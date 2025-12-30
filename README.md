# WC3Stats Auto Uploader (LEAUGE FORK)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [How it Works](#how-it-works)
- [FAQ](#faq)
- [Building](#building)
- [Notes](#notes)

## Features

* Automatically uploads Warcraft III replay files to wc3stats.com.
* **Secondary League Upload** - Optionally upload replays to a second URL (e.g., private league site) simultaneously.
* **Storm Prevention** - Random upload delay (0-15s) to prevent server overload when multiple players upload after a game.
* **Replay Parsing** - Automatically extracts and includes game name with each upload.
* **No upfront configuration** & detailed logging for troubleshooting.
* **Automatically starts** when logging into your computer (i.e. signed out or restart).
* **System tray icon** to indicate the program is running with menu items (settings, logs and exit).
* **Automatically reloads** when the settings file is updated (no need to restart).
* **Easily uninstallable** in the "Add or remove programs" control panel.
* **Supports networkio** allowing map editors to [proxy network requests](https://github.com/voces/wc3networkio/blob/master/README.md).

## Installation

1. Download the [latest release](https://wc3stats.com/auto-uploader "latest release").
2. Run the installer.
3. (Optional) Create a `.env` file in the installation directory to configure league upload URL.

*Note: Both your web browser when downloading and Windows Firewall will likely flag this program as unsafe. One of the motivations for choosing NodeJS and Electron (aside from its ease of use) was to make how the program works as accessible as possible. If you have any concerns, **please do not hesistate to contact us on [our discord](https://wcstats.com/discord)**.* 

## Configuration

### League Upload

To enable uploading replays to a secondary league website:

1. Create a `.env` file in the application directory (use `.env.example` as a template)
2. Set `LEAGUE_URL` to your league's upload endpoint:
   ```
   LEAGUE_URL=https://replays.example.com/api/upload
   ```
3. Restart the application
4. Right-click the system tray icon and check "Enable League Upload"

### Storm Prevention

Storm prevention adds a random delay (0-15 seconds by default) before each upload to prevent multiple players from uploading simultaneously after a game ends.

- Toggle via system tray menu: "Enable Storm Prevention"
- Configure delay range in settings file (`stormPrevention.minDelay` and `stormPrevention.maxDelay`)
- Enabled by default

### Replay Parsing

The application automatically parses each replay file to extract game information and includes it with uploads:

- **`gameName`** - The name of the custom game (e.g., "FBG LTD5")
- **`players`** - JSON array of player objects with detailed information:
  - `name` - Player BattleTag (e.g., "sebas32832#1783")
  - `id` - Position/slot number (0-11)
  - `color` - Hex color code (e.g., "#ff0303" for red)
  - `teamid` - Team number
  - `race` - Race code (H=Human, O=Orc, U=Undead, N=Night Elf)
  - `apm` - Actions per minute
  - Note: AI players named "Computer" are automatically filtered out

**Example player object:**
```json
{
  "name": "sebas32832#1783",
  "id": 3,
  "color": "#ff0303",
  "teamid": 0,
  "race": "H",
  "apm": 16
}
```

These parameters help league websites categorize and track replays by game type and participants.

### Server-Side Example (Node.js)

Here's a complete example of how to receive replay uploads in a Node.js/Express server:

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Endpoint to receive replay uploads
app.post('/api/upload', upload.single('replay'), (req, res) => {
  try {
    // Extract form data
    const gameName = req.body.gameName;
    const players = JSON.parse(req.body.players);
    const replayFile = req.file;

    console.log('=== New Replay Received ===');
    console.log('Game:', gameName);
    console.log('File:', replayFile.originalname);
    console.log('Size:', replayFile.size, 'bytes');
    console.log('');

    // Process each player
    console.log('Players:');
    players.forEach((player, index) => {
      console.log(`  ${index + 1}. ${player.name}`);
      console.log(`     Position: ${player.id}, Color: ${player.color}`);
      console.log(`     Team: ${player.teamid}, Race: ${player.race}, APM: ${player.apm}`);
    });

    // Save to database (example)
    // await saveReplayToDatabase({
    //   gameName,
    //   players,
    //   filePath: replayFile.path,
    //   uploadedAt: new Date()
    // });

    // Rename file with game name
    const newPath = path.join('uploads', `${gameName}_${Date.now()}.w3g`);
    fs.renameSync(replayFile.path, newPath);

    // Return success response (required format)
    res.json({
      code: 200,
      message: 'Replay uploaded successfully',
      queryTime: 0.1
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({
      code: 500,
      message: 'Upload failed'
    });
  }
});

app.listen(3000, () => {
  console.log('Replay server listening on port 3000');
});
```

**Install dependencies:**
```bash
npm install express multer
```

**Access player information:**
```javascript
// Find a specific player
const player = players.find(p => p.name === 'sebas32832#1783');
console.log(player.color); // "#ff0303"

// Filter by team
const team0 = players.filter(p => p.teamid === 0);
const team1 = players.filter(p => p.teamid === 1);

// Calculate team average APM
const avgApm = players.reduce((sum, p) => sum + p.apm, 0) / players.length;
```

## How it Works

When the program runs, a list of configured directories are added to a [chokidar](https://github.com/paulmillr/chokidar) watcher. These directories are configurable by right-clicking on the program icon in the system tray and clicking `settings`.

Whenever a file is added or changed in one of the directories (like after a Warcraft III game when `LastReplay.w3g` is saved), it is added to an upload queue. A queue is used to ensure only one upload occurs at a time in the event that several files are copied into one of the watched directories. While there are items in the queue, they will be sequentially uploaded to wc3stats.com.

## FAQ

#### Why is the installer so big?

This program uses [electron](https://electronjs.org/) to transform web technologies like NodeJS into a native format that Windows can work with. Because of this, the size of the program is dramatically larger than a native (e.g. C++) application would be. However, weighing in at around 50mb, we felt the size was not prohibitive.

#### Why is the program flagged by my antivirus and firewall?

[This program is not currently signed.](https://www.electron.build/code-signing)

#### Why are there two processes running in the Windows Task Manager?

[This is a side effect of the electron framework](https://electronjs.org/docs/tutorial/application-architecture) and is to be expected.

## Building

1. **Install Dependencies:** `npm install`

2a. **Development:** `npm run start`

2b. **Packaging (create exe):** `npm run build`

## Notes

For more information or help troubleshooting feel free to join [our discord](https://discord.gg/N3VGkUM).