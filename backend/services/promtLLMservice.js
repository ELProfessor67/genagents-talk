import { sendMessage } from "./genagentService.js";
import { getAudioBase64 } from "./realTimeSpeechService.js";


export async function generateResponse(config, content,connection) {
  config.stopStream = false;
  const assistantResponse = await sendMessage(content);

  // if (!config.stopStream) {
  //   mediaStream.send(JSON.stringify({ 'type': 'Speak', 'text': assistantResponse.response }));
  //   mediaStream.send(JSON.stringify({ 'type': 'Flush' }));
  // }
  // Tell TTS Websocket were finished generation of tokens



  const audiodata = await getAudioBase64(assistantResponse.response);
  const sendData = {
    event: 'audio',
    media: {
      payload: audiodata
    }
  };
  connection.send(JSON.stringify(sendData));

  return assistantResponse.response;
}