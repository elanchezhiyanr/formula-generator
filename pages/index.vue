<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'

// Import components with explicit paths to avoid any import issues
const Button = defineAsyncComponent(() => import('~/components/ui/button/Button.vue'))
const Card = defineAsyncComponent(() => import('~/components/ui/card/Card.vue'))
const CardHeader = defineAsyncComponent(() => import('~/components/ui/card/CardHeader.vue'))
const CardTitle = defineAsyncComponent(() => import('~/components/ui/card/CardTitle.vue'))
const CardContent = defineAsyncComponent(() => import('~/components/ui/card/CardContent.vue'))
const Textarea = defineAsyncComponent(() => import('~/components/ui/textarea/Textarea.vue'))
const Switch = defineAsyncComponent(() => import('~/components/ui/switch/Switch.vue'))

const isConnected = ref(false)
const fields = ref([])
const userInput = ref('')
const generatedFormula = ref('')
const showFormula = ref(false)
const isGenerated = ref(false)

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

// Load mock data from JSON file
async function loadMockData() {
	try {
		const response = await fetch('/mockData.json')
		const data = await response.json()
		fields.value = data.fields
	} catch (error) {
		console.error('Error loading mock data:', error)
	}
}

onMounted(() => {
	loadMockData();
	// Log user_id and bot_id from local storage
	const userId = localStorage.getItem('user_id');
	const botId = localStorage.getItem('bot_id');
	console.log('User ID:', userId);
	console.log('Bot ID:', botId);
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
			}, 500);
		}
	}, 500);

	// Set the connected state
	isConnected.value = true;
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
					<div v-else class="w-full overflow-y-auto max-h-[300px] sm:max-h-[400px] md:max-h-[500px] pr-2">
						<!-- Database structure fields display -->
						<div v-for="field in fields" :key="field.name"
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

							<p class="text-gray-500 ml-10 mb-2">{{ field.description }}</p>

							<!-- Options for select type fields -->
							<div v-if="field.options" class="ml-10 flex flex-wrap gap-2 mt-2">
								<span v-for="option in field.options" :key="option.name" :class="option.color"
									class="px-3 py-1 rounded-full text-sm">
									{{ option.name }}
								</span>
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
