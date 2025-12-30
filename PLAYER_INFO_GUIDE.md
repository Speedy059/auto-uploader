# Player Information Feature - Complete

## Overview
The WC3 Auto Uploader now extracts and sends **detailed player information** with every replay upload.

## What Gets Sent

### POST Parameters
Every replay upload includes these three fields:

1. **`replay`** - The binary .w3g file
2. **`gameName`** - String with the game name (e.g., "FBG LTD5")
3. **`players`** - JSON string containing an array of player objects

### Player Object Structure
Each player in the array includes:

```javascript
{
  "name": "sebas32832#1783",    // BattleTag
  "id": 3,                       // Position/Slot (0-11)
  "color": "#ff0303",            // Hex color code
  "teamid": 0,                   // Team number
  "race": "H",                   // H=Human, O=Orc, U=Undead, N=Night Elf
  "apm": 16                      // Actions per minute
}
```

## Color Codes Reference
The `color` field uses standard Warcraft 3 hex colors:
- `#ff0303` - Red
- `#0042ff` - Blue
- `#1ce6b9` - Teal
- `#540081` - Purple
- `#fffc00` - Yellow
- `#fe8a0e` - Orange
- `#20c000` - Green
- `#e55bb0` - Pink
- `#7ebff1` - Light Blue
- `#959697` - Gray
- `#ebcd87` - Light Brown
- `#f8a48b` - Maroon

## Position/ID (Slot Numbers)
The `id` field indicates which slot the player occupied:
- Values range from 0-11 (12 possible slots)
- Corresponds to the player's position in the game lobby
- Useful for determining player order and starting positions

## Team ID
The `teamid` field indicates which team the player was on:
- `0` - Team 1
- `1` - Team 2
- etc.

## Race Codes
The `race` field uses single-letter codes:
- `H` - Human
- `O` - Orc
- `U` - Undead
- `N` - Night Elf

## Example: Real Upload Data

From the test replay "FBG LTD5":

```json
{
  "gameName": "FBG LTD5",
  "players": [
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
    {
      "name": "Neanderthal#21591",
      "id": 7,
      "color": "#1ce6b9",
      "teamid": 0,
      "race": "H",
      "apm": 8
    },
    {
      "name": "yolostyle#21350",
      "id": 9,
      "color": "#0042ff",
      "teamid": 0,
      "race": "H",
      "apm": 8
    },
    {
      "name": "Kheb#2696",
      "id": 4,
      "color": "#e55bb0",
      "teamid": 1,
      "race": "H",
      "apm": 12
    },
    {
      "name": "Dabster#21932",
      "id": 5,
      "color": "#fe8a0e",
      "teamid": 1,
      "race": "H",
      "apm": 22
    },
    {
      "name": "Spear#11419",
      "id": 6,
      "color": "#fffc00",
      "teamid": 1,
      "race": "H",
      "apm": 26
    },
    {
      "name": "chunkie#11313",
      "id": 8,
      "color": "#20c000",
      "teamid": 1,
      "race": "H",
      "apm": 13
    }
  ]
}
```

**Note:** The "Computer" AI player (slot 0) is automatically filtered out.

## Server-Side Implementation

### Node.js/Express Example
```javascript
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('replay'), (req, res) => {
  const gameName = req.body.gameName;
  const players = JSON.parse(req.body.players);
  const replayFile = req.file;

  console.log('Game:', gameName);
  
  players.forEach(player => {
    console.log(`Player: ${player.name}`);
    console.log(`  Position: ${player.id}`);
    console.log(`  Color: ${player.color}`);
    console.log(`  Team: ${player.teamid}`);
    console.log(`  Race: ${player.race}`);
    console.log(`  APM: ${player.apm}`);
  });

  // Save to database, etc.
  res.json({ code: 200, message: 'Replay uploaded successfully' });
});
```

### PHP Example
```php
<?php
$gameName = $_POST['gameName'];
$players = json_decode($_POST['players'], true);
$replayFile = $_FILES['replay'];

echo "Game: " . $gameName . "\n";

foreach ($players as $player) {
    echo "Player: " . $player['name'] . "\n";
    echo "  Position: " . $player['id'] . "\n";
    echo "  Color: " . $player['color'] . "\n";
    echo "  Team: " . $player['teamid'] . "\n";
    echo "  Race: " . $player['race'] . "\n";
    echo "  APM: " . $player['apm'] . "\n";
}

// Process and save replay
?>
```

## Use Cases

With this detailed player information, you can:

1. **Display player colors** in your league website UI
2. **Show team compositions** (who was on which team)
3. **Track player statistics** across multiple games
4. **Identify player positions** in the game lobby
5. **Calculate performance metrics** using APM data
6. **Filter replays by race** or other criteria
7. **Generate leaderboards** with color-coded player names

## Testing

Run the test files to see the data:
```bash
node test_detailed_players.js   # See all player details
node test_json_output.js         # See JSON format
node test_upload_simulation.js   # Simulate full upload
```

## Summary

✅ **8 real players** extracted (Computer filtered out)  
✅ **Position/Slot** information included  
✅ **Color codes** for UI display  
✅ **Team assignments** clearly identified  
✅ **Race information** available  
✅ **APM stats** included  
✅ Data sent to **both** wc3stats.com and League URL  

This comprehensive player data enables rich features on your league website! 🎮

