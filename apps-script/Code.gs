/**
 * Append Google Meet "Notes by Gemini" docs (in "Meet Recordings" folder)
 * into a single Master Google Doc.
 *
 * Modernized version for Google Apps Script (V8 Engine).
 * 
 * IMPROVEMENTS:
 * - Uses ES6+ syntax (const, let, template literals).
 * - Scales better: Uses file descriptions for deduplication (no 9KB property limit).
 * - More robust error handling and logging.
 * - Explicit OAuth scopes defined in appsscript.json.
 */

const CONFIG = {
  MASTER_DOC_ID: 'YOUR_MASTER_DOC_ID_HERE', // Set this in script properties or here
  SOURCE_FOLDER_NAME: 'Meet Recordings',
  SYNC_MARKER: '[SYNCED_TO_NOTEBOOKLM_MASTER_DOC]'
};

/**
 * Main function to sync Meet notes.
 * Set up a time-based trigger to run this (e.g., every 15-30 minutes).
 */
function appendMeetNotesToMaster() {
  // Load Doc ID from ScriptProperties if available, otherwise use CONFIG
  const masterDocId = PropertiesService.getScriptProperties().getProperty('MASTER_DOC_ID') || CONFIG.MASTER_DOC_ID;

  if (masterDocId === 'YOUR_MASTER_DOC_ID_HERE' || !masterDocId) {
    console.error('Master Doc ID not set. Please set MASTER_DOC_ID in Script Properties or the script.');
    return;
  }

  // Find source folder
  const folders = DriveApp.getFoldersByName(CONFIG.SOURCE_FOLDER_NAME);
  if (!folders.hasNext()) {
    console.warn(`Source folder not found: ${CONFIG.SOURCE_FOLDER_NAME}`);
    return;
  }
  const meetFolder = folders.next();

  // Open master doc
  let masterDoc;
  try {
    masterDoc = DocumentApp.openById(masterDocId);
  } catch (e) {
    console.error(`Could not open Master Doc with ID ${masterDocId}: ${e.message}`);
    return;
  }
  const body = masterDoc.getBody();

  // Iterate files in the folder
  const files = meetFolder.getFiles();
  let count = 0;

  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileName = file.getName();
    const mime = file.getMimeType();
    const description = file.getDescription() || '';

    // Deduplication check
    if (description.includes(CONFIG.SYNC_MARKER)) {
      continue;
    }

    // Only process Google Docs
    if (mime !== MimeType.GOOGLE_DOCS) {
      console.log(`Skipping non-Doc file: ${fileName}`);
      // Mark as skipped so we don't check it every time
      file.setDescription(`${description}\n${CONFIG.SYNC_MARKER} (SKIPPED: Not a Google Doc)`.trim());
      continue;
    }

    console.log(`Processing: ${fileName} (${fileId})`);

    try {
      // Export Meet Doc to plain text
      const text = exportGoogleDocAsText_(fileId);

      // Append to Master Doc
      if (body.getText().length > 0) {
        body.appendPageBreak();
      }

      const titlePara = body.appendParagraph(`Meeting: ${fileName}`);
      titlePara.setBold(true).setFontSize(14);

      const datePara = body.appendParagraph(`Date added: ${new Date().toLocaleString()}`);
      datePara.setItalic(true).setFontSize(10);

      body.appendParagraph(''); // Spacer
      body.appendParagraph(text);

      // Mark as processed using file description
      file.setDescription(`${description}\n${CONFIG.SYNC_MARKER}`.trim());
      console.log(`✅ Successfully appended: ${fileName}`);
      count++;

    } catch (e) {
      console.error(`❌ Failed to process ${fileName}: ${e.message}`);
    }
  }

  if (count > 0) {
    console.log(`Sync complete. Appended ${count} meeting(s).`);
  } else {
    console.log('No new meetings found to sync.');
  }
}

/**
 * Export a Google Doc as plain text using Drive v3 export endpoint.
 */
function exportGoogleDocAsText_(fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  const token = ScriptApp.getOAuthToken();

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Export API error: ${response.getResponseCode()} - ${response.getContentText()}`);
  }

  // Clean up some common text export noise if needed
  let text = response.getContentText();
  
  // Optional: Remove trailing page breaks or specific Meet artifacts if needed
  return text.trim();
}

/**
 * Setup function to help the user configure the script.
 */
function setup() {
  const ui = SpreadsheetApp.getUi ? SpreadsheetApp : null; // Check if we're in a spreadsheet or standalone
  
  // This is a placeholder since this is usually a standalone script.
  // In a standalone script, you'd just run this once and check logs.
  console.log('--- SETUP INSTRUCTIONS ---');
  console.log('1. Go to Project Settings (cog icon).');
  console.log('2. Scroll to "Script Properties".');
  console.log('3. Add a property:');
  console.log('   Property: MASTER_DOC_ID');
  console.log('   Value: [Your Google Doc ID]');
  console.log('4. Ensure you have a folder named "Meet Recordings" in your Drive.');
  console.log('5. Run "appendMeetNotesToMaster" manually once to authorize.');
  console.log('6. Set up a Time-driven trigger to automate.');
}
