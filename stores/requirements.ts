import { defineStore } from 'pinia'

interface RequirementsState {
  userInput: string;
  generatedFormula: string;
  showFormula: boolean;
  isGenerated: boolean;
  mockFormulas: string[];
}

export const useRequirementsStore = defineStore('requirements', {
  state: (): RequirementsState => ({
    userInput: '',
    generatedFormula: '',
    showFormula: false,
    isGenerated: false,
    
    // Mock formula generation (for demo purposes)
    mockFormulas: [
      'IF(AND([Status]="Completed", [Priority]="High"), "High Priority Complete", IF([Status]="In Progress", "Working", "Not Started"))',
      'CONCATENATE("Task: ", [Title], " - Due: ", DATEFORMAT([Due Date], "MMM D, YYYY"))',
      'IF([Estimated Hours] > 8, "Full Day", IF([Estimated Hours] > 4, "Half Day", "Quick Task"))',
      'IF(ISBLANK([Reference Link]), "No reference provided", "Has reference")',
      'IF(NOW() > [Due Date], "Overdue", "On Track")',
    ]
  }),
  
  getters: {
    cardTitle: (state): string => state.showFormula ? 'Your Formula' : 'Describe your requirement'
  },
  
  actions: {
    updateUserInput(value: string): void {
      this.userInput = value
    },
    
    updateGeneratedFormula(value: string): void {
      this.generatedFormula = value
    },
    
    toggleView(): void {
      // Only allow toggling if a formula has been generated
      if (this.isGenerated) {
        this.showFormula = !this.showFormula
      }
    },
    
    generateFormula(): void {
      // For demo purposes, just pick a random formula from our mock data
      const randomIndex = Math.floor(Math.random() * this.mockFormulas.length)
      this.generatedFormula = this.mockFormulas[randomIndex]
      this.isGenerated = true
      this.showFormula = true
    }
  }
})
