<script>
  import FormInput from './FormInput.svelte';
  import { goto } from '$app/navigation';
  import { session } from '$lib/stores/session';
  import { browser } from '$app/environment';
  
  export let action;
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let isLoading = false;
  
  async function handleSubmit(event) {
    event.preventDefault();
    error = '';
    isLoading = true;
    
    try {
      if (action === 'signup' && password !== confirmPassword) {
        error = 'Passwords do not match';
        return;
      }

      const endpoint = action === 'login' ? '/api/login' : '/api/signup';
      const requestBody = action === 'login' 
        ? { email, password } 
        : { user: { email, password } };

      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Request failed';
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.errors) {
          if (typeof data.errors === 'string') {
            errorMessage = data.errors;
          } else {
            const firstError = Object.values(data.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
        
        throw new Error(errorMessage);
      }

      if (browser) {
        session.update(s => ({ ...s, user: data.user || data }));
      }
      goto(data.redirectTo || '/homePage');
      
    } catch (err) {
      error = err.message;
      console.error('API Error:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

<form on:submit={handleSubmit}>
  <FormInput 
    type="email" 
    name="email" 
    bind:value={email} 
    label="Email" 
    required 
  />
  
  <FormInput 
    type="password" 
    name="password" 
    bind:value={password} 
    label="Password" 
    required 
  />
  
  {#if action === 'signup'}
    <FormInput 
      type="password" 
      name="confirmPassword" 
      bind:value={confirmPassword}
      label="Confirm Password" 
      required 
    />
  {/if}
  
  {#if error}
    <p class="error">{error}</p>
  {/if}
  
  <button type="submit" disabled={isLoading}>
    {#if isLoading}
      Loading...
    {:else}
      {action === 'login' ? 'Log In' : 'Sign Up'}
    {/if}
  </button>
</form>

<style>
  .error {
    color: red;
    margin: 1rem 0;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover:not(:disabled) {
    background: #4338ca;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
