import { GoogleGenAI, Type } from "@google/genai";
import { GeminiOCRResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const extractDeliveryDetails = async (base64Image: string): Promise<GeminiOCRResponse> => {
  const maxRetries = 3;
  let attempt = 0;

  // Remove header if present (data:image/jpeg;base64,)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  while (attempt <= maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: "Analise esta imagem de etiqueta de envio ou documento. Extraia os dados do DESTINATÁRIO (Receiver). Retorne APENAS um JSON com os campos: customerName (nome completo), phone (telefone apenas números), fullAddress (logradouro e número), cep (apenas números), city (cidade/UF), complement (complemento se houver), lat (latitude decimal), lng (longitude decimal)."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              customerName: { type: Type.STRING },
              phone: { type: Type.STRING },
              fullAddress: { type: Type.STRING },
              cep: { type: Type.STRING },
              city: { type: Type.STRING },
              complement: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
            }
          }
        }
      });

      if (response.text) {
        let cleanText = response.text.trim();
        // Remove Markdown code block syntax if present
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(cleanText);
      }
      throw new Error("Não foi possível ler os dados da imagem.");

    } catch (error: any) {
      // Check for 429 or RESOURCE_EXHAUSTED errors to retry
      const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      if (isRateLimit && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s...
        const backoffTime = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Gemini API Quota Hit. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await delay(backoffTime);
        attempt++;
        continue;
      }
      
      console.error("Gemini OCR Final Error:", error);
      throw error;
    }
  }
  throw new Error("Falha na extração de dados após múltiplas tentativas.");
};