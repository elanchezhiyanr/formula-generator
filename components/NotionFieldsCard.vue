<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useNotionStore } from '~/stores/notion_fields'
import { useNotionDataStore } from '~/stores/notion_data'

// Use the Notion stores
const notionStore = useNotionStore()
const notionDataStore = useNotionDataStore()

// Ref for search results dropdown
const searchResultsRef = ref(null)

// Setup click outside handler
onMounted(async () => {
	// Add global click handler to close search results dropdown
	document.addEventListener('click', handleGlobalClick)
	
	// Check if user is already connected to Notion and fetch databases
	const connectionResult = await notionStore.checkConnection()
	
	// Fetch databases and update the data store
	if (connectionResult.success && connectionResult.databases) {
		notionDataStore.setDatabases(connectionResult.databases)
		
		// If we have a saved database in localStorage, try to fetch its schema
		if (notionDataStore.selectedDatabase.id) {
			const result = await notionStore.fetchDatabaseSchema(notionDataStore.selectedDatabase.id)
			if (result.success && result.database) {
				// Update the fields in the selected database
				notionDataStore.setSelectedDatabase(
					notionDataStore.selectedDatabase.id,
					notionDataStore.selectedDatabase.title,
					result.database.properties
				)
			}
		}
	}
})

onUnmounted(() => {
	// Clean up global click handler
	document.removeEventListener('click', handleGlobalClick)
})

// Handle clicks outside of the search dropdown
const handleGlobalClick = (event) => {
	if (searchResultsRef.value && !searchResultsRef.value.contains(event.target)) {
		notionStore.toggleSearchResults(false)
	}
}

// Methods
function handleSearchQueryChange(value) {
	notionStore.updateSearchQuery(value)
	
	// When search query changes, update the data store with search results
	if (value.length >= 3) {
		notionStore.searchDatabases().then(result => {
			if (result.success && result.databases) {
				notionDataStore.setDatabases(result.databases)
			}
		})
	}
}

function handleDatabaseSelect(database) {
	// First, use the UI store to handle the selection process
	notionStore.selectDatabase(database.id)
	
	// Then, when the data is fetched, update the data store
	notionStore.fetchDatabaseSchema(database.id).then((result) => {
		if (result && result.success) {
			notionDataStore.setSelectedDatabase(
				database.id,
				database.title,
				result.database.properties
			)
		}
	})
}

function handleManualDatabaseStructureChange(event) {
	notionStore.updateManualDatabaseStructure(event.target.value)
}

function handleShowSearchResults(value) {
	notionStore.toggleSearchResults(value)
}

async function handleConnectToNotion() {
	const result = await notionStore.connectToNotion()
	if (result.success && result.databases) {
		notionDataStore.setDatabases(result.databases)
	}
}

async function handleRefreshDatabases() {
	// Only fetch databases if connected to Notion
	if (notionStore.isConnected) {
		const result = await notionStore.fetchDatabases()
		if (result.success && result.databases) {
			notionDataStore.setDatabases(result.databases)
		}
	}
}
</script>

<template>
	<!-- Database Structure Section -->
	<Card class="shadow-md h-full flex flex-col overflow-hidden">
		<CardHeader class="flex flex-row items-center justify-between">
			<CardTitle>Database Structure</CardTitle>
			<!-- Toggle switch for manual input, visible regardless of connection status -->
			<div class="flex items-center space-x-2">
				<Label for="manual-input">Manual Input</Label>
				<Switch id="manual-input" :model-value="notionStore.useManualInput" @update:model-value="value => notionStore.toggleManualInput(value)" />
			</div>
		</CardHeader>
		<CardContent class="flex-1 flex flex-col overflow-hidden max-h-[calc(100vh-200px)]" style="min-height: 0;">
			<!-- Manual input text area - shown when switch is on regardless of connection status -->
			<div v-if="notionStore.useManualInput" class="w-full flex-1 flex flex-col overflow-hidden">
				<!-- Manual database structure input -->
				<label for="manual-structure" class="block text-sm font-medium text-gray-700 mb-2">Define Database
					Structure</label>
				<Textarea id="manual-structure" :value="notionStore.manualDatabaseStructure" @input="handleManualDatabaseStructureChange" class="flex-1 max-h-[calc(100vh-300px)]"
					placeholder="Define your database structure..." style="overflow-y: auto; scrollbar-width: thin;" />
			</div>
			<!-- Notion connection prompt - shown when not connected and manual input is off -->
			<div v-else-if="!notionStore.isConnected"
				class="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex-1">
				<p class="text-gray-500 mb-4">Connect to your Notion database to view available fields and structure</p>
				<Button @click="handleConnectToNotion" variant="default">
					Connect to Notion
				</Button>
			</div>
			<!-- Notion database view - shown when connected and manual input is off -->
			<div v-else class="w-full flex-1 flex flex-col overflow-hidden">
				<!-- Database search input -->
				<div class="mb-6">
					<label for="database-search" class="block text-sm font-medium text-gray-700 mb-2">Search a
						Database</label>
					<div class="relative w-full flex gap-2">
						<Input id="database-search" :model-value="notionStore.searchQuery" @update:model-value="handleSearchQueryChange" placeholder="Search for a database..."
							@focus="handleShowSearchResults(true)" class="flex-1" />
						<Button @click="handleRefreshDatabases" variant="outline" class="shrink-0" title="Refresh databases">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-refresh-cw">
								<polyline points="23 4 23 10 17 10"></polyline>
								<polyline points="1 20 1 14 7 14"></polyline>
								<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
							</svg>
						</Button>

						<!-- Search results dropdown -->
						<div v-if="notionStore.showSearchResults" ref="searchResultsRef"
							class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
							<div v-if="notionStore.isSearching" class="p-4 text-center text-gray-500">
								Searching...
							</div>
							<div v-else-if="notionStore.databases.length === 0" class="p-4 text-center text-gray-500">
								No databases found
							</div>
							<div v-else>
								<button v-for="database in notionDataStore.databases" :key="database.id"
									class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
									@click="handleDatabaseSelect(database)">
									{{ database.title }}
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Selected database info -->
				<div v-if="notionDataStore.selectedDatabase.title" class="mb-6 flex-1 flex flex-col overflow-hidden">
					<h3 class="text-lg font-medium text-gray-900 mb-2">{{ notionDataStore.selectedDatabase.title }}</h3>
					<div v-if="notionStore.isLoading" class="text-center py-4">
						<span class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></span>
					</div>
					<div v-else-if="notionDataStore.selectedDatabase.fields && Object.keys(notionDataStore.selectedDatabase.fields).length > 0"
						class="space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-300px)]" style="scrollbar-width: thin;">
						<div v-for="(field, id) in notionDataStore.selectedDatabase.fields" :key="id"
							class="border border-gray-200 rounded-md p-3">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-2">
									<span
										class="text-lg font-medium w-8 h-8 flex items-center justify-center rounded-md"
										:class="field.bgColor || 'bg-gray-100'">
										{{ field.icon }}
									</span>
									<h4 class="font-medium text-gray-900">{{ field.name }}</h4>
								</div>
								<span class="px-2 py-1 text-xs rounded-full" :class="{
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
										class="px-2 py-1 text-xs rounded-full" :style="{
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
