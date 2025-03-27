<script setup>
import { computed } from 'vue'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
  <Card class="shadow-md h-full flex flex-col">
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ requirementsStore.cardTitle }}</CardTitle>
      <div v-if="requirementsStore.isGenerated" class="flex items-center space-x-2">
        <Label for="show-formula">Show Requirements</Label>
        <Switch id="show-formula" :model-value="!requirementsStore.showFormula" @update:model-value="requirementsStore.toggleView" />
      </div>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col">
      <Textarea 
        :model-value="requirementsStore.showFormula ? requirementsStore.generatedFormula : requirementsStore.userInput" 
        :placeholder="requirementsStore.showFormula ? 'Generated formula will appear here...' : 'Describe what you want your formula to do...'" 
        class="flex-1" 
        :readonly="requirementsStore.showFormula && requirementsStore.generatedFormula" 
      />
    </CardContent>
  </Card>
</template>
