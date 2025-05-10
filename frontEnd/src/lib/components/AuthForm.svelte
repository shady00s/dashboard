<script>
  import FormInput from './FormInput.svelte';
  import { enhance } from '$app/forms';
  
  export let action;
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  
  async function handleSubmit() {
    try {
      if (action === 'signup' && password !== confirmPassword) {
        error = 'Passwords do not match';
        return;
      }
      
      // Form submission will be handled by SvelteKit's form actions
    } catch (err) {
      error = err.message;
    }
  }
</script>

<form method="POST" use:enhance on:submit={handleSubmit}>
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
  
  <button type="submit">
    {action === 'login' ? 'Log In' : 'Sign Up'}
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
  
  button:hover {
    background: #4338ca;
  }
</style>
