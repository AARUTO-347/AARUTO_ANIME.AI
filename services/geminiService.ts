
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CharacterDesign, QualityLevel, AppSettings } from "../types";

export class GeminiService {
  constructor() {}

  private getAI(keyOverride?: string) {
    const apiKey = keyOverride || process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
  }

  async generateDesign(prompt: string): Promise<CharacterDesign> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Master Architect of AARUTO_ANIME.AI. Design an apex-tier anime character based on: "${prompt}". 
      
      Requirements:
      1. 'visualTraits': Describe with supreme detail (e.g., 'eyes burning with celestial supernova energy', 'armor forged from the core of a dying star', 'a cloak that flows like liquid obsidian').
      2. 'homeworld': An environment that dictates their biology and power (e.g., 'A dimension of suspended crystal shards where light travels in slow-motion').
      3. 'stats': 1-100 values for Strength, Agility, Intelligence, Stamina.
      4. 'evolutionStage': Start at 1.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            personality: { type: Type.STRING },
            aesthetic: { type: Type.STRING },
            powers: { type: Type.ARRAY, items: { type: Type.STRING } },
            lore: { type: Type.STRING },
            visualTraits: { type: Type.STRING },
            homeworld: { type: Type.STRING },
            evolutionStage: { type: Type.INTEGER },
            stats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                stamina: { type: Type.INTEGER }
              },
              required: ["strength", "agility", "intelligence", "stamina"]
            }
          },
          required: ["name", "title", "personality", "aesthetic", "powers", "lore", "visualTraits", "stats", "homeworld", "evolutionStage"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  async evolveDesign(current: CharacterDesign): Promise<CharacterDesign> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a God-Tier Ascension for: ${JSON.stringify(current)}.
      
      Rules:
      1. Dramatically upgrade stats.
      2. Update 'visualTraits' to reflect supreme power (e.g., aura of localized space-time distortion, hair turning into pure light, growing spectral wings).
      3. Increment 'evolutionStage'.
      4. Enhance lore to describe this mythic transformation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            personality: { type: Type.STRING },
            aesthetic: { type: Type.STRING },
            powers: { type: Type.ARRAY, items: { type: Type.STRING } },
            lore: { type: Type.STRING },
            visualTraits: { type: Type.STRING },
            homeworld: { type: Type.STRING },
            evolutionStage: { type: Type.INTEGER },
            stats: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                stamina: { type: Type.INTEGER }
              }
            }
          },
          required: ["name", "title", "personality", "aesthetic", "powers", "lore", "visualTraits", "stats", "homeworld", "evolutionStage"]
        }
      }
    });

    return JSON.parse(response.text);
  }

  async generateImage(design: CharacterDesign, quality: QualityLevel, settings: AppSettings, type: 'character' | 'environment' = 'character'): Promise<string> {
    const ai = this.getAI();
    const model = 'gemini-2.5-flash-image'; 
    const imageConfig: any = { aspectRatio: type === 'character' ? "3:4" : "16:9" };

    const promptEnhancers = `masterpiece, top-tier quality, highly detailed, 8k resolution, cinematic lighting, vibrant colors, sharp focus, volumetric fog, trending on pixiv and artstation.`;
    
    const finalPrompt = type === 'character' 
      ? `${settings.artStyle} masterpiece. ${settings.composition}. Character: ${design.name} (${design.title}). traits: ${design.visualTraits}. Lighting: ${settings.lighting}. Background: ${design.homeworld}. ${promptEnhancers}`
      : `Cinematic ${settings.artStyle} environment background. Wide angle. Location: ${design.homeworld}. Lighting: ${settings.lighting}. Atmospheric world-building, high-fidelity textures. ${promptEnhancers}`;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig }
    });

    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("Materialization failed. The void did not respond.");
    return imageUrl;
  }

  async generateThemeAudio(design: CharacterDesign): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Heed the call of ${design.name}, the ${design.title}! Originating from ${design.homeworld}, their presence reshapes reality itself. Power levels are peaking at stage ${design.evolutionStage}. Let the chronicle begin!` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio resonance failed.");
    return base64Audio;
  }

  async updateField(design: CharacterDesign, field: keyof CharacterDesign): Promise<any> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current state: ${JSON.stringify(design)}. 
      Rewrite the "${field}" with god-tier creativity. Maintain the ${design.aesthetic} theme and homeworld lore.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newValue: field === 'powers' ? { type: Type.ARRAY, items: { type: Type.STRING } } : (field === 'stats' ? {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                stamina: { type: Type.INTEGER }
              }
            } : { type: Type.STRING })
          },
          required: ["newValue"]
        }
      }
    });
    return JSON.parse(response.text).newValue;
  }

  async loreChat(design: CharacterDesign, userQuestion: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identity Context: ${JSON.stringify(design)}. 
      Oracle Inquiry: "${userQuestion}". 
      
      Instruction: You are the Akashic Oracle. Provide a response that feels like an organic expansion of this character's mythos. 
      CRITICAL: You must explicitly weave together their visual appearance ('visualTraits') and their origin ('homeworld') into your answer. 
      Every answer should explain how their physical form or their environment influences the information you are providing. 
      Maintain a tone of mythic weight and god-tier immersion.`,
    });
    return response.text;
  }

  async senseiAdvice(history: any[]): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history,
      config: {
        systemInstruction: "You are the Omni-Sensei of AARUTO_ANIME.AI, the most advanced character generation terminal."
      }
    });
    return response.text;
  }
}
