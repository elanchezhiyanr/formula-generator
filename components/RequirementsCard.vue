<script setup>
import { ref, computed, watch } from 'vue'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

// Props to receive from parent
const props = defineProps({
  showFormula: Boolean,
  generatedFormula: String,
  userInput: String,
  isGenerated: Boolean
})

// Emits to send data back to parent
const emit = defineEmits([
  'update:userInput',
  'update:generatedFormula',
  'update:showFormula',
  'toggleView'
])

// Computed property for the card title
const cardTitle = computed(() => {
  return props.showFormula ? 'Your Formula' : 'Describe your requirement'
})

// Computed property for the text area content
const textareaContent = computed({
  get: () => {
    return props.showFormula ? props.generatedFormula : props.userInput
  },
  set: (value) => {
    if (props.showFormula) {
      emit('update:generatedFormula', value)
    } else {
      emit('update:userInput', value)
    }
  }
})

// Handle toggle view
function handleToggleView(value) {
  emit('toggleView')
}
</script>

<template>
  <!-- Input/Formula Section -->
  <Card class="shadow-md h-full flex flex-col">
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>{{ cardTitle }}</CardTitle>
      <div v-if="props.isGenerated" class="flex items-center space-x-2">
        <span class="text-sm text-gray-500">{{ props.showFormula ? 'Formula' : 'Description' }}</span>
        <Switch v-model:checked="props.showFormula" @update:checked="handleToggleView" />
      </div>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col">
      <Textarea 
        v-model="textareaContent" 
        :placeholder="props.showFormula ? 'Generated formula will appear here...' : 'Describe what you want your formula to do...'" 
        class="flex-1" 
        :readonly="props.showFormula && props.generatedFormula" 
      />
    </CardContent>
  </Card>
</template>
