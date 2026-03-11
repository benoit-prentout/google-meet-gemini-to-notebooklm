# Google Meet Gemini Notes → NotebookLM Sync

[English](README.md) | [Français](README_FR.md)

---

## 🚀 Quick Start (One-Click Install)

The easiest way to use this tool is to copy the pre-configured template:

1. **[Click here to Make a Copy of the Template](https://docs.google.com/document/d/1ag5wr4Tq31zBTEjGliY8hrsamvKw-TAGICwe963z0r4/copy)**
2. In your new document, refresh the page.
3. A new **🚀 NotebookLM** menu will appear.
4. Run **🔄 Sync Now** and follow the authorization prompts.

---

## 🏗 Why this tool?

NotebookLM is powerful, but it limits the number of sources you can add. By grouping months of meetings (yours and your team's) into a single "brain" document, you enable the AI to make long-term connections without ever hitting source limits.

### ✨ New Features (v4+)

* 👥 **Team Support**: Fetches meeting notes organized by your colleagues (files in "Shared with me", "Shared Drives", or files containing "Notes par Gemini").
* 📊 **Summary Table**: An automatically generated table at the top of your document lists all synced meetings.
* 🛡️ **Smart Sync**: Works even on files where you only have view-only access.
* 📦 **Neutral Archives**: Automatic archives are named **"Meeting Notes Archive"** to ensure NotebookLM treats them as historical data sources.
* ⚡ **Performance**: Uses advanced Google APIs to process 20+ meetings in seconds.

---

## 🏗 How it works?

1. **Global Scan**: The script searches for Gemini note variants ("Notes de la réunion", "Notes for", "Notes par Gemini") everywhere on your Drive.
2. **Filtering**: It ignores already-synced files using an internal script database.
3. **Cleaning**: It extracts text, removes Gemini-specific metadata, and simplifies Markdown formatting.
4. **Insertion**: It adds new notes to the top of the doc and updates the summary table.
5. **Archiving**: If the document gets too large, it creates a timestamped **"Meeting Notes Archive"** and resets.

---

## 🛠 Setup Guide (Beginners)

### 1️⃣ Prepare the Master Document
1. Create a new, empty **Google Doc** (e.g., "Master - Meeting Notes").
2. Inside this doc, go to the menu **Extensions > Apps Script**.

### 2️⃣ Copy the Code
1. Delete everything in the script editor (the `function myFunction() { ... }`).
2. Copy the entire content of the `apps-script/Code.gs` file from this repository and paste it into the editor.
3. Save (floppy disk icon) and name the project "Sync NotebookLM".

### 3️⃣ Configure Google Services
The script needs direct access to Drive and Docs APIs.
1. On the left side of the Apps Script editor, click the **+** next to **Services**.
2. Search for **Google Drive API**, select it, and click **Add**.
3. Click the **+** again, search for **Google Docs API**, select it, and click **Add**.

### 4️⃣ First Run & Authorization
1. In the top toolbar, ensure `appendMeetNotesToMaster` is selected.
2. Click **Run**.
3. An authorization window will appear:
   - Click **Review permissions**.
   - Choose your Google account.
   - If a "Google hasn't verified this app" message appears: click **Advanced** then **Go to Sync NotebookLM (unsafe)**.
   - Click **Allow**.
4. Go back to your Google Doc and refresh the page. A new **🚀 NotebookLM** menu will appear!

### 5️⃣ Automation (Optional but recommended)
To have the sync run automatically every 15 minutes:
1. In Apps Script, click the clock icon (**Triggers**) on the left.
2. Click **+ Add Trigger**.
3. Choose `appendMeetNotesToMaster`.
4. Event source: **Time-driven**.
5. Type of timer: **Minutes timer**.
6. Interval: **Every 15 minutes**.

---

## 📋 Daily Usage

| Option | Description |
|---|---|
| **🔄 Sync Now** | Forces an immediate sync of the latest meetings. |
| **📜 View Sync History** | Displays a log of recent synchronization runs. |
| **📦 Archive Document Now** | Manually empty the master doc and create a timestamped archive. |
| **🧹 Reset Sync State** | Useful if you want to re-import everything from scratch by clearing the local database. |
| **❓ Help & Setup** | Shows instructions and quick tips. |

---

## 🧠 Connecting to NotebookLM

1. Go to [NotebookLM](https://notebooklm.google.com).
2. Create a new Notebook.
3. Add your **Master Google Doc** as a source.
4. **Important**: Every time you use NotebookLM, click the **Refresh** button next to the Google Doc source so it picks up the latest meetings added by the script.

---

## 📜 License
MIT
