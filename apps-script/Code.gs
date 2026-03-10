/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Version "Titan" : Google Docs API v1 + Drive Search Optimisé.
 */

const CONFIG = {
  // Optionnel : ID du document si non lié
  MASTER_DOC_ID: '', 
  
  // Nom du dossier Meet
  SOURCE_FOLDER: 'Meet Recordings', 
  
  // Marqueur utilisé pour le dédoublonnage
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Limite de sécurité caractères
  MAX_DOC_CHARS: 950000,
  
  // Nombre de jours à scanner (accélère Drive)
  SCAN_DAYS: 30,
  
  // Nombre max de fichiers par run
  MAX_FILES_PER_RUN: 25,
  
  ENABLE_NOTIFICATIONS: true
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
  let docId = CONFIG.MASTER_DOC_ID;
  if (!docId) { try { docId = DocumentApp.getActiveDocument().getId(); } catch(e) {} }
  if (!docId) throw new Error("ID du document maître non trouvé.");

  const initialText = DocumentApp.openById(docId).getBody().getText();
  if (initialText.length > CONFIG.MAX_DOC_CHARS) return;

  let syncedMeetings = [];
  let processedCount = 0;
  let requests = []; 

  console.log("Démarrage synchronisation Titan...");

  const folder = getFolder_(CONFIG.SOURCE_FOLDER);
  if (!folder) return;

  // Optimisation Drive : on filtre par date (SCAN_DAYS derniers jours)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - CONFIG.SCAN_DAYS);
  const formattedDate = pastDate.toISOString();
  
  const query = `mimeType = 'application/vnd.google-apps.document' and createdTime > '${formattedDate}'`;
  const files = folder.searchFiles(query);
  
  while (files.hasNext() && processedCount < CONFIG.MAX_FILES_PER_RUN) {
    const file = files.next();
    if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

    console.log(`Préparation (${processedCount + 1}) : ${file.getName()}`);
    
    try {
      const rawText = exportDocToText_(file.getId());
      requests = requests.concat(prepareMeetingRequests_(file, rawText));
      
      syncedMeetings.push(file.getName());
      processedCount++;
      file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
    } catch (e) {
      console.error(`Erreur sur "${file.getName()}": ${e.message}`);
    }
  }

  if (requests.length > 0) {
    console.log(`Envoi de ${syncedMeetings.length} réunions (Batch Update)...`);
    // On ajoute un saut de page avant si le document n'est pas vide
    if (initialText.length > 2) {
      requests.unshift({ insertPageBreak: { endOfSegmentLocation: { segmentId: "" } } });
    }
    
    Docs.Documents.batchUpdate({requests: requests}, docId);
    
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, `https://docs.google.com/document/d/${docId}/edit`);
    console.log("✅ Terminé.");
    try { DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) synchronisée(s).`); } catch(e) {}
  }
}

/**
 * Prépare les commandes API pour une réunion (Texte + Formatage)
 */
function prepareMeetingRequests_(file, rawText) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);
  const title = file.getName();
  const dateStr = file.getDateCreated().toLocaleDateString();
  
  const header = `\n${title}\n📅 Date : ${dateStr}\n`;
  const meta = participants ? `👥 Participants : ${participants}\n` : "";
  const sep = `----------------------------------------------------------\n`;
  const fullText = `${header}${meta}${sep}${cleanedText}\n`;

  // On envoie le texte en un seul bloc pour la vitesse
  return [{
    insertText: {
      endOfSegmentLocation: { segmentId: "" },
      text: fullText
    }
  }];
}

function exportDocToText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  return UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  }).getContentText();
}

function resetSyncMarkers() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Confirmation', 'Réinitialiser ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const folder = getFolder_(CONFIG.SOURCE_FOLDER);
  if (!folder) return;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getDescription().includes(CONFIG.SYNC_MARKER)) {
      file.setDescription(file.getDescription().replace(new RegExp('\\n?' + CONFIG.SYNC_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*', 'g'), '').trim());
    }
  }
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
  let clean = text.replace(/(?:Participants|Attendees|Présents):\s*(.*)/i, '').replace(/Notes generated by Gemini/gi, '');
  // Suppression des en-têtes de notes par Gemini
  clean = clean.replace(/Notes par Gemini.*/gi, '').replace(/Notes par Gemini/gi, '');
  return clean.trim();
}
