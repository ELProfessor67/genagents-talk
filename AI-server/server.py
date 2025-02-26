from flask import Flask, request, jsonify
from simulation_engine.global_methods import *
from genagents.genagents import GenerativeAgent

app = Flask(__name__)

class Conversation:
    def __init__(self, agent_folder, interviewer_name="Interviewer"):
        self.agent = GenerativeAgent(agent_folder)
        self.interviewer_name = interviewer_name
        self.conversation_history = []

    def get_response(self, user_input):
        if user_input.lower() in ['exit', 'quit']:
            return {"message": "Conversation ended."}
        
        self.conversation_history.append([self.interviewer_name, user_input])
        agent_response = self.agent.utterance(self.conversation_history)
        self.conversation_history.append([self.agent.get_fullname(), agent_response])
        
        return {"agent": self.agent.get_fullname(), "response": agent_response}

    def clear_history(self):
        self.conversation_history = []
        return {"message": "Conversation history cleared."}

# Initialize conversation
agent_folder = "agent_bank/populations/gss_agents/fd7a21ff-0d6a-4ed5-bbb4-a548a8178dd0"
conversation = Conversation(agent_folder, interviewer_name="Jane Doe")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    response = conversation.get_response(user_input)
    return jsonify(response)

@app.route("/clear_history", methods=["POST"])
def clear_history():
    response = conversation.clear_history()
    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
