<script setup>
import { computed } from 'vue'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { XCircle } from 'lucide-vue-next'
import { useRequirementsStore } from '~/stores/requirements'

// Use the requirements store
const requirementsStore = useRequirementsStore()

// Computed property for the text area content
const textareaContent = computed({
  get: () => {
    return requirementsStore.showFormula ? requirementsStore.generatedFormula : requirementsStore.userInput
  },
  set: (value) => {
    if (requirementsStore.showFormula) {
      requirementsStore.updateGeneratedFormula(value)
    } else {
      requirementsStore.updateUserInput(value)
    }
  }
})
</script>

<template>
  <!-- Input/Formula Section -->
  <Card class="shadow-md h-full flex flex-col overflow-hidden">
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ requirementsStore.cardTitle }}</CardTitle>
      <div v-if="requirementsStore.isGenerated" class="flex items-center space-x-2">
        <Label for="show-formula">Show Requirements</Label>
        <Switch id="show-formula" :model-value="!requirementsStore.showFormula" @update:model-value="requirementsStore.toggleView" />
      </div>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col overflow-hidden">
      <!-- Error Alert -->
      <Alert v-if="requirementsStore.error" variant="destructive" class="mb-4">
        <XCircle class="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{{ requirementsStore.error }}</AlertDescription>
      </Alert>

      <!-- Loading State -->
      <div v-if="requirementsStore.isLoading" class="flex items-center justify-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>

      <!-- Textarea -->
      <Textarea 
        v-else
        v-model="textareaContent"
        :placeholder="requirementsStore.showFormula ? 'Generated formula will appear here...' : 'Describe what you want your formula to do...'" 
        class="flex-1 overflow-y-auto" 
        style="max-height: calc(100vh - 250px); min-height: 200px; scrollbar-width: thin;" 
        :readonly="requirementsStore.showFormula && requirementsStore.generatedFormula" 
        @input="requirementsStore.updateUserInput($event.target.value)"
      />
    </CardContent>
  </Card>
</template>
