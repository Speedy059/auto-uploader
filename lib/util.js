const logger = require ('electron-log');
const FormData = require ('form-data');
const fs = require ('fs').promises;
const { createReadStream } = require ('fs');
const path = require ('path');
const replayParser = require ('./replayParser');

let fetch;
let config;

fetch = require ('electron-fetch');
fetch = fetch.default;

/** **/

const endpoints = {
  upload: 'https://api.wc3stats.com/upload?auto=true'
};

/** **/

const $ = {

  setConfig (cfg) {
    config = cfg;
  },

  async upload (path)
  {
    if (!await $.exists (path)) {
      logger.error (`[Watcher] File not found: ${path}.`);
    }

    logger.info (`[Watcher] Uploading [${path}].`);

    // Parse replay to extract game information
    const replayData = await replayParser.parse(path);
    logger.info (`[Watcher] Game name: ${replayData.gameName}`);

    // Upload to wc3stats.com
    const wc3statsResult = await $.uploadToEndpoint(path, endpoints.upload, 'WC3Stats', replayData);

    // Upload to league URL if enabled
    if (config && config.get('leagueUpload.enabled')) {
      const leagueUrl = config.get('leagueUpload.url');
      if (leagueUrl) {
        await $.uploadToEndpoint(path, leagueUrl, 'League', replayData);
      } else {
        logger.warn(`[Watcher] League upload is enabled but no URL is configured.`);
      }
    }

    return wc3statsResult;
  },

  async uploadToEndpoint (path, url, endpointName, replayData)
  {
    logger.info (`[Watcher] Uploading [${path}] to ${endpointName} (${url}).`);

    let form = new FormData ();
    form.append ('replay', createReadStream (path));

    // Add game name if available
    if (replayData && replayData.gameName) {
      form.append ('gameName', replayData.gameName);
      logger.info (`[Watcher] Including gameName parameter: ${replayData.gameName}`);
    }

    // Add players array if available
    if (replayData && replayData.players && replayData.players.length > 0) {
      form.append ('players', JSON.stringify(replayData.players));
      logger.info (`[Watcher] Including players parameter: ${replayData.players.length} players`);
    }

    let res;
    try {
      res = await fetch (
        url,
        {
          method: 'POST',
          body: form
        }
      );

      let json;
      try {
        json = await res.json ();
      } catch (e) {
        logger.error (`[Watcher] Failed to parse JSON response from ${endpointName}: ${e.message}`);
        return res;
      }

      if (res.status !== 200 || json.code !== 200) {
        logger.error (`[Watcher] Received unexpected status [${res.status}/${json.code}] uploading [${path}] to ${endpointName}.`);
        logger.error (json);
        return res;
      }

      logger.info (`[Watcher] File [${path}] successfully uploaded to ${endpointName} (${json.queryTime || 'N/A'} sec).`);
      return res;
    } catch (error) {
      logger.error (`[Watcher] Error uploading to ${endpointName}: ${error.message}`);
      throw error;
    }
  },

  resolve (p)
  {
    return p
      .replace (/\\/g, '/');
  },

  nl (s)
  {
    return s
      .replace (/(?<!\r)\n/g, "\r\n");
  },

  isset (obj, k)
  {
    return k in obj;
  },

  async exists (file)
  {
    try {
      await fs.lstat (file);
    } catch (e) {
      return false;
    }

    return true;
  },

  async mkdir (dir)
  {
    return fs.mkdir (dir, { recursive : true });
  },

  async unlink (file)
  {
    if (!await $.exists (file)) {
      return;
    }

    return fs.unlink (file);
  }

};

module.exports = $;