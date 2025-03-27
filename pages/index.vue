<script setup>
import RequirementsCard from '@/components/RequirementsCard.vue'
import NotionFieldsCard from '@/components/NotionFieldsCard.vue'
import { Button } from '@/components/ui/button'
import { useRequirementsStore } from '~/stores/requirements'
import { useNotionStore } from '~/stores/notion_fields'

// Use the Pinia stores
const requirementsStore = useRequirementsStore()
const notionStore = useNotionStore()
</script>

<template>
	<div class="container mx-auto py-8 px-4 max-w-7xl flex flex-col min-h-screen">
		<h1 class="text-3xl font-bold text-center mb-8">Notion Formula Generator</h1>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden" style="max-height: calc(100vh - 180px);">
			<!-- Requirements Card Component -->
			<RequirementsCard />

			<!-- Notion Fields Card Component -->
			<NotionFieldsCard />
		</div>

		<!-- Generate Button -->
		<div class="flex justify-center mt-6 mb-4 sticky bottom-0 bg-white py-2 z-10">
			<Button @click="requirementsStore.generateFormula" variant="default" size="lg" class="px-8">
				Generate Formula
			</Button>
		</div>
	</div>
</template>