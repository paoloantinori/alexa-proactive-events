const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome to Ping Me! You can say "send a notification" to trigger a message alert, or "check status" to see your subscription state.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const SendNotificationIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SendNotificationIntent';
  },
  handle(handlerInput) {
    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
    const speakOutput = `I've noted your user ID. To receive proactive notifications, make sure you have enabled notifications for this skill in the Alexa app. Your user ID has been logged. Use the send notification script with your user ID to trigger a proactive alert.`;
    console.log(`USER_ID_FOR_PROACTIVE_EVENTS: ${userId}`);
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const CheckStatusIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckStatusIntent';
  },
  handle(handlerInput) {
    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
    console.log(`USER_ID_CHECK: ${userId}`);
    const speakOutput = 'Your skill is active. To receive proactive notifications, open the Alexa app, go to your skills, find Ping Me in the Dev Skills section, tap Settings, then Manage Permissions, and enable notifications.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const ProactiveSubscriptionChangedHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'System.ExceptionEncountered'
      || (handlerInput.requestEnvelope.request
          && handlerInput.requestEnvelope.request.type === 'AlexaSkillEvent.SkillProactiveSubscriptionChanged');
  },
  handle(handlerInput) {
    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
    const body = handlerInput.requestEnvelope.request.body;
    if (body && body.subscriptions) {
      const hasNotificationPermission = body.subscriptions.includes('alexa::devices:all:notifications:write');
      console.log(`PROACTIVE_SUBSCRIPTION_CHANGED: userId=${userId}, subscribed=${hasNotificationPermission}`);
    }
    return handlerInput.responseBuilder.getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can say "send a notification" to trigger a proactive alert, or "check status" to verify your subscription. To receive notifications, make sure you have enabled them in the Alexa app under skill settings.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Goodbye!';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`ERROR: ${JSON.stringify(error)}`);
    const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    SendNotificationIntentHandler,
    CheckStatusIntentHandler,
    ProactiveSubscriptionChangedHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
