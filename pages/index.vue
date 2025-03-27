<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import RequirementsCard from '@/components/RequirementsCard.vue'
import NotionFieldsCard from '@/components/NotionFieldsCard.vue'
import { Button } from '@/components/ui/button'

// State management
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

// Computed property for the card title
const leftCardTitle = computed(() => {
	return showFormula.value ? 'Your Formula' : 'Describe your requirement'
})

// Mock formula generation
const mockFormulas = [
	'IF(AND([Status]="Completed", [Priority]="High"), "High Priority Complete", IF([Status]="In Progress", "Working", "Not Started"))',
	'CONCATENATE("Task: ", [Title], " - Due: ", DATEFORMAT([Due Date], "MMM D, YYYY"))',
	'IF([Estimated Hours] > 8, "Full Day", IF([Estimated Hours] > 4, "Half Day", "Quick Task"))',
	'IF(ISBLANK([Reference Link]), "No reference provided", "Has reference")',
	'IF(NOW() > [Due Date], "Overdue", "On Track")',
]

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
	<div class="container mx-auto py-8 px-4 max-w-7xl flex flex-col min-h-screen">
		<h1 class="text-3xl font-bold text-center mb-8">Notion Formula Generator</h1>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
			<!-- Requirements Card Component -->
			<RequirementsCard 
				:show-formula="showFormula"
				:generated-formula="generatedFormula"
				:user-input="userInput"
				:is-generated="isGenerated"
				@update:user-input="userInput = $event"
				@update:generated-formula="generatedFormula = $event"
				@update:show-formula="showFormula = $event"
				@toggle-view="toggleView"
			/>

			<!-- Notion Fields Card Component -->
			<NotionFieldsCard 
				:is-connected="isConnected"
				:is-loading="isLoading"
				:is-searching="isSearching"
				:databases="databases"
				:fields="fields"
				:database-title="databaseTitle"
				:show-search-results="showSearchResults"
				:search-query="searchQuery"
				:use-manual-input="useManualInput"
				:manual-database-structure="manualDatabaseStructure"
				@update:search-query="searchQuery = $event"
				@update:show-search-results="showSearchResults = $event"
				@update:selected-database-id="selectedDatabaseId = $event"
				@update:use-manual-input="useManualInput = $event"
				@update:manual-database-structure="manualDatabaseStructure = $event"
				@connect-to-notion="connectToNotion"
				@search-databases="searchDatabases"
				@fetch-database-schema="fetchDatabaseSchema"
			/>
		</div>

		<!-- Generate Button -->
		<div class="flex justify-center mt-8 mb-4">
			<Button @click="generateFormula" variant="default" size="lg" class="px-8">
				Generate Formula
			</Button>
		</div>
	</div>
</template>