/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Script lié au document (Extensions > Apps Script).
 * Centralise les notes Meet Gemini dans ce document.
 */

const CONFIG = {
  // Nom des dossiers Drive à scanner
  SOURCE_FOLDERS: ['Meet Recordings'], 
  
  // Marqueur de synchronisation pour éviter les doublons
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Limite de sécurité (Google Doc ~1M caractères)
  MAX_DOC_CHARS: 900000,
  
  // Notifications
  ENABLE_NOTIFICATIONS: true
};

/**
 * Menu personnalisé dans le Google Doc.
 */
function onOpen() {
  DocumentApp.getUi().createMenu('🚀 NotebookLM')
      .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
      .addSeparator()
      .addItem('Réinitialiser les marqueurs (Reset)', 'resetSyncMarkers')
      .addToUi();
}

/**
 * Fonction principale de synchronisation.
 */
function appendMeetNotesToMaster() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  // Vérification de la taille
  if (body.getText().length > CONFIG.MAX_DOC_CHARS) {
    DocumentApp.getUi().alert("⚠️ Document plein", "Ce document est trop volumineux. Veuillez le renommer (ex: Archive) et en créer un nouveau pour continuer la synchro.", DocumentApp.getUi().ButtonSet.OK);
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
    DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`);
  } else {
    DocumentApp.getUi().alert('Aucune nouvelle réunion à synchroniser.');
  }
}

/**
 * Formate et insère le contenu d'une réunion.
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  // Styles de base pour éviter l'héritage du gras/italique
  const STYLE_NORMAL = {};
  STYLE_NORMAL[DocumentApp.Attribute.BOLD] = false;
  STYLE_NORMAL[DocumentApp.Attribute.ITALIC] = false;
  STYLE_NORMAL[DocumentApp.Attribute.FONT_SIZE] = 11;
  STYLE_NORMAL[DocumentApp.Attribute.HEADING] = DocumentApp.ParagraphHeading.NORMAL;

  if (body.getText().length > 0) body.appendPageBreak();

  // 1. Titre (H2)
  const titlePara = body.appendParagraph('');
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);
  titlePara.setText(file.getName());

  // 2. Date (Italique)
  const datePara = body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`);
  datePara.setItalic(true).setFontSize(10).setBold(false);
  
  // 3. Participants (H3)
  if (participants) {
    const partPara = body.appendParagraph('');
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
    partPara.setText(`👥 Participants : ${participants}`);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // 4. Corps du texte (Normalisé)
  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      p.setAttributes(STYLE_NORMAL); // Force le style propre
      
      // Optionnel : Met en gras les lignes qui ressemblent à des sous-titres
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) {
        p.setBold(true);
      }
    }
  });

  // Marquage Drive
  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Applique un style de titre avec double sécurité (bug Google).
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
      para.setBold(true);
      para.setFontSize(heading === DocumentApp.ParagraphHeading.HEADING_2 ? 14 : 12);
    }
  }
}

/**
 * Réinitialise les marqueurs pour tout ré-importer.
 */
function resetSyncMarkers() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Confirmation', 'Voulez-vous vraiment réinitialiser les marqueurs ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  let count = 0;
  CONFIG.SOURCE_FOLDERS.forEach(id => {
    const folder = getFolder_(id);
    if (!folder) return;
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) {
        const cleanDesc = file.getDescription().replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '').trim();
        file.setDescription(cleanDesc);
        count++;
      }
    }
  });
  ui.alert(`🔄 ${count} fichiers réinitialisés.`);
}

/**
 * Envoie un résumé par e-mail.
 */
function sendNotification_(meetings, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const body = `Réunions ajoutées au Master Doc :\n\n- ${meetings.join('\n- ')}\n\nLien : ${url}`;
  MailApp.sendEmail(email, `✅ Synchro NotebookLM (${meetings.length})`, body);
}

/**
 * Helpers
 */
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
