<script lang="ts">
	export let size: number = 24;
	export let className: string = '';
</script>

<svg 
	width={size} 
	height={size} 
	viewBox="0 0 24 24" 
	fill="none" 
	stroke="currentColor" 
	stroke-width="2" 
	stroke-linecap="round" 
	stroke-linejoin="round"
	class={className}
>
	<rect width="6" height="16" x="4" y="3" rx="1"/>
	<rect width="6" height="16" x="14" y="5" rx="1"/>
</svg>