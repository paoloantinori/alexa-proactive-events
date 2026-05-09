#!/usr/bin/env node
/**
 * Send a proactive MessageAlert notification to an Alexa user.
 *
 * Usage:
 *   node send-notification.js --user <USER_ID> --count <COUNT> --message <CREATOR_NAME>
 *   node send-notification.js --multicast --count <COUNT> --message <CREATOR_NAME>
 *
 * Required env vars (or CLI flags):
 *   LWA_CLIENT_ID       --client-id
 *   LWA_CLIENT_SECRET   --client-secret
 *
 * Optional env vars:
 *   ALEXA_REGION  -- na (default), eu, fe
 *   SKILL_STAGE   -- development (default) or live
 */

const https = require('https');

// --- Config ---
const LWA_TOKEN_URL = 'https://api.amazon.com/auth/O2/token';
const REGION_ENDPOINTS = {
  na: { dev: 'api.amazonalexa.com', prod: 'api.amazonalexa.com' },
  eu: { dev: 'api.eu.amazonalexa.com', prod: 'api.eu.amazonalexa.com' },
  fe: { dev: 'api.fe.amazonalexa.com', prod: 'api.fe.amazonalexa.com' },
};

// --- Parse args ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    clientId: process.env.LWA_CLIENT_ID || '',
    clientSecret: process.env.LWA_CLIENT_SECRET || '',
    userId: '',
    multicast: false,
    count: 1,
    message: 'Ping Me',
    region: process.env.ALEXA_REGION || 'na',
    stage: process.env.SKILL_STAGE || 'development',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--user': opts.userId = args[++i]; break;
      case '--multicast': opts.multicast = true; break;
      case '--count': opts.count = parseInt(args[++i], 10); break;
      case '--message': opts.message = args[++i]; break;
      case '--client-id': opts.clientId = args[++i]; break;
      case '--client-secret': opts.clientSecret = args[++i]; break;
      case '--region': opts.region = args[++i]; break;
      case '--stage': opts.stage = args[++i]; break;
      case '--help':
        console.log(`
Usage: node send-notification.js [options]

Options:
  --user <ID>           Send to specific user (unicast)
  --multicast           Send to all subscribed users
  --count <N>           Number of unread messages (default: 1)
  --message <NAME>      Creator/sender name (default: "Ping Me")
  --client-id <ID>      LWA Client ID (or set LWA_CLIENT_ID)
  --client-secret <KEY> LWA Client Secret (or set LWA_CLIENT_SECRET)
  --region <na|eu|fe>   Alexa region (default: na)
  --stage <dev|live>    Skill stage (default: development)
  --help                Show this help
`);
        process.exit(0);
    }
  }

  if (!opts.multicast && !opts.userId) {
    console.error('ERROR: Provide --user <USER_ID> or --multicast');
    process.exit(1);
  }
  if (!opts.clientId || !opts.clientSecret) {
    console.error('ERROR: Provide LWA_CLIENT_ID and LWA_CLIENT_SECRET via env or --client-id/--client-secret');
    process.exit(1);
  }

  return opts;
}

// --- HTTPS POST helper ---
function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// --- Step 1: Get LWA access token ---
async function getAccessToken(clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'alexa::proactive_events',
  }).toString();

  const result = await httpsPost(
    'api.amazon.com',
    '/auth/O2/token',
    { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  );

  const tokenData = JSON.parse(result.body);
  return tokenData.access_token;
}

// --- Step 2: Build the proactive event payload ---
function buildEventPayload(opts) {
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const audience = opts.multicast
    ? { type: 'Multicast', payload: {} }
    : { type: 'Unicast', payload: { user: opts.userId } };

  return {
    timestamp: now.toISOString(),
    referenceId: `pingme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    expiryTime: expires.toISOString(),
    event: {
      name: 'AMAZON.MessageAlert.Activated',
      payload: {
        state: {
          status: 'UNREAD',
          freshness: 'NEW',
        },
        messageGroup: {
          count: opts.count,
          creator: {
            name: opts.message,
          },
        },
      },
    },
    relevantAudience: audience,
  };
}

// --- Step 3: Send the proactive event ---
async function sendProactiveEvent(accessToken, payload, region, stage) {
  const regionConfig = REGION_ENDPOINTS[region] || REGION_ENDPOINTS.na;
  const hostname = stage === 'live' ? regionConfig.prod : regionConfig.dev;
  const path = stage === 'live'
    ? '/v1/proactiveEvents'
    : '/v1/proactiveEvents/stages/development';

  const result = await httpsPost(
    hostname,
    path,
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    payload
  );
  return result;
}

// --- Main ---
async function main() {
  const opts = parseArgs();

  console.log(`Getting LWA access token...`);
  const token = await getAccessToken(opts.clientId, opts.clientSecret);
  console.log('Token obtained successfully.');

  const payload = buildEventPayload(opts);
  console.log(`Sending ${opts.multicast ? 'multicast' : 'unicast'} notification...`);
  console.log(`  Reference: ${payload.referenceId}`);
  console.log(`  Messages:  ${opts.count}`);
  console.log(`  Creator:   ${opts.message}`);
  console.log(`  Region:    ${opts.region}`);
  console.log(`  Stage:     ${opts.stage}`);

  const result = await sendProactiveEvent(token, payload, opts.region, opts.stage);
  console.log('Notification sent successfully!');
  if (result.body) {
    console.log(`  API response: ${result.body}`);
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
