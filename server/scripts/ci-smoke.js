const { spawn } = require('node:child_process');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const serverDir = path.join(__dirname, '..');
const port = process.env.CI_SMOKE_PORT || '5010';

const server = spawn(process.execPath, ['server.js'], {
  cwd: serverDir,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: port
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', (chunk) => process.stdout.write(chunk));
server.stderr.on('data', (chunk) => process.stderr.write(chunk));

const stopServer = () => {
  if (server.exitCode === null && !server.killed) {
    server.kill('SIGTERM');
  }
};

process.on('exit', stopServer);
process.on('SIGINT', () => {
  stopServer();
  process.exit(1);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(1);
});

(async () => {
  try {
    for (let attempt = 1; attempt <= 20; attempt += 1) {
      if (server.exitCode !== null) {
        throw new Error(`Server exited early with code ${server.exitCode}`);
      }

      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`);
        let payload;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if ((response.status === 200 && payload?.status === 'OK') || (response.status === 503 && payload?.status === 'ERROR')) {
          console.log(`Smoke check passed with /api/health status ${response.status}`);
          stopServer();
          process.exit(0);
        }
      } catch {
      }

      await delay(1000);
    }

    throw new Error('Smoke check failed: /api/health did not respond successfully within 20 seconds (20 attempts)');
  } catch (error) {
    console.error(error.message);
    stopServer();
    process.exit(1);
  }
})();
