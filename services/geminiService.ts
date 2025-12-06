import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from '../utils/audioUtils';

const API_KEY = process.env.API_KEY || '';

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analyzes an image using Gemini 3 Pro to generate a description.
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
  // Remove data URL prefix if present for the API call
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const mimeType = base64Image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Describe this image in detail for a visually impaired person. Focus on the main subjects, layout, colors, and any legible text. Keep the tone helpful and objective."
          }
        ]
      }
    });
    
    return response.text || "I couldn't generate a description for this image.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image.");
  }
};

/**
 * Converts text to speech using Gemini TTS.
 */
export const synthesizeSpeech = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a good, clear voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned from TTS model.");
    }

    return await decodeAudioData(base64Audio);
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw new Error("Failed to synthesize speech.");
  }
};
