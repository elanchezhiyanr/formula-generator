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
    selectDatabase(databaseId: string): void {
      this.selectedDatabaseId = databaseId
      this.fetchDatabaseSchema(databaseId)
    },
    
    // Fetch user's Notion databases
    async fetchDatabases(): Promise<void> {
      try {
        this.isLoading = true
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found in local storage')
          return
        }

        const response = await fetch(`/api/notion-databases?userId=${userId}`)
        const data = await response.json()

        if (data.success) {
          this.databases = data.databases
          console.log('Fetched databases:', this.databases)
        } else {
          console.error('Error fetching databases:', data.error)
        }
      } catch (error) {
        console.error('Error fetching databases:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // Search for databases based on user input
    async searchDatabases(): Promise<void> {
      if (this.searchQuery.length < 3) {
        this.showSearchResults = false
        return
      }

      this.isSearching = true
      this.showSearchResults = true
      try {
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found in local storage')
          return
        }

        const response = await fetch(`/api/notion-search-databases?userId=${userId}&query=${encodeURIComponent(this.searchQuery)}`)
        const data = await response.json()

        if (data.success) {
          this.databases = data.databases
          console.log('Search results:', this.databases)
        } else {
          console.error('Error searching databases:', data.error)
        }
      } catch (error) {
        console.error('Error searching databases:', error)
      } finally {
        this.isSearching = false
      }
    },
    
    // Fetch database schema
    async fetchDatabaseSchema(databaseId: string): Promise<void> {
      if (!databaseId) return
      
      try {
        this.isLoading = true
        const userId = localStorage.getItem('user_id')
        if (!userId) {
          console.error('User ID not found')
          return
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
        } else {
          console.error('Error fetching database schema:', data.error)
        }
      } catch (error) {
        console.error('Error fetching database schema:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    // Connect to Notion
    connectToNotion(): void {
      const config = useRuntimeConfig().public
      
      // Get the client ID from the runtime config
      const notionClientId = config.notionClientId as string
      
      // Construct the Notion OAuth URL dynamically
      const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user`
      
      // Open the URL in a popup
      const popup = window.open(authUrl, 'NotionAuthPopup', 'width=600,height=700')
      
      if (!popup) {
        console.error('Failed to open popup')
        return
      }
      
      // Set up a polling interval to check if the popup is closed
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer)
          // After popup is closed, wait a moment for localStorage to be updated
          setTimeout(() => {
            const userId = localStorage.getItem('user_id')
            const botId = localStorage.getItem('bot_id')
            alert(`Bot ID: ${botId || 'Not found'}, User ID: ${userId || 'Not found'}`)
            
            // Set the connected state and fetch databases
            if (userId && botId) {
              this.isConnected = true
              this.fetchDatabases()
            }
          }, 500)
        }
      }, 500)
    },
    
    // Check if user is already connected on mount
    checkConnection(): void {
      const userId = localStorage.getItem('user_id')
      const botId = localStorage.getItem('bot_id')
      console.log('User ID:', userId)
      console.log('Bot ID:', botId)
      
      // If user is already connected, fetch their databases
      if (userId && botId) {
        this.isConnected = true
        this.fetchDatabases()
      }
    }
  }
})
