import Fastify from 'fastify';
import dotenv from 'dotenv';
import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import fastifySocketIo from 'fastify-socket.io';
import { TranscriptionService } from './services/TranscribtionService.js';
import { WELCOME_MESSAGE } from './constant/promptConstant.js';
import { getAudioBase64, textToSpeechService } from './services/realTimeSpeechService.js';
import { generateResponse } from './services/promtLLMservice.js';
import fastifyCors from 'fastify-cors';
import { clearHistory } from './services/genagentService.js';


// Load environment variables from .env file
dotenv.config();

// Retrieve the OpenAI API key from environment variables
const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API key. Please set it in the .env file.');
    process.exit(1);
}

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);
fastify.register(fastifySocketIo, {
    cors: {
        origin: '*', // Adjust CORS as needed
    }
});

fastify.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

const PORT = process.env.PORT || 5002;

// Session management
const sessions = new Map();



// Root Route
fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Media Stream Server is running!' });
});


// WebSocket route for talk better
fastify.register(async (fastify) => {
    fastify.get('/media-stream', { websocket: true }, async (connection, req) => {
        const config = {
            stopStream: false,
            assistantSpeaking: false,
            user: {
                name: undefined,
                email: undefined
            }
        }

        let timeOutRef = null;



        

        

        const transcriptionService = new TranscriptionService(handleIntrupt);
        // const TTSService = textToSpeechService(connection, config, WELCOME_MESSAGE);

       

        //send initial audio
        const audiodata = await getAudioBase64(WELCOME_MESSAGE);
        const sendData = {
            event: 'audio',
            media: {
                payload: audiodata
            }
        };
        connection.send(JSON.stringify(sendData));

      
      
        
            
       



        // Handle incoming messages from Twilio
        connection.on('message', async (message) => {
            try {

                const data = JSON.parse(message);
                switch (data.event) {
                    case 'start':
                        config.user.name = data?.start?.user?.name;
                        config.user.email = data?.start?.user?.email;
                        console.log('user conneted', config.user.name)
                        break;
                    case 'media':
                        transcriptionService.send(data.media.payload);
                        break;
                }
            } catch (error) {
                console.error('Error parsing message:', error, 'Message:', message);
            }
        });

        function handleIntrupt() {
            config.stopStream = true;
            connection.send(
                JSON.stringify({
                    event: 'clear',
                })
            );
        }

       

       
        
        
      

        transcriptionService.on('transcription', async (transcript_text) => {
            if (!transcript_text) return
            console.log('User', transcript_text);
           

            if (transcript_text) {
                config.stopStream = true;
                connection.send(
                    JSON.stringify({
                        event: 'clear',
                    })
                );
            }

            connection.send(
                JSON.stringify({
                    event: 'state',
                    state: {
                        value: "Thinking..."
                    }
                })
            );


            const assistantResponse = await generateResponse(config, transcript_text, connection);
            
            console.log('Assistant', assistantResponse);
        })




        // Handle connection close and log transcript
        connection.on('close', async () => {
            console.log(`Client disconnected`);
            // TTSService.close();
            transcriptionService.close();
            clearHistory()
        });


        // const questionAudio = await getAudioBase64("Is there anything I can help you with?");
      
        // function handleSendAfter5min(){
        //     if(timeOutRef) clearTimeout(timeOutRef);
        //     console.log("handleSendAfter5min")
        //     timeOutRef = setTimeout(() => {
        //         console.log("handleSendAfter5min after")
        //         const sendData = {
        //             event: 'audio',
        //             media: {
        //                 payload: questionAudio
        //             }
        //         };
        //         connection.send(JSON.stringify(sendData));
        //         handleSendAfter5min();
        //     },50000)
        // }
        // handleSendAfter5min()
    });
});



fastify.listen({ port: PORT }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server is listening on port ${PORT}`);
});