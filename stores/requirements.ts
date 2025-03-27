import { defineStore } from 'pinia'

interface RequirementsState {
  userInput: string;
  generatedFormula: string;
  showFormula: boolean;
  isGenerated: boolean;
  isLoading: boolean;
  error: string | null;
  lastRequirements: string | null;
}

export const useRequirementsStore = defineStore('requirements', {
  state: (): RequirementsState => {
    // Try to load the last requirements from localStorage
    let savedState = {
      userInput: '',
      lastRequirements: null
    }
    
    try {
      const savedData = localStorage.getItem('requirements')
      if (savedData) {
        savedState = JSON.parse(savedData)
      }
    } catch (error) {
      console.error('Error loading requirements from localStorage:', error)
    }
    
    return {
      userInput: savedState.userInput,
      generatedFormula: '',
      showFormula: false,
      isGenerated: false,
      isLoading: false,
      error: null,
      lastRequirements: savedState.lastRequirements
    }
  },
  
  getters: {
    cardTitle: (state): string => state.showFormula ? 'Your Formula' : 'Describe your requirement'
  },
  
  actions: {
    updateUserInput(value: string): void {
      this.userInput = value
      // Save to localStorage
      try {
        localStorage.setItem('requirements', JSON.stringify({
          userInput: this.userInput,
          lastRequirements: this.lastRequirements
        }))
      } catch (error) {
        console.error('Error saving requirements to localStorage:', error)
      }
    },
    
    updateGeneratedFormula(value: string): void {
      this.generatedFormula = value
    },
    
    toggleView(): void {
      // Only allow toggling if a formula has been generated
      if (this.isGenerated) {
        this.showFormula = !this.showFormula
        if (!this.showFormula && this.lastRequirements) {
          // When showing requirements, restore the last requirements
          this.userInput = this.lastRequirements
        }
      }
    },
    
        // Transform database structure into simplified format
    transformDatabaseStructure(fields: Record<string, any>): Array<any> {
      return Object.entries(fields).map(([_, field]) => {
        const result: any = {
          name: field.name,
          field_type: field.type
        }

        // Add options for select and multi_select fields
        if (field.type === 'select' && field.select?.options) {
          result.options = field.select.options.map((opt: any) => opt.name)
        } else if (field.type === 'multi_select' && field.multi_select?.options) {
          result.options = field.multi_select.options.map((opt: any) => opt.name)
        }

        // Add format for number fields
        if (field.type === 'number' && field.number?.format) {
          result.format = field.number.format
        }

        return result
      })
    },

    async generateFormula(): Promise<void> {
      const notionStore = useNotionStore()
      const notionDataStore = useNotionDataStore()

      // Reset state
      this.error = null
      
      // Validate database structure
      if (!notionStore.useManualInput && !notionDataStore.selectedDatabase.id) {
        this.error = 'Please select a Notion database or switch to manual input mode'
        return
      }

      if (notionStore.useManualInput && (!notionStore.manualDatabaseStructure || notionStore.manualDatabaseStructure === 'Define your database structure...')) {
        this.error = 'Please define the database structure or select a Notion database'
        return
      }

      // Save current requirements before generating
      this.lastRequirements = this.userInput
      try {
        localStorage.setItem('requirements', JSON.stringify({
          userInput: this.userInput,
          lastRequirements: this.lastRequirements
        }))
      } catch (error) {
        console.error('Error saving requirements to localStorage:', error)
      }

      try {
        this.isLoading = true

        // Validate user input
        if (!this.userInput.trim()) {
          this.error = 'Please describe your formula requirements'
          return
        }

        // Prepare database structure based on input mode
        let databaseStructure
        if (notionStore.useManualInput) {
          try {
            // Try to parse the manual input as JSON
            databaseStructure = JSON.parse(notionStore.manualDatabaseStructure)
          } catch {
            // If parsing fails, send it as is - the API will handle validation
            databaseStructure = notionStore.manualDatabaseStructure
          }
        } else {
          // Transform the Notion database structure into simplified format
          databaseStructure = this.transformDatabaseStructure(notionDataStore.selectedDatabase.fields)
        }

        // Call the API
        const response = await fetch('/api/formula-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userRequirements: this.userInput,
            databaseStructure
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          this.generatedFormula = data.text
          this.isGenerated = true
          this.showFormula = true
        } else {
          this.error = data.error || 'Failed to generate formula'
        }
      } catch (err) {
        console.error('Error generating formula:', err)
        this.error = 'An error occurred while generating the formula'
      } finally {
        this.isLoading = false
      }
    }
  }
})
