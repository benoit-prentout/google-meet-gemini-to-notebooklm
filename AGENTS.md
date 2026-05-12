# AGENTS.md

## Repository Overview

Single Google Apps Script project that syncs Google Meet "Notes by Gemini" into a master Google Doc for NotebookLM.

## Important Quirks

- **No build/test tooling exists.** This is a pure Google Apps Script project — code runs directly in the Google Apps Script environment. There is no `npm`, `pytest`, or CI pipeline.
- **Deploy by copy-paste.** The canonical code lives in `apps-script/Code.gs`. To deploy, copy its contents into a Google Apps Script project tied to a Google Doc.
- **Two Google APIs must be enabled manually**: Google Drive API (v3) and Google Docs API (v1) — listed in `apps-script/appsscript.json`. They must be added via the Apps Script editor's Services panel.
- **State is stored in PropertiesService**, not a file. Sync history and file tracking live in the script's `PropertiesService`, not in this repo.

## Key Entry Points

- `appendMeetNotesToMaster()` — main sync function, run from the "🚀 NotebookLM" menu
- `CONFIG` object (line 6 of Code.gs) — controls max files per run, archive thresholds, notifications, and age filters
- `checkAndArchive_()` — archiving logic; triggers monthly or when doc exceeds ~800k chars
- `cleanGeminiText_()` — normalizes Gemini notes (strips markdown, metadata, headers)

## Known Failure Modes

- Files with only view access still get synced (uses Drive API read); updates are detected via modification time with a 5-minute grace period
- Email notifications use `Session.getActiveUser().getEmail()` — may fail for personal accounts or if permissions are restricted
- Archive emails silently fail if `MailApp` quota is exceeded

## Repo Structure

```
apps-script/
  Code.gs          — all application logic (single file, ~630 lines)
  appsscript.json  — manifest with API scopes and runtime config
README.md          — user-facing setup guide
README_FR.md        — French translation
```

No tests, no dependencies, no packaging scripts. If you modify Code.gs, test manually by running `appendMeetNotesToMaster` from the Apps Script editor or the Google Doc menu.