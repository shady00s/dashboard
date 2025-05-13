<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { derived, writable } from 'svelte/store';
  import { userId, logout } from '$lib/auth';
  import { stockData, socketConnectionStatus, connectSocket, disconnectSocket } from '$lib/socket';
  import { goto } from '$app/navigation';

  // Theme management
  const darkMode = writable(false);
  function toggleTheme() {
    darkMode.update(mode => {
      const newMode = !mode;
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
  }

  onMount(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    darkMode.set(savedMode);
  });

  interface Stock {
    name: string;
    symbol: string;
    price: number | null;
    change: number;
    lastUpdate: string | null;
  }

  let currentUserId: string | null = null;
  userId.subscribe(id => currentUserId = id);

  onMount(() => {
    if (currentUserId && $socketConnectionStatus !== 'connected' && $socketConnectionStatus !== 'connecting') {
      connectSocket();
    }

    if (!currentUserId) {
        goto('/');
    }
  });

  function handleLogout() {
    logout();
    disconnectSocket();
  }

  // Transform stock data object to array
  const stocks = derived(stockData, ($stockData: Record<string, Stock>) => {
    const stockArray = Object.values($stockData);
    console.log('Current stocks:', stockArray);
    return stockArray;
  });
</script>

<div class="home-container" class:dark={$darkMode}>
  <header>
    <h1>Stock Dashboard</h1>
    {#if currentUserId}
      <p>Welcome, User: {currentUserId}</p>
    {/if}
    <div class="header-actions">
      <button on:click={toggleTheme} class="theme-toggle">
        {#if $darkMode}
          ☀️ Light
        {:else}
          🌙 Dark
        {/if}
      </button>
      <button on:click={handleLogout} class="logout-button">Logout</button>
    </div>
  </header>

  {#if $socketConnectionStatus === 'connecting'}
    <p class="status-message">Connecting to stock service...</p>
  {:else if $socketConnectionStatus === 'connected'}
    <p class="status-message success">Connected to stock service.</p>
    <div class="stocks-grid">
      {#each $stocks as stock}
        <div class="stock-card">
          <h3>{stock.name} ({stock.symbol})</h3>
          {#if stock.price !== null}
            <p class="price">${stock.price.toFixed(2)}</p>
            <p class:positive={stock.change > 0} class:negative={stock.change < 0}>
              {stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2) || '0.00'}
            </p>
            <p class="timestamp">Last update: {stock.lastUpdate}</p>
          {:else}
            <p class="price">Data unavailable</p>
          {/if}
        </div>
      {/each}
    </div>
  {:else if $socketConnectionStatus === 'error'}
    <p class="status-message error">Error connecting to stock service. Please try again later.</p>
  {:else if $socketConnectionStatus === 'closed'}
    <p class="status-message">Disconnected from stock service. Attempting to reconnect or please login again.</p>
     {#if currentUserId}
      <button on:click={connectSocket}>Reconnect</button>
     {/if}
  {/if}
</div>

<style>
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --accent: #3498db;
    --error: #e74c3c;
    --success: #2e7d32;
    --border: #eee;
    --card-bg: white;
    --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  :global(.dark) {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #f8f9fa;
    --text-secondary: #adb5bd;
    --accent: #4dabf7;
    --error: #ff6b6b;
    --success: #51cf66;
    --border: #495057;
    --card-bg: #2d2d2d;
    --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .home-container {
    padding: 20px;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .theme-toggle {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    background: var(--accent);
    color: white;
  }

  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :global(body) {
    font-family: 'Inter', sans-serif;
  }

  header h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.5px;
  }

  .logout-button {
    background-color: var(--error);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .logout-button:hover {
    background-color: #c0392b;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .status-message {
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
    font-weight: bold;
  }
  .status-message.success {
    background-color: var(--success);
    color: white;
  }
  .status-message.error {
    background-color: var(--error);
    color: white;
  }

  .stocks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .positive {
    color: #28a745;
    font-weight: bold;
  }

  .negative {
    color: #dc3545;
    font-weight: bold;
  }

  .stock-card {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: var(--card-shadow);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }
  .stock-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .stock-card h3 {
    margin-top: 0;
    font-size: 1.25em;
    color: var(--text-primary);
  }

  .price {
    font-size: 1.8em;
    font-weight: bold;
    color: var(--accent);
    margin: 0.5rem 0;
  }

  .timestamp {
    font-size: 0.85em;
    color: var(--text-secondary);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .stocks-grid {
      grid-template-columns: 1fr; /* Stack cards on smaller screens */
    }
    header {
      flex-direction: column;
      align-items: flex-start;
    }
    .logout-button {
      margin-top: 10px;
    }
  }
</style>
