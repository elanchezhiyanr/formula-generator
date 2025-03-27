<script setup>
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'

// State management
const prompt = ref('')
const generatedFormula = ref('')
const isLoading = ref(false)
const error = ref(null)

// Function to call the formula-generate API
async function generateFormula() {
  if (!prompt.value.trim()) {
    error.value = 'Please enter a prompt'
    return
  }

  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetch('/api/formula-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt.value
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      generatedFormula.value = data.text
    } else {
      error.value = data.error || 'Failed to generate formula'
    }
  } catch (err) {
    console.error('Error generating formula:', err)
    error.value = 'An error occurred while generating the formula'
  } finally {
    isLoading.value = false
  }
}

// Function to copy formula to clipboard
function copyToClipboard() {
  if (!generatedFormula.value) return
  
  navigator.clipboard.writeText(generatedFormula.value)
    .then(() => {
      alert('Formula copied to clipboard!')
    })
    .catch(err => {
      console.error('Failed to copy formula:', err)
    })
}
</script>

<template>
  <div class="container mx-auto py-8 px-4 max-w-3xl flex flex-col min-h-screen">
    <h1 class="text-3xl font-bold text-center mb-8">Formula Generator</h1>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Enter Your Prompt</h2>
      <div class="mb-4">
        <textarea
          v-model="prompt"
          placeholder="Describe what formula you need, e.g., 'Create a formula that calculates the days remaining until a deadline'"
          class="w-full h-32 p-3 border rounded-md dark:bg-gray-900 dark:border-gray-700"
          :disabled="isLoading"
        ></textarea>
      </div>
      <div class="flex justify-center">
        <Button 
          @click="generateFormula" 
          variant="default" 
          size="lg" 
          class="px-8"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Generating...</span>
          <span v-else>Generate Formula</span>
        </Button>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md mb-6">
      {{ error }}
    </div>
    
    <div v-if="generatedFormula" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Generated Formula</h2>
        <Button @click="copyToClipboard" variant="outline" size="sm">
          Copy to Clipboard
        </Button>
      </div>
      <div class="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto">
        <pre class="whitespace-pre-wrap break-words">{{ generatedFormula }}</pre>
      </div>
    </div>
  </div>
</template>
