const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { ensureDesktopEnv, applyEnv } = require('../scripts/electron-env');
const { runMigrations } = require('../scripts/electron-migrate');

const DEV_SERVER_URL = process.env.ELECTRON_DEV_URL || 'http://127.0.0.1:3000';
const isDev = process.env.ELECTRON_DEV === '1';
const SERVER_PORT = process.env.ELECTRON_PORT || '38547';

/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;
/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null;

function getAppRoot() {
  if (isDev) return process.cwd();
  return app.getAppPath();
}

function waitForServer(url, timeoutMs = 120_000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 400);
      });
    };
    check();
  });
}

function startEmbeddedServer(appRoot, userDataPath) {
  const { env } = ensureDesktopEnv(userDataPath, appRoot);
  applyEnv(env);

  process.env.PORT = SERVER_PORT;
  process.env.HOSTNAME = '127.0.0.1';
  process.env.NEXT_APP_DIR = appRoot;
  process.env.NODE_ENV = 'production';

  runMigrations(appRoot);

  const serverScript = path.join(appRoot, 'scripts', 'electron-server.js');
  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: appRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: SERVER_PORT,
      HOSTNAME: '127.0.0.1',
      NEXT_APP_DIR: appRoot,
    },
    stdio: 'inherit',
  });

  serverProcess.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[electron] server exited with code ${code}`);
    }
    serverProcess = null;
  });

  return `http://127.0.0.1:${SERVER_PORT}`;
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'SN32 Tracker',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function boot() {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  await app.whenReady();

  let appUrl = DEV_SERVER_URL;

  if (!isDev) {
    const appRoot = getAppRoot();
    const userDataPath = app.getPath('userData');
    appUrl = startEmbeddedServer(appRoot, userDataPath);
    await waitForServer(appUrl);
  } else {
    await waitForServer(DEV_SERVER_URL);
  }

  createWindow(appUrl);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(appUrl);
    }
  });
}

function shutdownServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.on('window-all-closed', () => {
  shutdownServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', shutdownServer);

boot().catch((error) => {
  console.error('[electron] startup failed', error);
  app.quit();
});
