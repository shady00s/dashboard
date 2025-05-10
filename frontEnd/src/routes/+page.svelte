<script>
  import { goto } from '$app/navigation';
</script>

<nav class="navbar">
  <div class="nav-buttons">
    <button on:click={() => goto('/auth/login')}>Login</button>
    <button on:click={() => goto('/auth/signup')}>Sign Up</button>
  </div>
</nav>

<div class="hero">
  <h1>Your stock watcher</h1>
</div>

<style>
  .navbar {
    display: flex;
    justify-content: flex-start;
    padding: 1rem;
    background-color: #f0f0f0;
  }

  .nav-buttons {
    display: flex;
    gap: 1rem;
  }

  .nav-buttons button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .nav-buttons button:hover {
    background-color: #45a049;
  }

  .hero {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80vh;
    text-align: center;
  }

  h1 {
    font-size: 3rem;
    color: #333;
  }
</style>
