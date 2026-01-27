Here’s a **complete, polished GitHub README** you can copy-paste directly. It’s written to be clear for **developers, presales leaders, and enterprise users**, and explains exactly what the Apps Script does and how to use it.

---

# Google Meet Gemini Notes → Master Doc (NotebookLM Ready)

Automate the consolidation of **Google Meet “Notes by Gemini”** into a single **Master Google Doc**, creating a durable, enterprise-safe knowledge source for **NotebookLM** and long-term reasoning.

---

## 🚀 Overview

Google Meet + Gemini generates high-value meeting notes — but they’re fragmented across many documents.

This **Google Apps Script** continuously scans a Drive folder, exports new Gemini notes, and appends them into **one canonical master document**. The result is a clean, ever-growing source that can be added to **NotebookLM** for synthesis, pattern recognition, and institutional memory.

No unsupported APIs. No brittle UI automation. Enterprise-safe by design.

---

## 🎯 What This Solves

* ❌ Scattered meeting notes across dozens of files
* ❌ Manual copy/paste into NotebookLM
* ❌ Lost context over time

**Instead you get:**

* ✅ One authoritative master document
* ✅ Automated ingestion every X minutes
* ✅ Safe deduplication (no double appends)
* ✅ Fault-tolerant processing
* ✅ NotebookLM-ready knowledge source

---

## 🏗 High-Level Architecture

```
Google Meet (Gemini Notes)
        ↓
Google Drive (Meet Recordings folder)
        ↓
Google Apps Script (scheduled automation)
        ↓
Master Google Doc (canonical knowledge store)
        ↓
NotebookLM (manual refresh for reasoning)
```

---

## ⚙️ How It Works

1. Runs on a **time-based trigger** (e.g. every 15 minutes)
2. Scans the Drive folder `Meet Recordings`
3. Iterates all files safely
4. Skips non-Google Docs
5. Deduplicates using `ScriptProperties`
6. Exports Google Docs using **Drive v3 export API**
7. Appends content to a Master Google Doc
8. Logs failures without breaking the run

Each meeting is appended with:

* Meeting title
* Timestamp
* Full Gemini transcript text

---

## 🔐 Security & Governance

* Runs entirely inside Google Workspace
* Uses script OAuth token only
* No external services required
* No unsupported NotebookLM APIs
* Fully auditable via Apps Script & Drive logs
* Manual NotebookLM refresh preserves user trust

---

## 📂 Repository Structure

```
apps-script/
├── Code.gs            # Main Apps Script logic
├── appsscript.json    # Script manifest (optional but recommended)
README.md
```

---

## 🛠 Setup Instructions

### 1️⃣ Create the Master Document

* Create a Google Doc
* Copy its **Document ID**
* Paste it into `MASTER_DOC_ID` in `Code.gs`

### 2️⃣ Create the Source Folder

* In Google Drive, create a folder named exactly:

  ```
  Meet Recordings
  ```

### 3️⃣ Create the Apps Script Project

1. Go to [https://script.google.com](https://script.google.com)
2. Create a new project
3. Replace `Code.gs` with the contents of this repo’s `Code.gs`
4. (Optional) Add `appsscript.json`

### 4️⃣ Authorize

* Run `appendMeetNotesToMaster()` once manually
* Approve Drive and UrlFetch permissions

### 5️⃣ Automate

* Add a **time-based trigger** (e.g. every 15 minutes)

---

## 🧠 Using with NotebookLM

1. Add the **Master Google Doc** as a source in NotebookLM
2. When new meetings are appended:

   * Open NotebookLM
   * Click **Refresh / Sync source**
3. Ask NotebookLM questions across **weeks or months of meetings**

> NotebookLM refresh is manual by design (enterprise-safe tradeoff).

---

## 🧩 Key Design Decisions

* **Drive v3 export API** instead of `DocumentApp.openById()` on Meet docs
* Defensive formatting (no fragile heading APIs)
* Idempotent processing (safe to rerun)
* Loose coupling with NotebookLM

---

## 🎯 Ideal Use Cases

* Presales & Solution Engineering teams
* Sales & Consulting orgs
* Knowledge-heavy leadership roles
* Anyone building long-term institutional memory from meetings

---

## ⚠️ Notes & Limitations

* NotebookLM does not auto-refresh sources (manual click required)
* Only Google Docs are processed (videos, PDFs are skipped safely)
* ScriptProperties are per-script (reset if you clone to a new project)

---

## 📜 License

MIT (or replace with your preferred license)

---

## 🙌 Credits

Built to turn conversations into **compounding knowledge**, not chat scroll.

---


