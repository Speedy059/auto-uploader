# Quick Start: Node.js Replay Server

This guide shows how to quickly set up a Node.js server to receive replay uploads from the WC3 Auto Uploader.

## Setup

### 1. Create a new project

```bash
mkdir wc3-replay-server
cd wc3-replay-server
npm init -y
npm install express multer
```

### 2. Create server.js

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

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

    // Rename file with game name and timestamp
    const newPath = path.join('uploads', `${gameName}_${Date.now()}.w3g`);
    fs.renameSync(replayFile.path, newPath);
    console.log('Saved to:', newPath);
    console.log('');

    // Return success response (required format for WC3 Auto Uploader)
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Replay server listening on port ${PORT}`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
});
```

### 3. Run the server

```bash
node server.js
```

You should see:
```
✅ Replay server listening on port 3000
📤 Upload endpoint: http://localhost:3000/api/upload
```

## Configure WC3 Auto Uploader

1. Create `.env` file in the WC3 Auto Uploader directory:
```
LEAGUE_URL=http://localhost:3000/api/upload
```

2. Restart WC3 Auto Uploader
3. Enable "League Upload" from the system tray menu

## Test It

Play a Warcraft 3 game. After the game ends, check your server console:

```
=== New Replay Received ===
Game: FBG LTD5
File: LastReplay.w3g
Size: 245678 bytes

Players:
  1. UberPownage#2217
     Position: 1, Color: #540081
     Team: 0, Race: H, APM: 23
  2. sebas32832#1783
     Position: 3, Color: #ff0303
     Team: 0, Race: H, APM: 16
  ...

Saved to: uploads/FBG LTD5_1735515234567.w3g
```

## Working with Player Data

### Find a specific player
```javascript
const sebas = players.find(p => p.name === 'sebas32832#1783');
console.log(sebas.color); // "#ff0303"
console.log(sebas.teamid); // 0
```

### Separate teams
```javascript
const team0 = players.filter(p => p.teamid === 0);
const team1 = players.filter(p => p.teamid === 1);

console.log('Team 0:', team0.map(p => p.name));
console.log('Team 1:', team1.map(p => p.name));
```

### Calculate statistics
```javascript
// Average APM
const avgApm = players.reduce((sum, p) => sum + p.apm, 0) / players.length;
console.log('Average APM:', avgApm);

// Highest APM player
const topPlayer = players.reduce((max, p) => p.apm > max.apm ? p : max);
console.log('Top APM:', topPlayer.name, topPlayer.apm);
```

### Display with colors
```javascript
players.forEach(player => {
  console.log(`\x1b[38;2;${hexToRgb(player.color)}m${player.name}\x1b[0m`);
});

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r};${g};${b}`;
}
```

## Deploy to Production

### Using a reverse proxy (nginx)

```nginx
server {
  listen 80;
  server_name replays.yourleague.com;

  location /api/upload {
    proxy_pass http://localhost:3000/api/upload;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 50M;
  }
}
```

### Using PM2 for process management

```bash
npm install -g pm2
pm2 start server.js --name "replay-server"
pm2 save
pm2 startup
```

### Environment variables

Create `.env` file:
```
PORT=3000
NODE_ENV=production
```

Update server.js:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

## Database Integration Example

### With MongoDB

```javascript
const mongoose = require('mongoose');

const ReplaySchema = new mongoose.Schema({
  gameName: String,
  players: [{
    name: String,
    id: Number,
    color: String,
    teamid: Number,
    race: String,
    apm: Number
  }],
  filePath: String,
  uploadedAt: { type: Date, default: Date.now }
});

const Replay = mongoose.model('Replay', ReplaySchema);

// In your upload endpoint:
const replay = new Replay({
  gameName,
  players,
  filePath: newPath
});
await replay.save();
```

## Response Format

The WC3 Auto Uploader expects this response format:

```javascript
// Success
res.json({
  code: 200,
  message: 'Replay uploaded successfully',
  queryTime: 0.1  // optional
});

// Error
res.status(500).json({
  code: 500,
  message: 'Error message here'
});
```

## Troubleshooting

### Port already in use
Change the port in `server.js` or use environment variable:
```bash
PORT=8080 node server.js
```

### Cannot receive uploads
Check firewall settings and ensure port is open.

### Large file uploads
Increase multer limits:
```javascript
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
```

## Next Steps

- Add authentication/API keys
- Store replays in cloud storage (AWS S3, etc.)
- Build a web interface to view replays
- Create leaderboards from player stats
- Send notifications to Discord/Slack

---

That's it! You now have a working replay server. Check the main README.md for more details.

