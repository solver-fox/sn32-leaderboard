const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const next = require('next');

const port = parseInt(process.env.PORT || '38547', 10);
const hostname = process.env.HOSTNAME || '127.0.0.1';
const dir = process.env.NEXT_APP_DIR || process.cwd();

const app = next({
  dev: false,
  dir,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(parsedUrl, req, res);
      } catch (error) {
        console.error('[electron-server]', error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, () => {
      console.log(`[electron-server] http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error('[electron-server] failed to start', error);
    process.exit(1);
  });
