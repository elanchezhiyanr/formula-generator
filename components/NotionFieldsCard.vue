<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

// Props to receive from parent
const props = defineProps({
  isConnected: Boolean,
  isLoading: Boolean,
  isSearching: Boolean,
  databases: Array,
  fields: Object,
  databaseTitle: String,
  showSearchResults: Boolean,
  searchQuery: String,
  useManualInput: Boolean,
  manualDatabaseStructure: String
})

// Emits to send data back to parent
const emit = defineEmits([
  'update:searchQuery', 
  'update:showSearchResults', 
  'update:selectedDatabaseId', 
  'update:useManualInput', 
  'update:manualDatabaseStructure',
  'connectToNotion',
  'searchDatabases',
  'fetchDatabaseSchema'
])

// Ref for search results dropdown
const searchResultsRef = ref(null)

// Setup click outside handler
onMounted(() => {
  // Add global click handler to close search results dropdown
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  // Clean up global click handler
  document.removeEventListener('click', handleGlobalClick)
})

// Handle clicks outside of the search dropdown
const handleGlobalClick = (event) => {
  if (searchResultsRef.value && !searchResultsRef.value.contains(event.target)) {
    emit('update:showSearchResults', false)
  }
}

// Methods
function handleSearchQueryChange(value) {
  emit('update:searchQuery', value)
  emit('searchDatabases')
}

function handleDatabaseSelect(database) {
  emit('update:selectedDatabaseId', database.id)
  emit('fetchDatabaseSchema', database.id)
}

function handleConnectToNotion() {
  emit('connectToNotion')
}

function handleUseManualInputChange(value) {
  emit('update:useManualInput', value)
}

function handleManualDatabaseStructureChange(event) {
  emit('update:manualDatabaseStructure', event.target.value)
}

function handleShowSearchResults(value) {
  emit('update:showSearchResults', value)
}
</script>

<template>
  <!-- Database Structure Section -->
  <Card class="shadow-md h-full flex flex-col">
    <CardHeader>
      <CardTitle>Database Structure</CardTitle>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col overflow-hidden">
      <div v-if="!props.isConnected"
        class="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex-1">
        <p class="text-gray-500 mb-4">Connect to your Notion database to view available fields and
          structure</p>
        <Button @click="handleConnectToNotion" variant="default">
          Connect to Notion
        </Button>
      </div>
      <div v-else class="w-full flex-1 flex flex-col">
        <!-- Toggle switch for manual input -->
        <div class="flex justify-end mb-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-700">Notion DB</span>
            <Switch id="manual-input" :checked="props.useManualInput" @update:checked="handleUseManualInputChange" />
            <span class="text-sm text-gray-700">Manual</span>
          </div>
        </div>

        <div v-if="!props.useManualInput" class="flex-1 flex flex-col">
          <!-- Database search input -->
          <div class="mb-6">
            <label for="database-search" class="block text-sm font-medium text-gray-700 mb-2">Search a Database</label>
            <div class="relative w-full">
              <Input 
                id="database-search" 
                :model-value="props.searchQuery" 
                @update:model-value="handleSearchQueryChange" 
                placeholder="Search for a database..." 
                @focus="handleShowSearchResults(true)" 
              />
              
              <!-- Search results dropdown -->
              <div v-if="props.showSearchResults" ref="searchResultsRef"
                class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                <div v-if="props.isSearching" class="p-4 text-center text-gray-500">
                  Searching...
                </div>
                <div v-else-if="props.databases.length === 0" class="p-4 text-center text-gray-500">
                  No databases found
                </div>
                <div v-else>
                  <button v-for="database in props.databases" :key="database.id"
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    @click="handleDatabaseSelect(database)">
                    {{ database.title }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected database info -->
          <div v-if="props.databaseTitle" class="mb-6 flex-1 flex flex-col">
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ props.databaseTitle }}</h3>
            <div v-if="props.isLoading" class="text-center py-4">
              <span class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></span>
            </div>
            <div v-else-if="props.fields && Object.keys(props.fields).length > 0" class="space-y-4 overflow-y-auto flex-1">
              <div v-for="(field, id) in props.fields" :key="id" class="border border-gray-200 rounded-md p-3">
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <span 
                      class="text-lg font-medium w-8 h-8 flex items-center justify-center rounded-md"
                      :class="field.bgColor || 'bg-gray-100'"
                    >
                      {{ field.icon }}
                    </span>
                    <h4 class="font-medium text-gray-900">{{ field.name }}</h4>
                  </div>
                  <span class="px-2 py-1 text-xs rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': field.type === 'title',
                      'bg-green-100 text-green-800': field.type === 'rich_text' || field.type === 'text',
                      'bg-purple-100 text-purple-800': field.type === 'select',
                      'bg-yellow-100 text-yellow-800': field.type === 'multi_select',
                      'bg-red-100 text-red-800': field.type === 'number',
                      'bg-indigo-100 text-indigo-800': field.type === 'date',
                      'bg-pink-100 text-pink-800': field.type === 'people',
                      'bg-orange-100 text-orange-800': field.type === 'formula',
                      'bg-gray-100 text-gray-800': field.type === 'checkbox' || field.type === 'url' || field.type === 'email' || field.type === 'phone_number',
                    }">
                    {{ field.type }}
                  </span>
                </div>

                <!-- Show options for select and multi_select types -->
                <div v-if="field.type === 'select' || field.type === 'multi_select'" class="mt-2">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="option in field.options" :key="option.id"
                      class="px-2 py-1 text-xs rounded-full"
                      :style="{
                        backgroundColor: getSelectOptionColor(option.name, id),
                        color: getSelectOptionTextColor(option.name, id)
                      }">
                      {{ option.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              No fields found in this database
            </div>
          </div>
        </div>

        <!-- Manual database structure input -->
        <div v-else class="w-full flex-1 flex flex-col">
          <label for="manual-structure" class="block text-sm font-medium text-gray-700 mb-2">Define Database Structure</label>
          <Textarea 
            id="manual-structure" 
            :value="props.manualDatabaseStructure"
            @input="handleManualDatabaseStructureChange"
            class="flex-1" 
            placeholder="Define your database structure..." 
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script>
// Helper functions to generate colors for select options
function getSelectOptionColor(optionName, fieldId) {
  const hue = (stringToHash(optionName + fieldId) % 360);
  return `hsl(${hue}, 70%, 85%)`;
}

function getSelectOptionTextColor(optionName, fieldId) {
  const hue = (stringToHash(optionName + fieldId) % 360);
  return `hsl(${hue}, 70%, 25%)`;
}

// Helper function to convert a string to a numeric hash
function stringToHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
</script>
