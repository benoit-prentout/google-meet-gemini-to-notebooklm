/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Centralise les notes Meet Gemini dans ce document.
 */

const CONFIG = {
  MASTER_DOC_ID: '', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  MAX_DOC_CHARS: 900000,
  ENABLE_NOTIFICATIONS: true,
  MAX_FILES_PER_RUN: 15 // Augmenté car l'export API est plus rapide
};

function onOpen() {
  try {
    DocumentApp.getUi().createMenu('🚀 NotebookLM')
        .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
        .addSeparator()
        .addItem('Réinitialiser les marqueurs (Reset)', 'resetSyncMarkers')
        .addToUi();
  } catch (e) {}
}

function appendMeetNotesToMaster() {
  let doc = DocumentApp.getActiveDocument();
  if (!doc && CONFIG.MASTER_DOC_ID) doc = DocumentApp.openById(CONFIG.MASTER_DOC_ID);
  if (!doc) throw new Error("Document maître non trouvé.");

  const body = doc.getBody();
  let syncedMeetings = [];
  let processedCount = 0;

  console.log("Démarrage de la synchronisation (via Drive Export API)...");

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    if (processedCount >= CONFIG.MAX_FILES_PER_RUN) return;

    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    // Recherche uniquement les Google Docs non synchronisés
    const files = folder.searchFiles('mimeType = "application/vnd.google-apps.document"');
    
    while (files.hasNext() && processedCount < CONFIG.MAX_FILES_PER_RUN) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      console.log(`Exportation texte de : ${file.getName()}`);
      
      try {
        const rawText = exportDocToText_(file.getId());
        processMeeting_(file, rawText, body);
        syncedMeetings.push(file.getName());
        processedCount++;
      } catch (e) {
        console.error(`Erreur sur "${file.getName()}": ${e.message}`);
      }
    }
  });

  if (syncedMeetings.length > 0) {
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, doc.getUrl());
    const msg = `✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`;
    console.log(msg);
    try { DocumentApp.getUi().alert(msg); } catch(e) {}
  } else {
    console.log("Aucune nouvelle réunion.");
  }
}

/**
 * Extrait le texte via l'API Drive (plus robuste que DocumentApp.openById)
 */
function exportDocToText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const options = {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    throw new Error(`Erreur Export API (${response.getResponseCode()})`);
  }
  return response.getContentText();
}

function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  const STYLE_NORMAL = {};
  STYLE_NORMAL[DocumentApp.Attribute.BOLD] = false;
  STYLE_NORMAL[DocumentApp.Attribute.ITALIC] = false;
  STYLE_NORMAL[DocumentApp.Attribute.FONT_SIZE] = 11;
  STYLE_NORMAL[DocumentApp.Attribute.HEADING] = DocumentApp.ParagraphHeading.NORMAL;

  if (body.getText().trim().length > 0) body.appendPageBreak();

  const titlePara = body.appendParagraph('');
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);
  titlePara.setText(file.getName());

  const datePara = body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`);
  datePara.setItalic(true).setFontSize(10).setBold(false);
  
  if (participants) {
    const partPara = body.appendParagraph('');
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
    partPara.setText(`👥 Participants : ${participants}`);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      p.setAttributes(STYLE_NORMAL);
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

function safeSetHeading_(para, heading) {
  try {
    para.setHeading(heading);
  } catch (e) {
    try {
      var s = {}; s[DocumentApp.Attribute.HEADING] = heading;
      para.setAttributes(s);
    } catch (e2) {
      para.setBold(true).setFontSize(heading === DocumentApp.ParagraphHeading.HEADING_2 ? 14 : 12);
    }
  }
}

function resetSyncMarkers() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Confirmation', 'Réinitialiser les marqueurs ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  
  CONFIG.SOURCE_FOLDERS.forEach(id => {
    const folder = getFolder_(id);
    if (!folder) return;
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) {
        file.setDescription(file.getDescription().replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '').trim());
      }
    }
  });
  ui.alert(`🔄 Terminé.`);
}

function sendNotification_(meetings, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(email, `✅ Synchro NotebookLM (${meetings.length})`, `Réunions ajoutées :\n\n- ${meetings.join('\n- ')}\n\nDoc : ${url}`);
}

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
