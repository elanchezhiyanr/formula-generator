// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@pinia/nuxt'],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },
  runtimeConfig: {
    // Server-side environment variables
    groqApiKey: process.env.GROQ_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_KEY,
    
    // Keys within public are also exposed client-side
    public: {
        notionClientId: process.env.NOTION_CLIENT_ID,
        notionClientSecret: process.env.NOTION_CLIENT_SECRET,
        notionRedirectUri: process.env.NOTION_REDIRECT_URI
      }
  }
})