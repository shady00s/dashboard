<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session';
  import { initSocket } from '$lib/stores/socket';
  import HomeNavbar from './components/HomeNavbar.svelte';
  import StockList from './components/StockList.svelte';

  onMount(() => {
    if (!$session.user) {
      goto('/auth/login');
    } else {
      initSocket();
    }
  });
</script>

<svelte:head>
  <title>Home - Stock Watcher</title>
</svelte:head>

<HomeNavbar />
<main>
  <h1>Welcome back, {$session.user?.email}!</h1>
  <StockList />
</main>

<style>
  main {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
    font-size: 2rem;
  }
</style>
