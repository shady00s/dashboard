<script lang="ts">
  import { goto } from '$app/navigation';
  import { login, signup, userId } from '$lib/auth';
  import { onMount } from 'svelte';

  let loginEmail = '';
  let loginPassword = '';
  let signupEmail = '';
  let signupPassword = '';
  let error = '';
  let isLoading = false;
  let activeTab: 'login' | 'signup' = 'login';

  onMount(() => {
    const unsubscribe = userId.subscribe(id => {
      if (id) {
        goto('/home', { replaceState: true });
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      error = 'Email and password are required';
      return;
    }
    isLoading = true;
    error = '';
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      error = err.message || 'Login failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSignup() {
    if (!signupEmail || !signupPassword) {
      error = 'Email and password are required';
      return;
    }
    isLoading = true;
    error = '';
    try {
      await signup({ email: signupEmail, password: signupPassword });
    } catch (err: any) {
      error = err.message || 'Signup failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  <h1>Your Stock Watcher</h1>
  
  <div class="tabs">
    <button
      class:active={activeTab === 'login'}
      on:click={() => activeTab = 'login'}
      disabled={isLoading}
    >
      Login
    </button>
    <button
      class:active={activeTab === 'signup'}
      on:click={() => activeTab = 'signup'}
      disabled={isLoading}
    >
      Sign Up
    </button>
  </div>

  {#if error}
    <p class="error-message">{error}</p>
  {/if}

  {#if activeTab === 'login'}
    <div class="form-container">
      <label for="login-email">Email:</label>
      <input
        type="email"
        id="login-email"
        bind:value={loginEmail}
        placeholder="Enter your email"
        disabled={isLoading}
      />

      <label for="login-password">Password:</label>
      <input
        type="password"
        id="login-password"
        bind:value={loginPassword}
        placeholder="Enter your password"
        disabled={isLoading}
      />

      <button on:click={handleLogin} disabled={isLoading}>
        {#if isLoading}Logging in...{:else}Login{/if}
      </button>
    </div>
  {:else}
    <div class="form-container">
      <label for="signup-email">Email:</label>
      <input
        type="email"
        id="signup-email"
        bind:value={signupEmail}
        placeholder="Enter your email"
        disabled={isLoading}
      />

      <label for="signup-password">Password:</label>
      <input
        type="password"
        id="signup-password"
        bind:value={signupPassword}
        placeholder="Create a password"
        disabled={isLoading}
      />

      <button on:click={handleSignup} disabled={isLoading}>
        {#if isLoading}Signing up...{:else}Sign Up{/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    text-align: center;
    max-width: 400px;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2.5em;
    color: #333;
  }

  .tabs {
    display: flex;
    margin-bottom: 1.5rem;
    width: 100%;
  }

  .tabs button {
    flex: 1;
    padding: 0.75rem;
    background: #f0f0f0;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tabs button.active {
    background: #3498db;
    color: white;
  }

  .tabs button:first-child {
    border-radius: 4px 0 0 4px;
  }

  .tabs button:last-child {
    border-radius: 0 4px 4px 0;
  }

  .form-container {
    width: 100%;
  }

  label {
    display: block;
    margin: 1rem 0 0.5rem;
    text-align: left;
    font-weight: bold;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
  }

  button:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }

  .error-message {
    color: #e74c3c;
    margin: 1rem 0;
    min-height: 1.2em;
  }
</style>
