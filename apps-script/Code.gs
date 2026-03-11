/**
 * Google Meet Gemini Notes → NotebookLM Sync (v4.1)
 * 100% English Version with UI Refinements
 */

const CONFIG = {
  SOURCE_FOLDER_NAME: 'Meet Recordings',
  MAX_FILES_PER_RUN: 20,
  ENABLE_NOTIFICATIONS: true,

  // Max size of the master doc (in characters) before auto-archiving. 0 = disabled.
  ARCHIVE_THRESHOLD_CHARS: 800000,

  // Re-sync modified notes after their first sync.
  ENABLE_UPDATE_DETECTION: true,

  // Filter files older than N days. 0 = no filter.
  MAX_AGE_DAYS: 0,

  // Max retries for transient API errors.
  MAX_RETRIES: 3,

  // Number of syncs kept in history.
  HISTORY_SIZE: 20,
};

// ─── MENU ─────────────────────────────────────────────────────────────────────

/**
 * Creates the custom menu when the document opens.
 */
function onOpen() {
  try {
    const ui = DocumentApp.getUi();
    ui.createMenu('🚀 NotebookLM')
      .addItem('🔄 Sync Now', 'appendMeetNotesToMaster')
      .addSeparator()
      .addItem('⏰ Enable Auto-Sync (Every 15m)', 'setupTrigger')
      .addItem('📜 View Sync History', 'showSyncHistory')
      .addSeparator()
      .addItem('📦 Archive Document Now', 'forceArchive')
      .addItem('🧹 Reset Sync State (Full Re-sync)', 'resetSyncProperties')
      .addSeparator()
      .addItem('❓ Help & Setup', 'showHelp')
      .addToUi();

    // First run logic
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('initialized')) {
      showHelp();
      insertWelcomeContent();
      props.setProperty('initialized', 'true');
    }
  } catch (e) {
    console.error('Menu creation failed:', e.message);
  }
}

/**
 * Automatically sets up a 15-minute time-based trigger.
 */
function setupTrigger() {
  const ui = DocumentApp.getUi();
  
  // Check if trigger already exists
  const allTriggers = ScriptApp.getProjectTriggers();
  const existing = allTriggers.find(t => t.getHandlerFunction() === 'appendMeetNotesToMaster');
  
  if (existing) {
    ui.alert('⏰ Auto-Sync is already active.');
    return;
  }

  try {
    ScriptApp.newTrigger('appendMeetNotesToMaster')
      .timeBased()
      .everyMinutes(15)
      .create();
      
    ui.alert('✅ Success!', 'Auto-sync is now active. This document will update every 15 minutes.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('❌ Error', 'Could not set up trigger: ' + e.message + '\n\nMake sure you have approved all permissions.', ui.ButtonSet.OK);
  }
}

/**
 * Inserts a beautiful setup guide into the document body.
 */
function insertWelcomeContent() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  
  // Only insert if the document is essentially empty
  if (body.getText().trim().length > 100) return;

  body.clear();
  
  const title = body.appendParagraph('🚀 Welcome to NotebookLM Sync');
  title.setHeading(DocumentApp.ParagraphHeading.TITLE);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph('Follow these 4 steps to activate your knowledge base:').setHeading(DocumentApp.ParagraphHeading.HEADING2);

  const list1 = body.appendListItem('Authorize the script: Go to the "🚀 NotebookLM" menu and click "🔄 Sync Now". Follow the Google prompts.');
  const list2 = body.appendListItem('Enable Auto-Sync: In the same menu, click "⏰ Enable Auto-Sync". This will fetch new meetings every 15 minutes.');
  const list3 = body.appendListItem('Connect to NotebookLM: Add this document as a source in NotebookLM. Remember to click "Refresh" in NotebookLM after a sync!');
  const list4 = body.appendListItem('📦 Manage Archives: When this document reaches its size limit, a "Meeting Notes Archive" is created. You must manually add each new archive to NotebookLM to keep your full history available!');

  body.appendParagraph('\n---').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  const footer = body.appendParagraph('Note: You can delete these instructions once you are set up. Your meeting notes will appear below the summary table.');
  footer.setItalic(true);
  footer.setAttributes({[DocumentApp.Attribute.FOREGROUND_COLOR]: '#70757a'});

  const github = body.appendParagraph('Star this project on GitHub');
  github.setLinkUrl('https://github.com/benoit-prentout/google-meet-gemini-to-notebooklm');
  github.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  doc.saveAndClose();
}

/**
 * Displays a help dialog with instructions.
 */
function showHelp() {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 15px; color: #3c4043; line-height: 1.5;">
      <h2 style="color: #1a73e8; margin-top: 0;">🚀 NotebookLM Sync Help</h2>
      <p>This tool consolidates <b>Google Meet "Notes by Gemini"</b> into this document to create a powerful source for NotebookLM.</p>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
        <div style="margin-bottom: 8px;"><b>🔄 Sync Now:</b> Manually fetch the latest meeting notes.</div>
        <div style="margin-bottom: 8px;"><b>📜 View History:</b> Check the status of recent sync operations.</div>
        <div style="margin-bottom: 8px;"><b>📦 Archive:</b> Safely move current content to an archive file when it gets too large.</div>
        <div style="margin-bottom: 0;"><b>🧹 Reset:</b> Clear the sync database to re-import all meetings from scratch.</div>
      </div>

      <p style="font-size: 0.9em;"><b>Pro Tip:</b> Add this document to a <a href="https://notebooklm.google.com" target="_blank">NotebookLM</a> notebook and remember to <b>Refresh</b> the source after syncing!</p>
      
      <div style="text-align: center; margin: 15px 0;">
        <a href="https://github.com/benoit-prentout/google-meet-gemini-to-notebooklm" target="_blank" style="background: #1a73e8; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 0.9em;">⭐ View on GitHub</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e8eaed; margin: 15px 0;">
      <div style="font-size: 0.8em; color: #70757a; text-align: center;">v4.1 • 100% English • MIT License</div>
    </div>
  `;
  const userInterface = HtmlService.createHtmlOutput(html)
    .setTitle('Help & Documentation')
    .setWidth(450)
    .setHeight(400);
  DocumentApp.getUi().showModelessDialog(userInterface, ' ');
}

// ─── MAIN SYNC LOGIC ──────────────────────────────────────────────────────────

/**
 * Main function to find, clean, and append new meeting notes.
 */
function appendMeetNotesToMaster() {
  const startTime = Date.now();
  const docId = DocumentApp.getActiveDocument().getId();
  const timezone = Session.getScriptTimeZone() || 'UTC';
  const props = PropertiesService.getScriptProperties();

  console.time('Total Sync');

  // 1. Identify files to process
  // Search in: 
  // - Local "Meet Recordings" folder
  // - OR shared files with specific naming conventions
  const folderId = getFolderIdByName_(CONFIG.SOURCE_FOLDER_NAME);
  
  let query = `mimeType = 'application/vnd.google-apps.document' and trashed = false`;
  let folderQuery = folderId ? `'${folderId}' in parents` : '';
  let nameQuery = `(name contains 'Notes de la réunion' or name contains 'Meeting notes' or name contains 'Notes for' or name contains 'Notes by Gemini' or name contains 'Notes par Gemini')`;
  
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
    pageSize: 100, 
    fields: 'files(id, name, createdTime, modifiedTime)',
    orderBy: 'createdTime desc',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  }));

  if (!result.files || result.files.length === 0) {
    console.log('No meetings found.');
    showAlert_('Everything is already up to date!');
    return;
  }

  // 2. Filter already synced files (using PropertiesService)
  const toProcess = [];
  const updatedIds = [];
  
  for (const file of result.files) {
    const lastSyncTime = props.getProperty('SYNC_' + file.id);
    
    if (!lastSyncTime) {
      toProcess.push(file);
    } else if (CONFIG.ENABLE_UPDATE_DETECTION) {
      // Update detection: compare modification dates
      const modifiedDate = new Date(file.modifiedTime).getTime();
      const syncDate = parseInt(lastSyncTime, 10);
      const GRACE_MS = 5 * 60 * 1000; // 5 min grace period
      
      if (modifiedDate > syncDate + GRACE_MS) {
        toProcess.push(file);
        updatedIds.push(file.id);
      }
    }
    
    if (toProcess.length >= CONFIG.MAX_FILES_PER_RUN) break;
  }

  if (toProcess.length === 0) {
    console.log('All files are already synced.');
    showAlert_('Everything is already up to date!');
    return;
  }

  // 3. Check for auto-archiving
  if (CONFIG.ARCHIVE_THRESHOLD_CHARS > 0) {
    checkAndArchive_(docId, timezone);
  }

  // 4. Process files
  const filesToProcess = toProcess.reverse();
  const requests = [];
  const syncedEntries = [];
  let errorCount = 0;

  for (const file of filesToProcess) {
    try {
      console.log(`Processing: ${file.name}`);
      const rawText = apiCall_(() => exportFileAsText_(file.id));

      const participants = extractParticipants_(rawText);
      const cleanText = cleanGeminiText_(rawText);
      const isUpdate = updatedIds.indexOf(file.id) !== -1;
      const dateStr = Utilities.formatDate(new Date(file.createdTime), timezone, 'yyyy-MM-dd');

      const blockText = buildBlock_(file.name, dateStr, participants, cleanText, isUpdate);
      
      requests.push({
        insertText: {
          location: { index: 1 },
          text: blockText,
        },
      });

      // Store sync state locally (modification timestamp)
      props.setProperty('SYNC_' + file.id, String(new Date(file.modifiedTime).getTime()));
      syncedEntries.push({ name: file.name, date: dateStr });

    } catch (e) {
      errorCount++;
      console.error(`Error on ${file.name}: ${e.message}\n${e.stack}`);
    }
  }

  // 5. Batch update the document
  if (requests.length > 0) {
    apiCall_(() => Docs.Documents.batchUpdate({ requests }, docId));
    updateDocSizeEstimate_(requests);
    
    try {
      updateSummaryTable_(docId, syncedEntries);
    } catch (e) {
      console.error(`Summary table update failed: ${e.message}`);
    }

    if (CONFIG.ENABLE_NOTIFICATIONS) {
      try {
        sendNotification_(syncedEntries.map(e => e.name), updatedIds.map(id => id), errorCount, `https://docs.google.com/document/d/${docId}/edit`);
      } catch (e) {
        console.error(`Notification failed: ${e.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.timeEnd('Total Sync');
    logSyncRun_({ date: new Date().toISOString(), synced: syncedEntries.length, updated: updatedIds.length, errors: errorCount, duration });

    const errorMsg = errorCount > 0 ? ` ⚠️ ${errorCount} error(s) — check Stackdriver logs.` : '';
    showAlert_(`✅ ${syncedEntries.length} meeting(s) added.${errorMsg}`);
  }
}

// ─── ARCHIVING ────────────────────────────────────────────────────────────────

/**
 * Manually triggers an archive of the current document.
 */
function forceArchive() {
  const ui = DocumentApp.getUi();
  if (ui.alert('Archive', 'Copy this document to an archive and clear the current content?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const docId = DocumentApp.getActiveDocument().getId();
  const timezone = Session.getScriptTimeZone() || 'UTC';
  PropertiesService.getScriptProperties().setProperty('estimatedChars', String(Number.MAX_SAFE_INTEGER));
  checkAndArchive_(docId, timezone);
  showAlert_('✅ Archive created. The master document has been cleared.');
}

/**
 * Checks document size and archives if threshold is reached.
 */
function checkAndArchive_(docId, timezone) {
  const props = PropertiesService.getScriptProperties();
  const estimatedChars = parseInt(props.getProperty('estimatedChars') || '0', 10);

  if (estimatedChars < CONFIG.ARCHIVE_THRESHOLD_CHARS) return;

  console.log(`📦 Archiving threshold reached (~${estimatedChars} chars). Archiving...`);

  try {
    const dateStr = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd — HH'h'mm");

    const copy = apiCall_(() => Drive.Files.copy({ name: `Meeting Notes Archive — ${dateStr}` }, docId));
    const archiveUrl = `https://docs.google.com/document/d/${copy.id}/edit`;

    // Mark the archive as synced locally
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
      insertText: { location: { index: 1 }, text: `[Meeting Notes Archive — ${dateStr} → ${archiveUrl} ]\n\n` },
    });
    apiCall_(() => Docs.Documents.batchUpdate({ requests: clearRequests }, docId));

    props.setProperty('estimatedChars', '0');
    console.log(`✅ Archived: Meeting Notes Archive — ${dateStr} (${archiveUrl})`);

    // Send email notification for the archive
    try {
      const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
      if (email) {
        MailApp.sendEmail(
          email,
          `📦 Document Archived — NotebookLM Sync`,
          `The master document reached its size limit and has been archived.\n\n` +
          `Archive Name: Meeting Notes Archive — ${dateStr}\n` +
          `Archive Link: ${archiveUrl}\n\n` +
          `The master document has been cleared and is ready for new meetings.`
        );
      }
    } catch (e) {
      console.error(`Archive notification failed: ${e.message}`);
    }

  } catch (e) {
    console.error(`Archiving failed: ${e.message}`);
  }
}

/**
 * Updates the estimated document size based on inserted text.
 */
function updateDocSizeEstimate_(requests) {
  const props = PropertiesService.getScriptProperties();
  const current = parseInt(props.getProperty('estimatedChars') || '0', 10);
  const added = requests.reduce((sum, r) => sum + (r.insertText ? r.insertText.text.length : 0), 0);
  props.setProperty('estimatedChars', String(current + added));
}

// ─── RESET ────────────────────────────────────────────────────────────────────

/**
 * Resets the local sync database to allow re-importing all meetings.
 */
function resetSyncProperties() {
  const ui = DocumentApp.getUi();
  const response = ui.alert(
    'Confirmation',
    'Do you want to re-import everything?\nAll past meeting notes will be re-synced.',
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
  ui.alert('🔄 Ready for re-importation.');
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────

/**
 * Shows the history of recent sync operations.
 */
function showSyncHistory() {
  const props = PropertiesService.getScriptProperties();
  const history = JSON.parse(props.getProperty('syncHistory') || '[]');

  if (history.length === 0) {
    showAlert_('No sync history available.');
    return;
  }

  const lines = history.map(run => {
    const d = new Date(run.date).toLocaleString();
    const dur = `${(run.duration / 1000).toFixed(1)}s`;
    return `${d}  |  +${run.synced} new  |  ↻${run.updated} updates  |  ⚠️${run.errors} errors  |  ⏱${dur}`;
  });

  showAlert_(`Sync History (latest ${history.length} runs):\n\n${lines.join('\n')}`);
}

/**
 * Logs a sync run to the internal history.
 */
function logSyncRun_(run) {
  try {
    const props = PropertiesService.getScriptProperties();
    const history = JSON.parse(props.getProperty('syncHistory') || '[]');
    history.unshift(run);
    if (history.length > CONFIG.HISTORY_SIZE) history.length = CONFIG.HISTORY_SIZE;
    props.setProperty('syncHistory', JSON.stringify(history));
  } catch (e) {
    console.error(`logSyncRun_ failed: ${e.message}`);
  }
}

// ─── SUMMARY TABLE ────────────────────────────────────────────────────────────

/**
 * Updates the summary table at the top of the document.
 */
function updateSummaryTable_(docId, newEntries) {
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  
  let table = body.getTables()[0];
  
  if (!table) {
    table = body.insertTable(0, [['Date', 'Meeting Name']]);
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

/**
 * Finds a folder ID by its name.
 */
function getFolderIdByName_(name) {
  const safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const res = apiCall_(() => Drive.Files.list({
    q: `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  }));
  return res.files && res.files.length > 0 ? res.files[0].id : null;
}

/**
 * Extracts participant names from raw text.
 */
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

/**
 * Cleans Gemini notes text by removing metadata and simplifying formatting.
 */
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

/**
 * Builds the text block for a meeting.
 */
function buildBlock_(name, dateStr, participants, cleanText, isUpdate) {
  const updateTag = isUpdate ? ' [UPDATED]' : '';
  const participantsLine = participants ? `👥 Participants: ${participants}\n` : '';
  return `\n\n${name}${updateTag}\n📅 Date: ${dateStr}\n${participantsLine}${'─'.repeat(58)}\n${cleanText}\n`;
}

/**
 * Sends an email notification after sync.
 */
function sendNotification_(newMeetings, updatedMeetings, errorCount, url) {
  const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  if (!email) return;

  const parts = [];
  if (newMeetings.length > 0) parts.push(`New meetings:\n- ${newMeetings.join('\n- ')}`);
  if (updatedMeetings.length > 0) parts.push(`Updates:\n- ${updatedMeetings.join('\n- ')}`);
  if (errorCount > 0) parts.push(`⚠️ ${errorCount} file(s) failed — check Stackdriver logs.`);

  MailApp.sendEmail(
    email,
    `✅ NotebookLM Sync Status (${newMeetings.length + updatedMeetings.length} meetings)`,
    `${parts.join('\n\n')}\n\nDocument: ${url}`
  );
}

/**
 * Displays a simple UI alert.
 */
function showAlert_(msg) {
  try { DocumentApp.getUi().alert(msg); } catch (e) {}
}

/**
 * Exports a Drive file as plain text.
 */
function exportFileAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fplain`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new Error(`Export failed (${response.getResponseCode()}): ${response.getContentText().slice(0, 200)}`);
  }
  return response.getContentText();
}

/**
 * Helper to call APIs with automatic retries.
 */
function apiCall_(fn) {
  let lastError;
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      return fn();
    } catch (e) {
      lastError = e;
      if (attempt < CONFIG.MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 500;
        console.warn(`API error (attempt ${attempt + 1}/${CONFIG.MAX_RETRIES}): ${e.message}. Retrying in ${delay}ms`);
        Utilities.sleep(delay);
      }
    }
  }
  throw lastError;
}
