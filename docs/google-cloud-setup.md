# Google Cloud Console Setup

This guide walks you through setting up Google Cloud Console to enable OAuth for the Chrome extension.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Steps

### 1. Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" or create a new project
3. Note your Project ID (you'll need it later)

### 2. Enable Required APIs

1. Go to "APIs & Services" → "Library"
2. Search for and enable:
   - Google Drive API
   - Google Docs API
   - Apps Script API

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in:
   - App name: Meet Gemini to NotebookLM
   - User support email: (your email)
   - Developer contact: (your email)
4. Click "Save and Continue"
5. On Scopes page, add:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/script.scriptapp`
6. Click "Save and Continue"
7. Add test users (your Google account) for testing
8. Click "Save and Continue"

### 4. Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Chrome Application"
4. Name: Meet Gemini to NotebookLM
5. Add your extension ID (found in chrome://extensions)
6. Click "Create"
7. Copy the Client ID (you'll need to add it to `manifest.json` and `src/hooks/useAuth.ts`)

### 5. Update Extension Configuration

Update `manifest.json`:
```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  ...
}
```

Update `src/hooks/useAuth.ts`:
```typescript
const CLIENT_ID = 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com';
```

### 6. Deploy Apps Script as Web App

1. Open the Apps Script project
2. Click "Deploy" → "New deployment"
3. Select type: "Web app"
4. Configure:
   - Description: Meet Gemini API
   - Execute as: Me
   - Access: Anyone with Google account
5. Click "Deploy"
6. Copy the Web App URL (add to `src/lib/api.ts`)

## Troubleshooting

### OAuth Error: redirect_uri_mismatch
- Make sure the extension ID is added to OAuth client
- Check that manifest.json has correct client_id

### API errors
- Verify all APIs are enabled
- Check OAuth scopes match what's requested

### Extension not loading
- Check chrome://extensions for errors
- Verify manifest.json is valid JSON