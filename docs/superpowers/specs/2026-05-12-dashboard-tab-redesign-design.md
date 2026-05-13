# Dashboard Tab Redesign

**Date:** 2026-05-12  
**Status:** Approved

## Summary

Split the Chrome extension into two surfaces: a lightweight popup for quick actions and a full-page dashboard tab for detailed management. Redesign both with a Clean Light / Google-ish visual style (white cards, Google blue `#1a73e8`, subtle borders). All stat cards uniform in size.

---

## 1. Entry Points (Two Vite Builds)

Add a second HTML entry point alongside the existing `index.html`:

| File | Purpose | Size target |
|------|---------|-------------|
| `index.html` | Popup — lightweight, ~240px wide | < 50 KB JS |
| `dashboard.html` | Full-page dashboard tab | Full bundle |

`vite.config.ts` uses `rollupOptions.input` to declare both. `manifest.json` keeps `"default_popup": "index.html"`. The popup calls `chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })` to open the dashboard tab; if the tab is already open it is focused instead (via `chrome.tabs.query`).

---

## 2. Popup (`src/popup/`)

New standalone entry: `src/popup/main.tsx` → `src/popup/App.tsx` → `src/popup/Popup.tsx`.

**Unauthenticated state:** "Connect Google Account" button only.  
**No deployment URL:** "Open Setup" button that opens `index.html` (setup wizard).  
**Authenticated + configured state:**

- Header: blue bar with logo + app name
- 2×2 grid of equal-size stat cards (fixed `height: 52px`): Last Sync · Doc Size · Files Synced · Status (green dot)
- "↻ Sync Now" primary button (blue, full-width)
- "Open Dashboard →" secondary button (white/border, full-width)
- Footer: user email + "Sign out" link

Popup width: `w-60` (240px). No scrolling. Auth/store hooks reused from `src/hooks/` and `src/store/`.

---

## 3. Dashboard Tab (`src/dashboard/`)

New entry: `src/dashboard/main.tsx` → `src/dashboard/App.tsx` → `src/dashboard/Dashboard.tsx`.

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  [N] Meet → NotebookLM          ● Synced  email  │  ← top bar (h-12)
├────────────┬────────────────────────────────────────┤
│ ↻ Overview │  [stat] [stat] [stat] [stat]           │
│   History  │  [Quick Actions]  [Recent Activity]    │
│   Analytics│  …                                     │
│   Files    │                                        │
│ ⚙ Settings │                                        │
└────────────┴────────────────────────────────────────┘
  160px fixed   flex-1
```

**Top bar:** logo, app name, status badge, user email.  
**Sidebar (160px, fixed):** icon + label for each nav item. Active item: `bg-blue-50 border-r-2 border-blue-600 text-blue-600`. Settings pinned at bottom with `mt-auto`.  
**Content area:**
- 4-column equal-height stat row: Last Sync · Doc Size · Files Synced · Status
- Second row: Quick Actions (1fr) + Recent Activity (2fr) — both same height
- Remaining tabs (History, Analytics, Files, Settings) render existing components unchanged

---

## 4. Visual Style

| Token | Value |
|-------|-------|
| Primary | `#1a73e8` (Google blue) |
| Active bg | `#e8f0fe` |
| Border | `#e2e8f0` |
| Muted text | `#94a3b8` |
| Success | `#16a34a` with `#e8f5e9` bg |
| Warning | `#f59e0b` with `#fef9c3` bg |
| Page bg | `#f8fafc` |
| Card bg | `#ffffff` |

Cards: `rounded-lg border border-slate-200 bg-white`. Stat cards: explicit `h-[70px]` (dashboard) / `h-[52px]` (popup) so all cells are identical size.

---

## 5. Manifest Changes

No new permissions required. `dashboard.html` is a local extension page — no `host_permissions` needed for it.

`manifest.json` stays as-is (popup remains `index.html`). The popup JS opens the dashboard tab programmatically.

---

## 6. Files Changed / Created

| Path | Change |
|------|--------|
| `vite.config.ts` | Add `dashboard.html` to `rollupOptions.input` |
| `index.html` | Stays as popup entry (already exists) |
| `dashboard.html` | New — mirrors `index.html` but points to `src/dashboard/main.tsx` |
| `src/popup/main.tsx` | New popup entry point |
| `src/popup/App.tsx` | Popup app shell (auth/storage checks) |
| `src/popup/Popup.tsx` | Popup UI component |
| `src/dashboard/main.tsx` | New dashboard entry point |
| `src/dashboard/App.tsx` | Dashboard app shell |
| `src/dashboard/Dashboard.tsx` | Left-sidebar layout + tab routing |
| `src/App.tsx` | Repurposed as popup shell — simplified to render `<Popup />` (drops Dashboard import) |
| `src/main.tsx` | Unchanged — remains popup entry, already points at `src/App.tsx` |

Existing tab components (`History`, `Analytics`, `Settings`, `FileExplorer`, `QuickActions`, `Notifications`) are reused unchanged inside the dashboard.

---

## 7. Out of Scope

- Bug fixes (Settings not loaded, JSON parse error in Notifications) — separate task
- New features (schedule sync, notifications settings, etc.)
- Dark mode
