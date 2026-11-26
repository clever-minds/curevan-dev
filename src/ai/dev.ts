
import { config } from 'dotenv';
config();

// Conditionally import AI flows based on environment variable
if (process.env.AI_FEATURES_ENABLED === 'true') {
  import('@/ai/flows/generate-objective-notes');
  import('@/ai/flows/refine-content');
  import('@/ai/flows/chat-assistant');
}
