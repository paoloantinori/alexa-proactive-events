const http = require('http');
const crypto = require('crypto');

const PORT = 3000;

const VALID_RESPONSES = {
  LaunchRequest: {
    outputSpeech: { type: 'PlainText', text: 'Welcome to Ping Me! You are set up for proactive notifications.' },
    shouldEndSession: true,
  },
  SendNotificationIntent: {
    outputSpeech: { type: 'PlainText', text: 'Your user ID has been captured. Use the notification script to send a proactive alert.' },
    shouldEndSession: true,
  },
  CheckStatusIntent: {
    outputSpeech: { type: 'PlainText', text: 'Your skill is active. Enable notifications in the Alexa app to receive proactive alerts.' },
    shouldEndSession: true,
  },
  HelpIntent: {
    outputSpeech: { type: 'PlainText', text: 'Say send notification or check status.' },
    shouldEndSession: false,
    reprompt: { outputSpeech: { type: 'PlainText', text: 'What would you like to do?' } },
  },
};

function buildResponse(requestId, response) {
  return {
    version: '1.0',
    response: {
      ...response,
    },
    sessionAttributes: {},
  };
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const request = event.request || {};
        const requestType = request.type || '';
        const intentName = request.intent ? request.intent.name : '';

        console.log(`[${new Date().toISOString()}] ${requestType}${intentName ? ' / ' + intentName : ''}`);
        console.log(`  Full request body: ${body.substring(0, 500)}`);

        if (event.session && event.session.user) {
          console.log(`  userId: ${event.session.user.userId}`);
        }
        if (event.context && event.context.System) {
          console.log(`  apiEndpoint: ${event.context.System.apiEndpoint}`);
        }

        let response;

        if (requestType === 'LaunchRequest') {
          response = buildResponse(request.requestId, VALID_RESPONSES.LaunchRequest);
        } else if (requestType === 'IntentRequest') {
          const resp = VALID_RESPONSES[intentName] || VALID_RESPONSES.HelpIntent;
          response = buildResponse(request.requestId, resp);
        } else if (requestType === 'SessionEndedRequest') {
          response = { version: '1.0', response: {} };
        } else if (requestType === 'System.ExceptionEncountered') {
          console.log(`  Exception: ${request.cause && request.cause.message}`);
          response = { version: '1.0', response: {} };
        } else if (requestType === 'AlexaSkillEvent.SkillProactiveSubscriptionChanged') {
          const body2 = request.body || {};
          console.log(`  Proactive subscription changed: ${JSON.stringify(body2.subscriptions || [])}`);
          response = { version: '1.0', response: {} };
        } else {
          response = buildResponse(request.requestId, VALID_RESPONSES.HelpIntent);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (e) {
        console.error('Error processing request:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Sorry, something went wrong.' }, shouldEndSession: true } }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok"}');
  }
});

server.listen(PORT, () => {
  console.log(`Alexa skill server running on port ${PORT}`);
});
