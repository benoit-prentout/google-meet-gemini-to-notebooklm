/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Centralise automatiquement vos notes de réunion Gemini dans un Google Doc.
 */

const CONFIG = {
  // ID du document maître (laisser vide si le script est lié au document)
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', 
  
  // Nom des dossiers Drive à scanner
  SOURCE_FOLDERS: ['Meet Recordings'], 
  
  // Limite de caractères avant rotation (~850k)
  MAX_DOC_CHARS: 850000, 
  
  // Marqueur de synchronisation
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Notifications
  ENABLE_NOTIFICATIONS: true,
  NOTIFICATION_EMAIL: '' 
};

/**
 * Menu personnalisé.
 * Note : Apparaît uniquement si le script est lié au document (Extensions > Apps Script).
 */
function onOpen() {
  try {
    DocumentApp.getUi().createMenu('🚀 NotebookLM')
        .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
        .addSeparator()
        .addItem('Réinitialiser les marqueurs (Reset)', 'resetSyncMarkers')
        .addToUi();
  } catch (e) {}
}

/**
 * Fonction principale.
 */
function appendMeetNotesToMaster() {
  let masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    try {
      masterDocId = DocumentApp.getActiveDocument().getId();
    } catch (e) {
      console.error('ID du document maître non trouvé.');
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
    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== MimeType.GOOGLE_DOCS || file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      try {
        const rawText = exportGoogleDocAsText_(file.getId());
        processMeeting_(file, rawText, body);
        syncedMeetings.push(file.getName());
      } catch (e) {
        console.error(`Erreur sur "${file.getName()}": ${e.message}`);
      }
    }
  });

  if (syncedMeetings.length > 0) {
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, masterDoc.getUrl());
    if (isUiAvailable_()) DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`);
  } else if (isUiAvailable_()) {
    DocumentApp.getUi().alert('Aucune nouvelle réunion.');
  }
}

/**
 * Formate et insère une réunion.
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (body.getText().length > 0) body.appendPageBreak();

  // Titre : Création vide puis injection (contourne les bugs Google)
  const titlePara = body.appendParagraph('');
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);
  titlePara.setText(file.getName());

  // Date
  const datePara = body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`);
  datePara.setItalic(true).setFontSize(10);
  
  // Participants
  if (participants) {
    const partPara = body.appendParagraph('');
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
    partPara.setText(`👥 Participants : ${participants}`);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // Texte
  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Applique un style de titre avec double sécurité.
 */
function safeSetHeading_(para, heading) {
  try {
    para.setHeading(heading);
  } catch (e) {
    try {
      var style = {};
      style[DocumentApp.Attribute.HEADING] = heading;
      para.setAttributes(style);
    } catch (e2) {
      // Repli silencieux sur formatage manuel si Google bug
      para.setBold(true);
      if (heading === DocumentApp.ParagraphHeading.HEADING_2) para.setFontSize(14);
      if (heading === DocumentApp.ParagraphHeading.HEADING_3) para.setFontSize(12);
    }
  }
}

/**
 * Réinitialisation.
 */
function resetSyncMarkers() {
  const ui = isUiAvailable_() ? DocumentApp.getUi() : null;
  if (ui && ui.alert('Confirmation', 'Réinitialiser les marqueurs ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  let count = 0;
  CONFIG.SOURCE_FOLDERS.forEach(id => {
    const folder = getFolder_(id);
    if (!folder) return;
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) {
        file.setDescription(file.getDescription().replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '').trim());
        count++;
      }
    }
  });
  if (ui) ui.alert(`🔄 ${count} fichiers réinitialisés.`);
}

/**
 * Rotation du document.
 */
function rotateMasterDoc_(oldDoc) {
  const newDoc = DocumentApp.create(`${oldDoc.getName()} (Suite ${new Date().toLocaleDateString()})`);
  const newId = newDoc.getId();
  PropertiesService.getScriptProperties().setProperty('MASTER_DOC_ID', newId);
  if (CONFIG.ENABLE_NOTIFICATIONS) {
    MailApp.sendEmail(getNotificationEmail_(), "⚠️ Sync NotebookLM : Nouveau Doc", `Doc plein. Nouveau : ${newDoc.getUrl()}`);
  }
  return newId;
}

function sendNotification_(meetings, url) {
  const email = getNotificationEmail_();
  const body = `Réunions ajoutées :\n\n- ${meetings.join('\n- ')}\n\nLien : ${url}`;
  MailApp.sendEmail(email, `✅ Synchro NotebookLM (${meetings.length})`, body);
}

function getNotificationEmail_() {
  if (CONFIG.NOTIFICATION_EMAIL) return CONFIG.NOTIFICATION_EMAIL;
  try { return Session.getActiveUser().getEmail(); } catch (e) { return Session.getEffectiveUser().getEmail(); }
}

function isUiAvailable_() { try { DocumentApp.getUi(); return true; } catch (e) { return false; } }

function getFolder_(id) {
  try { return DriveApp.getFolderById(id); } catch(e) {
    const f = DriveApp.getFoldersByName(id);
    return f.hasNext() ? f.next() : null;
  }
}

function extractParticipants_(text) {
  const m = text.match(/(?:Participants|Attendees|Présents):\s*(.*)/i);
  return m ? m[1].trim() : null;
}

function cleanGeminiText_(text) {
  return text.replace(/(?:Participants|Attendees|Présents):\s*(.*)/i, '').replace(/Notes generated by Gemini/gi, '').trim();
}

function exportGoogleDocAsText_(id) {
  const r = UrlFetchApp.fetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }, muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) throw new Error(`API error ${r.getResponseCode()}`);
  return r.getContentText();
}

function doGet() {
  const id = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;
  return HtmlService.createHtmlOutput(`<h1>📊 Status</h1><p>Doc ID: ${id}</p>`);
}
