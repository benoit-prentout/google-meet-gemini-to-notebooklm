/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Centralise les notes Meet Gemini dans ce document.
 */

const CONFIG = {
  // Optionnel : ID du document (utile si le script n'est pas lié au document)
  // Laissez vide si vous avez créé le script via Extensions > Apps Script
  MASTER_DOC_ID: '', 

  // Nom des dossiers Drive à scanner
  SOURCE_FOLDERS: ['Meet Recordings'], 
  
  // Marqueur de synchronisation
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Limite de sécurité (Google Doc ~1M caractères)
  MAX_DOC_CHARS: 900000,
  
  // Notifications
  ENABLE_NOTIFICATIONS: true
};

/**
 * Menu personnalisé.
 */
function onOpen() {
  try {
    DocumentApp.getUi().createMenu('🚀 NotebookLM')
        .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
        .addSeparator()
        .addItem('Réinitialiser les marqueurs (Reset)', 'resetSyncMarkers')
        .addToUi();
  } catch (e) {
    console.log("Interface UI non disponible (mode exécution automatique).");
  }
}

/**
 * Fonction principale.
 */
function appendMeetNotesToMaster() {
  let doc = DocumentApp.getActiveDocument();
  
  // Fallback si le script n'est pas lié ou exécuté hors contexte
  if (!doc && CONFIG.MASTER_DOC_ID) {
    doc = DocumentApp.openById(CONFIG.MASTER_DOC_ID);
  }

  if (!doc) {
    throw new Error("Impossible de trouver le document. Assurez-vous que le script est lié au document (Extensions > Apps Script) ou renseignez MASTER_DOC_ID dans le code.");
  }

  const body = doc.getBody();
  
  if (body.getText().length > CONFIG.MAX_DOC_CHARS) {
    DocumentApp.getUi().alert("⚠️ Document plein", "Veuillez archiver ce document et en créer un nouveau.", DocumentApp.getUi().ButtonSet.OK);
    return;
  }

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
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, doc.getUrl());
    try { DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`); } catch(e) {}
  }
}

/**
 * Formate et insère le contenu.
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  // Reset des styles pour éviter le gras/italique partout
  const STYLE_NORMAL = {};
  STYLE_NORMAL[DocumentApp.Attribute.BOLD] = false;
  STYLE_NORMAL[DocumentApp.Attribute.ITALIC] = false;
  STYLE_NORMAL[DocumentApp.Attribute.FONT_SIZE] = 11;
  STYLE_NORMAL[DocumentApp.Attribute.HEADING] = DocumentApp.ParagraphHeading.NORMAL;

  if (body.getText().trim().length > 0) body.appendPageBreak();

  // 1. Titre
  const titlePara = body.appendParagraph('');
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);
  titlePara.setText(file.getName());

  // 2. Date
  const datePara = body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`);
  datePara.setItalic(true).setFontSize(10).setBold(false);
  
  // 3. Participants
  if (participants) {
    const partPara = body.appendParagraph('');
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
    partPara.setText(`👥 Participants : ${participants}`);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // 4. Corps (Nettoyé)
  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      p.setAttributes(STYLE_NORMAL);
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Sécurité Titres.
 */
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

/**
 * Reset.
 */
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

function exportGoogleDocAsText_(id) {
  const r = UrlFetchApp.fetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` }, muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) throw new Error(`API error ${r.getResponseCode()}`);
  return r.getContentText();
}
