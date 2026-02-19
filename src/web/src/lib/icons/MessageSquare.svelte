<script lang="ts">
  export let size = 24;
  export let color = 'currentColor';
  let className = '';
  export { className as class };
</script>

<svg 
  width={size} 
  height={size} 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke={color} 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round"
  class="lucide lucide-message-square {className}"
>
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
</svg>