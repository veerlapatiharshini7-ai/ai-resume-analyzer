import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function testGemini3() {
  const apiKey = process.env.GEMINI_API_KEY;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-2.5-flash-preview',
    'gemini-3.6-pro',
    'gemini-flash',
    'gemini-pro',
  ];

  for (const model of candidateModels) {
    try {
      console.log(`\nTesting model: "${model}"...`);
      const response = await ai.models.generateContent({
        model,
        contents: 'Hello, reply with JSON: {"status": "ok", "model": "' + model + '"}',
      });
      console.log(`✅ Model "${model}" SUCCESS:`, response.text);
    } catch (err: any) {
      console.error(`❌ Model "${model}" FAILED:`, err.message || err);
    }
  }
}

testGemini3().catch(console.error);
