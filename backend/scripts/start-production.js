import { spawn } from 'node:child_process';

const configuredTimeout = Number(process.env.STARTUP_STAGE_TIMEOUT_MS || 120_000);
const stageTimeoutMs = Number.isInteger(configuredTimeout) && configuredTimeout >= 10_000
  ? configuredTimeout
  : 120_000;

const stages = [
  ['PostgreSQL connection', 'scripts/check-connection.js', []],
  ['PostgreSQL schema initialization', 'scripts/initialize-database.js', []],
  ['PostgreSQL seed', 'scripts/seed.js', []],
  ['admin bootstrap', 'scripts/create-admin.js', ['--if-configured']]
];

function runProcess(label, script, args = [], timeoutMs = stageTimeoutMs) {
  return new Promise((resolve, reject) => {
    console.log(`[startup] ${label} starting`);
    const child = spawn(process.execPath, [script, ...args], {
      env: process.env,
      stdio: 'inherit'
    });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      console.error(`[startup] ${label} exceeded ${timeoutMs}ms; terminating`);
      child.kill('SIGTERM');
    }, timeoutMs);
    timeout.unref();

    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`${label} could not start: ${error.message}`));
    });
    child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0 && !timedOut) {
        console.log(`[startup] ${label} complete`);
        resolve();
        return;
      }
      reject(
        new Error(
          `${label} failed (${timedOut ? 'timeout' : signal ? `signal=${signal}` : `exit=${code}`})`
        )
      );
    });
  });
}

try {
  console.log(`[startup] PostgreSQL production startup (${process.env.RENDER_GIT_COMMIT || 'local'})`);
  for (const [label, script, args] of stages) {
    await runProcess(label, script, args);
  }

  console.log('[startup] Express listen starting');
  const server = spawn(process.execPath, ['server.js'], {
    env: process.env,
    stdio: 'inherit'
  });

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.kill(signal));
  }

  server.once('error', (error) => {
    console.error(`[startup] Express failed to start: ${error.message}`);
    process.exit(1);
  });
  server.once('exit', (code, signal) => {
    if (signal) console.error(`[startup] Express exited from signal ${signal}`);
    process.exit(code ?? 1);
  });
} catch (error) {
  console.error(`[startup] PostgreSQL startup aborted: ${error.message}`);
  process.exit(1);
}
