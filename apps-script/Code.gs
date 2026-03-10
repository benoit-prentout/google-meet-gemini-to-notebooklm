/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Automate the consolidation of Google Meet "Notes by Gemini" into a Master Doc.
 */

const CONFIG = {
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  MAX_DOC_CHARS: 850000, 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  ENABLE_NOTIFICATIONS: true,
  NOTIFICATION_EMAIL: '' 
};

/**
 * Creates a custom menu in the Google Doc.
 * Runs automatically when the document is opened.
 */
function onOpen() {
  try {
    const ui = DocumentApp.getUi();
    ui.createMenu('🚀 NotebookLM')
        .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
        .addSeparator()
        .addItem('Réinitialiser tous les marqueurs (Reset)', 'resetSyncMarkers')
        .addToUi();
  } catch (e) {
    console.error('Failed to create menu: ' + e.message);
  }
}

/**
 * Main function to sync Meet notes from Drive folders to the Master Doc.
 */
function appendMeetNotesToMaster() {
  let masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  // Auto-detect if we're in a container-bound script
  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    try {
      masterDocId = DocumentApp.getActiveDocument().getId();
    } catch (e) {
      console.error('Master Doc ID not set and could not be auto-detected.');
      return;
    }
  }

  const masterDoc = DocumentApp.openById(masterDocId);
  
  // Check for document saturation and rotate if needed
  if (masterDoc.getBody().getText().length > CONFIG.MAX_DOC_CHARS) {
    masterDocId = rotateMasterDoc_(masterDoc);
  }

  const body = DocumentApp.openById(masterDocId).getBody();
  let syncedMeetings = [];

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== MimeType.GOOGLE_DOCS) continue;
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      try {
        const rawText = exportGoogleDocAsText_(file.getId());
        processMeeting_(file, rawText, body);
        syncedMeetings.push(file.getName());
      } catch (e) {
        console.error(`Error processing ${file.getName()}: ${e.message}`);
      }
    }
  });

  if (syncedMeetings.length > 0) {
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, DocumentApp.openById(masterDocId).getUrl());
    const msg = `✅ ${syncedMeetings.length} réunions synchronisées !`;
    if (isUiAvailable_()) DocumentApp.getUi().alert(msg);
    console.log(msg);
  } else {
    const msg = 'Terminé : Aucune nouvelle réunion à synchroniser.';
    if (isUiAvailable_()) DocumentApp.getUi().alert(msg);
    console.log(msg);
  }

  return syncedMeetings;
}

/**
 * Removes the [SYNCED] marker from all files in source folders.
 */
function resetSyncMarkers() {
  const ui = isUiAvailable_() ? DocumentApp.getUi() : null;
  if (ui) {
    const response = ui.alert('Confirmation', 'Voulez-vous vraiment réinitialiser les marqueurs de synchronisation ? Tous vos anciens comptes-rendus seront ré-importés lors du prochain scan.', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;
  }

  let count = 0;
  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      let desc = file.getDescription();
      if (desc.includes(CONFIG.SYNC_MARKER)) {
        desc = desc.replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '');
        file.setDescription(desc.trim());
        count++;
      }
    }
  });

  const msg = `🔄 Réinitialisation terminée : ${count} fichiers prêts à être re-synchronisés.`;
  if (ui) ui.alert(msg);
  console.log(msg);
}

/**
 * Creates a new Master Doc when the current one is full.
 */
function rotateMasterDoc_(oldDoc) {
  const oldName = oldDoc.getName();
  const newName = `${oldName} (Continued ${new Date().toLocaleDateString()})`;
  const newDoc = DocumentApp.create(newName);
  const newId = newDoc.getId();
  
  PropertiesService.getScriptProperties().setProperty('MASTER_DOC_ID', newId);
  
  if (CONFIG.ENABLE_NOTIFICATIONS) {
    const email = getNotificationEmail_();
    MailApp.sendEmail(email, 
      "⚠️ NotebookLM Sync: New Master Doc Created", 
      `The previous Master Doc reached its size limit.\nA new one has been created: ${newDoc.getUrl()}`);
  }
  
  return newId;
}

/**
 * Sends an email summary of the synchronization.
 */
function sendNotification_(meetings, docUrl) {
  const email = getNotificationEmail_();
  const subject = `✅ Sync Complete: ${meetings.length} new meeting(s) added`;
  const body = `The following meetings have been added to your Master Doc:\n\n- ${meetings.join('\n- ')}\n\nView: ${docUrl}`;
  MailApp.sendEmail(email, subject, body);
}

/**
 * Retrieves the notification email safely.
 */
function getNotificationEmail_() {
  if (CONFIG.NOTIFICATION_EMAIL) return CONFIG.NOTIFICATION_EMAIL;
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return Session.getEffectiveUser().getEmail();
  }
}

/**
 * Checks if the User Interface is available (not a background trigger).
 */
function isUiAvailable_() {
  try {
    DocumentApp.getUi();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Internal helper to find folder by ID or Name.
 */
function getFolder_(folderNameOrId) {
  let folder;
  try {
    folder = DriveApp.getFolderById(folderNameOrId);
  } catch(e) {
    const folders = DriveApp.getFoldersByName(folderNameOrId);
    if (folders.hasNext()) folder = folders.next();
  }
  if (!folder) console.warn(`Folder not found: ${folderNameOrId}`);
  return folder;
}

/**
 * Processes and formats a single meeting document.
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (body.getText().length > 0) body.appendPageBreak();

  body.appendParagraph(file.getName()).setHeading(DocumentApp.ParagraphHeading.HEADING_2);
  body.appendParagraph(`📅 Date: ${file.getDateCreated().toLocaleDateString()}`).setItalic(true).setFontSize(10);
  
  if (participants) {
    body.appendParagraph(`👥 Participants: ${participants}`).setHeading(DocumentApp.ParagraphHeading.HEADING_3);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Extracts participant list from Gemini notes.
 */
function extractParticipants_(text) {
  const patterns = [/Participants:\s*(.*)/i, /Attendees:\s*(.*)/i, /Présents:\s*(.*)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

/**
 * Cleans the raw text by removing headers and metadata lines.
 */
function cleanGeminiText_(text) {
  let cleaned = text.replace(/Participants:\s*(.*)/i, '').replace(/Attendees:\s*(.*)/i, '').replace(/Présents:\s*(.*)/i, '');
  return cleaned.replace(/Notes generated by Gemini/gi, '').trim();
}

/**
 * Exports a Google Doc as plain text.
 */
function exportGoogleDocAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error(`API Error ${response.getResponseCode()}`);
  return response.getContentText();
}

/**
 * Dashboard for Web App deployment.
 */
function doGet() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const html = `<html><body><h1>📊 NotebookLM Sync Status</h1><p>Master Doc ID: ${props.MASTER_DOC_ID || 'Not set'}</p></body></html>`;
  return HtmlService.createHtmlOutput(html);
}
