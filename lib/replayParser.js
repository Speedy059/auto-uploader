const W3GReplay = require('w3gjs').default;
const logger = require('electron-log');
const fs = require('fs').promises;

const $ = {
  /**
   * Parse a Warcraft 3 replay file and extract game information
   * @param {string} filePath - Path to the .w3g replay file
   * @returns {Promise<Object>} Parsed replay data including gamename
   */
  async parse(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const parser = new W3GReplay();
      const result = await parser.parse(buffer);

      logger.info(`[ReplayParser] Successfully parsed replay: ${result.gamename}`);

      // Filter out "Computer" players (AI fillers) and extract detailed info
      const players = result.players
        ? result.players
            .filter(p => p.name !== 'Computer')
            .map(p => ({
              name: p.name,
              id: p.id,           // Player slot/position (0-11)
              color: p.color,     // Hex color code (e.g., "#ff0303")
              teamid: p.teamid,   // Team number
              race: p.race,       // Race code (H=Human, O=Orc, U=Undead, N=Night Elf)
              apm: p.apm          // Actions per minute
            }))
        : [];

      return {
        gameName: result.gamename || 'Unknown',
        id: result.id,
        players: players,
        duration: result.duration,
        map: result.map
      };
    } catch (error) {
      logger.error(`[ReplayParser] Error parsing replay ${filePath}: ${error.message}`);
      return {
        gameName: 'Unknown',
        players: [],
        error: error.message
      };
    }
  }
};

module.exports = $;

