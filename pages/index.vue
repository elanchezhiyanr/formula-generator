<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { Input } from '@/components/ui/input'

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}

const isConnected = ref(false)
const fields = ref([])
const userInput = ref('')
const generatedFormula = ref('')
const showFormula = ref(false)
const isGenerated = ref(false)
const isLoading = ref(false)
const isSearching = ref(false)
const databases = ref([])
const selectedDatabaseId = ref('')
const databaseTitle = ref('')
const useManualInput = ref(false)
const manualDatabaseStructure = ref('Define your database structure...')
const searchQuery = ref('')
const showSearchResults = ref(false)

// Mock formula generation
const mockFormulas = [
	'IF(AND([Status]="Completed", [Priority]="High"), "High Priority Complete", IF([Status]="In Progress", "Working", "Not Started"))',
	'CONCATENATE("Task: ", [Title], " - Due: ", DATEFORMAT([Due Date], "MMM D, YYYY"))',
	'IF([Estimated Hours] > 8, "Full Day", IF([Estimated Hours] > 4, "Half Day", "Quick Task"))',
	'IF(ISBLANK([Reference Link]), "No reference provided", "Has reference")',
	'IF(NOW() > [Due Date], "Overdue", "On Track")',
]

// Computed property for the left card title
const leftCardTitle = computed(() => {
	return showFormula.value ? 'Your Formula' : 'Describe your requirement'
})

// Computed property for the text area content
const textareaContent = computed({
	get: () => {
		return showFormula.value ? generatedFormula.value : userInput.value
	},
	set: (value) => {
		if (showFormula.value) {
			generatedFormula.value = value
		} else {
			userInput.value = value
		}
	}
})

// Fetch user's Notion databases
async function fetchDatabases() {
	try {
		isLoading.value = true;
		const userId = localStorage.getItem('user_id');
		if (!userId) {
			console.error('User ID not found in local storage');
			return;
		}

		const response = await fetch(`/api/notion-databases?userId=${userId}`);
		const data = await response.json();

		if (data.success) {
			databases.value = data.databases;
			console.log('Fetched databases:', databases.value);
		} else {
			console.error('Error fetching databases:', data.error);
		}
	} catch (error) {
		console.error('Error fetching databases:', error);
	} finally {
		isLoading.value = false;
	}
}

// Search for databases based on user input
async function searchDatabases() {
	if (searchQuery.value.length < 3) {
		showSearchResults.value = false;
		return;
	}

	isSearching.value = true;
	showSearchResults.value = true;
	try {
		const userId = localStorage.getItem('user_id');
		if (!userId) {
			console.error('User ID not found in local storage');
			return;
		}

		const response = await fetch(`/api/notion-search-databases?userId=${userId}&query=${encodeURIComponent(searchQuery.value)}`);
		const data = await response.json();

		if (data.success) {
			databases.value = data.databases;
			console.log('Search results:', databases.value);
		} else {
			console.error('Error searching databases:', data.error);
		}
	} catch (error) {
		console.error('Error searching databases:', error);
	} finally {
		isSearching.value = false;
	}
}

// Fetch database schema
async function fetchDatabaseSchema(databaseId) {
	if (!databaseId) return;
	
	try {
		isLoading.value = true;
		const userId = localStorage.getItem('user_id');
		if (!userId) {
			console.error('User ID not found');
			return;
		}

		const response = await fetch(`/api/notion-database-schema?userId=${userId}&databaseId=${databaseId}`);
		const data = await response.json();

		if (data.success) {
			fields.value = data.database.properties;
			databaseTitle.value = data.database.title;
			console.log('Fetched database schema:', fields.value);
			// Hide search results after selection
			showSearchResults.value = false;
			// Clear search query after selection
			searchQuery.value = '';
		} else {
			console.error('Error fetching database schema:', data.error);
		}
	} catch (error) {
		console.error('Error fetching database schema:', error);
	} finally {
		isLoading.value = false;
	}
}

onMounted(() => {
	// Check if user is already connected to Notion
	const userId = localStorage.getItem('user_id');
	const botId = localStorage.getItem('bot_id');
	console.log('User ID:', userId);
	console.log('Bot ID:', botId);

	// If user is already connected, fetch their databases
	if (userId && botId) {
		isConnected.value = true;
		fetchDatabases();
	}
})

function connectToNotion() {
	const config = useRuntimeConfig().public;

	// Get the client ID and redirect URI from the runtime config
	const notionClientId = config.notionClientId;
	// The redirect URI is already URL-encoded in the .env file
	const notionRedirectUri = config.notionRedirectUri;

	// Construct the Notion OAuth URL dynamically
	const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${notionClientId}&response_type=code&owner=user`;

	// Open the URL in a popup
	const popup = window.open(authUrl, 'NotionAuthPopup', 'width=600,height=700');

	// Set up a polling interval to check if the popup is closed
	const pollTimer = setInterval(() => {
		if (popup.closed) {
			clearInterval(pollTimer);
			// After popup is closed, wait a moment for localStorage to be updated
			setTimeout(() => {
				const userId = localStorage.getItem('user_id');
				const botId = localStorage.getItem('bot_id');
				alert(`Bot ID: ${botId || 'Not found'}, User ID: ${userId || 'Not found'}`);
				
				// Set the connected state and fetch databases
				if (userId && botId) {
					isConnected.value = true;
					fetchDatabases();
				}
			}, 500);
		}
	}, 500);
}

function generateFormula() {
	// For demo purposes, just pick a random formula from our mock data
	const randomIndex = Math.floor(Math.random() * mockFormulas.length)
	generatedFormula.value = mockFormulas[randomIndex]
	isGenerated.value = true
	showFormula.value = true
}

function toggleView() {
	// Only allow toggling if a formula has been generated
	if (isGenerated.value) {
		showFormula.value = !showFormula.value
	}
}
</script>

<template>
	<div class="container mx-auto py-8 px-4 max-w-7xl">
		<h1 class="text-3xl font-bold text-center mb-8">Notion Database Explorer</h1>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Input/Formula Section -->
			<Card class="shadow-md">
				<CardHeader class="flex flex-row items-center justify-between">
					<CardTitle>{{ leftCardTitle }}</CardTitle>
					<div v-if="isGenerated" class="flex items-center space-x-2">
						<span class="text-sm text-gray-500">{{ showFormula ? 'Formula' : 'Description' }}</span>
						<Switch v-model:checked="showFormula" @update:checked="toggleView" />
					</div>
				</CardHeader>
				<CardContent>
					<Textarea v-model="textareaContent"
						:placeholder="showFormula ? 'Your generated formula will appear here...' : 'Describe what you want to calculate or track in your Notion database...'"
						class="min-h-[300px] sm:min-h-[400px] md:min-h-[500px] w-full resize-none" />
				</CardContent>
			</Card>

			<!-- Database Structure Section -->
			<Card class="shadow-md">
				<CardHeader>
					<CardTitle>Database Structure</CardTitle>
				</CardHeader>
				<CardContent>
					<div v-if="!isConnected"
						class="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
						<p class="text-gray-500 mb-4">Connect to your Notion database to view available fields and
							structure</p>
						<Button @click="connectToNotion" variant="default" class="mt-2">
							Connect to Notion
						</Button>
					</div>
					<div v-else class="w-full">
						<!-- Toggle switch for manual input -->
						<div class="flex justify-end mb-4">
							<div class="flex items-center space-x-2">
								<span class="text-sm text-gray-700">Notion DB</span>
								<Switch v-model="useManualInput" />
								<span class="text-sm text-gray-700">Manual</span>
							</div>
						</div>

						<!-- Manual database structure input -->
						<div v-if="useManualInput" class="w-full">
							<label for="manual-database-structure" class="block text-sm font-medium text-gray-700 mb-2">Define Your Database Structure</label>
							<Textarea
								id="manual-database-structure"
								v-model="manualDatabaseStructure"
								placeholder="Define your database structure..."
								class="w-full h-[300px] sm:h-[400px] md:h-[500px]"
							></Textarea>
						</div>

						<!-- Notion database structure section -->
						<div v-if="!useManualInput">
							<!-- Database search input -->
							<div class="mb-6">
								<label for="database-search" class="block text-sm font-medium text-gray-700 mb-2">Search a Database</label>
								<div class="relative w-full">
									<div class="flex items-center">
										<Input
											id="database-search"
											v-model="searchQuery"
											@input="searchDatabases"
											@keydown.esc="showSearchResults = false"
											placeholder="Type at least 3 characters to search..."
											class="w-full pr-10"
										/>
										<div v-if="isSearching" class="absolute right-3">
											<div class="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
										</div>
									</div>
									
									<!-- Search results dropdown with click outside handling -->
									<div 
										v-if="showSearchResults && searchQuery.length >= 3" 
										class="w-full bg-white text-gray-800 shadow-md rounded-md border max-h-60 overflow-y-auto z-50 absolute mt-1 left-0 right-0"
										v-click-outside="() => showSearchResults = false"
									>
										<div v-if="databases.length === 0 && !isSearching" class="p-4 text-center">
											No databases found matching your search
										</div>
										<ul v-else class="py-1">
											<li
												v-for="db in databases"
												:key="db.id"
												@click="selectedDatabaseId = db.id; fetchDatabaseSchema(db.id);"
												class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
											>
												{{ db.title }}
											</li>
										</ul>
									</div>
								</div>
							</div>

							<!-- Database title -->
							<h3 v-if="databaseTitle" class="text-lg font-semibold mb-4">{{ databaseTitle }}</h3>

							<!-- Loading indicator -->
							<div v-if="isLoading" class="flex justify-center items-center py-10">
								<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
							</div>

							<!-- No database selected message -->
							<div v-else-if="!selectedDatabaseId" class="text-center py-10 text-gray-500">
								Search and select a database to view its structure
							</div>

							<!-- Database structure fields display -->
							<div v-else class="overflow-y-auto max-h-[300px] sm:max-h-[400px] md:max-h-[500px] pr-2">
								<div v-for="field in fields" :key="field.id"
									class="mb-6 border rounded-lg p-4 hover:shadow-md transition-shadow"
									:style="{ backgroundColor: getFieldBgColor(field.type) }">

								<div class="flex justify-between items-center mb-1">
									<div class="flex items-center gap-2">
										<span
											class="text-lg font-medium w-8 h-8 flex items-center justify-center rounded-md"
											:class="field.bgColor || 'bg-gray-100'">
											{{ field.icon }}
										</span>
										<span class="text-lg font-medium">{{ field.name }}</span>
									</div>
									<span class="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
										{{ field.type }}
									</span>
								</div>

								<!-- Description removed as requested -->

								<!-- Additional info based on property type -->
								<!-- Options for select/multi_select/status type fields -->
								<div v-if="field.options" class="ml-10 flex flex-wrap gap-2 mt-2">
									<span 
										v-for="option in field.options" 
										:key="option.name" 
										:class="option.color"
										class="px-3 py-1 rounded-full text-sm border border-gray-200 bg-white text-gray-800"
									>
										{{ option.name }}
									</span>
								</div>

								<!-- Formula expression -->
								<div v-if="field.formula" class="ml-10 mt-2 p-2 bg-gray-100 rounded font-mono text-sm whitespace-nowrap overflow-x-auto">
									{{ field.formula }}
								</div>

								<!-- Number format -->
								<div v-if="field.format" class="ml-10 mt-2 text-sm text-gray-500">
									Format: {{ field.format }}
								</div>

								<!-- Rollup function -->
								<div v-if="field.rollupFunction" class="ml-10 mt-2 text-sm text-gray-500">
									Function: {{ field.rollupFunction }}
								</div>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Generate Button -->
		<div class="flex justify-center mt-8">
			<Button @click="generateFormula" variant="default" size="lg" class="px-8">
				Generate Formula
			</Button>
		</div>
	</div>
</template>

<style scoped>
/* Custom scrollbar for the fields list */
.overflow-y-auto::-webkit-scrollbar {
	width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background: #555;
}

/* Responsive adjustments */
@media (max-width: 768px) {
	.container {
		padding-left: 1rem;
		padding-right: 1rem;
	}
}
</style>

<script>
// Helper function to get background color based on field type
function getFieldBgColor(type) {
	const colorMap = {
		'title': '#EFF6FF', // blue-50
		'select': '#F5F3FF', // purple-50
		'date': '#FFFBEB', // amber-50
		'number': '#ECFDF5', // emerald-50
		'created_time': '#FFFBEB', // amber-50
		'checkbox': '#F0FDF4', // green-50
		'rich_text': '#F9FAFB', // gray-50
		'url': '#F0F9FF', // sky-50
	}
	return colorMap[type] || '#F9FAFB' // default to gray-50
}
</script>
