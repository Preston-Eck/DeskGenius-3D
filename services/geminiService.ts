
import { GoogleGenAI, Type, FunctionDeclaration, Schema } from "@google/genai";
import { ProjectConfig, BuildGuideData, RoomConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tools Definition ---

const updateDesignTool: FunctionDeclaration = {
  name: 'updateDesign',
  description: 'Update the design of the built-in desk unit. Can change dimensions, layout, material, or added equipment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      deskDepth: { type: Type.NUMBER, description: 'Depth of the desk surface in inches.' },
      baseLayout: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING, enum: ['drawers', 'cabinet', 'cpu_holder', 'empty'] },
        description: 'Layout of base units from left to right. "empty" is knee space.'
      },
      hasUppers: { type: Type.BOOLEAN, description: 'Whether to include upper cabinets.' },
      tvSize: { type: Type.NUMBER, description: 'Size of TV in inches (diagonal). Set 0 to remove.' },
      monitorCount: { type: Type.NUMBER, description: 'Number of computer monitors (0, 1, or 2).' },
      material: { type: Type.STRING, enum: ['Birch Plywood', 'Walnut Plywood', 'Solid Oak', 'Painted MDF'] },
    },
  },
};

// --- Service Methods ---

export const analyzeRoom = async (images: string[]): Promise<Partial<RoomConfig> | null> => {
  const prompt = `
    Analyze these room photos for a built-in desk project.
    Estimate the dimensions of the main wall shown.
    1. Width of the available wall space (in inches).
    2. Ceiling height (in inches, typically 96 or 108).
    3. Pick the dominant Wall Color (hex code).
    4. Detect floor type (wood, carpet, concrete).
    5. Pick the dominant Floor Color (hex code).
    
    Output JSON only.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      width: { type: Type.NUMBER },
      height: { type: Type.NUMBER },
      wallColor: { type: Type.STRING },
      floorType: { type: Type.STRING, enum: ['wood', 'carpet', 'concrete'] },
      floorColor: { type: Type.STRING }
    }
  };

  try {
    const contents: any[] = [{ text: prompt }];
    
    images.forEach(img => {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.split(',')[1]
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text || '{}') as Partial<RoomConfig>;
  } catch (error) {
    console.error("Room analysis error:", error);
    // Fallback defaults
    return { width: 120, height: 96, wallColor: '#f3f4f6', floorType: 'wood', floorColor: '#8d6e63' };
  }
};

export const generateBuildGuide = async (config: ProjectConfig): Promise<BuildGuideData | null> => {
  const prompt = `
    I am building a custom built-in desk/cabinet unit.
    Specifications:
    - Width: ${config.room.width}"
    - Material: ${config.material}
    - Base Layout: ${config.baseLayout.join(' - ')}
    - Upper Cabinets: ${config.hasUppers ? `Yes, layout: ${config.upperLayout.join(' - ')}` : 'No'}
    - TV Integration: ${config.tvSize > 0 ? `${config.tvSize} inch TV` : 'None'}
    
    Act as a master cabinet maker.
    Provide a detailed build plan.
    1. A simplified cut list (focus on carcass parts: sides, bottoms, tops, shelves).
       Provide length, width, and thickness for each part in inches.
    2. Tools required (e.g., Kreg Jig, Table Saw).
    3. Step-by-step assembly instructions for building the carcasses, installing drawer slides, and scribing the countertop to the wall.
    
    Output STRICT JSON.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      cutList: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            partName: { type: Type.STRING },
            length: { type: Type.NUMBER },
            width: { type: Type.NUMBER },
            thickness: { type: Type.NUMBER },
            quantity: { type: Type.NUMBER },
            material: { type: Type.STRING },
          }
        }
      },
      toolsRequired: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as BuildGuideData;
  } catch (error) {
    console.error("Error generating build guide:", error);
    return null;
  }
};

export const chatWithAi = async (
  history: { role: 'user' | 'model'; parts: { text?: string }[] }[],
  message: string,
  currentConfig: ProjectConfig,
  onUpdateConfig: (updates: Partial<ProjectConfig>) => void,
  imageContext?: string
): Promise<string> => {
  try {
    const systemInstruction = `
      You are an expert cabinet maker and interior designer assisting a user in designing a built-in office desk.
      Current Design Config: ${JSON.stringify(currentConfig)}.
      
      User Goals: They want a custom built-in look.
      
      Capabilities:
      - Call 'updateDesign' to change the model.
      - If user asks for "drawers on the left", set baseLayout to start with 'drawers'.
      - If user mentions a TV, enable uppers and set tvSize (usually 40-65 inches).
      - If user mentions gaming or work, suggest dual monitors (monitorCount: 2).
      - Analyze uploaded images for style (Modern vs Traditional).
      
      Be enthusiastic about DIY!
    `;

    const contents: any[] = [{ text: message }];
    
    // Inject the first image as context if available for ongoing chat
    const img = imageContext || (currentConfig.images && currentConfig.images.length > 0 ? currentConfig.images[0] : null);

    if (img) {
      contents.unshift({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [updateDesignTool] }],
      }
    });

    const toolCalls = response.functionCalls;
    if (toolCalls && toolCalls.length > 0) {
      for (const call of toolCalls) {
        if (call.name === 'updateDesign') {
          const updates = call.args as unknown as Partial<ProjectConfig>;
          
          if (updates.tvSize && updates.tvSize > 0) {
             updates.hasUppers = true;
             updates.upperLayout = ['cabinet', 'tv_gap', 'cabinet'];
          }

          onUpdateConfig(updates);
          return `I've updated the design for you. How does that look?`;
        }
      }
    }

    return response.text || "I didn't catch that. Could you rephrase?";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};