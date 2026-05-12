# Chrome Extension + Dashboard Design Spec

**Date:** 2026-05-12
**Project:** Meet Gemini Notes to NotebookLM — Chrome Extension

---

## Overview

Transform the existing Google Apps Script into a Chrome extension with a full React dashboard, while keeping Apps Script as the backend API. The extension provides OAuth-based Google authentication, richer UI, analytics, file browsing, and settings management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
│  React + Vite + TypeScript + Zustand                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │   State     │  │  Google OAuth       │  │
│  │   Dashboard │◄─┤   (Zustand) │◄─┤  (via Chrome Identity│  │
│  │             │  │             │  │   API)              │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
└─────────────────────────────────────────────────┼─────────────┘
                                                  │
                                                  ▼ HTTP REST
┌─────────────────────────────────────────────────────────────┐
│                   Apps Script (Web App)                       │
│  REST Endpoints + Sync Engine + Archive Manager              │
└─────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
                                           Google Drive/Docs
```

---

## Components

### Chrome Extension (Frontend)

| Component | Purpose |
|-----------|---------|
| Dashboard (React) | Main UI — analytics, file explorer, settings, history |
| OAuth Manager | Handles Google sign-in via Chrome Identity API |
| Settings Store (Zustand) | Persists user config (doc ID, folder ID, preferences) |
| Quick Actions | Browser action popup with sync status and one-click sync |
| Notifications | In-app notification center for sync events/errors |

### Apps Script (Backend)

| Component | Purpose |
|-----------|---------|
| Web App Handler | Exposes REST endpoints for all operations |
| Sync Engine | Existing logic (refactored) |
| Archive Manager | Creates/moves archives to configured folder |
| Settings Manager | Reads/writes CONFIG from PropertiesService |

---

## REST API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/status` | Returns sync status, last sync time, doc size |
| POST | `/sync` | Triggers a sync run |
| POST | `/archive` | Manually triggers archive |
| GET | `/history` | Returns last N sync events |
| GET | `/settings` | Returns current CONFIG |
| POST | `/settings` | Updates CONFIG |
| GET | `/files` | Lists synced meeting files |

---

## Data Models

### SyncEvent
```typescript
interface SyncEvent {
  id: string;
  timestamp: string; // ISO8601
  filesProcessed: number;
  status: 'success' | 'partial' | 'error';
  message: string;
}
```

### Settings
```typescript
interface Settings {
  sourceFolderName: string;
  maxFilesPerRun: number;
  archiveThresholdChars: number;
  enableMonthlyArchive: boolean;
  enableUpdateDetection: boolean;
  maxAgeDays: number;
  archiveFolderId: string;
  masterDocId: string;
  maxRetries: number;
  historySize: number;
}
```

---

## User Flow

1. User installs extension (self-hosted, developer mode)
2. Clicks "Connect Google Account" → OAuth flow
3. On first sync, user selects/enters:
   - Master Google Doc ID (or creates new)
   - Archive folder (or creates new)
4. Dashboard displays: sync status, history, analytics
5. User can trigger sync manually or enable auto-sync
6. Notifications appear for sync events
7. Archives are moved to configured folder
8. User manually adds Google Doc sources to NotebookLM (manual import)

---

## Features

### Dashboard
- Analytics: Charts showing sync frequency, meeting counts over time, doc size trends
- File Explorer: Browse synced meetings, search/filter, preview content
- Notifications Center: In-app notifications for sync events, errors, archives
- Settings Panel: Configure all options via UI (replaces code editing)
- Quick Actions Toolbar: Browser action button showing recent sync status and one-click sync

### OAuth
- Chrome Identity API for Google OAuth 2.0
- User grants Drive and Docs API permissions
- Tokens stored securely by Chrome extension

---

## Extension Structure

```
meet-gemini-chrome-extension/
├── manifest.json
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── FileExplorer.tsx
│   │   ├── History.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   ├── Notifications.tsx
│   │   └── QuickActions.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useApi.ts
│   ├── store/
│   │   └── settingsStore.ts
│   └── lib/
│       └── api.ts
├── apps-script/
│   ├── Code.gs
│   └── appsscript.json
└── package.json
```

---

## Implementation Notes

### OAuth Scopes
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/documents`
- `https://www.googleapis.com/auth/script.scriptapp`

### Apps Script Deployment
- Deploy as Web App with "Execute as: Me" and "Access: Anyone with Google account"
- Each user's extension connects via their own OAuth tokens

### Archive Folder
- New `archiveFolderId` config option added to CONFIG
- Archives moved to configured folder instead of root

### NotebookLM Integration
- Manual import: User clicks link to open NotebookLM with source ready to add
- Future: Add UI to configure NotebookLM notebook URL for future automation when API available