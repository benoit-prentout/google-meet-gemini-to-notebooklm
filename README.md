# Google Meet Gemini Notes → NotebookLM Sync

[English](README.md) | [Français](README_FR.md)

Automate the consolidation of **Google Meet "Notes by Gemini"** into a single **Master Google Doc**, creating a durable knowledge source for **NotebookLM**.

---

## 🚀 Overview

This **Google Apps Script** continuously scans your `Meet Recordings` folder, extracts text from new Gemini-generated meeting notes, and inserts them into one master document.

This master document serves as a "compounding brain" for **NotebookLM**, allowing you to reason and synthesize across months of meetings without hitting NotebookLM's source limits.

### ✨ Key Features

* ✅ **Zero DocumentApp** — 100% Drive & Docs API for maximum speed
* ✅ **Scalable deduplication** — Uses hidden file metadata (appProperties), no storage limits
* ✅ **Update detection** — Re-syncs notes that were edited after their first sync
* ✅ **Auto-archiving** — Automatically archives the master doc when it exceeds a configurable size
* ✅ **Date filter** — Optionally ignore files older than N days
* ✅ **API retry with backoff** — Handles transient Google API errors gracefully
* ✅ **Sync history** — View the last 20 sync runs directly from the menu
* ✅ **Email notifications** — Summary report after each sync (new + updated + errors)
* ✅ **Interactive menu** — All actions accessible from your Google Doc

---

## 🏗 How It Works

1. **Trigger** — Runs on a time-based trigger (e.g., every 15 minutes).
2. **Scan** — Queries the `Meet Recordings` folder for Google Docs not yet synced.
3. **Update check** — Detects previously-synced files that were modified since the last sync.
4. **Archive check** — If the master doc is too large, copies it to an archive doc and resets.
5. **Export** — Converts each Meet Doc to plain text via the Drive API.
6. **Clean** — Strips Gemini metadata, markdown formatting, and normalizes whitespace.
7. **Batch insert** — Sends all insertions in a single Docs API request.
8. **Mark** — Stores `synced=true` and `syncedAt=<timestamp>` in the file's hidden metadata.
9. **Notify** — Sends an email summary (new meetings, updates, errors).

---

## 🛠 Setup

### 1️⃣ Prepare the Master Document

* Create a new Google Doc (e.g., "Master Meeting Notes").
* Open it and go to **Extensions > Apps Script**.

### 2️⃣ Deploy the Code

1. Copy `apps-script/Code.gs` into the Apps Script editor (replace everything).
2. **Show the Manifest**:
   - Click **Project Settings** (⚙️ icon).
   - Check "**Show 'appsscript.json' manifest file in editor**".
   - Open `appsscript.json` in the editor and replace its content with `apps-script/appsscript.json` from this repo.

### 3️⃣ Configure

Edit the `CONFIG` object at the top of `Code.gs`:

```javascript
const CONFIG = {
  SOURCE_FOLDER_NAME: 'Meet Recordings', // Name of your Meet Recordings folder
  MAX_FILES_PER_RUN: 20,                 // Max files per trigger execution
  ENABLE_NOTIFICATIONS: true,            // Email summary after each sync

  ARCHIVE_THRESHOLD_CHARS: 800000,       // Archive master doc above ~800K chars (0 = disabled)
  ENABLE_UPDATE_DETECTION: true,         // Re-sync notes modified after first sync
  MAX_AGE_DAYS: 0,                       // Ignore files older than N days (0 = no filter)
  MAX_RETRIES: 3,                        // API retry attempts on transient errors
  HISTORY_SIZE: 20,                      // Number of sync runs kept in history
};
```

### 4️⃣ Authorize & Automate

1. **Authorize**: Select `appendMeetNotesToMaster` in the toolbar and click **Run**. Follow the Google security prompts.
2. **Refresh**: Reload your Google Doc. A **🚀 NotebookLM** menu will appear.
3. **Automate**: In Apps Script, go to **Triggers** (⏰ icon) and add:
   - Function: `appendMeetNotesToMaster`
   - Event: `Time-driven` → `Minutes timer` → `Every 15 minutes`

---

## 📋 Menu Options

| Menu item | Description |
|---|---|
| Synchroniser maintenant | Run a sync immediately |
| Voir l'historique des syncs | Display the last 20 sync runs (date, count, errors, duration) |
| Réinitialiser l'état (Reset) | Clear sync state — all files will be re-imported on next run |

---

## ❓ Troubleshooting

**The "🚀 NotebookLM" menu does not appear**
Make sure you opened Apps Script *from* the document (Extensions > Apps Script). Refresh the document page after saving the script.

**"Dossier source introuvable" error**
Check that `CONFIG.SOURCE_FOLDER_NAME` matches the exact name of your folder in Google Drive.

**Files are not being detected**
The script uses Drive's `appProperties` API. Ensure the Drive API v3 is enabled in Services.

---

## 🧠 Using with NotebookLM

1. Open [NotebookLM](https://notebooklm.google.com).
2. Create a notebook and add your **Master Google Doc** as a source.
3. Click **Refresh** in NotebookLM whenever you want to sync the latest meetings.

---

## 📜 License

MIT
