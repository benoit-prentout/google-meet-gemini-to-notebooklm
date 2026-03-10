# Google Meet Gemini Notes → NotebookLM Sync (Modernized)

[English](README.md) | [Français](README_FR.md)

Automate the consolidation of **Google Meet “Notes by Gemini”** into a single **Master Google Doc**, creating a durable, enterprise-safe knowledge source for **NotebookLM**.

---

## 🚀 Overview

This project provides a **Google Apps Script** that continuously scans your `Meet Recordings` folder, extracts the text from new Gemini-generated meeting notes, and appends them into **one master document**. 

This master document serves as a "compounding brain" for **NotebookLM**, allowing you to perform reasoning and synthesis across months of meetings without hitting NotebookLM's source limits.

### ✨ Key Features
* ✅ **Modern V8 Support**: Uses modern JavaScript (ES6+).
* ✅ **Interactive Menu**: Access tools directly from your Google Doc.
* ✅ **Scalable Deduplication**: Uses file metadata (no storage limits).
* ✅ **Auto-archiving**: Automatically manages document size.
* ✅ **Notifications**: Email reports after each sync.

---

## 🏗 How It Works

1. **Trigger**: Runs on a time-based trigger (e.g., every 15 minutes).
2. **Scan**: Scans the `Meet Recordings` folder for Google Docs.
3. **Deduplicate**: Checks the file description for a `[SYNCED]` marker.
4. **Export**: Converts the Meet Doc into clean plain text via Drive API.
5. **Append**: Appends the content to your Master Doc with semantic headings.
6. **Mark**: Updates the source file's description to avoid duplicates.

---

## 🛠 Setup Instructions (The Simple Way)

### 1️⃣ Prepare the Master Document
* Create a new Google Doc (e.g., "Master Meeting Notes").
* Open the document and go to **Extensions > Apps Script**.

### 2️⃣ Deploy the Code
1. Copy the content of `apps-script/Code.gs` from this repo into the Apps Script editor (replace everything).
2. **Show the Manifest**: 
   - Click the **Project Settings** (cog icon ⚙️) on the left.
   - Check the box: "**Show 'appsscript.json' manifest file in editor**".
   - Go back to the **Editor** (< > icon), click on `appsscript.json`, and replace its content with the content of `apps-script/appsscript.json` from this repo.
3. **Add the Drive Service**:
   - In the **Editor**, click the **+** next to **Services**.
   - Select **Google Drive API** (v3) and click **Add**.

### 3️⃣ Configure
1. In **Project Settings** (cog icon ⚙️), scroll to **Script Properties**.
2. Add a new property:
   * **Property**: `MASTER_DOC_ID`
   * **Value**: Paste the ID of your Google Doc (found in the URL).
3. (Optional) In `Code.gs`, update `SOURCE_FOLDERS` if your folder is named differently.

### 4️⃣ Authorize & Automate
1. **Authorize**: 
   - In the toolbar, select `appendMeetNotesToMaster` and click **Run**.
   - Follow the security prompts to **Allow** access.
2. **Refresh**: Reload your Google Doc page. A new **🚀 NotebookLM** menu will appear.
3. **Automate**:
   - In Apps Script, go to **Triggers** (alarm clock icon ⏰).
   - Add a trigger: `appendMeetNotesToMaster` / `Time-driven` / `Minutes timer` / `Every 15 minutes`.

---

## ❓ Troubleshooting

### The "🚀 NotebookLM" menu does not appear
Ensure you followed **Step 1** by opening Apps Script *from* the document. Save your code, refresh the document page, and ensure you have run the script manually at least once to authorize it.

### "Unexpected error" in logs
Google Apps Script sometimes fails to apply semantic headings on large documents. The script includes a fallback that will use **Bold** text instead.

---

## 🧠 Using with NotebookLM

1. Open [NotebookLM](https://notebooklm.google.com).
2. Create a new notebook and add your **Master Google Doc** as a source.
3. Simply click **Refresh in NotebookLM whenever you want to sync latest meetings.

---

## 📜 License
MIT
