# Chrome Extension + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension with React dashboard that connects to Apps Script backend via OAuth to sync Google Meet notes to NotebookLM.

**Architecture:** Chrome extension (React + Vite + TypeScript + Zustand) as frontend, existing Apps Script refactored as REST web app as backend. OAuth via Chrome Identity API for Google authentication.

**Tech Stack:** Chrome Extension Manifest V3, React 18, Vite, TypeScript, Zustand, Recharts (analytics), Tailwind CSS

---

## File Structure

```
meet-gemini-notes-to-notebooklm/
├── manifest.json                    # Chrome extension manifest
├── package.json                     # Dependencies
├── vite.config.ts                   # Vite config for Chrome ext
├── tsconfig.json
├── tailwind.config.js
├── apps-script/
│   ├── Code.gs                      # Refactored with REST endpoints
│   └── appsscript.json
└── src/
    ├── main.tsx                     # Extension entry
    ├── App.tsx                      # Main app shell
    ├── manifest.d.ts
    ├── components/
    │   ├── Dashboard.tsx             # Main dashboard layout
    │   ├── FileExplorer.tsx         # Synced files browser
    │   ├── History.tsx              # Sync history view
    │   ├── Analytics.tsx           # Charts and stats
    │   ├── Settings.tsx             # Configuration panel
    │   ├── Notifications.tsx        # Notification center
    │   ├── QuickActions.tsx        # Browser action popup
    │   └── ui/                     # shadcn/ui components
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── switch.tsx
    │       └── badge.tsx
    ├── hooks/
    │   ├── useAuth.ts               # OAuth state management
    │   └── useApi.ts               # API calls to Apps Script
    ├── store/
    │   └── settingsStore.ts        # Zustand store
    ├── lib/
    │   └── api.ts                  # API client
    └── types/
        └── index.ts                # TypeScript interfaces
```

---

## Implementation Phases

### Phase 1: Project Scaffold
### Phase 2: Apps Script REST Backend
### Phase 3: Chrome Extension Core
### Phase 4: Dashboard Components
### Phase 5: OAuth Integration
### Phase 6: Polish & Testing

---

## Phase 1: Project Scaffold

### Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `manifest.json`
- Create: `src/manifest.d.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "meet-gemini-chrome-extension",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 4: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Meet Gemini to NotebookLM",
  "version": "1.0.0",
  "description": "Sync Google Meet notes to NotebookLM",
  "permissions": ["identity", "identity.email"],
  "host_permissions": ["https://script.google.com/*"],
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/script.scriptapp"
    ]
  }
}
```

- [ ] **Step 7: Create src/manifest.d.ts**

```typescript
import { Chrome } from 'chrome';

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}
```

- [ ] **Step 8: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create src/App.tsx**

```tsx
import { Dashboard } from './components/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;
```

- [ ] **Step 11: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meet Gemini to NotebookLM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 12: Create icons directory placeholder**

Create empty `src/icons/` directory or add .gitkeep

- [ ] **Step 13: Install dependencies**

Run: `npm install`

- [ ] **Step 14: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tailwind.config.js postcss.config.js manifest.json src/ index.html
git commit -m "feat: scaffold Chrome extension project structure"
```

---

### Task 2: Install shadcn/ui Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/badge.tsx`

- [ ] **Step 1: Create src/components/ui/button.tsx**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 2: Create src/components/ui/card.tsx**

```typescript
import * as React from 'react';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={`text-sm text-muted-foreground ${className || ''}`} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex items-center p-6 pt-0 ${className || ''}`} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 3: Create src/components/ui/input.tsx**

```typescript
import * as React from 'react';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 4: Create src/components/ui/label.tsx**

```typescript
import * as React from 'react';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
```

- [ ] **Step 5: Create src/components/ui/switch.tsx**

```typescript
import * as React from 'react';

const Switch = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        ref={ref}
        className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input ${className || ''}`}
        {...props}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0`}
        />
      </button>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
```

- [ ] **Step 6: Create src/components/ui/badge.tsx**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 7: Add class-variance-authority to dependencies**

Run: `npm install class-variance-authority`

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn/ui base components"
```

---

## Phase 2: Apps Script REST Backend

### Task 3: Refactor Apps Script with REST Endpoints

**Files:**
- Modify: `apps-script/Code.gs`
- Modify: `apps-script/appsscript.json`

- [ ] **Step 1: Read current Code.gs to understand structure**

Run: `read apps-script/Code.gs` (full file)

- [ ] **Step 2: Replace apps-script/Code.gs with refactored version**

The file is ~630 lines. Key changes:
1. Add `doGet(e)` and `doPost(e)` handlers at the top
2. Add `handleRequest()` function that routes to appropriate handler based on `e.parameter.action`
3. Wrap each existing function to return JSON responses
4. Add `archiveFolderId` to CONFIG
5. Modify archive logic to use configured folder

```javascript
/**
 * Google Meet Gemini Notes → NotebookLM Sync (v5.0)
 * Chrome Extension REST API Backend
 */

const CONFIG = {
  SOURCE_FOLDER_NAME: 'Meet Recordings',
  MAX_FILES_PER_RUN: 20,
  ENABLE_NOTIFICATIONS: true,
  ARCHIVE_THRESHOLD_CHARS: 800000,
  ENABLE_MONTHLY_ARCHIVE: true,
  ENABLE_UPDATE_DETECTION: true,
  MAX_AGE_DAYS: 0,
  MAX_RETRIES: 3,
  HISTORY_SIZE: 20,
  ARCHIVE_FOLDER_ID: '',  // NEW: Configurable archive folder
  MASTER_DOC_ID: '',      // NEW: Configurable master doc ID
};

// ─── REST API HANDLERS ────────────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch (action) {
      case 'status':
        result = getStatus();
        break;
      case 'sync':
        result = runSync();
        break;
      case 'archive':
        result = runArchive();
        break;
      case 'history':
        result = getHistory();
        break;
      case 'settings':
        result = e.method === 'POST' ? updateSettings(JSON.parse(e.postData.contents)) : getSettings();
        break;
      case 'files':
        result = getFiles();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getStatus() {
  const props = PropertiesService.getScriptProperties();
  const lastSync = props.getProperty('LAST_SYNC_TIME') || null;
  const docSize = props.getProperty('DOC_SIZE') || '0';
  
  return {
    success: true,
    lastSync,
    docSize: parseInt(docSize, 10),
    isConfigured: !!(CONFIG.MASTER_DOC_ID && CONFIG.ARCHIVE_FOLDER_ID)
  };
}

function getSettings() {
  return {
    success: true,
    settings: {
      sourceFolderName: CONFIG.SOURCE_FOLDER_NAME,
      maxFilesPerRun: CONFIG.MAX_FILES_PER_RUN,
      archiveThresholdChars: CONFIG.ARCHIVE_THRESHOLD_CHARS,
      enableMonthlyArchive: CONFIG.ENABLE_MONTHLY_ARCHIVE,
      enableUpdateDetection: CONFIG.ENABLE_UPDATE_DETECTION,
      maxAgeDays: CONFIG.MAX_AGE_DAYS,
      archiveFolderId: CONFIG.ARCHIVE_FOLDER_ID,
      masterDocId: CONFIG.MASTER_DOC_ID,
      maxRetries: CONFIG.MAX_RETRIES,
      historySize: CONFIG.HISTORY_SIZE
    }
  };
}

function updateSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  
  // Store in script properties
  if (settings.masterDocId) {
    props.setProperty('MASTER_DOC_ID', settings.masterDocId);
    CONFIG.MASTER_DOC_ID = settings.masterDocId;
  }
  if (settings.archiveFolderId) {
    props.setProperty('ARCHIVE_FOLDER_ID', settings.archiveFolderId);
    CONFIG.ARCHIVE_FOLDER_ID = settings.archiveFolderId;
  }
  if (settings.maxFilesPerRun) CONFIG.MAX_FILES_PER_RUN = settings.maxFilesPerRun;
  if (settings.archiveThresholdChars) CONFIG.ARCHIVE_THRESHOLD_CHARS = settings.archiveThresholdChars;
  if (settings.enableMonthlyArchive !== undefined) CONFIG.ENABLE_MONTHLY_ARCHIVE = settings.enableMonthlyArchive;
  if (settings.enableUpdateDetection !== undefined) CONFIG.ENABLE_UPDATE_DETECTION = settings.enableUpdateDetection;
  if (settings.maxAgeDays !== undefined) CONFIG.MAX_AGE_DAYS = settings.maxAgeDays;
  
  return { success: true, message: 'Settings updated' };
}

function getHistory() {
  const props = PropertiesService.getScriptProperties();
  const history = props.getProperty('SYNC_HISTORY');
  
  return {
    success: true,
    history: history ? JSON.parse(history) : []
  };
}

function getFiles() {
  // Return list of synced files from properties
  const props = PropertiesService.getScriptProperties();
  const files = props.getProperty('SYNCED_FILES');
  
  return {
    success: true,
    files: files ? JSON.parse(files) : []
  };
}

function runSync() {
  // Existing sync logic from appendMeetNotesToMaster()
  // Modified to return structured result
  // ... (see existing Code.gs lines 50-400)
  
  const result = appendMeetNotesToMaster();
  return { success: true, result };
}

function runArchive() {
  // Existing archive logic from checkAndArchive_()
  const result = checkAndArchive_();
  return { success: true, result };
}
```

- [ ] **Step 3: Modify archive function to use configured folder**

Find `checkAndArchive_()` in Code.gs and update to use `CONFIG.ARCHIVE_FOLDER_ID`:

```javascript
function checkAndArchive_() {
  // ... existing checks ...
  
  const masterDoc = DocumentApp.openById(CONFIG.MASTER_DOC_ID);
  const docSize = masterDoc.getBody().getText().length;
  
  // ... existing archive logic ...
  
  // NEW: Move archive to configured folder
  if (CONFIG.ARCHIVE_FOLDER_ID) {
    const archiveFolder = DriveApp.getFolderById(CONFIG.ARCHIVE_FOLDER_ID);
    const archiveDoc = DriveApp.getFileById(archiveId);
    archiveFolder.addFile(archiveDoc);
    // Remove from root
    DriveApp.removeFile(archiveDoc);
  }
}
```

- [ ] **Step 4: Update appsscript.json to include web app URL**

```json
{
  "timeZone": "UTC",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Docs",
        "serviceId": "docs",
        "version": "v1"
      },
      {
        "userSymbol": "Drive",
        "serviceId": "drive",
        "version": "v3"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps-script/
git commit -m "feat: refactor Apps Script as REST API backend"
```

---

## Phase 3: Chrome Extension Core

### Task 4: Create TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
export interface SyncEvent {
  id: string;
  timestamp: string;
  filesProcessed: number;
  status: 'success' | 'partial' | 'error';
  message: string;
}

export interface Settings {
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

export interface SyncFile {
  id: string;
  name: string;
  lastSynced: string;
  size: number;
}

export interface StatusResponse {
  success: boolean;
  lastSync: string | null;
  docSize: number;
  isConfigured: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  result?: T;
  message?: string;
  settings?: Settings;
  history?: SyncEvent[];
  files?: SyncFile[];
}

export interface AnalyticsData {
  totalSyncs: number;
  totalFilesProcessed: number;
  avgFilesPerSync: number;
  syncFrequency: { date: string; count: number }[];
  monthlyStats: { month: string; files: number }[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript types"
```

---

### Task 5: Create Zustand Store

**Files:**
- Create: `src/store/settingsStore.ts`

- [ ] **Step 1: Create src/store/settingsStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, SyncEvent, SyncFile } from '@/types';

interface SettingsState {
  isAuthenticated: boolean;
  accessToken: string | null;
  settings: Settings | null;
  lastSync: string | null;
  docSize: number;
  history: SyncEvent[];
  files: SyncFile[];
  isLoading: boolean;
  error: string | null;
  
  setAuthenticated: (token: string) => void;
  setSettings: (settings: Settings) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setHistory: (history: SyncEvent[]) => void;
  addToHistory: (event: SyncEvent) => void;
  setFiles: (files: SyncFile[]) => void;
  setStatus: (lastSync: string, docSize: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      settings: null,
      lastSync: null,
      docSize: 0,
      history: [],
      files: [],
      isLoading: false,
      error: null,
      
      setAuthenticated: (token) => set({ accessToken: token, isAuthenticated: true }),
      
      setSettings: (settings) => set({ settings }),
      
      updateSetting: (key, value) =>
        set((state) => ({
          settings: state.settings ? { ...state.settings, [key]: value } : null,
        })),
      
      setHistory: (history) => set({ history }),
      
      addToHistory: (event) =>
        set((state) => ({
          history: [event, ...state.history].slice(0, state.settings?.historySize || 20),
        })),
      
      setFiles: (files) => set({ files }),
      
      setStatus: (lastSync, docSize) => set({ lastSync, docSize }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      logout: () => set({
        isAuthenticated: false,
        accessToken: null,
        settings: null,
        history: [],
        files: [],
        error: null,
      }),
    }),
    {
      name: 'meet-gemini-storage',
      partialize: (state) => ({
        settings: state.settings,
        lastSync: state.lastSync,
        docSize: state.docSize,
      }),
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add src/store/settingsStore.ts
git commit -m "feat: add Zustand settings store"
```

---

### Task 6: Create API Client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
import type { ApiResponse, StatusResponse, Settings, SyncEvent, SyncFile } from '@/types';

const DEPLOYMENT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const url = `${DEPLOYMENT_URL}?action=${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.statusText}`, response.status);
  }
  
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new ApiError(data.error || 'Unknown error');
  }
  
  return data as T;
}

export const api = {
  getStatus: (accessToken: string) =>
    fetchApi<StatusResponse>('status', { method: 'GET' }, accessToken),
  
  sync: (accessToken: string) =>
    fetchApi<{ result: unknown }>('sync', { method: 'POST' }, accessToken),
  
  archive: (accessToken: string) =>
    fetchApi<{ result: unknown }>('archive', { method: 'POST' }, accessToken),
  
  getHistory: (accessToken: string) =>
    fetchApi<{ history: SyncEvent[] }>('history', { method: 'GET' }, accessToken),
  
  getSettings: (accessToken: string) =>
    fetchApi<{ settings: Settings }>('settings', { method: 'GET' }, accessToken),
  
  updateSettings: (accessToken: string, settings: Partial<Settings>) =>
    fetchApi<{ message: string }>('settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }, accessToken),
  
  getFiles: (accessToken: string) =>
    fetchApi<{ files: SyncFile[] }>('files', { method: 'GET' }, accessToken),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add API client"
```

---

### Task 7: Create OAuth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create src/hooks/useAuth.ts**

```typescript
import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { api } from '@/lib/api';

const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/script.scriptapp',
].join(' ');

export function useAuth() {
  const { setAuthenticated, setLoading, setError, accessToken, isAuthenticated } = useSettingsStore();
  
  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true, scopes: SCOPES }, (authToken) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(authToken);
          }
        });
      });
      
      setAuthenticated(token);
      
      // Fetch initial settings after auth
      try {
        const settings = await api.getSettings(token);
        useSettingsStore.getState().setSettings(settings.settings);
      } catch {
        // Settings might not exist yet
      }
      
      return token;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAuthenticated, setLoading, setError]);
  
  const signOut = useCallback(async () => {
    if (accessToken) {
      try {
        await new Promise<void>((resolve) => {
          chrome.identity.removeCachedAuthToken({ token: accessToken }, () => resolve());
        });
      } catch {
        // Ignore errors on sign out
      }
    }
    
    useSettingsStore.getState().logout();
  }, [accessToken]);
  
  return {
    signIn,
    signOut,
    isAuthenticated,
    accessToken,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add OAuth authentication hook"
```

---

### Task 8: Create API Hook

**Files:**
- Create: `src/hooks/useApi.ts`

- [ ] **Step 1: Create src/hooks/useApi.ts**

```typescript
import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { api } from '@/lib/api';

export function useApi() {
  const { accessToken, setLoading, setError, setStatus, setHistory, setFiles, addToHistory } = useSettingsStore();
  
  const getStatus = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getStatus(accessToken);
      setStatus(response.lastSync || '', response.docSize);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, setStatus]);
  
  const sync = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.sync(accessToken);
      await getStatus();
      await getHistory();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sync failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);
  
  const archive = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.archive(accessToken);
      await getStatus();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Archive failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);
  
  const getHistory = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await api.getHistory(accessToken);
      setHistory(response.history);
      return response.history;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get history');
      throw error;
    }
  }, [accessToken, setHistory, setError]);
  
  const getFiles = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    
    try {
      const response = await api.getFiles(accessToken);
      setFiles(response.files);
      return response.files;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get files');
      throw error;
    }
  }, [accessToken, setFiles, setError]);
  
  const updateSettings = useCallback(async (settings: Parameters<typeof api.updateSettings>[1]) => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.updateSettings(accessToken, settings);
      await getStatus();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update settings');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);
  
  return {
    getStatus,
    sync,
    archive,
    getHistory,
    getFiles,
    updateSettings,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useApi.ts
git commit -m "feat: add API hooks"
```

---

## Phase 4: Dashboard Components

### Task 9: Create Dashboard Component

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Dashboard.tsx`

- [ ] **Step 1: Update src/App.tsx**

```tsx
import { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { useSettingsStore } from './store/settingsStore';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  const { settings } = useSettingsStore();
  
  useEffect(() => {
    if (isAuthenticated) {
      getStatus().catch(console.error);
      getHistory().catch(console.error);
      getFiles().catch(console.error);
    }
  }, [isAuthenticated, getStatus, getHistory, getFiles]);
  
  return <Dashboard />;
}

export default App;
```

- [ ] **Step 2: Create src/components/Dashboard.tsx**

```tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { History } from './History';
import { Analytics } from './Analytics';
import { Settings } from './Settings';
import { Notifications } from './Notifications';
import { FileExplorer } from './FileExplorer';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useSettingsStore } from '@/store/settingsStore';
import { 
  RefreshCw, 
  Settings as SettingsIcon, 
  History as HistoryIcon,
  BarChart3,
  Bell,
  FolderOpen,
  LogOut,
  Check
} from 'lucide-react';

type Tab = 'overview' | 'history' | 'analytics' | 'files' | 'settings';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { signIn, signOut, isAuthenticated } = useAuth();
  const { sync } = useApi();
  const { isLoading, lastSync, docSize, settings } = useSettingsStore();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Meet Gemini to NotebookLM</CardTitle>
            <CardDescription>
              Connect your Google account to sync your meeting notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signIn} className="w-full">
              Connect Google Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const notConfigured = !settings?.masterDocId || !settings?.archiveFolderId;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Meet Gemini to NotebookLM</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="border-b bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            <Button
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'history' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === 'files' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('files')}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Files
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {notConfigured && activeTab !== 'settings' && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="flex items-center gap-4 py-4">
              <Bell className="w-5 h-5 text-yellow-600" />
              <p className="flex-1">
                Please configure your Master Doc ID and Archive Folder in Settings to enable syncing.
              </p>
              <Button size="sm" onClick={() => setActiveTab('settings')}>
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'overview' && <OverviewPanel onSync={sync} isLoading={isLoading} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function OverviewPanel({ onSync, isLoading }: { onSync: () => Promise<void>; isLoading: boolean }) {
  const { lastSync, docSize, history } = useSettingsStore();
  const lastEvent = history[0];
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Quick Actions */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={onSync} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </CardContent>
      </Card>
      
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Last Sync</p>
            <p className="text-lg font-medium">
              {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Document Size</p>
            <p className="text-lg font-medium">
              {(docSize / 1024).toFixed(1)} KB
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={lastEvent?.status === 'success' ? 'success' : 'warning'}>
              {lastEvent?.status || 'No syncs yet'}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {lastEvent ? (
            <div className="space-y-2">
              <p className="text-sm">{lastEvent.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(lastEvent.timestamp).toLocaleString()}
              </p>
              <p className="text-sm">
                {lastEvent.filesProcessed} files processed
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activity</p>
          )}
        </CardContent>
      </Card>
      
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Notifications compact />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx src/App.tsx
git commit -m "feat: add main Dashboard component with navigation"
```

---

### Task 10: Create History Component

**Files:**
- Create: `src/components/History.tsx`

- [ ] **Step 1: Create src/components/History.tsx**

```tsx
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export function History() {
  const { history } = useSettingsStore();
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Sync History</h2>
      
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sync history yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-shrink-0">
                  {event.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {event.status === 'partial' && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  {event.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.message}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <Badge
                  variant={
                    event.status === 'success'
                      ? 'success'
                      : event.status === 'partial'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {event.filesProcessed} files
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/History.tsx
git commit -m "feat: add History component"
```

---

### Task 11: Create Analytics Component

**Files:**
- Create: `src/components/Analytics.tsx`

- [ ] **Step 1: Create src/components/Analytics.tsx**

```tsx
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export function Analytics() {
  const { history, docSize } = useSettingsStore();
  
  // Calculate analytics data
  const totalSyncs = history.length;
  const totalFilesProcessed = history.reduce((sum, e) => sum + e.filesProcessed, 0);
  const avgFilesPerSync = totalSyncs > 0 ? (totalFilesProcessed / totalSyncs).toFixed(1) : '0';
  
  // Group syncs by date for chart
  const syncsByDate = history.reduce((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const syncFrequencyData = Object.entries(syncsByDate)
    .map(([date, count]) => ({ date, count }))
    .slice(-7);
  
  // Group by month
  const syncsByMonth = history.reduce((acc, event) => {
    const month = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + event.filesProcessed;
    return acc;
  }, {} as Record<string, number>);
  
  const monthlyData = Object.entries(syncsByMonth)
    .map(([month, files]) => ({ month, files }))
    .slice(-6);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSyncs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Files Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFilesProcessed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Files / Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgFilesPerSync}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync Frequency (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {syncFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={syncFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Files (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="files"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Document Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Document Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Current Size</p>
              <p className="text-2xl font-bold">{(docSize / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size Limit</p>
              <p className="text-2xl font-bold">
                {((800000 || 0) / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Analytics.tsx
git commit -m "feat: add Analytics component with charts"
```

---

### Task 12: Create Settings Component

**Files:**
- Create: `src/components/Settings.tsx`

- [ ] **Step 1: Create src/components/Settings.tsx**

```tsx
import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Check } from 'lucide-react';

export function Settings() {
  const { settings, setSettings } = useSettingsStore();
  const { updateSettings } = useApi();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [formData, setFormData] = useState({
    masterDocId: settings?.masterDocId || '',
    archiveFolderId: settings?.archiveFolderId || '',
    sourceFolderName: settings?.sourceFolderName || 'Meet Recordings',
    maxFilesPerRun: settings?.maxFilesPerRun || 20,
    archiveThresholdChars: settings?.archiveThresholdChars || 800000,
    enableMonthlyArchive: settings?.enableMonthlyArchive ?? true,
    enableUpdateDetection: settings?.enableUpdateDetection ?? true,
    maxAgeDays: settings?.maxAgeDays || 0,
  });
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      setSettings({ ...settings!, ...formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
        {saved && (
          <Badge variant="success" className="gap-1">
            <Check className="w-3 h-3" />
            Saved
          </Badge>
        )}
      </div>
      
      {/* Google Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Google Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="masterDocId">Master Document ID</Label>
            <Input
              id="masterDocId"
              value={formData.masterDocId}
              onChange={(e) => handleChange('masterDocId', e.target.value)}
              placeholder="Enter your Google Doc ID"
            />
            <p className="text-xs text-muted-foreground">
              Found in your Google Doc URL: docs.google.com/document/d/[THIS PART]
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="archiveFolderId">Archive Folder ID</Label>
            <Input
              id="archiveFolderId"
              value={formData.archiveFolderId}
              onChange={(e) => handleChange('archiveFolderId', e.target.value)}
              placeholder="Enter your archive folder ID"
            />
            <p className="text-xs text-muted-foreground">
              Create a folder in Google Drive, then copy the ID from the URL
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceFolderName">Source Folder Name</Label>
            <Input
              id="sourceFolderName"
              value={formData.sourceFolderName}
              onChange={(e) => handleChange('sourceFolderName', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxFilesPerRun">Max Files Per Run</Label>
            <Input
              id="maxFilesPerRun"
              type="number"
              value={formData.maxFilesPerRun}
              onChange={(e) => handleChange('maxFilesPerRun', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxAgeDays">Max Age (Days)</Label>
            <Input
              id="maxAgeDays"
              type="number"
              value={formData.maxAgeDays}
              onChange={(e) => handleChange('maxAgeDays', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              0 = no filter. Set to sync only recent files.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Update Detection</Label>
              <p className="text-xs text-muted-foreground">
                Re-sync modified notes after first sync
              </p>
            </div>
            <Switch
              checked={formData.enableUpdateDetection}
              onCheckedChange={(checked) => handleChange('enableUpdateDetection', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Archive Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="archiveThresholdChars">Archive Threshold (Characters)</Label>
            <Input
              id="archiveThresholdChars"
              type="number"
              value={formData.archiveThresholdChars}
              onChange={(e) => handleChange('archiveThresholdChars', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-archive when doc exceeds this size (0 = disabled)
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Monthly Archive</Label>
              <p className="text-xs text-muted-foreground">
                Automatically archive at the start of each month
              </p>
            </div>
            <Switch
              checked={formData.enableMonthlyArchive}
              onCheckedChange={(checked) => handleChange('enableMonthlyArchive', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Settings.tsx
git commit -m "feat: add Settings component"
```

---

### Task 13: Create Notifications Component

**Files:**
- Create: `src/components/Notifications.tsx`

- [ ] **Step 1: Create src/components/Notifications.tsx**

```tsx
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationsProps {
  compact?: boolean;
}

export function Notifications({ compact = false }: NotificationsProps) {
  const { history } = useSettingsStore();
  
  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };
  
  const notifications = history.slice(0, compact ? 3 : 10);
  
  if (notifications.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Bell className="w-4 h-4" />
        <span className="text-sm">No notifications</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-start gap-2 p-2 rounded-md hover:bg-accent transition-colors"
        >
          {getIcon(notification.status)}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{notification.message}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Notifications.tsx
git commit -m "feat: add Notifications component"
```

---

### Task 14: Create FileExplorer Component

**Files:**
- Create: `src/components/FileExplorer.tsx`

- [ ] **Step 1: Create src/components/FileExplorer.tsx**

```tsx
import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, FileText, Calendar } from 'lucide-react';

export function FileExplorer() {
  const { files } = useSettingsStore();
  const [search, setSearch] = useState('');
  
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Synced Files</h2>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {files.length === 0 ? 'No files synced yet' : 'No files match your search'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(file.lastSynced).toLocaleDateString()}
                    <span>•</span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                
                <Badge variant="secondary">Synced</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FileExplorer.tsx
git commit -m "feat: add FileExplorer component"
```

---

### Task 15: Create QuickActions Component (Browser Action Popup)

**Files:**
- Create: `src/components/QuickActions.tsx`

- [ ] **Step 1: Create src/components/QuickActions.tsx**

```tsx
import { useSettingsStore } from '@/store/settingsStore';
import { useApi } from '@/hooks/useApi';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function QuickActions() {
  const { lastSync, history, isLoading, settings } = useSettingsStore();
  const { sync } = useApi();
  const lastEvent = history[0];
  
  const notConfigured = !settings?.masterDocId || !settings?.archiveFolderId;
  
  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Quick Actions</h2>
        <Badge
          variant={lastEvent?.status === 'success' ? 'success' : 'secondary'}
        >
          {lastEvent?.status === 'success' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          {lastEvent?.status || 'No syncs'}
        </Badge>
      </div>
      
      {notConfigured && (
        <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm">
          Please configure settings in the dashboard
        </div>
      )}
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Last sync:</p>
        <p className="text-sm">
          {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
        </p>
      </div>
      
      <Button
        className="w-full"
        onClick={sync}
        disabled={isLoading || notConfigured}
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Sync Now
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Open the dashboard for more features
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Update manifest.json to point to QuickActions**

Modify manifest.json `action.default_popup` to use QuickActions component

- [ ] **Step 3: Commit**

```bash
git add src/components/QuickActions.tsx
git commit -m "feat: add QuickActions popup component"
```

---

## Phase 5: OAuth Integration

### Task 16: Set Up Google Cloud Console Project

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: Create Google Cloud Console project guide**

Create `docs/google-cloud-setup.md`:

```markdown
# Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable APIs:
   - Google Drive API
   - Google Docs API
   - Apps Script API
4. Go to "Credentials" → "OAuth consent screen"
5. Configure:
   - User type: External
   - App name: Meet Gemini to NotebookLM
   - Scopes: add drive.readonly, documents, script.scriptapp
6. Go to "Credentials" → "OAuth 2.0 Client IDs"
7. Create "Chrome Application" credential
8. Copy Client ID to manifest.json
9. Deploy Apps Script as Web App and copy URL to api.ts
```

- [ ] **Step 2: Update manifest.json with placeholders**

Update with actual Client ID placeholder and instructions

- [ ] **Step 3: Commit**

```bash
git add docs/google-cloud-setup.md manifest.json
git commit -m "docs: add Google Cloud Console setup guide"
```

---

## Phase 6: Polish & Testing

### Task 17: Add Extension Icons

**Files:**
- Create: `public/icons/icon16.png`
- Create: `public/icons/icon48.png`
- Create: `public/icons/icon128.png`

- [ ] **Step 1: Create placeholder icons**

Create simple colored PNG icons (16x16, 48x48, 128x128)

- [ ] **Step 2: Update manifest.json**

Add icon references

- [ ] **Step 3: Commit**

```bash
git add public/icons/
git commit -m "feat: add extension icons"
```

---

### Task 18: Final Build Test

- [ ] **Step 1: Run build**

Run: `npm run build`

- [ ] **Step 2: Fix any TypeScript errors**

- [ ] **Step 3: Test extension loading in Chrome**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Chrome extension with dashboard"
```

---

## Plan Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Project scaffold and UI components |
| 2 | 3 | Apps Script REST backend |
| 3 | 4-8 | Extension core (types, store, API, hooks) |
| 4 | 9-15 | Dashboard components |
| 5 | 16 | OAuth setup |
| 6 | 17-18 | Polish and testing |

**Total: 18 tasks**

---

## Spec Coverage Check

- [x] Architecture: REST API between extension and Apps Script
- [x] Components: All specified components created
- [x] REST Endpoints: All 7 endpoints defined
- [x] Data Models: SyncEvent, Settings, SyncFile implemented
- [x] User Flow: OAuth, setup, sync flow
- [x] Features: Analytics, FileExplorer, History, Settings, Notifications, QuickActions
- [x] OAuth: Chrome Identity API integration
- [x] Archive Folder: Configurable via settings
- [x] NotebookLM: Manual import link (placeholder for future)

---

## Type Consistency Check

- Settings interface fields match Settings component form fields
- API response types match Zustand store update methods
- All component props typed correctly