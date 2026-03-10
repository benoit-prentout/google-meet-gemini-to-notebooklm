/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Version optimisée pour la performance (évite les ralentissements sur gros documents).
 */

const CONFIG = {
  MASTER_DOC_ID: '', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  MAX_DOC_CHARS: 900000,
  ENABLE_NOTIFICATIONS: true,
  MAX_FILES_PER_RUN: 20
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
  
  // OPTIMISATION : On ne récupère la longueur qu'UNE SEULE fois au début
  const initialTextLength = body.getText().length;
  if (initialTextLength > CONFIG.MAX_DOC_CHARS) {
    try { DocumentApp.getUi().alert("⚠️ Document plein. Veuillez l'archiver."); } catch(e) {}
    return;
  }

  let syncedMeetings = [];
  let processedCount = 0;
  // Savoir si on doit ajouter un saut de page (si le doc n'est pas vide au départ)
  let hasContent = initialTextLength > 2; // Un doc "vide" a souvent une longueur de 1 ou 2

  console.log("Démarrage de la synchronisation optimisée...");

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    if (processedCount >= CONFIG.MAX_FILES_PER_RUN) return;

    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.searchFiles('mimeType = "application/vnd.google-apps.document"');
    
    while (files.hasNext() && processedCount < CONFIG.MAX_FILES_PER_RUN) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      console.log(`Traitement (${processedCount + 1}/${CONFIG.MAX_FILES_PER_RUN}) : ${file.getName()}`);
      
      try {
        const rawText = exportDocToText_(file.getId());
        processMeeting_(file, rawText, body, hasContent);
        
        hasContent = true; // Après la première insertion, on aura forcément du contenu
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
 * Extraction rapide via API
 */
function exportDocToText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  return response.getContentText();
}

/**
 * Insertion optimisée
 */
function processMeeting_(file, rawText, body, addPageBreak) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (addPageBreak) body.appendPageBreak();

  // Titre
  const titlePara = body.appendParagraph(file.getName());
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);

  // Date
  body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`)
      .setItalic(true).setFontSize(10).setBold(false);
  
  // Participants
  if (participants) {
    const partPara = body.appendParagraph(`👥 Participants : ${participants}`);
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // Styles pré-définis pour éviter les appels multiples
  const STYLE_NORMAL = {};
  STYLE_NORMAL[DocumentApp.Attribute.BOLD] = false;
  STYLE_NORMAL[DocumentApp.Attribute.ITALIC] = false;
  STYLE_NORMAL[DocumentApp.Attribute.FONT_SIZE] = 11;
  STYLE_NORMAL[DocumentApp.Attribute.HEADING] = DocumentApp.ParagraphHeading.NORMAL;

  // Corps du texte : on traite par ligne pour conserver le formatage des sous-titres
  const lines = cleanedText.split('\n');
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      const p = body.appendParagraph(trimmedLine);
      p.setAttributes(STYLE_NORMAL);
      // Détection rapide de sous-titre (gras)
      if (trimmedLine.length < 60 && (trimmedLine.includes(':') || trimmedLine.toUpperCase() === trimmedLine)) {
        p.setBold(true);
      }
    }
  });

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
