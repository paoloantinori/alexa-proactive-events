#!/usr/bin/env python3
"""
Alexa Ping Me Skill Server — single-file, zero-dependency Python HTTP server.
Handles all Alexa skill requests including proactive subscription events.

Usage:
  python3 alexa_skill_server.py              # port 3000
  python3 alexa_skill_server.py 8443         # custom port
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000


class AlexaHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._json_response(200, {"status": "ok"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length else ""

        try:
            event = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self._json_response(200, {
                "version": "1.0",
                "response": {
                    "outputSpeech": {"type": "PlainText", "text": "Sorry, something went wrong."},
                    "shouldEndSession": True,
                },
            })
            return

        request = event.get("request", {})
        request_type = request.get("type", "")
        intent_name = request.get("intent", {}).get("name", "") if request.get("intent") else ""
        user_id = ""
        if event.get("session", {}).get("user"):
            user_id = event["session"]["user"].get("userId", "")
        api_endpoint = ""
        context = event.get("context", {})
        if context.get("System"):
            api_endpoint = context["System"].get("apiEndpoint", "")

        log(f"{request_type}" + (f" / {intent_name}" if intent_name else ""))
        if user_id:
            log(f"  userId: {user_id}")
        if api_endpoint:
            log(f"  apiEndpoint: {api_endpoint}")

        response = self._handle_request(request_type, intent_name, request, event)
        self._json_response(200, response)

    def _handle_request(self, request_type, intent_name, request, event):
        if request_type == "LaunchRequest":
            return self._skill_response("Welcome to Ping Me! You are set up for proactive notifications.", end_session=True)

        if request_type == "IntentRequest":
            if intent_name == "SendNotificationIntent":
                return self._skill_response("Your user ID has been captured. Use the notification script to send a proactive alert.", end_session=True)
            if intent_name == "CheckStatusIntent":
                return self._skill_response("Your skill is active. Enable notifications in the Alexa app to receive proactive alerts.", end_session=True)
            return self._skill_response("Say send notification or check status.", end_session=False,
                                        reprompt="What would you like to do?")

        if request_type == "SessionEndedRequest":
            return {"version": "1.0", "response": {}}

        if request_type == "System.ExceptionEncountered":
            cause = request.get("cause", {})
            log(f"  Exception: {cause.get('message', 'unknown')}")
            return {"version": "1.0", "response": {}}

        if request_type == "AlexaSkillEvent.SkillProactiveSubscriptionChanged":
            body = request.get("body", {})
            subscriptions = body.get("subscriptions", [])
            log(f"  Proactive subscription changed: {json.dumps(subscriptions)}")
            return {"version": "1.0", "response": {}}

        return self._skill_response("Say send notification or check status.", end_session=False,
                                    reprompt="What would you like to do?")

    @staticmethod
    def _skill_response(text, end_session=True, reprompt=None):
        response = {
            "outputSpeech": {"type": "PlainText", "text": text},
            "shouldEndSession": end_session,
        }
        if reprompt:
            response["reprompt"] = {"outputSpeech": {"type": "PlainText", "text": reprompt}}
        return {"version": "1.0", "response": response, "sessionAttributes": {}}

    def _json_response(self, code, body):
        payload = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):
        pass  # suppress default stderr logging


def log(msg):
    print(f"[{datetime.now().isoformat()}] {msg}", flush=True)


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), AlexaHandler)
    log(f"Alexa Ping Me skill server running on port {PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log("Shutting down.")
        server.server_close()
