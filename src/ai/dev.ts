
import { config } from 'dotenv';
config();

// Conditionally import AI flows based on environment variable
if (process.env.AI_FEATURES_ENABLED === 'true') {
  import('@/ai/flows/generate-objective-notes.ts');
  import('@/ai/flows/refine-content.ts');
  import('@/ai/flows/chat-assistant.ts');
}
