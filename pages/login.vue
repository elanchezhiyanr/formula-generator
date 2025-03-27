<script setup lang="ts">
const config = useRuntimeConfig()

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey);

async function signInWithOAuth() {
	console.log('Attempting to sign in with Google...')
	try {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/login`,
			},
		})
		
		if (error) {
			console.error('Error signing in with Google:', error)
			alert(`Error signing in with Google: ${error.message}`)
			return
		}
		
		console.log('Sign in successful:', data)
	} catch (err) {
		console.error('Exception during sign in:', err)
		alert(`Exception during sign in: ${err}`)
	}
}
</script>
<template>
  <div class="flex items-center justify-center h-screen">
    <Button @click="signInWithOAuth">Login with Google</Button>
  </div>
</template>