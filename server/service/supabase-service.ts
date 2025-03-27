import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize and get a Supabase client instance
 * @returns SupabaseClient instance
 */
export const getSupabaseClient = (): SupabaseClient => {
	if (supabaseInstance) {
		return supabaseInstance;
	}

	const config = useRuntimeConfig();
	const supabaseUrl = config.supabaseUrl;
	const supabaseKey = config.supabaseAnonKey;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Supabase URL and key must be provided in environment variables');
	}

	supabaseInstance = createClient(supabaseUrl, supabaseKey);
	return supabaseInstance;
};

/**
 * Store Notion authentication details in the database
 * @param userId - User ID to associate with the Notion authentication
 * @param authData - Notion authentication data
 * @returns Result of the database operation
 */
export const storeNotionAuth = async (userId: string, authData: {
	access_token: string;
	bot_id: string;
	duplicated_template_id?: string;
	owner: any;
	workspace_icon?: string;
	workspace_id: string;
	workspace_name: string;
}) => {
	const supabase = getSupabaseClient();

	console.log('All Data ', authData);

	const { data, error } = await supabase
		.from('notion_authentication')
		.upsert({
			user_id: userId,
			access_token: authData.access_token,
			bot_id: authData.bot_id,
			duplicated_template_id: authData.duplicated_template_id || null,
			owner: authData.owner,
			workspace_icon: authData.workspace_icon || null,
			workspace_id: authData.workspace_id,
			workspace_name: authData.workspace_name,
			last_used: new Date().toISOString(),
			updated_time: new Date().toISOString()
		}, {
			onConflict: 'bot_id',
			ignoreDuplicates: false
		});

	if (error) {
		console.error('Error storing Notion authentication:', error);
		throw error;
	}

	return data;
};

/**
 * Get Notion authentication details for a user
 * @param userId - User ID to get Notion authentication for
 * @returns Notion authentication data or null if not found
 */
export const getNotionAuth = async (userId: string) => {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from('notion_authentication')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
		console.error('Error getting Notion authentication:', error);
		throw error;
	}

	return data || null;
};
