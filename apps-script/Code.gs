/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Version ULTRA-OPTIMISÉE (Bulk Insertion).
 * Conçue pour traiter des centaines de réunions sans ralentissement.
 */

const CONFIG = {
  MASTER_DOC_ID: '', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  MAX_DOC_CHARS: 900000,
  ENABLE_NOTIFICATIONS: true,
  MAX_FILES_PER_RUN: 30 // Augmenté grâce à l'optimisation
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
  const initialTextLength = body.getText().length;
  
  if (initialTextLength > CONFIG.MAX_DOC_CHARS) {
    try { DocumentApp.getUi().alert("⚠️ Document plein. Veuillez l'archiver."); } catch(e) {}
    return;
  }

  let syncedMeetings = [];
  let processedCount = 0;
  let hasContent = initialTextLength > 2;

  console.log("Démarrage de la synchronisation (Mode BULK)...");

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    if (processedCount >= CONFIG.MAX_FILES_PER_RUN) return;

    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.searchFiles('mimeType = "application/vnd.google-apps.document"');
    
    while (files.hasNext() && processedCount < CONFIG.MAX_FILES_PER_RUN) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      const startTime = new Date().getTime();
      
      try {
        const rawText = exportDocToText_(file.getId());
        processMeetingBulk_(file, rawText, body, hasContent);
        
        hasContent = true;
        syncedMeetings.push(file.getName());
        processedCount++;
        
        const duration = (new Date().getTime() - startTime) / 1000;
        console.log(`✅ ${file.getName()} traité en ${duration}s`);
      } catch (e) {
        console.error(`Erreur sur "${file.getName()}": ${e.message}`);
      }
    }
  });

  if (syncedMeetings.length > 0) {
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, doc.getUrl());
    try { DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`); } catch(e) {}
  }
}

/**
 * Extraction rapide (API Drive)
 */
function exportDocToText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  return UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  }).getContentText();
}

/**
 * Insertion BULK (Très rapide)
 */
function processMeetingBulk_(file, rawText, body, addPageBreak) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (addPageBreak) body.appendPageBreak();

  // 1. En-tête (Titre + Date + Participants)
  const titlePara = body.appendParagraph(file.getName());
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);

  body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`)
      .setItalic(true).setFontSize(10).setBold(false).setHeading(DocumentApp.ParagraphHeading.NORMAL);
  
  if (participants) {
    body.appendParagraph(`👥 Participants : ${participants}`)
        .setHeading(DocumentApp.ParagraphHeading.HEADING_3).setBold(true).setItalic(false);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // 2. Corps : UNE SEULE OPÉRATION d'insertion pour tout le bloc
  // Cela évite de boucler sur les lignes et divise le temps de traitement par 50
  const bodyPara = body.appendParagraph(cleanedText);
  
  const STYLE_CLEAN = {};
  STYLE_CLEAN[DocumentApp.Attribute.BOLD] = false;
  STYLE_CLEAN[DocumentApp.Attribute.ITALIC] = false;
  STYLE_CLEAN[DocumentApp.Attribute.FONT_SIZE] = 11;
  STYLE_CLEAN[DocumentApp.Attribute.HEADING] = DocumentApp.ParagraphHeading.NORMAL;
  
  bodyPara.setAttributes(STYLE_CLEAN);

  // 3. Marquage
  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

function safeSetHeading_(para, heading) {
  try {
    para.setHeading(heading);
  } catch (e) {
    para.setBold(true).setFontSize(heading === DocumentApp.ParagraphHeading.HEADING_2 ? 14 : 12);
  }
}

function resetSyncMarkers() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Confirmation', 'Réinitialiser ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
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
  ui.alert(`🔄 Reset terminé.`);
}

function sendNotification_(meetings, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(email, `✅ Synchro NotebookLM (${meetings.length})`, `Réunions ajoutées :\n\n- ${meetings.join('\n- ')}\n\nLien : ${url}`);
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
