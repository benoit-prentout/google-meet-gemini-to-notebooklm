/**
 * Google Meet Gemini Notes → NotebookLM Sync
 * 
 * Version INDUSTRIELLE (Google Docs API v1).
 * Utilise le mode "Batch Update" pour une vitesse instantanée.
 */

const CONFIG = {
  MASTER_DOC_ID: '', 
  SOURCE_FOLDERS: ['Meet Recordings'], 
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  MAX_DOC_CHARS: 950000,
  ENABLE_NOTIFICATIONS: true,
  MAX_FILES_PER_RUN: 25
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
  if (!docId) {
    try { docId = DocumentApp.getActiveDocument().getId(); } catch(e) {}
  }
  if (!docId) throw new Error("ID du document maître non trouvé.");

  // Vérification rapide de la taille (seule opération DocumentApp)
  const body = DocumentApp.openById(docId).getBody();
  if (body.getText().length > CONFIG.MAX_DOC_CHARS) {
    console.warn("Document plein.");
    return;
  }

  let syncedMeetings = [];
  let processedCount = 0;
  let requests = []; // Liste des modifications à envoyer à l'API

  console.log("Démarrage de la synchronisation (API Docs v1)...");

  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    if (processedCount >= CONFIG.MAX_FILES_PER_RUN) return;

    const folder = getFolder_(folderNameOrId);
    if (!folder) return;

    const files = folder.searchFiles('mimeType = "application/vnd.google-apps.document"');
    
    while (files.hasNext() && processedCount < CONFIG.MAX_FILES_PER_RUN) {
      const file = files.next();
      if (file.getDescription().includes(CONFIG.SYNC_MARKER)) continue;

      console.log(`Préparation de : ${file.getName()}`);
      
      try {
        const rawText = exportDocToText_(file.getId());
        const meetingRequests = prepareMeetingRequests_(file, rawText);
        requests = requests.concat(meetingRequests);
        
        syncedMeetings.push(file.getName());
        processedCount++;
        
        // On marque le fichier Drive immédiatement
        file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
      } catch (e) {
        console.error(`Erreur sur "${file.getName()}": ${e.message}`);
      }
    }
  });

  // ENVOI GROUPÉ : Une seule requête réseau pour TOUTES les réunions
  if (requests.length > 0) {
    console.log(`Envoi de ${syncedMeetings.length} réunions au document...`);
    Docs.Documents.batchUpdate({requests: requests}, docId);
    
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedMeetings, `https://docs.google.com/document/d/${docId}/edit`);
    console.log("✅ Synchronisation terminée avec succès.");
    try { DocumentApp.getUi().alert(`✅ ${syncedMeetings.length} réunion(s) ajoutée(s).`); } catch(e) {}
  } else {
    console.log("Aucune nouvelle réunion.");
  }
}

/**
 * Prépare les instructions d'insertion pour l'API Docs.
 * On insère à l'index 1 (juste après le début) pour plus de simplicité.
 */
function prepareMeetingRequests_(file, rawText) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);
  const dateStr = file.getDateCreated().toLocaleDateString();
  
  // On construit le bloc de texte
  let fullBlock = `\n\n${file.getName()}\n📅 Date : ${dateStr}\n`;
  if (participants) fullBlock += `👥 Participants : ${participants}\n`;
  fullBlock += `----------------------------------------------------------\n${cleanedText}\n`;

  // On demande à l'API d'insérer ce bloc à la fin du document
  return [{
    insertText: {
      endOfSegmentLocation: { segmentId: "" },
      text: fullBlock
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
