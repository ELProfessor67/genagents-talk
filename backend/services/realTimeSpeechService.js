import WebSocket from 'ws';
import wavefile from 'wavefile';

const deepgramTTSWebsocketURL = 'wss://api.deepgram.com/v1/speak?encoding=mulaw&sample_rate=8000&container=none';

export const textToSpeechService = (connection, config, welcome_message) => {
  let chunks = [];
  const options = {
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`
    }
  };

  const ws = new WebSocket(deepgramTTSWebsocketURL, options);

  ws.on('open', function open() {
    console.log('deepgram TTS: Connected');
    ws.send(JSON.stringify({ 'type': 'Speak', 'text': welcome_message }));
    ws.send(JSON.stringify({ 'type': 'Flush' }));
  });

  ws.on('message', function incoming(data) {
    // Handles barge in
    if (!config.stopStream) {
      try {
        let json = JSON.parse(data.toString());
        console.log('deepgram TTS: ', data.toString());
        return;
      } catch (e) {
        // Ignore
      }

      const buffer = Buffer.from(data);
      const wav = new wavefile.WaveFile();

      wav.fromScratch(1, 8000, '8m', buffer);
      wav.fromMuLaw();
      wav.toSampleRate(24000);
      const payload = wav.toBase64();
      const sendData = {
        event: 'media',
        media: {
          payload
        }
      }

      connection.send(JSON.stringify(sendData));
    }
  });

  ws.on('close', function close() {
    console.log('deepgram TTS: Disconnected from the WebSocket server');
  });

  ws.on('error', function error(error) {
    console.log("deepgram TTS: error received");
    console.error(error);
  });
  return ws;
}