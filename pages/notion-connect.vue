<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

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
localStorage.setItem('bot_id', response.bot_id || '');
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
    <Card class="auth-card">
      <CardHeader>
        <h1 class="text-2xl font-semibold">Notion Authentication</h1>
      </CardHeader>
      <CardContent>
        <div class="status-message">{{ status }}</div>
      </CardContent>
      <CardFooter v-if="showCloseButton" class="justify-center">
        <Button @click="handleClose">Return to Home</Button>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
.notion-connect-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f7f7f7;
}

.auth-card {
  max-width: 400px;
  width: 100%;
  text-align: center;
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
</style>
