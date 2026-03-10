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
3. Copy the content of `apps-script/Code.gs` into the editor.
4. (Optional but Recommended) Enable the "Classic editor" or use `clasp` to upload `appsscript.json`, OR manually ensure the **Drive API** is enabled in "Services".

### 3️⃣ Configure
1. In the Apps Script editor, go to **Project Settings** (cog icon).
2. Scroll to **Script Properties**.
3. Add a new property:
   * **Property**: `MASTER_DOC_ID`
   * **Value**: Paste your Master Doc ID here.

### 4️⃣ Authorize & Automate
1. Run the `appendMeetNotesToMaster` function once manually to authorize permissions.
2. Go to **Triggers** (alarm clock icon).
3. Add a trigger:
   * Function: `appendMeetNotesToMaster`
   * Event source: `Time-driven`
   * Type: `Minutes timer`
   * Interval: `Every 15 minutes` (or your preference).

---

## 🧠 Using with NotebookLM

1. Open [NotebookLM](https://notebooklm.google.com).
2. Create a new notebook.
3. Add your **Master Google Doc** as a source.
4. Whenever you want to chat with your latest meetings, simply click **Refresh** on the source in NotebookLM.

---

## 📜 License
MIT
