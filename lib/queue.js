const logger = require ('electron-log');
const util = require ('./util');

class Queue
{
  constructor (config)
  {
    this.paths = [];
    this.uploading = false;
    this.config = config;

    // Pass config to util module
    if (config) {
      util.setConfig(config);
    }
  }

  add (path)
  {
    logger.info (`[Watcher] Pushing [${path}] onto upload queue.`);

    this.paths.push (path);

    if (!this.uploading) {
      this.upload ();
    }
  }

  async upload ()
  {
    this.uploading = true;

    while (this.paths.length) {
      // Storm prevention: random delay to prevent simultaneous uploads
      if (this.config && this.config.get('stormPrevention.enabled')) {
        const minDelay = this.config.get('stormPrevention.minDelay') || 0;
        const maxDelay = this.config.get('stormPrevention.maxDelay') || 15;

        const delayMs = Math.floor(Math.random() * (maxDelay - minDelay) * 1000) + (minDelay * 1000);
        const delaySec = (delayMs / 1000).toFixed(1);

        logger.info (`[Watcher] Storm prevention: waiting ${delaySec}s before upload...`);
        await this.sleep(delayMs);
      }

      await util.upload (this.paths.shift ());
    }

    this.uploading = false;
    logger.info (`[Watcher] Upload queue empty, waiting...`);
  }

  sleep (ms)
  {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Queue;