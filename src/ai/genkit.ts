import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * The model comes from the environment (AI_MODEL_ID, a Gemini model id such as the current Gemini Flash).
 * Changing it needs a new value in the environment only, never a code change.
 */
export const aiModelId = (env: Record<string, string | undefined> = process.env) => (env.AI_MODEL_ID ?? '').trim();

export class AiNotConfiguredError extends Error {
  constructor() { super('The AI assistant is not configured: AI_MODEL_ID is empty.'); this.name = 'AiNotConfiguredError'; }
}

/** The model reference for ai.generate; throws AiNotConfiguredError when AI_MODEL_ID is not set. */
export function requireModel(env: Record<string, string | undefined> = process.env) {
  const id = aiModelId(env);
  if (!id) throw new AiNotConfiguredError();
  return googleAI.model(id);
}

const id = aiModelId();
export const ai = genkit({
  plugins: [googleAI()],
  ...(id ? { model: googleAI.model(id) } : {}),   // the other flows (notes, refine) use this default
});
