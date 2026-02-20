<script lang="ts">
  import { darkMode } from './stores';
  import Moon from './icons/Moon.svelte';
  import Sun from './icons/Sun.svelte';
  
  function toggleDarkMode() {
    darkMode.toggle();
  }
</script>

<button 
  on:click={toggleDarkMode}
  class="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
  title={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
  aria-label={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
  aria-pressed={$darkMode}
>
  {#if $darkMode}
    <Moon size={20} color="currentColor" aria-hidden="true" />
    <span class="sr-only">Dark mode is currently enabled</span>
  {:else}
    <Sun size={20} color="currentColor" aria-hidden="true" />
    <span class="sr-only">Light mode is currently enabled</span>
  {/if}
</button>