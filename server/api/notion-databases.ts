import { Client } from '@notionhq/client';
import { getSupabaseClient } from '../service/supabase-service';
import { SearchResponse } from '@notionhq/client/build/src/api-endpoints';

// Define interface for database object
interface NotionDatabase {
  id: string;
  title?: Array<{
    plain_text?: string;
    [key: string]: any;
  }>;
  created_time: string;
  last_edited_time: string;
  [key: string]: any;
}

/**
 * API endpoint to fetch all Notion databases accessible to the user
 */
export default defineEventHandler(async (event) => {
  try {
    // Get the user ID from the query parameters
    const query = getQuery(event);
    const userId = query.userId as string;
    
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }
    
    // Get the Notion access token for the user from Supabase
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase
      .from('notion_authentication')
      .select('access_token')
      .eq('user_id', userId)
      .single();
    
    if (authError || !authData) {
      console.error('Error fetching Notion access token:', authError);
      return {
        success: false,
        error: 'Failed to retrieve Notion access token'
      };
    }
    
    // Initialize the Notion client with the user's access token
    const notion = new Client({
      auth: authData.access_token
    });
    
    // Search for all databases the user has access to
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    }) as SearchResponse;
    
    // Transform the databases to a more usable format for the frontend
    const databases = response.results.map((db: any) => {
      const database = db as NotionDatabase;
      return {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled Database',
        created_time: database.created_time,
        last_edited_time: database.last_edited_time
      };
    });
    
    return {
      success: true,
      databases
    };
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    return {
      success: false,
      error: 'Failed to fetch databases'
    };
  }
});
