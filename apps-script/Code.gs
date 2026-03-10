/**
 * Google Meet Gemini Notes → NotebookLM Sync (Titan v2)
 * 
 * VERSION HAUTE PERFORMANCE : Utilise exclusivement les APIs Drive et Docs JSON.
 * Gère le dédoublonnage via des métadonnées cachées (AppProperties).
 */

const CONFIG = {
  // Nom du dossier Meet
  SOURCE_FOLDER_NAME: 'Meet Recordings', 
  
  // Limite caractères (Google Doc ~1M)
  MAX_DOC_CHARS: 950000,
  
  // Nombre max de fichiers par run (pour éviter timeout)
  MAX_FILES_PER_RUN: 25,
  
  ENABLE_NOTIFICATIONS: true
};

function onOpen() {
  try {
    DocumentApp.getUi().createMenu('🚀 NotebookLM')
        .addItem('Sincroniser maintenant', 'appendMeetNotesToMaster')
        .addSeparator()
        .addItem('Réinitialiser l\'état (Reset)', 'resetSyncProperties')
        .addToUi();
  } catch (e) {}
}

/**
 * Fonction ultra-rapide utilisant les APIs avancées.
 */
function appendMeetNotesToMaster() {
  const doc = DocumentApp.getActiveDocument();
  if (!doc) throw new Error("Document non trouvé (ce script doit être lié au document).");
  
  const docId = doc.getId();
  const initialText = doc.getBody().getText();
  if (initialText.length > CONFIG.MAX_DOC_CHARS) return;

  const folderId = getFolderIdByName_(CONFIG.SOURCE_FOLDER_NAME);
  if (!folderId) return;

  // REQUÊTE NÉGATIVE : On demande uniquement les fichiers PAS ENCORE synchronisés
  // 'appProperties/synced != "true"' est extrêmement rapide
  const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document' and appProperties/synced != 'true'`;
  const result = Drive.Files.list({ q: query, pageSize: CONFIG.MAX_FILES_PER_RUN, fields: "files(id, name, createdTime)" });

  if (!result.files || result.files.length === 0) {
    console.log("Aucun nouveau fichier à synchroniser.");
    return;
  }

  console.log(`Préparation de ${result.files.length} fichiers...`);
  
  let syncedNames = [];
  let requests = []; // Liste des commandes BatchUpdate pour l'API Docs

  for (const file of result.files) {
    try {
      console.log(`Extraction texte : ${file.name}`);
      const text = exportDocToText_(file.id);
      
      // On prépare l'insertion
      requests = requests.concat(prepareDocsBatchRequests_(file, text));
      
      // On marque le fichier comme "synced" via une propriété cachée
      Drive.Files.update({ appProperties: { synced: "true" } }, file.id);
      
      syncedNames.push(file.name);
    } catch (e) {
      console.error(`Erreur sur "${file.name}": ${e.message}`);
    }
  }

  if (requests.length > 0) {
    // On ajoute un saut de page si le doc n'est pas vide
    if (initialText.length > 2) {
      requests.unshift({ insertPageBreak: { endOfSegmentLocation: { segmentId: "" } } });
    }

    console.log("Envoi du lot au document (BatchUpdate)...");
    Docs.Documents.batchUpdate({ requests: requests }, docId);
    
    if (CONFIG.ENABLE_NOTIFICATIONS) sendNotification_(syncedNames, doc.getUrl());
    try { DocumentApp.getUi().alert(`✅ ${syncedNames.length} réunion(s) synchronisée(s).`); } catch(e) {}
  }
}

/**
 * Prépare les commandes JSON pour l'API Docs v1.
 */
function prepareDocsBatchRequests_(file, text) {
  const date = new Date(file.createdTime).toLocaleDateString();
  const participants = extractParticipants_(text);
  const cleanText = cleanGeminiText_(text);
  
  const header = `\n${file.name}\n📅 Date : ${date}\n`;
  const meta = participants ? `👥 Participants : ${participants}\n` : "";
  const sep = `----------------------------------------------------------\n`;
  const fullBlock = `${header}${meta}${sep}${cleanText}\n`;

  return [{
    insertText: {
      endOfSegmentLocation: { segmentId: "" },
      text: fullBlock
    }
  }];
}

/**
 * Export ultra-rapide via Drive API.
 */
function exportDocToText_(fileId) {
  return Drive.Files.export(fileId, 'text/plain', { fields: "body" }).getContentText();
}

/**
 * Réinitialise les métadonnées (Reset).
 */
function resetSyncProperties() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Confirmation', 'Réinitialiser l\'état ? Tout sera ré-importé.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const folderId = getFolderIdByName_(CONFIG.SOURCE_FOLDER_NAME);
  const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document'`;
  const files = Drive.Files.list({ q: query, fields: "files(id, name)" }).files;

  for (const file of files) {
    Drive.Files.update({ appProperties: { synced: "false" } }, file.id);
  }
  ui.alert(`🔄 Réinitialisation terminée.`);
}

/**
 * Helpers API.
 */
function getFolderIdByName_(name) {
  const q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const result = Drive.Files.list({ q: q, fields: "files(id)" });
  return result.files && result.files.length > 0 ? result.files[0].id : null;
}

function extractParticipants_(text) {
  const m = text.match(/(?:Participants|Attendees|Présents):\s*(.*)/i);
  return m ? m[1].trim() : null;
}

function cleanGeminiText_(text) {
  return text.replace(/(?:Participants|Attendees|Présents):\s*(.*)/i, '')
             .replace(/Notes par Gemini.*/gi, '')
             .replace(/Notes generated by Gemini/gi, '')
             .trim();
}

function sendNotification_(meetings, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(email, `✅ Synchro NotebookLM (${meetings.length})`, `Réunions ajoutées :\n\n- ${meetings.join('\n- ')}\n\nLien : ${url}`);
}
