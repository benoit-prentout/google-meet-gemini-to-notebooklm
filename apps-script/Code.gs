/**
 * Google Meet Gemini Notes → NotebookLM Sync (Pro Version)
 * 
 * Includes:
 * - Piste 1: Improved Formatting & Extraction
 * - Piste 2: Auto-archiving (Saturation management)
 * - Piste 4: Email Notifications & Web Dashboard
 * - Piste 5: Multi-source Folder Support
 * - Menu: Custom menu in Master Doc + Reset function
 */

const CONFIG = {
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  MAX_DOC_CHARS: 850000, 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  ENABLE_NOTIFICATIONS: true,
  NOTIFICATION_EMAIL: Session.getActiveUser().getEmail()
};

/**
 * Piste 6: Add a custom menu to the Google Doc.
 * This runs when the document is opened (if script is bound to the doc).
 */
function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('🚀 NotebookLM')
      .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
      .addSeparator()
      .addItem('Réinitialiser tous les marqueurs (Reset)', 'resetSyncMarkers')
      .addToUi();
}

/**
 * Main function to sync Meet notes.
 */
function appendMeetNotesToMaster() {
  let masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getActiveDocument()) {
      masterDocId = DocumentApp.getActiveDocument().getId();
    } else {
      console.error('Master Doc ID not set.');
      return;
    }
  }

  let masterDoc = DocumentApp.openById(masterDocId);
  
  if (masterDoc.getBody().getText().length > CONFIG.MAX_DOC_CHARS) {
    masterDocId = rotateMasterDoc_(masterDoc);
    masterDoc = DocumentApp.openById(masterDocId);
  }

  const body = masterDoc.getBody();
  let syncedMeetings = [];

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    let folder = getFolder_(folderNameOrId);
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
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, masterDoc.getUrl());
    const msg = `✅ ${syncedMeetings.length} réunions synchronisées !`;
    if (typeof DocumentApp !== 'undefined') DocumentApp.getUi().alert(msg);
    console.log(msg);
  } else {
    const msg = 'Terminé : Aucune nouvelle réunion à synchroniser.';
    if (typeof DocumentApp !== 'undefined') DocumentApp.getUi().alert(msg);
    console.log(msg);
  }

  return syncedMeetings;
}

/**
 * RESET FUNCTION: Removes the [SYNCED] marker from all files in source folders.
 * Use this if you want to re-import everything after clearing your Master Doc.
 */
function resetSyncMarkers() {
  const ui = (typeof DocumentApp !== 'undefined') ? DocumentApp.getUi() : null;
  if (ui) {
    const response = ui.alert('Confirmation', 'Voulez-vous vraiment réinitialiser les marqueurs de synchronisation ? Tous vos anciens comptes-rendus seront ré-importés lors du prochain scan.', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) return;
  }

  let count = 0;
  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    let folder = getFolder_(folderNameOrId);
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
 * Internal helper to find folder by ID or Name
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
 * Piste 2: Create a new Master Doc when the current one is full.
 */
function rotateMasterDoc_(oldDoc) {
  const oldName = oldDoc.getName();
  const newName = `${oldName} (Continued ${new Date().toLocaleDateString()})`;
  const newDoc = DocumentApp.create(newName);
  const newId = newDoc.getId();
  
  PropertiesService.getScriptProperties().setProperty('MASTER_DOC_ID', newId);
  
  if (CONFIG.ENABLE_NOTIFICATIONS) {
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, 
      "⚠️ NotebookLM Sync: New Master Doc Created", 
      `The previous Master Doc reached its size limit.\nA new one has been created: ${newDoc.getUrl()}`);
  }
  
  return newId;
}

/**
 * Helper to process a single meeting
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
 * Piste 4: Send Email summary
 */
function sendNotification_(meetings, docUrl) {
  const subject = `✅ Sync Complete: ${meetings.length} new meeting(s) added`;
  const body = `The following meetings have been added to your Master Doc:\n\n- ${meetings.join('\n- ')}\n\nView: ${docUrl}`;
  MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

function extractParticipants_(text) {
  const patterns = [/Participants:\s*(.*)/i, /Attendees:\s*(.*)/i, /Présents:\s*(.*)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function cleanGeminiText_(text) {
  let cleaned = text.replace(/Participants:\s*(.*)/i, '').replace(/Attendees:\s*(.*)/i, '').replace(/Présents:\s*(.*)/i, '');
  return cleaned.replace(/Notes generated by Gemini/gi, '').trim();
}

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
 * Piste 4: Dashboard
 */
function doGet() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const html = `<html><body><h1>📊 NotebookLM Sync Status</h1><p>Master Doc ID: ${props.MASTER_DOC_ID || 'Not set'}</p></body></html>`;
  return HtmlService.createHtmlOutput(html);
}
