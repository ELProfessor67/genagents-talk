import { sendMessage } from "./genagentService.js";


export async function generateResponse(mediaStream, config, content) {
  config.stopStream = false;
  const assistantResponse = await sendMessage(content);
  if (!config.stopStream) {
    mediaStream.send(JSON.stringify({ 'type': 'Speak', 'text': assistantResponse.response }));
    mediaStream.send(JSON.stringify({ 'type': 'Flush' }));
  }
  // Tell TTS Websocket were finished generation of tokens
  return assistantResponse.response;
}