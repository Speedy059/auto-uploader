if (require ('electron-squirrel-startup')) return;

/** **/

require('dotenv').config();

const { app, Tray, Menu, shell, dialog } = require ('electron');
const logger = require ('electron-log');
const path = require ('path');
const Store = require ('./lib/store');
const Watcher = require ('./lib/modules/watcher');
const Netio = require ('./lib/modules/netio');

logger.transports.file.fileName = 'log.txt';
logger.transports.file.level = 'info';

logger.info ('Starting up...');

/**
 * Start the program when a user logs in (after bootup for example).
 */
app.setLoginItemSettings ({
  openAtLogin: true,
  path: process.execPath,
  args: [
    '--processStart',
    `${path.basename (process.execPath)}`,
    '--process-start-args',
    "--hidden"
  ]
});

/**
 * Don't allow multiple instances of the program to be run.
 */
let lock = app.requestSingleInstanceLock ();

if (!lock) {
  return app.quit ();
}

app.on ('second-instance', (event, argv, cwd) => {
  logger.info (`[General] Prevented second instance from spawning.`);
});

/**
 * Prevent garbage collection.
 */
let config,
    icon,
    menu,
    modules;

app.on ('ready', () => {

  logger.info (`[General] App ready (${process.pid})...`);

  /** **/

  config = new Store (
    /* Store */    'wc3stats',
    /* Defaults */ require ('./config')
  );

  // Load league URL from environment variable if available
  if (process.env.LEAGUE_URL) {
    config.set('leagueUpload.url', process.env.LEAGUE_URL);
  }

  logger.info (`[General] App version: [v${config.get ('version')}]`);

  /** **/

  icon = path.join (__dirname, 'icon.ico');
  icon = new Tray (icon);
  icon.setToolTip ('WC3Stats Auto Uploader');

  menu = Menu.buildFromTemplate ([
    {
      label: 'Settings',
      click: () => {
        config.open ();
      }
    },

    {
      label: 'Enable League Upload',
      type: 'checkbox',
      checked: config.get('leagueUpload.enabled'),
      click: (menuItem) => {
        const enabled = menuItem.checked;
        config.set('leagueUpload.enabled', enabled);
        logger.info(`[General] League upload ${enabled ? 'enabled' : 'disabled'}.`);

        if (enabled && !config.get('leagueUpload.url')) {
          dialog.showMessageBox(null, {
            type: 'warning',
            title: 'League URL Not Set',
            message: 'League upload is enabled but LEAGUE_URL is not configured in .env file. Please set it and restart the application.'
          });
        }
      }
    },

    {
      label: 'Enable Storm Prevention',
      type: 'checkbox',
      checked: config.get('stormPrevention.enabled'),
      click: (menuItem) => {
        const enabled = menuItem.checked;
        config.set('stormPrevention.enabled', enabled);
        const minDelay = config.get('stormPrevention.minDelay');
        const maxDelay = config.get('stormPrevention.maxDelay');
        logger.info(`[General] Storm prevention ${enabled ? 'enabled' : 'disabled'} (${minDelay}-${maxDelay}s delay).`);
      }
    },

    {
      label: 'Logs',
      click: () => {
        shell.openPath (logger.transports.file.file);
      }
    },

    {
      label: 'Version',
      click: () => {
        dialog.showMessageBox (
          null,
          {
            title: 'Version',
            message: `${app.getName ()} ${app.getVersion ()} (${app.getLocale ()})`
          }
        );
      }
    },

    {
      label: 'Exit',
      click: () => {
        app.quit ();
      }
    }
  ]);

  icon.setContextMenu (menu);

  /** **/

  modules = [];

  setup ();

  config.on ('change', () => {
    logger.info (`[General] Configuration change detected, reinitializing...`);
    setup ();
  });

});

function setup ()
{
  cleanup ();

  logger.info (`[General] Running setup...`);

  modules = [
    new Watcher (config).start (),
    new Netio   (config).start ()
  ];
}

function cleanup ()
{
  modules.forEach (m => m.stop ());
}