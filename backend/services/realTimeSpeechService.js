import WebSocket from 'ws';
import wavefile from 'wavefile';
import "dotenv/config"

// const deepgramTTSWebsocketURL = 'wss://api.deepgram.com/v1/speak?encoding=mulaw&sample_rate=8000&container=none';
const deepgramTTSWebsocketURL = 'wss://api.deepgram.com/v1/speak?encoding=linear16&sample_rate=8000&model=aura-asteria-en';

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

      // const buffer = Buffer.from(data);
      // const wav = new wavefile.WaveFile();

      // wav.fromScratch(1, 8000, '8m', buffer);
      // wav.fromMuLaw();
      // wav.toSampleRate(24000);
      // const encodededBuffer = Buffer.from(wav.data.samples, 'base64');
      // const payload = encodededBuffer.toString("base64");
      // const sendData = {
      //   event: 'media',
      //   media: {
      //     payload
      //   }
      // }
      // connection.send(JSON.stringify(sendData));


      // const buffer = Buffer.from(data);
      // const wav = new wavefile.WaveFile();

      // // Create Wav File from Mu-Law Audio
      // wav.fromScratch(1, 8000, '8m', buffer);
      // wav.fromMuLaw();
      // wav.toSampleRate(24000, { method: 'sinc' }); // High-quality resampling
      // wav.toBitDepth("16"); // Ensure 16-bit PCM

      // // Convert to Buffer
      // const encodedBuffer = Buffer.from(wav.data.samples);
      // const payload = encodedBuffer.toString("base64");

      // // Send Data
      // const sendData = {
      //   event: 'media',
      //   media: {
      //     payload
      //   }
      // };
      // connection.send(JSON.stringify(sendData));





      // Send Data
      const sendData = {
        event: 'media',
        media: {
          payload: data.toString('base64')
        }
      };
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





export async function getAudioBase64(text) {
    const url = "https://api.deepgram.com/v1/speak?model=aura-angus-en&encoding=linear16&sample_rate=24000";
    const apiKey = process.env.DEEPGRAM_API_KEY;
    const data = { text };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            return;
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        return audioSrc;
    } catch (error) {
        console.error("Error:", error);
    }
}