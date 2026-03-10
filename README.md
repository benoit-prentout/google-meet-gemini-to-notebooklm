# Google Meet Gemini Notes → NotebookLM Sync (Modernized)

Automate the consolidation of **Google Meet “Notes by Gemini”** into a single **Master Google Doc**, creating a durable, enterprise-safe knowledge source for **NotebookLM**.

---

## 🚀 Overview

This project provides a **Google Apps Script** that continuously scans your `Meet Recordings` folder, extracts the text from new Gemini-generated meeting notes, and appends them into **one master document**. 

This master document serves as a "compounding brain" for **NotebookLM**, allowing you to perform reasoning and synthesis across months of meetings without hitting NotebookLM's source limits.

### ✨ Modernized Features (V8)
* ✅ **V8 Engine Support**: Uses modern JavaScript (ES6+).
* ✅ **Scalable Deduplication**: Uses file metadata instead of limited script properties (no 9KB limit).
* ✅ **Explicit Scopes**: Includes `appsscript.json` for easier authorization.
* ✅ **Advanced Drive API**: Uses Drive v3 for reliable document exports.

---

## 🏗 How It Works

1. **Trigger**: Runs on a time-based trigger (e.g., every 15 minutes).
2. **Scan**: Scans the `Meet Recordings` folder for Google Docs.
3. **Deduplicate**: Checks the file description for a `[SYNCED]` marker.
4. **Export**: Uses the Drive API to convert the Meet Doc into clean plain text.
5. **Append**: Appends the content to your Master Doc with a title and timestamp.
6. **Mark**: Updates the source file's description so it's never processed again.

---

## 🛠 Setup Instructions

### 1️⃣ Create the Master Document
* Create a new Google Doc (e.g., "Master Meeting Notes").
* Copy its **ID** from the URL: `https://docs.google.com/document/d/[ID]/edit`

### 2️⃣ Deploy the Script
1. Go to [script.google.com](https://script.google.com).
2. Create a **New Project**.
3. Copy the content of `apps-script/Code.gs` into the editor (replace everything).
4. **Show the Manifest**: 
   - Click the **Project Settings** (cog icon ⚙️) on the left.
   - Check the box: "**Show 'appsscript.json' manifest file in editor**".
   - Go back to the **Editor** (< > icon), click on `appsscript.json`, and replace its content with the content of `apps-script/appsscript.json` from this repo.
5. **Add the Drive Service**:
   - In the **Editor**, click the **+** next to **Services** in the left sidebar.
   - Select **Google Drive API**.
   - Ensure the version is **v3** and click **Add**.

### 3️⃣ Configure
1. In the Apps Script editor, go to **Project Settings** (cog icon ⚙️).
2. Scroll to **Script Properties**.
3. Add a new property:
   * **Property**: `MASTER_DOC_ID`
   * **Value**: Paste your Master Doc ID here.
4. (Optional) In `Code.gs`, update `SOURCE_FOLDERS` if you want to sync from multiple folders.

### 4️⃣ Authorize & Automate
1. **Force Authorization**: 
   - Select `appendMeetNotesToMaster` in the toolbar and click **Run**.
   - Click **Review Permissions** and follow the screens to **Allow**.
2. **Set the Trigger**:
   - Go to **Triggers** (alarm clock icon ⏰).
   - Click **Add Trigger**.
   - Function: `appendMeetNotesToMaster`
   - Event source: `Time-driven`
   - Type: `Minutes timer`
   - Interval: `Every 15 minutes`.
3. **(Optional) Deploy Dashboard**:
   - Click **Deploy** > **New Deployment**.
   - Select **Web App**.
   - Set "Execute as" to **Me** and "Who has access" to **Only myself**.
   - Click **Deploy** and copy the URL to view your status dashboard.

---

## 🧠 Using with NotebookLM

1. Open [NotebookLM](https://notebooklm.google.com).
2. Create a new notebook.
3. Add your **Master Google Doc** as a source.
4. Whenever you want to chat with your latest meetings, simply click **Refresh** on the source in NotebookLM.

---

## 📜 License
MIT
