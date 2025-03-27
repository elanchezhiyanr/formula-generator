import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
  try {
    // Get the request body
    const body = await readBody(event);
    
    // Extract the prompt from the request body
    const prompt = body.prompt || 'Create a Notion formula';
    
    // Generate text using the AI model
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `Create a Notion formula for the following requirement: ${prompt}. 
               Only return the formula code, no explanation.`,
    });
    
    // Return the generated text
    return { 
      success: true,
      text 
    };
  } catch (error: any) {
    console.error('Error generating formula:', error);
    
    // Return error response
    return { 
      success: false,
      error: error.message || 'Failed to generate formula' 
    };
  }
});