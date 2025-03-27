import { defineStore } from 'pinia'
import { useRuntimeConfig } from 'nuxt/app'

interface NotionField {
  name: string;
  type: string;
  icon?: string;
  bgColor?: string;
  options?: Array<{
    id: string;
    name: string;
  }>;
}

interface NotionDatabase {
  id: string;
  title: string;
}

interface NotionState {
  isConnected: boolean;
  isLoading: boolean;
  isSearching: boolean;
  databases: NotionDatabase[];
  fields: Record<string, NotionField>;
  databaseTitle: string;
  selectedDatabaseId: string;
  useManualInput: boolean;
  manualDatabaseStructure: string;
  searchQuery: string;
  showSearchResults: boolean;
}

export const useNotionStore = defineStore('notion', {
  state: (): NotionState => ({
    isConnected: false,
    isLoading: false,
    isSearching: false,
    databases: [],
    fields: {},
    databaseTitle: '',
    selectedDatabaseId: '',
    useManualInput: false,
    manualDatabaseStructure: 'Define your database structure...',
    searchQuery: '',
    showSearchResults: false
  }),
  
  actions: {
    // Toggle manual input mode
    toggleManualInput(value: boolean): void {
      console.log('Toggling manual input:', value)
      this.useManualInput = value
    },
    
    // Update manual database structure
    updateManualDatabaseStructure(value: string): void {
      this.manualDatabaseStructure = value
    },
    
    // Update search query
    updateSearchQuery(value: string): void {
      this.searchQuery = value
      // If query is long enough, trigger search
      if (value.length >= 3) {
        this.searchDatabases()
      } else {
        this.showSearchResults = false
      }
    },
    
    // Toggle search results visibility
    toggleSearchResults(value: boolean): void {
      this.showSearchResults = value
    },
    
    // Select a database
    async selectDatabase(databaseId: string): Promise<{ success: boolean; database?: any }> {
      this.selectedDatabaseId = databaseId
      return await this.fetchDatabaseSchema(databaseId)
    },
    
    // Fetch user's Notion databases
    async fetchDatabases(): Promise<{ success: boolean; databases?: any[] }> {
      try {
        this.isLoading = true
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found in local storage')
          return { success: false }
        }

        const response = await fetch(`/api/notion-databases?userId=${userId}`)
        const data = await response.json()

        if (data.success) {
          this.databases = data.databases
          console.log('Fetched databases:', this.databases)
          return { success: true, databases: data.databases }
        } else {
          console.error('Error fetching databases:', data.error)
          return { success: false }
        }
      } catch (error) {
        console.error('Error fetching databases:', error)
        return { success: false }
      } finally {
        this.isLoading = false
      }
    },
    
    // Search for databases based on user input
    async searchDatabases(): Promise<{ success: boolean; databases?: any[] }> {
      if (this.searchQuery.length < 3) {
        this.showSearchResults = false
        return { success: false }
      }

      this.isSearching = true
      this.showSearchResults = true
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found in local storage')
          return { success: false }
        }

        const response = await fetch(`/api/notion-search-databases?userId=${userId}&query=${encodeURIComponent(this.searchQuery)}`)
        const data = await response.json()

        if (data.success) {
          this.databases = data.databases
          console.log('Search results:', this.databases)
          return { success: true, databases: data.databases }
        } else {
          console.error('Error searching databases:', data.error)
          return { success: false }
        }
      } catch (error) {
        console.error('Error searching databases:', error)
        return { success: false }
      } finally {
        this.isSearching = false
      }
    },
    
    // Fetch database schema
    async fetchDatabaseSchema(databaseId: string): Promise<{ success: boolean; database?: any }> {
      if (!databaseId) return { success: false }
      
      try {
        this.isLoading = true
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found')
          return { success: false }
        }

        const response = await fetch(`/api/notion-database-schema?userId=${userId}&databaseId=${databaseId}`)
        const data = await response.json()

        if (data.success) {
          this.fields = data.database.properties
          this.databaseTitle = data.database.title
          console.log('Fetched database schema:', this.fields)
          // Hide search results after selection
          this.showSearchResults = false
          // Clear search query after selection
          this.searchQuery = ''
          return { success: true, database: data.database }
        } else {
          console.error('Error fetching database schema:', data.error)
          return { success: false }
        }
      } catch (error) {
        console.error('Error fetching database schema:', error)
        return { success: false }
      } finally {
        this.isLoading = false
      }
    },
    
    // Connect to Notion
    connectToNotion(): Promise<{ success: boolean; databases?: any[] }> {
      const config = useRuntimeConfig().public
      
      // Get the client ID from the runtime config
      const notionClientId = config.notionClientId as string
      
      // Construct the Notion OAuth URL dynamically
      const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user`
      
      return new Promise((resolve) => {
        // Open the URL in a popup
        const popup = window.open(authUrl, 'NotionAuthPopup', 'width=600,height=700')
        
        if (!popup) {
          console.error('Failed to open popup')
          resolve({ success: false })
          return
        }
        
        // Set up a polling interval to check if the popup is closed
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollTimer)
            // After popup is closed, wait a moment for localStorage to be updated
            setTimeout(async () => {
              const userId = localStorage.getItem('user_id')
              const botId = localStorage.getItem('bot_id')
              alert(`Bot ID: ${botId || 'Not found'}, User ID: ${userId || 'Not found'}`)
              
              // Set the connected state and fetch databases
              if (userId && botId) {
                this.isConnected = true
                const result = await this.fetchDatabases()
                resolve(result)
              } else {
                resolve({ success: false })
              }
            }, 500)
          }
        }, 500)
      })
    },
    
    // Check if user is already connected on mount
    async checkConnection(): Promise<{ success: boolean; databases?: any[] }> {
      const userId = localStorage.getItem('user_id')
      const botId = localStorage.getItem('bot_id')
      console.log('User ID:', userId)
      console.log('Bot ID:', botId)
      
      // If user is already connected, fetch their databases
      if (userId && botId) {
        this.isConnected = true
        return await this.fetchDatabases()
      }
      return { success: false }
    }
  }
})
