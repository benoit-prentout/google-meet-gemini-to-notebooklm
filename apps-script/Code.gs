/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Centralise automatiquement vos notes de réunion Gemini dans un Google Doc.
 */

const CONFIG = {
  // ID du document maître (peut être laissé vide si le script est lié au document)
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', 
  
  // Nom des dossiers Drive à scanner
  SOURCE_FOLDERS: ['Meet Recordings'], 
  
  // Limite de caractères avant création d'un nouveau document (~850k)
  MAX_DOC_CHARS: 850000, 
  
  // Marqueur utilisé pour le dédoublonnage
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Paramètres de notification
  ENABLE_NOTIFICATIONS: true,
  NOTIFICATION_EMAIL: '' 
};

/**
 * Crée un menu personnalisé dans le Google Doc.
 * S'exécute automatiquement à l'ouverture du document.
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
    console.error('Erreur lors de la création du menu : ' + e.message);
  }
}

/**
 * Fonction principale de synchronisation.
 */
function appendMeetNotesToMaster() {
  let masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  // Détection automatique du document si le script est lié
  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    try {
      masterDocId = DocumentApp.getActiveDocument().getId();
    } catch (e) {
      console.error('ID du document maître non trouvé. Veuillez le configurer dans les propriétés du script.');
      return;
    }
  }

  let masterDoc = DocumentApp.openById(masterDocId);
  
  // Gestion de la saturation du document (Auto-archivage)
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
      if (file.getMimeType() !== MimeType.GOOGLE_DOCS) continue;
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      try {
        const rawText = exportGoogleDocAsText_(file.getId());
        processMeeting_(file, rawText, body);
        syncedMeetings.push(file.getName());
      } catch (e) {
        console.error(`Erreur lors du traitement de "${file.getName()}": ${e.message}`);
      }
    }
  });

  // Notifications et alertes
  if (syncedMeetings.length > 0) {
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, masterDoc.getUrl());
    const msg = `✅ ${syncedMeetings.length} réunion(s) synchronisée(s) !`;
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
 * Traite et formate une réunion spécifique.
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (body.getText().length > 0) body.appendPageBreak();

  // Titre de la réunion (H2 sécurisé)
  const titlePara = body.appendParagraph(file.getName());
  safeSetHeading_(titlePara, DocumentApp.ParagraphHeading.HEADING_2);

  // Métadonnées
  const datePara = body.appendParagraph(`📅 Date : ${file.getDateCreated().toLocaleDateString()}`);
  datePara.setItalic(true).setFontSize(10);
  
  if (participants) {
    const partPara = body.appendParagraph(`👥 Participants : ${participants}`);
    safeSetHeading_(partPara, DocumentApp.ParagraphHeading.HEADING_3);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  // Corps du texte
  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      // Détecte si la ligne ressemble à un sous-titre
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  // Marquage du fichier comme traité
  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Applique un style de titre de manière sécurisée.
 * Tente plusieurs approches pour contourner les erreurs "Unexpected error" de Google.
 */
function safeSetHeading_(para, heading) {
  try {
    // 1. Tentative normale
    para.setHeading(heading);
  } catch (e) {
    try {
      // 2. Tentative via attributs (souvent plus robuste)
      var style = {};
      style[DocumentApp.Attribute.HEADING] = heading;
      para.setAttributes(style);
    } catch (e2) {
      // 3. Repli final sur le formatage manuel
      console.warn('Echec des styles de titres, repli sur le gras : ' + e2.message);
      para.setBold(true);
      if (heading === DocumentApp.ParagraphHeading.HEADING_2) para.setFontSize(14);
      if (heading === DocumentApp.ParagraphHeading.HEADING_3) para.setFontSize(12);
    }
  }
}

/**
 * Réinitialise les marqueurs de synchronisation pour tout ré-importer.
 */
function resetSyncMarkers() {
  const ui = isUiAvailable_() ? DocumentApp.getUi() : null;
  if (ui) {
    const response = ui.alert('Confirmation', 'Voulez-vous vraiment réinitialiser les marqueurs ? Tout sera ré-importé au prochain scan.', ui.ButtonSet.YES_NO);
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
        // Nettoie le marqueur proprement
        desc = desc.replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '');
        file.setDescription(desc.trim());
        count++;
      }
    }
  });

  const msg = `🔄 Réinitialisation terminée : ${count} fichiers prêts.`;
  if (ui) ui.alert(msg);
  console.log(msg);
}

/**
 * Crée un nouveau document maître si l'actuel est plein.
 */
function rotateMasterDoc_(oldDoc) {
  const oldName = oldDoc.getName();
  const newName = `${oldName} (Suite ${new Date().toLocaleDateString()})`;
  const newDoc = DocumentApp.create(newName);
  const newId = newDoc.getId();
  
  PropertiesService.getScriptProperties().setProperty('MASTER_DOC_ID', newId);
  
  if (CONFIG.ENABLE_NOTIFICATIONS) {
    const email = getNotificationEmail_();
    MailApp.sendEmail(email, 
      "⚠️ Sync NotebookLM : Nouveau Document Créé", 
      `Le document maître précédent est plein.\nUn nouveau a été créé : ${newDoc.getUrl()}`);
  }
  
  return newId;
}

/**
 * Envoie un résumé par e-mail.
 */
function sendNotification_(meetings, docUrl) {
  const email = getNotificationEmail_();
  const subject = `✅ Synchro terminée : ${meetings.length} réunions ajoutées`;
  const body = `Les réunions suivantes ont été ajoutées :\n\n- ${meetings.join('\n- ')}\n\nLien : ${docUrl}`;
  MailApp.sendEmail(email, subject, body);
}

/**
 * Récupère l'e-mail pour les notifications de manière sécurisée.
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
 * Vérifie si l'interface utilisateur est disponible.
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
 * Trouve un dossier par ID ou par nom.
 */
function getFolder_(folderNameOrId) {
  let folder;
  try {
    folder = DriveApp.getFolderById(folderNameOrId);
  } catch(e) {
    const folders = DriveApp.getFoldersByName(folderNameOrId);
    if (folders.hasNext()) folder = folders.next();
  }
  if (!folder) console.warn(`Dossier non trouvé : ${folderNameOrId}`);
  return folder;
}

/**
 * Extrait les participants des notes Gemini.
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
 * Nettoie le texte Gemini (retire les entêtes redondantes).
 */
function cleanGeminiText_(text) {
  let cleaned = text.replace(/Participants:\s*(.*)/i, '').replace(/Attendees:\s*(.*)/i, '').replace(/Présents:\s*(.*)/i, '');
  return cleaned.replace(/Notes generated by Gemini/gi, '').trim();
}

/**
 * Export le document Google en texte brut.
 */
function exportGoogleDocAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error(`Erreur API Drive ${response.getResponseCode()}`);
  return response.getContentText();
}

/**
 * Dashboard (Web App).
 */
function doGet() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const html = `<html><body><h1>📊 NotebookLM Sync Status</h1><p>Master Doc ID: ${props.MASTER_DOC_ID || 'Non défini'}</p></body></html>`;
  return HtmlService.createHtmlOutput(html);
}
