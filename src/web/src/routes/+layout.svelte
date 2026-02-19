<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { darkMode } from '../lib/stores';
	import { browser } from '$app/environment';
	
	// Initialize dark mode on mount
	onMount(() => {
		if (browser) {
			const savedDarkMode = localStorage.getItem('tkxr-dark-mode') === 'true';
			darkMode.set(savedDarkMode);
		}
	});
</script>

<main class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
	<slot />
</main>