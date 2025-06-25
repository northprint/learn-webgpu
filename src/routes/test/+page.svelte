<script>
	import { onMount } from 'svelte';
	
	let message = 'Loading...';
	
	onMount(() => {
		message = 'Test page is working!';
	});
</script>

<h1>{message}</h1>
<p>If you can see this, basic routing is working.</p>

<ul>
	<li><a href="/tutorial">Tutorial list</a></li>
	<li><a href="/playground">Playground</a></li>
	<li><a href="/">Home</a></li>
</ul>