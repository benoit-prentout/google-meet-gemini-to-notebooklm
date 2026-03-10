/**
 * Google Meet Gemini Notes → NotebookLM Sync (Pro Version)
 * 
 * Includes:
 * - Piste 1: Improved Formatting & Extraction
 * - Piste 2: Auto-archiving (Saturation management)
 * - Piste 4: Email Notifications & Web Dashboard
 * - Piste 5: Multi-source Folder Support
 */

const CONFIG = {
  // Fallback IDs if not set in Script Properties
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', 
  
  // Piste 5: Multiple source folders (Names or IDs)
  SOURCE_FOLDERS: ['Meet Recordings'], 
  
  // Piste 2: Safety limit (Google Docs limit is ~1M chars)
  MAX_DOC_CHARS: 850000, 
  
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]',
  
  // Piste 4: Notification settings
  ENABLE_NOTIFICATIONS: true,
  NOTIFICATION_EMAIL: Session.getActiveUser().getEmail()
};

/**
 * Main function to sync Meet notes.
 */
function appendMeetNotesToMaster() {
  let masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    console.error('Master Doc ID not set.');
    return;
  }

  let masterDoc = DocumentApp.openById(masterDocId);
  
  // Piste 2: Check for saturation and rotate if needed
  if (masterDoc.getBody().getText().length > CONFIG.MAX_DOC_CHARS) {
    masterDocId = rotateMasterDoc_(masterDoc);
    masterDoc = DocumentApp.openById(masterDocId);
  }

  const body = masterDoc.getBody();
  let syncedMeetings = [];

  // Piste 5: Iterate through multiple source folders
  CONFIG.SOURCE_FOLDERS.forEach(folderNameOrId => {
    let folder;
    try {
      folder = DriveApp.getFolderById(folderNameOrId);
    } catch(e) {
      const folders = DriveApp.getFoldersByName(folderNameOrId);
      if (folders.hasNext()) folder = folders.next();
    }

    if (!folder) {
      console.warn(`Folder not found: ${folderNameOrId}`);
      return;
    }

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
        console.error(`Error processing ${file.getName()}: ${e.message}`);
      }
    }
  });

  // Piste 4: Send Notifications
  if (syncedMeetings.length > 0 && CONFIG.ENABLE_NOTIFICATIONS) {
    sendNotification_(syncedMeetings, masterDoc.getUrl());
  }

  return syncedMeetings;
}

/**
 * Piste 2: Create a new Master Doc when the current one is full.
 */
function rotateMasterDoc_(oldDoc) {
  const oldName = oldDoc.getName();
  const newName = `${oldName} (Continued ${new Date().toLocaleDateString()})`;
  const newDoc = DocumentApp.create(newName);
  const newId = newDoc.getId();
  
  // Update properties for the next run
  PropertiesService.getScriptProperties().setProperty('MASTER_DOC_ID', newId);
  
  console.log(`🚀 Master Doc rotated! New Doc: ${newName} (${newId})`);
  
  if (CONFIG.ENABLE_NOTIFICATIONS) {
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, 
      "⚠️ NotebookLM Sync: New Master Doc Created", 
      `The previous Master Doc reached its size limit.\nA new one has been created: ${newDoc.getUrl()}\n\nPlease add this new source to your NotebookLM.`);
  }
  
  return newId;
}

/**
 * Piste 4: Simple Web Dashboard
 */
function doGet() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const lastSync = new Date().toLocaleString();
  
  const html = `
    <html>
      <head><style>body{font-family:sans-serif;padding:20px;line-height:1.6} .card{border:1px solid #ccc;padding:15px;border-radius:8px}</style></head>
      <body>
        <h1>📊 NotebookLM Sync Dashboard</h1>
        <div class="card">
          <p><strong>Current Master Doc ID:</strong> ${props.MASTER_DOC_ID || 'Not Set'}</p>
          <p><strong>Source Folders:</strong> ${CONFIG.SOURCE_FOLDERS.join(', ')}</p>
          <p><strong>Last Dashboard Refresh:</strong> ${lastSync}</p>
        </div>
        <p>To force a sync, run the <code>appendMeetNotesToMaster</code> function in the editor.</p>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html).setTitle('NotebookLM Sync Dashboard');
}

/**
 * Helper to process a single meeting (Refactored Piste 1)
 */
function processMeeting_(file, rawText, body) {
  const participants = extractParticipants_(rawText);
  const cleanedText = cleanGeminiText_(rawText);

  if (body.getText().length > 0) body.appendPageBreak();

  body.appendParagraph(file.getName()).setHeading(DocumentApp.ParagraphHeading.HEADING_2);
  body.appendParagraph(`📅 Date: ${file.getDateCreated().toLocaleDateString()}`).setItalic(true).setFontSize(10);
  
  if (participants) {
    body.appendParagraph(`👥 Participants: ${participants}`).setHeading(DocumentApp.ParagraphHeading.HEADING_3);
  }

  body.appendParagraph('---').setAttributes({HORIZONTAL_ALIGNMENT: DocumentApp.HorizontalAlignment.CENTER});

  cleanedText.split('\n').forEach(line => {
    if (line.trim()) {
      const p = body.appendParagraph(line.trim());
      if (line.trim().length < 60 && (line.includes(':') || line.toUpperCase() === line)) p.setBold(true);
    }
  });

  file.setDescription(`${file.getDescription()}\n${CONFIG.SYNC_MARKER}`.trim());
}

/**
 * Piste 4: Send Email summary
 */
function sendNotification_(meetings, docUrl) {
  const subject = `✅ Sync Complete: ${meetings.length} new meeting(s) added`;
  const body = `The following meetings have been appended to your Master Doc:\n\n- ${meetings.join('\n- ')}\n\nView Master Doc: ${docUrl}\n\nDon't forget to click "Refresh" in NotebookLM!`;
  MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
}

/** 
 * Extraction Helpers (from Piste 1) 
 */
function extractParticipants_(text) {
  const patterns = [/Participants:\s*(.*)/i, /Attendees:\s*(.*)/i, /Présents:\s*(.*)/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function cleanGeminiText_(text) {
  let cleaned = text.replace(/Participants:\s*(.*)/i, '').replace(/Attendees:\s*(.*)/i, '').replace(/Présents:\s*(.*)/i, '');
  return cleaned.replace(/Notes generated by Gemini/gi, '').trim();
}

function exportGoogleDocAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error(`API Error ${response.getResponseCode()}`);
  return response.getContentText();
}
