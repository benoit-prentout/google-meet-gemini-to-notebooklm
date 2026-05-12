# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single Google Apps Script project that syncs Google Meet "Notes by Gemini" into a master Google Doc for use as a NotebookLM source. All application logic lives in `apps-script/Code.gs` (~630 lines). There is no build system, no package manager, no tests, and no CI pipeline.

## Deployment

There is no deploy command. To ship a change:
1. Edit `apps-script/Code.gs` in this repo.
2. Copy its full contents into the Apps Script editor bound to a Google Doc.
3. Save and test manually by running `appendMeetNotesToMaster` from the editor or the "🚀 NotebookLM" menu.

## Architecture

The script is a single-file Apps Script bound to a Google Doc. It uses:
- **Google Drive API v3** (`Drive`) and **Google Docs API v1** (`Docs`) — must be added manually in the Apps Script Services panel; declared in `appsscript.json`.
- **`PropertiesService`** for all persistent state: sync history, per-file sync timestamps (`SYNC_<fileId>`), estimated doc size (`estimatedChars`), and monthly archive tracking (`lastArchiveMonth`).
- **`UrlFetchApp`** with OAuth token for raw Drive export and Docs metadata calls not covered by the advanced services.

### Key Entry Points

| Function | Purpose |
|---|---|
| `appendMeetNotesToMaster()` | Main sync: discovers, filters, cleans, and batch-inserts meeting notes |
| `checkAndArchive_()` | Triggers monthly or at ~800k chars; copies doc, clears master, sends email |
| `cleanGeminiText_()` | Strips Gemini metadata, markdown headers/bold, and excess whitespace |
| `CONFIG` (top of file) | Controls `MAX_FILES_PER_RUN`, `ARCHIVE_THRESHOLD_CHARS`, `ENABLE_MONTHLY_ARCHIVE`, `MAX_AGE_DAYS` |

### Sync Flow

1. Drive query finds all docs named with Gemini note variants (multi-language).
2. `PropertiesService` filters already-synced files; `ENABLE_UPDATE_DETECTION` re-syncs modified ones (5-min grace).
3. `checkAndArchive_()` runs before insertions if archiving is enabled.
4. All insertions are batched into a single `Docs.Documents.batchUpdate` call (inserts at index 1, so files accumulate in reverse-chronological order).
5. Summary table at document top is updated via `DocumentApp`.

### Known Failure Modes

- Email notifications via `MailApp` silently fail when quota is exceeded or on personal accounts with restricted permissions.
- `Session.getActiveUser().getEmail()` may return empty for some account types.
- Archive email failure is caught and logged but does not abort the archive.
