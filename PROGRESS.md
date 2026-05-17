# do. — Progress Log

---

## Session: 2026-05-17 (Sat) ~22:21–23:36 PHT

### 🎯 Goal
Build a desktop widget for the do. task manager so stats can be monitored directly from the Windows home screen without opening a browser.

---

### ✅ Implemented

#### 1. Web Widget Route (`/widget`)
- Created `src/app/widget/page.tsx` — a compact stats page at `/widget`
- Displays: today's progress bar, streak counter, week stats, urgent count, 12-week activity heatmap, pending task list
- Auto-refreshes every 60 seconds
- Links back to main app

#### 2. Electron Desktop Widget (`widget-desktop/`)
- Built a standalone Electron app that sits on the Windows desktop
- **Frameless transparent window** — no browser chrome, feels native
- **System tray icon** — green dot in taskbar; click to toggle, right-click for menu
- **Global hotkey** — `Ctrl+Shift+D` toggles widget from anywhere, auto-focuses input
- **Draggable** — drag by the header area to reposition
- **Pin button** (yellow dot) — keeps widget always-on-top
- **Hide button** (red dot) — hides to system tray

#### 3. Quick-Add Task Input
- Same syntax as the web app's TaskInput
- Supports: `#area`, `~due` (today/tomorrow/mon-sun/ISO date), `!priority` (high/low/normal), `@recurring` (daily/weekly/monthly)
- Example: `Buy groceries #personal ~fri !high`
- Ported the full `parseTask.ts` logic to vanilla JS in the widget

#### 4. Click-to-Complete Tasks
- Tasks displayed in the widget are clickable — click to mark as completed
- Visual checkbox UI with hover feedback

#### 5. Offline Queue System
- Tasks added or completed while offline are queued in `localStorage`
- Queue badge shows count of pending operations
- Auto-syncs to Supabase when connectivity is restored
- Manual flush every 30 seconds when online
- Toast notifications for queued actions

#### 6. Connection Status Indicator
- Green dot = connected, red dot = offline
- Listens to browser `online`/`offline` events

#### 7. Font Change — San Francisco
- Switched both the web app (`globals.css`) and desktop widget from JetBrains Mono to SF Pro system font stack
- Stack: `-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

---

### 🐛 Issues Encountered & Fixed

| Issue | Root Cause | Fix |
|---|---|---|
| **Hydration error** on `/widget` page | Inline `<style>` tag caused server/client HTML encoding mismatch (`'` → `&#x27;`) | Removed redundant inline `<style>` — `globals.css` already had those styles |
| **Cannot drag widget** | HTML element had two `id` attributes (`id="header" id="drag"`) — second one ignored | Removed duplicate id, applied `-webkit-app-region: drag` to `#header` |
| **Buttons not working** (pin/hide) | Buttons inside drag region weren't registering clicks | Already had `button { -webkit-app-region: no-drag }` — fixed by correcting the drag region selector |
| **"Open do." link did nothing** | Used `require('electron').shell` in renderer with `contextIsolation: true` | Added `openApp()` to preload IPC bridge, handled via `shell.openExternal()` in main process |
| **Supabase POST 400 error** | Sending `null` values for optional columns (`notes: null`, `parent_id: null`) | Only send non-null fields; DB defaults handle the rest |

---

### 📁 Files Created

| File | Purpose |
|---|---|
| `src/app/widget/page.tsx` | Web-based widget page (Next.js route) |
| `widget-desktop/package.json` | Electron widget package config |
| `widget-desktop/main.js` | Electron main process — window, tray, global shortcut, IPC |
| `widget-desktop/preload.js` | Context bridge — safe IPC for renderer |
| `widget-desktop/widget.html` | Widget UI — stats, quick-add, offline queue |
| `widget-desktop/start.bat` | One-click launcher |

### 📁 Files Modified

| File | Change |
|---|---|
| `src/app/globals.css` | Font changed from JetBrains Mono → SF Pro system font |

---

### 🔧 Tech Stack (Widget)

- **Electron 30** — desktop window + system tray
- **Vanilla HTML/CSS/JS** — no framework, fast cold start
- **Supabase REST API** — direct fetch, no SDK needed
- **localStorage** — offline queue persistence

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+D` | Toggle widget visibility (global) |
| `Enter` | Submit task in quick-add input |
| `Escape` | Hide widget (when input focused) |

---

### 📌 Notes
- Widget talks directly to Supabase REST API — **no Next.js server needed**
- GPU process warning in Electron console (`gpu_process_host.cc`) is harmless and expected on some Windows configs
- To auto-start widget on boot: `Win+R` → `shell:startup` → paste shortcut to `start.bat`

---

## Session: 2026-05-18 (Sun) ~00:17–01:11 PHT

### 🎯 Goal
Visual overhaul of the desktop widget with Apple-inspired Liquid Glass UI, interactive polish, and rich heatmap tooltips.

---

### ✅ Implemented

#### 1. Liquid Glass UI Redesign
- Complete CSS overhaul with frosted glass aesthetic
- **Card**: Semi-translucent gradient background with glass shimmer reflection overlay (`::before`) and ambient edge glow (`::after` with inset highlights)
- **Panels & Chips**: Glass-like with `linear-gradient` backgrounds, top-edge light refraction lines, and translucent borders
- **Tabs**: Glass pill tabs with inner glow, colored text shadows for Active (green) / Done (blue)
- **Progress bar**: Gradient fill with ambient glow shadow
- **Control buttons**: Radial gradients simulating light refraction, scale-up hover effect
- **Status dots**: Ambient glow halos
- **Input bar**: Green border glow on focus-within
- All text uses `rgba(255,255,255,...)` at varying opacities for glass depth

#### 2. Apple Squircle Corners (Superellipse)
- Implemented Apple-style **continuous/squircle corners** using a JS-generated `clip-path: polygon()`
- Uses the **superellipse formula** with n=5 (exponent 2/n = 0.4) for smooth, organic corner transitions
- 64 points per corner (16 per quadrant) for high-resolution curves
- `ResizeObserver` auto-recalculates when card height changes
- Corner radius: 24px
- Replaces standard CSS `border-radius` circular arcs with mathematically smoother Apple-style geometry

#### 3. Frosted Glass Effects
- Pure dark black card background (`rgba(14,14,14,1)`)
- Bright shimmer reflection overlay (12% white gradient)
- Green ambient outer glow (40px + 80px halos)
- Frosted inner radiance (green + white inset glow)
- Bright top-edge highlight (14% white) for glass refraction
- Deep 32px drop shadow for depth

#### 4. Heatmap Rich Tooltips
- Hover any heatmap cell to see a **glass-styled tooltip** with:
  - **Date** — formatted as "Sun, May 18"
  - **Count** — "3 tasks completed" in green
  - **Task titles** — up to 5 completed task names with bullet points, "+N more" overflow
- Updated Supabase query to fetch `title` alongside `completed_at` for the heatmap data
- Tooltip auto-positions above the cell (or below if near top edge)
- Glass-styled with gradient background, border glow, and backdrop blur

#### 5. Heatmap Visibility Fix
- Empty heatmap cells changed from nearly invisible `#1e1e1e` to visible `#2a2a2a`
- Active cell greens boosted across all levels for better contrast

#### 6. IPC Enhancements
- Added `window-focus` / `window-blur` IPC events in main process
- Exposed `onWindowFocus` / `onWindowBlur` callbacks in preload bridge
- (Interactive opacity feature was explored but removed per user preference — widget stays permanently solid)

---

### 🐛 Issues Encountered & Fixed

| Issue | Root Cause | Fix |
|---|---|---|
| **Desktop bleeds through card** | `backdrop-filter: blur()` in Electron can't blur the actual OS desktop — only web content | Made card background 98-100% opaque; used CSS-only frost effects (gradients, glows, shimmer) instead |
| **Heatmap cells invisible** | Level-0 color `#1e1e1e` was too close to card background | Changed to `#2a2a2a` and boosted all green levels |
| **GPU cache errors on restart** | Previous Electron instance left stale lock on GPU shader cache folder | Harmless — can be cleared with `Remove-Item $env:APPDATA\do-widget\GPUCache` |

---

### 📁 Files Modified

| File | Change |
|---|---|
| `widget-desktop/widget.html` | Full Liquid Glass CSS overhaul, squircle clip-path, heatmap tooltips, frost effects |
| `widget-desktop/main.js` | Added focus/blur IPC event emitters |
| `widget-desktop/preload.js` | Exposed `onWindowFocus`/`onWindowBlur` IPC callbacks |
