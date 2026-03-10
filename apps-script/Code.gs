/**
 * Google Meet Gemini Notes → NotebookLM Sync (v4)
 */

const CONFIG = {
  SOURCE_FOLDER_NAME: 'Meet Recordings',
  MAX_FILES_PER_RUN: 20,
  ENABLE_NOTIFICATIONS: true,

  // Taille max du doc maître (en caractères) avant archivage automatique. 0 = désactivé.
  ARCHIVE_THRESHOLD_CHARS: 800000,

  // Re-synchroniser les notes modifiées après leur premier sync.
  ENABLE_UPDATE_DETECTION: true,

  // Filtrer les fichiers plus vieux que N jours. 0 = pas de filtre.
  MAX_AGE_DAYS: 0,

  // Tentatives max en cas d'erreur API transitoire.
  MAX_RETRIES: 3,

  // Nombre de syncs conservés dans l'historique.
  HISTORY_SIZE: 20,
};

// ─── MENU ─────────────────────────────────────────────────────────────────────

function onOpen() {
  try {
    DocumentApp.getUi().createMenu('🚀 NotebookLM')
      .addItem('Synchroniser maintenant', 'appendMeetNotesToMaster')
      .addSeparator()
      .addItem("Voir l'historique des syncs", 'showSyncHistory')
      .addSeparator()
      .addItem('Archiver le document maintenant', 'forceArchive')
      .addItem("Réinitialiser l'état (Reset)", 'resetSyncProperties')
      .addToUi();
  } catch (e) {}
}

// ─── SYNC PRINCIPAL ───────────────────────────────────────────────────────────

function appendMeetNotesToMaster() {
  const startTime = Date.now();
  const docId = DocumentApp.getActiveDocument().getId();
  const timezone = Session.getTimeZone() || 'Europe/Paris';
  const props = PropertiesService.getScriptProperties();

  console.time('Synchro Totale');

  // 1. Identification des fichiers à traiter
  // On cherche : 
  // - Dans le dossier "Meet Recordings" local
  // - OU les fichiers partagés dont le nom contient "Notes de la réunion" ou "Notes for"
  const folderId = getFolderIdByName_(CONFIG.SOURCE_FOLDER_NAME);
  
  let query = `mimeType = 'application/vnd.google-apps.document' and trashed = false`;
  let folderQuery = folderId ? `'${folderId}' in parents` : '';
  let nameQuery = `(name contains 'Notes de la réunion' or name contains 'Notes for')`;
  
  if (folderQuery) {
    query += ` and (${folderQuery} or ${nameQuery})`;
  } else {
    query += ` and ${nameQuery}`;
  }

  if (CONFIG.MAX_AGE_DAYS > 0) {
    const cutoff = new Date(Date.now() - CONFIG.MAX_AGE_DAYS * 86400000).toISOString();
    query += ` and modifiedTime > '${cutoff}'`;
  }

  const result = apiCall_(() => Drive.Files.list({
    q: query,
    pageSize: 100, // On prend une marge pour le filtrage manuel
    fields: 'files(id, name, createdTime, modifiedTime)',
    orderBy: 'createdTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  }));

  if (!result.files || result.files.length === 0) {
    console.log('Aucune réunion trouvée.');
    showAlert_('Tout est déjà à jour !');
    return;
  }

  // 2. Filtrage des fichiers déjà synchronisés (via PropertiesService)
  const toProcess = [];
  const updatedIds = [];
  
  for (const file of result.files) {
    const lastSyncTime = props.getProperty('SYNC_' + file.id);
    
    if (!lastSyncTime) {
      toProcess.push(file);
    } else if (CONFIG.ENABLE_UPDATE_DETECTION) {
      // Détection de mise à jour : comparaison des dates
      const modifiedDate = new Date(file.modifiedTime).getTime();
      const syncDate = parseInt(lastSyncTime, 10);
      const GRACE_MS = 5 * 60 * 1000; // Marge de 5min
      
      if (modifiedDate > syncDate + GRACE_MS) {
        toProcess.push(file);
        updatedIds.push(file.id);
      }
    }
    
    if (toProcess.length >= CONFIG.MAX_FILES_PER_RUN) break;
  }

  if (toProcess.length === 0) {
    console.log('Tout est déjà synchronisé.');
    showAlert_('Tout est déjà à jour !');
    return;
  }

  // 3. Archivage si le doc dépasse le seuil
  if (CONFIG.ARCHIVE_THRESHOLD_CHARS > 0) {
    checkAndArchive_(docId, timezone);
  }

  // 4. Traitement des fichiers
  const filesToProcess = toProcess.reverse();
  const requests = [];
  const syncedEntries = [];
  let errorCount = 0;

  for (const file of filesToProcess) {
    try {
      console.log(`Extraction : ${file.name}`);
      const rawText = apiCall_(() => exportFileAsText_(file.id));

      const participants = extractParticipants_(rawText);
      const cleanText = cleanGeminiText_(rawText);
      const isUpdate = updatedIds.indexOf(file.id) !== -1;
      const dateStr = Utilities.formatDate(new Date(file.createdTime), timezone, 'dd/MM/yyyy');

      const blockText = buildBlock_(file.name, dateStr, participants, cleanText, isUpdate);
      
      requests.push({
        insertText: {
          location: { index: 1 },
          text: blockText,
        },
      });

      // Stocker l'état de synchro localement (timestamp de modification)
      props.setProperty('SYNC_' + file.id, String(new Date(file.modifiedTime).getTime()));
      syncedEntries.push({ name: file.name, date: dateStr });

    } catch (e) {
      errorCount++;
      console.error(`Erreur sur ${file.name}: ${e.message}\n${e.stack}`);
    }
  }

  // 5. Envoi groupé vers le document
  if (requests.length > 0) {
    apiCall_(() => Docs.Documents.batchUpdate({ requests }, docId));
    updateDocSizeEstimate_(requests);
    
    try {
      updateSummaryTable_(docId, syncedEntries);
    } catch (e) {
      console.error(`Tableau récapitulatif échoué : ${e.message}`);
    }

    if (CONFIG.ENABLE_NOTIFICATIONS) {
      try {
        sendNotification_(syncedEntries.map(e => e.name), updatedIds.map(id => id), errorCount, `https://docs.google.com/document/d/${docId}/edit`);
      } catch (e) {
        console.error(`Notification échouée : ${e.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.timeEnd('Synchro Totale');
    logSyncRun_({ date: new Date().toISOString(), synced: syncedEntries.length, updated: updatedIds.length, errors: errorCount, duration });

    const errorMsg = errorCount > 0 ? ` ⚠️ ${errorCount} erreur(s) — voir les logs STACKDRIVER.` : '';
    showAlert_(`✅ ${syncedEntries.length} réunion(s) ajoutée(s).${errorMsg}`);
  }
}

// ─── ARCHIVAGE ────────────────────────────────────────────────────────────────

function forceArchive() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Archiver', 'Copier ce document dans une archive et le vider ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const docId = DocumentApp.getActiveDocument().getId();
  const timezone = Session.getTimeZone() || 'Europe/Paris';
  PropertiesService.getScriptProperties().setProperty('estimatedChars', String(Number.MAX_SAFE_INTEGER));
  checkAndArchive_(docId, timezone);
  showAlert_('✅ Archive créée. Le document maître a été vidé.');
}

function checkAndArchive_(docId, timezone) {
  const props = PropertiesService.getScriptProperties();
  const estimatedChars = parseInt(props.getProperty('estimatedChars') || '0', 10);

  if (estimatedChars < CONFIG.ARCHIVE_THRESHOLD_CHARS) return;

  console.log(`📦 Seuil d'archivage atteint (~${estimatedChars} chars). Archivage en cours...`);

  try {
    const dateStr = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd — HH'h'mm");

    const copy = apiCall_(() => Drive.Files.copy({ name: `NotebookLM Archive — ${dateStr}` }, docId));
    const archiveUrl = `https://docs.google.com/document/d/${copy.id}/edit`;

    // Marquer l'archive comme synchronisée localement
    props.setProperty('SYNC_' + copy.id, String(Date.now()));

    const metaUrl = `https://docs.googleapis.com/v1/documents/${docId}?fields=body.content.endIndex`;
    const metaResp = UrlFetchApp.fetch(metaUrl, {
      headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    });
    const metaData = JSON.parse(metaResp.getContentText());
    const content = metaData.body.content;
    const endIndex = content[content.length - 1].endIndex - 1;

    const clearRequests = [];
    if (endIndex > 1) {
      clearRequests.push({ deleteContentRange: { range: { startIndex: 1, endIndex } } });
    }
    clearRequests.push({
      insertText: { location: { index: 1 }, text: `[Archive du ${dateStr} → ${archiveUrl} ]\n\n` },
    });
    apiCall_(() => Docs.Documents.batchUpdate({ requests: clearRequests }, docId));

    props.setProperty('estimatedChars', '0');
    console.log(`✅ Archivé : NotebookLM Archive — ${dateStr} (${archiveUrl})`);

  } catch (e) {
    console.error(`Archivage échoué : ${e.message}`);
  }
}

function updateDocSizeEstimate_(requests) {
  const props = PropertiesService.getScriptProperties();
  const current = parseInt(props.getProperty('estimatedChars') || '0', 10);
  const added = requests.reduce((sum, r) => sum + (r.insertText ? r.insertText.text.length : 0), 0);
  props.setProperty('estimatedChars', String(current + added));
}

// ─── RESET ────────────────────────────────────────────────────────────────────

function resetSyncProperties() {
  const ui = DocumentApp.getUi();
  const response = ui.alert(
    'Confirmation',
    'Voulez-vous tout ré-importer ?\nToutes les réunions seront re-synchronisées.',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();
  
  for (const key in allProps) {
    if (key.indexOf('SYNC_') === 0) {
      props.deleteProperty(key);
    }
  }

  props.deleteProperty('estimatedChars');
  ui.alert('🔄 Prêt pour ré-importation.');
}

// ─── HISTORIQUE ───────────────────────────────────────────────────────────────

function showSyncHistory() {
  const props = PropertiesService.getScriptProperties();
  const history = JSON.parse(props.getProperty('syncHistory') || '[]');

  if (history.length === 0) {
    showAlert_('Aucun historique disponible.');
    return;
  }

  const lines = history.map(run => {
    const d = new Date(run.date).toLocaleString();
    const dur = `${(run.duration / 1000).toFixed(1)}s`;
    return `${d}  |  +${run.synced} nouvelles  |  ↻${run.updated} MàJ  |  ⚠️${run.errors} erreurs  |  ⏱${dur}`;
  });

  showAlert_(`Historique (${history.length} dernières syncs) :\n\n${lines.join('\n')}`);
}

function logSyncRun_(run) {
  try {
    const props = PropertiesService.getScriptProperties();
    const history = JSON.parse(props.getProperty('syncHistory') || '[]');
    history.unshift(run);
    if (history.length > CONFIG.HISTORY_SIZE) history.length = CONFIG.HISTORY_SIZE;
    props.setProperty('syncHistory', JSON.stringify(history));
  } catch (e) {
    console.error(`logSyncRun_ échoué : ${e.message}`);
  }
}

// ─── TABLEAU RÉCAPITULATIF ────────────────────────────────────────────────────

function updateSummaryTable_(docId, newEntries) {
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  
  let table = body.getTables()[0];
  
  if (!table) {
    table = body.insertTable(0, [['Date', 'Réunion']]);
    table.getRow(0).setAttributes({
      [DocumentApp.Attribute.BOLD]: true,
      [DocumentApp.Attribute.BACKGROUND_COLOR]: '#f3f3f3'
    });
    body.insertParagraph(1, '');
  }
  
  const entries = [...newEntries];
  for (const entry of entries) {
    const row = table.insertTableRow(1);
    row.appendTableCell(entry.date);
    row.appendTableCell(entry.name);
  }
  
  doc.saveAndClose();
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getFolderIdByName_(name) {
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const res = apiCall_(() => Drive.Files.list({
    q: `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  }));
  return res.files && res.files.length > 0 ? res.files[0].id : null;
}

function extractParticipants_(text) {
  const match = text.match(/(?:Participants|Attendees|Présents)\s*:\s*([^\n]*)(\n(?!\n)[^\n]+)*/i);
  if (!match) return null;

  const raw = match[0].replace(/(?:Participants|Attendees|Présents)\s*:\s*/i, '');

  const entries = raw.split(/[\n,;]+/)
    .map(s => s
      .replace(/<[^>]+>/g, '')
      .replace(/\([^)]*@[^)]*\)/g, '')
      .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '')
      .replace(/^[-•*]\s*/, '')
      .trim()
    )
    .filter(s => s.length > 0);

  return entries.length > 0 ? entries.join(', ') : null;
}

function cleanGeminiText_(text) {
  return text
    .replace(/(?:Participants|Attendees|Présents)\s*:.*?(?=\n\n|\n[A-Z]|$)/is, '')
    .replace(/Notes\s+(?:par|by|generated by)\s+Gemini[^\n]*/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildBlock_(name, dateStr, participants, cleanText, isUpdate) {
  const updateTag = isUpdate ? ' [MISE À JOUR]' : '';
  const participantsLine = participants ? `👥 Participants : ${participants}\n` : '';
  return `\n\n${name}${updateTag}\n📅 Date : ${dateStr}\n${participantsLine}${'─'.repeat(58)}\n${cleanText}\n`;
}

function sendNotification_(newMeetings, updatedMeetings, errorCount, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  if (!email) return;

  const parts = [];
  if (newMeetings.length > 0) parts.push(`Nouvelles réunions :\n- ${newMeetings.join('\n- ')}`);
  if (updatedMeetings.length > 0) parts.push(`Mises à jour :\n- ${updatedMeetings.join('\n- ')}`);
  if (errorCount > 0) parts.push(`⚠️ ${errorCount} fichier(s) en erreur — vérifiez les logs STACKDRIVER.`);

  MailApp.sendEmail(
    email,
    `✅ Synchro NotebookLM (${newMeetings.length + updatedMeetings.length} réunions)`,
    `${parts.join('\n\n')}\n\nDoc : ${url}`
  );
}

function showAlert_(msg) {
  try { DocumentApp.getUi().alert(msg); } catch (e) {}
}

function exportFileAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fplain`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error(`Export échoué (${response.getResponseCode()}) : ${response.getContentText().slice(0, 200)}`);
  }
  return response.getContentText();
}

function apiCall_(fn) {
  let lastError;
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      return fn();
    } catch (e) {
      lastError = e;
      if (attempt < CONFIG.MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 500;
        console.warn(`API erreur (tentative ${attempt + 1}/${CONFIG.MAX_RETRIES}) : ${e.message}. Retry dans ${delay}ms`);
        Utilities.sleep(delay);
      }
    }
  }
  throw lastError;
}
