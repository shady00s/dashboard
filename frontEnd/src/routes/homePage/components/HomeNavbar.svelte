<script>
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session';
  import { socketStatus } from '$lib/stores/socket';
  
  async function handleLogout() {
    $session.set({ user: null });
    goto('/auth/login');
  }
</script>

<nav class="navbar">
  <div class="logo">StockWatcher</div>
  <div class="nav-items">
    <span class="connection-status {socketStatus}">
      {socketStatus}
    </span>
    <span class="user-email">{$session.user?.email}</span>
    <button on:click={handleLogout}>Logout</button>
  </div>
</nav>

<style>
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #f0f0f0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .logo {
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .nav-items {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .user-email {
    font-size: 0.9rem;
    color: #666;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: #d32f2f;
  }

  .connection-status {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .connection-status.connected {
    background-color: #4CAF50;
    color: white;
  }
  
  .connection-status.connecting {
    background-color: #FFC107;
    color: black;
  }
  
  .connection-status.disconnected,
  .connection-status.error {
    background-color: #f44336;
    color: white;
  }
</style>
