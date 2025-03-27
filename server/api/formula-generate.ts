import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export default defineEventHandler(async (event) => {
	try {
		// Get the request body
		const body = await readBody(event);

		// Extract the user requirements and database structure from the request body
		const userRequirements = body.userRequirements || 'Create a Notion formula';
		const databaseStructure = body.databaseStructure || {};

		// Generate text using the AI model
		const { text } = await generateText({
			model: groq('llama-3.3-70b-versatile'),
			messages: [
				{
					role: 'system',
					content: `You are a Notion formula generator. 
					The user will provide a requirement for a Notion formula and details about the structure of the Notion database. Create a Notion formula for the user's requirement. Only return the formula code, no explanation. Be very precise.
					If the user does not provide a database structure or if the database structure is not proper and to your understanding of how a table should look like, leave that part and give only the formula code with sample fields that would be applicable for the formula he has asked for.`
				},
				{
					role: 'user',
					content: `The structure of the database in json format is ${JSON.stringify(databaseStructure)}. The requirement is ${userRequirements}.`
				}
			],
			topP: 1,
			temperature: 1
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