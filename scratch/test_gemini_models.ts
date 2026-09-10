import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey, 'prefix:', apiKey?.slice(0, 8));

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  for (const model of candidateModels) {
    try {
      console.log(`\nTesting model: "${model}"...`);
      const response = await ai.models.generateContent({
        model,
        contents: 'Hello, respond with {"status": "ok"} in JSON',
      });
      console.log(`✅ Model "${model}" SUCCESS:`, response.text?.slice(0, 100));
    } catch (err: any) {
      console.error(`❌ Model "${model}" FAILED:`, err.message || err);
    }
  }
}

testGeminiModels().catch(console.error);
