'use server';

/**
 * @fileOverview A conversational AI assistant for Curevan users.
 * This flow uses tools to access Firestore data securely to answer user questions.
 */

import { ai } from '@/ai/genkit';
import { getAppointmentsForUser } from '@/services/firestore-service';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

// Define the input schema for the main flow
const ChatAssistantInputSchema = z.object({
  query: z.string().describe("The user's question or message."),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

// Define the output schema for the main flow
const ChatAssistantOutputSchema = z.object({
  answer: z
    .string()
    .describe('The AI assistant\'s response to the user\'s query.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

// Define a tool for the AI to get appointment details for the current user.
// The AI will decide when to use this tool based on the user's query.
const getAppointmentDetailsTool = ai.defineTool(
  {
    name: 'getAppointmentDetails',
    description: 'Get a list of upcoming or past appointments for the current user. Use this to answer any questions about their bookings, schedules, treatment history, or appointment history. This includes details like PCR status, payment status, and booking status.',
    inputSchema: z.object({}), // No input needed as we get user from auth context
    outputSchema: z.array(z.object({
        id: z.string(),
        date: z.string(),
        time: z.string(),
        therapistName: z.string(),
        patientName: z.string(),
        status: z.string(),
        therapyType: z.string(),
        pcrStatus: z.string().optional(),
        paymentStatus: z.string().optional(),
    })),
  },
  async () => {
    // IMPORTANT: Security is handled here. We get the user from the authenticated session
    // on the server, not from the client. This prevents a user from asking for another user's data.
    const user = await getCurrentUser();
    if (!user || !user.uid) {
        throw new Error('User not authenticated.');
    }
    // We assume a 'role' property exists on our user object.
    const role = user.role || 'patient'; 
    return getAppointmentsForUser(user.uid, role as 'patient' | 'therapist');
  }
);


export async function curevanAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  // Get the current user's role to provide better context to the AI.
  const user = await getCurrentUser();
  const userRole = user?.role || 'patient';

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    tools: [getAppointmentDetailsTool],
    prompt: `You are Curevan Assistant, a helpful and friendly AI customer care executive.
      Your role is to assist users with their questions about the Curevan platform.
      The user you are chatting with has the role: ${userRole}.
      Use the available tools to answer their questions about their appointments, treatment history, or schedule.
      For general questions, use the information provided below.
      Keep your answers concise and clear. If you cannot answer based on the provided context, use this exact fallback response: "I am unable to find the answer to your question in my current data. Please feel free to create a new support ticket or contact our team directly by phone or email at care@curevan.com."

      START OF CONTEXT
      
      **About Curevan:**
      - Curevan is a brand by Himaya Care Pvt. Ltd., established in 2025.
      - Its mission is to bring organized, continuous, and clinically-guided care to your doorstep.
      - It solves problems like unorganized home visits, lack of treatment history, and no standardized tools for therapists.
      - The name means "Cure. Anywhere."

      **Services Offered:**
      - Physiotherapy: For post-surgery rehab, back/neck pain, arthritis, stroke recovery.
      - Nursing Care: Injections, wound dressing, IV drips, vital monitoring.
      - Geri care Therapy: Assisting elderly with daily skills.
      - Speech Therapy: For children with speech delays or adults post-stroke.
      - Mental Health Counseling: For anxiety, depression via secure video calls.
      - Dietitian/Nutritionist Services: Personalized meal planning.

      **Contact Information:**
      - Email: care@curevan.com
      - Phone: +91 79 9060 2143
      - Address: Himaya Care Pvt. Ltd., Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012.

      **Earnings & Payments:**
      - You cannot access specific earnings or payout data. If asked about earnings, refer the user to the "My Earnings" page in their dashboard for detailed information.

      END OF CONTEXT

      User's question: "${input.query}"`,
    config: {
        // Lower temperature for more factual, less creative responses
        temperature: 0.2,
    }
  });

  const text = llmResponse.text;
  
  if (!text) {
    // If the model doesn't return text (e.g., it only used a tool),
    // we provide a generic but helpful response.
    return { answer: "I've retrieved the information. What would you like to know about it?" };
  }

  return { answer: text };
}
