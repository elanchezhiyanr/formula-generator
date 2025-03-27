import { defineStore } from 'pinia'

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

interface NotionDataState {
  databases: NotionDatabase[];
  selectedDatabase: {
    id: string;
    title: string;
    fields: Record<string, NotionField>;
  };
}

export const useNotionDataStore = defineStore('notion-data', {
  state: (): NotionDataState => {
    // Try to load the selected database from localStorage
    let savedSelectedDatabase = {
      id: '',
      title: '',
      fields: {}
    }
    
    try {
      const savedData = localStorage.getItem('selectedDatabase')
      if (savedData) {
        savedSelectedDatabase = JSON.parse(savedData)
      }
    } catch (error) {
      console.error('Error loading selected database from localStorage:', error)
    }
    
    return {
      databases: [],
      selectedDatabase: savedSelectedDatabase
    }
  },
  
  actions: {
    // Set the list of databases
    setDatabases(databases: NotionDatabase[]): void {
      this.databases = databases
    },
    
    // Set the selected database and its fields
    setSelectedDatabase(id: string, title: string, fields: Record<string, NotionField>): void {
      this.selectedDatabase = {
        id,
        title,
        fields
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('selectedDatabase', JSON.stringify(this.selectedDatabase))
      } catch (error) {
        console.error('Error saving selected database to localStorage:', error)
      }
    },
    
    // Clear the selected database
    clearSelectedDatabase(): void {
      this.selectedDatabase = {
        id: '',
        title: '',
        fields: {}
      }
      
      // Remove from localStorage
      try {
        localStorage.removeItem('selectedDatabase')
      } catch (error) {
        console.error('Error removing selected database from localStorage:', error)
      }
    },
    
    // Clear all data
    clearAll(): void {
      this.databases = []
      this.clearSelectedDatabase()
    },
    
    // Load the selected database from localStorage
    loadFromLocalStorage(): boolean {
      try {
        const savedData = localStorage.getItem('selectedDatabase')
        if (savedData) {
          this.selectedDatabase = JSON.parse(savedData)
          return true
        }
      } catch (error) {
        console.error('Error loading selected database from localStorage:', error)
      }
      return false
    }
  }
})
