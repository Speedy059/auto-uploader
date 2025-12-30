# WC3 Auto Uploader - Update Summary

## Overview
This document summarizes all the updates made to the WC3 Auto Uploader application.

## Changes Made

### 1. NPM Package Upgrades ✅
- Upgraded Electron from 6.0.9 to 28.0.0
- Upgraded all dependencies to latest compatible versions:
  - electron-builder: 21.2.0 → 24.13.3
  - electron-log: 3.0.8 → 5.4.3
  - chokidar: 3.1.0 → 3.6.0
  - form-data: 2.5.1 → 4.0.5
  - And more...
- Added new dependencies:
  - dotenv: 16.4.7 (for environment variable support)
  - w3gjs: 3.0.0 (for replay parsing)

### 2. Secondary League Upload Feature ✅
- Added support for uploading to a secondary URL alongside wc3stats.com
- Configurable via `.env` file with `LEAGUE_URL` variable
- Toggle-able via system tray menu: "Enable League Upload"
- Both uploads happen sequentially for each replay

**Configuration:**
```env
LEAGUE_URL=https://replays.example.com/api/upload
```

### 3. Storm Prevention Mechanism ✅
- Adds random delay (0-15 seconds by default) before each upload
- Prevents server overload when 8+ players upload simultaneously after a game
- Fully configurable in settings:
  - `stormPrevention.enabled` (default: true)
  - `stormPrevention.minDelay` (default: 0 seconds)
  - `stormPrevention.maxDelay` (default: 15 seconds)
- Toggle-able via system tray menu: "Enable Storm Prevention"

### 4. Replay Parsing & Metadata Extraction ✅
- Automatically parses Warcraft 3 replay files using w3gjs
- Extracts game information from each replay
- Filters out "Computer" players (AI fillers) from the players list
- Sends additional parameters with every upload:

**POST Parameters Added:**
- `gameName` - The custom game name (e.g., "FBG LTD5")
- `players` - JSON array of player objects with detailed information:
  - `name` - Player BattleTag
  - `id` - Position/slot number (0-11)
  - `color` - Hex color code (e.g., "#ff0303")
  - `teamid` - Team number
  - `race` - Race code (H/O/U/N)
  - `apm` - Actions per minute

**Example from test replay:**
```json
gameName: "FBG LTD5"
players: [
  {
    "name": "UberPownage#2217",
    "id": 1,
    "color": "#540081",
    "teamid": 0,
    "race": "H",
    "apm": 23
  },
  {
    "name": "sebas32832#1783",
    "id": 3,
    "color": "#ff0303",
    "teamid": 0,
    "race": "H",
    "apm": 16
  },
  ...
]
(Note: "Computer" AI player filtered out - 8 real players)
```

### 5. API Updates ✅
- Fixed deprecated Electron APIs:
  - Removed `logger.transports.file.init()` (no longer needed)
  - Changed `shell.openItem()` to `shell.openPath()`
- Added environment variable loading with dotenv
- Improved error handling for uploads

## Files Created/Modified

### New Files:
- `.env.example` - Template for environment variables
- `.env` - User's environment configuration
- `lib/replayParser.js` - Replay parsing module using w3gjs
- `test_parser.js` - Test script for replay parsing
- `test_players.js` - Test script for player extraction
- `test_upload_data.js` - Comprehensive upload data test

### Modified Files:
- `package.json` - Updated dependencies
- `index.js` - Added menu items, env loading, API fixes
- `config.js` - Added league upload and storm prevention settings
- `lib/util.js` - Added replay parsing, dual upload support, metadata inclusion
- `lib/queue.js` - Added storm prevention delay logic
- `lib/modules/watcher.js` - Pass config to Queue
- `README.md` - Updated documentation with new features

## Testing

All features have been tested:
- ✅ Application starts successfully with Electron 28
- ✅ Application builds successfully (unpacked build created)
- ✅ Replay parser correctly extracts "FBG LTD5" from test replay
- ✅ Player names correctly extracted (including "sebas32832#1783")
- ✅ POST parameters correctly formatted for upload

## Usage

### For End Users:
1. Right-click system tray icon to access menu
2. Toggle "Enable League Upload" to enable/disable secondary upload
3. Toggle "Enable Storm Prevention" to enable/disable upload delays
4. Click "Settings" to manually configure delay ranges and URLs

### For League Administrators:
The application now sends these parameters with each replay upload:
- `replay` - The .w3g file (binary)
- `gameName` - String containing the game name
- `players` - JSON string array of player objects with detailed info

Example server-side parsing:
```javascript
const gameName = req.body.gameName; // "FBG LTD5"
const players = JSON.parse(req.body.players); // Array of player objects

// Access player details:
players.forEach(player => {
  console.log(player.name);    // "sebas32832#1783"
  console.log(player.id);      // 3 (position/slot)
  console.log(player.color);   // "#ff0303" (red)
  console.log(player.teamid);  // 0
  console.log(player.race);    // "H" (Human)
  console.log(player.apm);     // 16
});
```

## Next Steps

To use the league upload feature:
1. Set up your league's replay upload endpoint
2. Create/edit `.env` file with your `LEAGUE_URL`
3. Restart the application
4. Enable league upload from the system tray menu

The application will now upload to both wc3stats.com and your league URL with game metadata included!

