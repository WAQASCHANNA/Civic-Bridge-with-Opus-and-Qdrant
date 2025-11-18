import { config } from '@/lib/config';

function simpleHashEmbedding(text: string, size = 256): number[] {
  const out = new Array<number>(size).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    out[i % size] = (out[i % size] + c) % 1_000;
  }
  // normalize to [0,1]
  const max = Math.max(...out.map(Math.abs)) || 1;
  return out.map((v) => v / max);
}

export async function embedText(text: string): Promise<number[]> {
  // Attempt to use Google AI Studio embeddings; fall back to a simple hash if not configured.
  if (!config.geminiApiKey) {
    return simpleHashEmbedding(text, 256);
  }
  try {
    const mod = await import('@google/generative-ai');
    const GoogleGenerativeAI: any = (mod as any).GoogleGenerativeAI;
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = (genAI as any).getTextEmbeddingModel
      ? (genAI as any).getTextEmbeddingModel({ model: 'text-embedding-004' })
      : (genAI as any).getGenerativeModel({ model: 'text-embedding-004' });
    const result = await (model as any).embedContent(text);
    const values = result?.embedding?.values || result?.data?.[0]?.embedding?.values;
    if (Array.isArray(values)) return values as number[];
  } catch (e) {
    // ignore and fall back
  }
  return simpleHashEmbedding(text, 256);
}

async function getGenAI() {
  const mod = await import('@google/generative-ai');
  const { GoogleGenerativeAI } = mod as any;
  return new GoogleGenerativeAI(config.geminiApiKey);
}

export async function processIntake(input: {
  type: 'voice' | 'image' | 'document';
  data: string; // base64 or text
  language?: string;
}) {
  if (!config.geminiApiKey) {
    // Fallback: produce a naive JSON summary
    return {
      issue_type: 'unknown',
      location: 'unknown',
      urgency: 5,
      sentiment: 'neutral',
      department: 'general',
    };
  }
  const genAI = await getGenAI();
  const model = (genAI as any).getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `
    Analyze this ${input.type} from a city resident.
    Extract: 1) Issue type 2) Location 3) Urgency (1-10) 4) Sentiment 5) Required department
    Respond in JSON only.
  `;

  try {
    if (input.type === 'voice') {
      const audioPart = {
        inlineData: {
          data: input.data.split('base64,')[1] ?? input.data,
          mimeType: 'audio/webm',
        },
      };
      const result = await model.generateContent([prompt, audioPart]);
      return JSON.parse(result.response.text());
    }
    if (input.type === 'image') {
      const imagePart = {
        inlineData: {
          data: input.data.split('base64,')[1] ?? input.data,
          mimeType: 'image/jpeg',
        },
      };
      const result = await model.generateContent([prompt, imagePart]);
      return JSON.parse(result.response.text());
    }
    const result = await model.generateContent([prompt, input.data]);
    return JSON.parse(result.response.text());
  } catch (_e) {
    return {
      issue_type: 'unknown',
      location: 'unknown',
      urgency: 5,
      sentiment: 'neutral',
      department: 'general',
    };
  }
}

export async function translateForResident(text: string, targetLang: string) {
  if (!config.geminiApiKey) return text;
  const genAI = await getGenAI();
  const model = (genAI as any).getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(
    `Translate to ${targetLang} for a 5th-grade reading level: ${text}`
  );
  return result.response.text();
}