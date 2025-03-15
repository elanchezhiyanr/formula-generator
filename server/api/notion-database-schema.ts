import { Client } from '@notionhq/client';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { getSupabaseClient } from '../service/supabase-service';

// Define types for Notion property objects
type NotionPropertyType = 
  | 'title' | 'rich_text' | 'number' | 'select' | 'multi_select' | 'date' 
  | 'people' | 'files' | 'checkbox' | 'url' | 'email' | 'phone_number' 
  | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' 
  | 'last_edited_time' | 'last_edited_by' | 'status';

interface NotionProperty {
  id: string;
  type: NotionPropertyType;
  [key: string]: any; // For type-specific properties
}

interface NotionOption {
  name: string;
  color?: string;
  id?: string;
}

/**
 * API endpoint to fetch Notion database schema
 * This endpoint retrieves the properties of a Notion database
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const databaseId = query.databaseId as string;
    
    // Get the user ID from the query parameters
    const userId = query.userId as string;
    
    if (!databaseId) {
      return {
        success: false,
        error: 'Database ID is required'
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
    
    // Fetch the database
    const database = await notion.databases.retrieve({
      database_id: databaseId
    }) as DatabaseObjectResponse;
    
    // Transform the properties to a more usable format for the frontend
    const properties = Object.entries(database.properties).map(([name, property]) => {
      const typedProperty = property as NotionProperty;
      
      // Common property attributes
      const baseProperty = {
        name,
        type: typedProperty.type,
        id: typedProperty.id
      };
      
      // Add type-specific attributes
      switch (typedProperty.type) {
        case 'title':
          return {
            ...baseProperty,
            description: 'The primary field for your database',
            icon: 'T',
            bgColor: 'bg-blue-50'
          };
        
        case 'rich_text':
          return {
            ...baseProperty,
            description: 'Text content with formatting',
            icon: '📝',
            bgColor: 'bg-gray-50'
          };
        
        case 'number':
          return {
            ...baseProperty,
            description: typedProperty.number?.format ? `Number (${typedProperty.number.format})` : 'Numeric value',
            icon: '#',
            bgColor: 'bg-emerald-50',
            format: typedProperty.number?.format
          };
        
        case 'select':
          return {
            ...baseProperty,
            description: 'Select from a list of options',
            icon: '≡',
            bgColor: 'bg-purple-50',
            options: typedProperty.select?.options?.map((option: NotionOption) => ({
              name: option.name,
              color: getColorClass(option.color)
            })) || []
          };
        
        case 'multi_select':
          return {
            ...baseProperty,
            description: 'Select multiple options from a list',
            icon: '≡≡',
            bgColor: 'bg-purple-50',
            options: typedProperty.multi_select?.options?.map((option: NotionOption) => ({
              name: option.name,
              color: getColorClass(option.color)
            })) || []
          };
        
        case 'date':
          return {
            ...baseProperty,
            description: 'Date value, optionally with time',
            icon: '📅',
            bgColor: 'bg-amber-50'
          };
        
        case 'people':
          return {
            ...baseProperty,
            icon: '👤',
            bgColor: 'bg-pink-50'
          };
        
        case 'files':
          return {
            ...baseProperty,
            description: 'Files and attachments',
            icon: '📎',
            bgColor: 'bg-gray-50'
          };
        
        case 'checkbox':
          return {
            ...baseProperty,
            description: 'True/false value',
            icon: '☑',
            bgColor: 'bg-green-50'
          };
        
        case 'url':
          return {
            ...baseProperty,
            description: 'Web URL',
            icon: '🔗',
            bgColor: 'bg-sky-50'
          };
        
        case 'email':
          return {
            ...baseProperty,
            description: 'Email address',
            icon: '✉️',
            bgColor: 'bg-sky-50'
          };
        
        case 'phone_number':
          return {
            ...baseProperty,
            description: 'Phone number',
            icon: '📞',
            bgColor: 'bg-sky-50'
          };
        
        case 'formula':
          return {
            ...baseProperty,
            description: 'Formula: ' + (typedProperty.formula?.expression || ''),
            icon: '𝑓x',
            bgColor: 'bg-yellow-50',
            expression: typedProperty.formula?.expression
          };
        
        case 'relation':
          return {
            ...baseProperty,
            description: `Relation to another database`,
            icon: '🔄',
            bgColor: 'bg-indigo-50',
            databaseId: typedProperty.relation?.database_id
          };
        
        case 'rollup':
          return {
            ...baseProperty,
            icon: '∑',
            bgColor: 'bg-orange-50',
            rollupFunction: typedProperty.rollup?.function
          };
        
        case 'created_time':
          return {
            ...baseProperty,
            icon: '🕒',
            bgColor: 'bg-amber-50'
          };
        
        case 'created_by':
          return {
            ...baseProperty,
            icon: '👤',
            bgColor: 'bg-pink-50'
          };
        
        case 'last_edited_time':
          return {
            ...baseProperty,
            icon: '🕒',
            bgColor: 'bg-amber-50'
          };
        
        case 'last_edited_by':
          return {
            ...baseProperty,
            icon: '👤',
            bgColor: 'bg-pink-50'
          };
        
        case 'status':
          return {
            ...baseProperty,
            description: 'Status of the item',
            icon: '🏷️',
            bgColor: 'bg-purple-50',
            options: typedProperty.status?.options?.map((option: NotionOption) => ({
              name: option.name,
              color: getColorClass(option.color)
            })) || []
          };
        
        default:
          return {
            ...baseProperty,
            icon: '❓',
            bgColor: 'bg-gray-50'
          };
      }
    });
    
    return {
      success: true,
      database: {
        id: database.id,
        title: database.title?.[0]?.plain_text || 'Untitled Database',
        properties
      }
    };
  } catch (error) {
    console.error('Error fetching Notion database schema:', error);
    return {
      success: false,
      error: 'Failed to fetch database schema'
    };
  }
});

// Helper function to convert Notion colors to Tailwind classes
function getColorClass(color?: string): string {
  const colorMap: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    gray: 'bg-gray-100 text-gray-800',
    brown: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    red: 'bg-red-100 text-red-800'
  };
  
  return colorMap[color || 'default'] || colorMap.default;
}
