# Persona 3 Reload // Chrome Suite 🌊

[![Persona 3 Reload](https://img.shields.io/badge/Persona%203%20Reload-Oceanic%20Theme-00d2ff?style=for-the-badge)](https://github.com/Mridhohm/P3_Chrome)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-ff1f70?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-001e54?style=for-the-badge)](LICENSE)

An authentic, ultra-stylized **Persona 3 Reload** browser transformation suite for Google Chrome. Recreates the iconic underwater pause menu directly inside your browser with seamless video loops, in-world sliding navigation, live search suggestions, dynamic bookmarks, behavioral top sites, and real-time synthesized sound effects.

---

## 📦 What's Included

The suite consists of two complementary components:

1. **`p3r-newtab-extension/`**: Full interactive New Tab override extension featuring Makoto Yuki's underwater loop, real-time clock HUD, Google autocomplete dropdown, dynamic bookmarks inventory, and customizable pinned apps.
2. **`p3r-chrome-theme/`**: Native Chrome theme tinting the browser top frame, active/inactive tabs, toolbar, and omnibox into deep oceanic navy and electric cyan.

---

## ✨ Features

- **Seamless Dual-Layer Video Engine:** Ultra-smooth 1080p looping background using dual-layer cross-dissolve to eliminate jump cuts and loop seams.
- **Synchronized Entrance Animation:** Cascading menu items sliced in right as the video's initial ink transition clears.
- **Direct Search Gateway:** Omni-search bar with live **Google Autocomplete suggestions** dropdown, keyboard navigation (`↑`/`↓`/`Enter`), and URL navigation.
- **Dynamic Bookmarks Inventory:** Automatically fetches your real Chrome bookmarks (`chrome.bookmarks` API) with dynamic favicons and domain badges.
- **Behavioral Pinned Sites:** Displays your most frequently visited sites based on authentic browsing behavior (`chrome.topSites` API), with support for custom site pinning (`+ PIN NEW SITE`) and hover removal (`✕`).
- **In-World Sliding Transitions:** Zero generic browser popups. Sub-panels slide smoothly in and out from the right matching Persona 3's menu architecture.
- **Synthesized Atlus Sound Engine:** High-frequency metallic chirps and blade confirm sounds synthesized entirely via Web Audio API (zero audio file bloat).
- **Deep Memory & Resource Optimization:**
  - Optimized 1080p H.264 video asset (2.1 MB) with FastStart atom for instant zero-delay playback.
  - Automatic inactive tab suspension (Web Audio thread freeze, clock timer halt, video decoder pause) to guarantee zero RAM leaks across multiple open tabs.
  - Clean default tab appearance: displays native `New Tab` title and Google favicon with zero audio indicator bloat.

---

## 🚀 Installation Guide

### Prerequisites
- Google Chrome (or any Chromium-based browser such as Brave, Edge, Opera, or Vivaldi).

---

### Step 1: Install the Native Chrome Theme (`p3r-chrome-theme`)
1. Download or clone this repository:
   ```bash
   git clone https://github.com/Mridhohm/P3_Chrome.git
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the **`p3r-chrome-theme`** folder.
6. Your browser window, tabs, and toolbar will immediately transform into the Persona 3 Reload color scheme!

---

### Step 2: Install the Interactive New Tab Extension (`p3r-newtab-extension`)
1. In the same **`chrome://extensions/`** tab:
2. Click **Load unpacked**.
3. Select the **`p3r-newtab-extension`** folder.
4. Open a new tab (`Ctrl + T`).
5. When prompted by Chrome: *"Is this the new tab you were expecting?"*, click **Keep it**.

---

## 🎮 Keyboard Controls

| Key | Action |
| :--- | :--- |
| `W` / `↑` | Move cursor up |
| `S` / `↓` | Move cursor down |
| `Enter` | Select / Open menu option |
| `/` or `Tab` | Instant shortcut to `SEARCH` bar |
| `Esc` | Return to root menu / Close dropdown / Dismiss modal |
| **Click Top-Left HUD** | Toggle between **Current Time** (`HH:MM:SS`) and **Calendar Date** (`DAY MON.DD`) |

---

## ⚙️ Settings & In-World Customization

Inside the new tab, select **`SETTINGS`**:
- **Atlus Audio Synthesizer:** Toggle sound effects on/off (`ENABLED` / `MUTED`).
- **Seamless Loop Timing Slider:** Calibrate the exact timestamp (in seconds) where the background video dissolves back into the loop.

Inside **`PINNED`**:
- **`+ PIN NEW SITE`**: Add any custom shortcut with custom name and URL.
- **Hover `✕`**: Remove any pinned item.
- **`↺ RESTORE BEHAVIOR TOP SITES`**: Instantly revert back to Chrome's automatic top visited sites based on your browsing behavior.

---

## 🔒 Permissions & Privacy

This extension runs **100% locally on your machine**. No analytics, tracking, or telemetry are collected.

- `topSites`: Used strictly to display your most visited shortcuts in the `PINNED` screen.
- `bookmarks`: Used strictly to render your bookmarks inside the `BOOKMARKS` screen.
- `host_permissions: https://suggestqueries.google.com/*`: Used exclusively to query live search suggestions as you type into the search bar.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

*Persona 3 Reload is a trademark of Atlus / SEGA. This fan project is not affiliated with or endorsed by Atlus or SEGA.*
