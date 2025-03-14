<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid';

// Disable the default layout for this page
definePageMeta({
  layout: false
});

const status = ref('Authenticating with Notion...');
const route = useRoute();
const router = useRouter();

// Define the response type to avoid TypeScript errors
interface NotionResponse {
  success: boolean;
  workspace_name?: string;
  workspace_id?: string;
  userId?: string;
  bot_id?: string;
  error?: string;
}

// Create a button ref to handle window closing via user interaction
// which avoids TypeScript errors with direct window access
const closeButtonRef = ref<HTMLButtonElement | null>(null);
const showCloseButton = ref(false);

// Process the authentication on page load
onMounted(async () => {
  try {
    // Get the code from the URL
    const code = route.query.code as string;
    
    if (!code) {
      status.value = 'Error: No authorization code provided';
      showCloseButton.value = true;
      return;
    }
    
    // Generate a UUID for this user
    const userId = uuidv4();
    
    // Send the code and UUID to the backend
    const response = await $fetch<NotionResponse>('/api/notion-connect', {
      method: 'POST',
      body: {
        code,
        userId
      }
    });
    
    if (response.success) {
      status.value = `Successfully connected to Notion workspace: ${response.workspace_name || 'Unknown'}`;
      
      // Store the user ID and bot ID in local storage for future reference
      localStorage.setItem('bot_id', response.bot_id);
      localStorage.setItem('user_id', response.userId || 'default-user-id');
      
      // Close the window after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.close();
        }
        // If window.close() doesn't work (which is common in many browsers),
        // redirect to the main page after a delay
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }, 2000);
    } else {
      status.value = `Error: ${response.error || 'Failed to connect to Notion'}`;
      showCloseButton.value = true;
    }
  } catch (error) {
    console.error('Error during Notion authentication:', error);
    status.value = 'Error: Failed to authenticate with Notion';
    showCloseButton.value = true;
  }
});

// Handle manual window close
const handleClose = () => {
  router.push('/');
};
</script>

<template>
  <div class="notion-connect-container">
    <div class="auth-card">
      <h1>Notion Authentication</h1>
      <div class="status-message">{{ status }}</div>
      <div v-if="showCloseButton" class="action-buttons">
        <button ref="closeButtonRef" @click="handleClose">Return to Home</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notion-connect-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f7f7;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.auth-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

h1 {
  color: #2d3748;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.status-message {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: #f0f9ff;
  color: #0369a1;
}

.status-message:empty {
  display: none;
}

.action-buttons {
  margin-top: 1rem;
}

button {
  background-color: #0ea5e9;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0284c7;
}
</style>
