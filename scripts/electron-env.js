const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'SYNC_INTERVAL_MINUTES',
  'BITTENSOR_RPC_URL',
  'BITTENSOR_NETUID',
  'WANDB_ENTITY',
  'WANDB_PROJECT',
  'SN32_MAIN_VALIDATOR_UID',
  'SN32_EVAL_LOOKBACK_DAYS',
  'SN32_METRICS_URL',
];

function parseEnvFile(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function serializeEnvFile(env) {
  return ENV_KEYS.filter((key) => env[key] != null && env[key] !== '')
    .map((key) => `${key}=${JSON.stringify(String(env[key]))}`)
    .join('\n');
}

function defaultDesktopEnv(userDataPath) {
  const dbPath = path.join(userDataPath, 'sn32.db').replace(/\\/g, '/');
  return {
    DATABASE_URL: `file:${dbPath}`,
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_EXPIRES_IN: '7d',
    SYNC_INTERVAL_MINUTES: '10',
    BITTENSOR_RPC_URL: 'wss://entrypoint-finney.opentensor.ai:443',
    BITTENSOR_NETUID: '32',
    WANDB_ENTITY: 'itsai-dev',
    WANDB_PROJECT: 'subnet32',
    SN32_MAIN_VALIDATOR_UID: '222',
    SN32_EVAL_LOOKBACK_DAYS: '7',
    SN32_METRICS_URL: '',
  };
}

function loadProjectEnv(appRoot) {
  const envPath = path.join(appRoot, '.env');
  if (!fs.existsSync(envPath)) return {};
  return parseEnvFile(fs.readFileSync(envPath, 'utf8'));
}

function ensureDesktopEnv(userDataPath, appRoot) {
  const envFile = path.join(userDataPath, 'sn32.env');
  let env;

  if (fs.existsSync(envFile)) {
    env = {
      ...defaultDesktopEnv(userDataPath),
      ...parseEnvFile(fs.readFileSync(envFile, 'utf8')),
    };
    env.DATABASE_URL = defaultDesktopEnv(userDataPath).DATABASE_URL;
  } else {
    env = {
      ...defaultDesktopEnv(userDataPath),
      ...loadProjectEnv(appRoot),
      DATABASE_URL: defaultDesktopEnv(userDataPath).DATABASE_URL,
    };
    if (!env.JWT_SECRET) {
      env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    }
    fs.writeFileSync(envFile, serializeEnvFile(env));
  }

  return { env, envFile };
}

function applyEnv(env) {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

module.exports = {
  ENV_KEYS,
  ensureDesktopEnv,
  applyEnv,
  parseEnvFile,
};
