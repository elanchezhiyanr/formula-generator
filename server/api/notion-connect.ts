import { storeNotionAuth } from '../service/supabase-service';

/**
 * Notion OAuth redirect handler
 * This endpoint handles the redirect from Notion after the user authenticates
 * It exchanges the authorization code for an access token and stores the authentication details in Supabase
 */
export default defineEventHandler(async (event) => {
	try {
		// Handle both GET (direct redirect) and POST (from frontend) requests
		const method = event.method;
		let code: string;
		let userId: string;

		if (method === 'POST') {
			// Handle POST request from the frontend
			const body = await readBody(event);
			code = body.code;
			userId = body.userId;

			if (!code || !userId) {
				return {
					success: false,
					error: 'Authorization code or user ID is missing'
				};
			}
		} else {
			// Handle direct GET request (not expected to be used with the current flow)
			const query = getQuery(event);
			code = query.code as string;
			const error = query.error as string;

			// Handle error from Notion
			if (error) {
				console.error('Notion authentication error:', error);
				return {
					success: false,
					error: error
				};
			}

			// Validate required parameters
			if (!code) {
				return {
					success: false,
					error: 'Authorization code is missing'
				};
			}

			// This flow is not expected to be used, but we'll handle it anyway
			// by generating a random UUID
			userId = crypto.randomUUID();
		}

		// Get configuration
		const config = useRuntimeConfig();
		const notionClientId = config.notionClientId;
		const notionClientSecret = config.notionClientSecret;
		const redirectUri = config.public.notionRedirectUri;

		if (!notionClientId || !notionClientSecret || !redirectUri) {
			console.error('Missing Notion API configuration');
			return {
				success: false,
				error: 'Server configuration error'
			};
		}

		// Exchange the authorization code for an access token
		const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${Buffer.from(`${notionClientId}:${notionClientSecret}`).toString('base64')}`
			},
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code,
				// redirect_uri: redirectUri
			})
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error('Error exchanging code for token:', errorData);
			return {
				success: false,
				error: 'Failed to exchange authorization code for access token'
			};
		}

		const tokenData = await tokenResponse.json();

		// Store the authentication details in Supabase with the provided UUID
		await storeNotionAuth(userId, {
			access_token: tokenData.access_token,
			bot_id: tokenData.bot_id,
			duplicated_template_id: tokenData.duplicated_template_id,
			owner: tokenData.owner,
			workspace_icon: tokenData.workspace_icon,
			workspace_id: tokenData.workspace_id,
			workspace_name: tokenData.workspace_name
		});

		// Return success response
		return {
			success: true,
			workspace_name: tokenData.workspace_name,
			workspace_id: tokenData.workspace_id,
			userId: userId, // Return the UUID for frontend reference
			bot_id: tokenData.bot_id // Return the bot_id for frontend reference
		};
	} catch (error) {
		console.error('Error in Notion connect API:', error);
		return {
			success: false,
			error: 'Internal server error'
		};
	}
});
