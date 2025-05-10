<script>
  export let type = 'text';
  export let name;
  export let value;
  export let label;
  export let required = false;
</script>

<label>
  {label}
  <input 
    {type} 
    {name} 
    bind:value 
    {required}
    class="input-field"
  />
</label>

<style>
  label {
    display: block;
    margin-bottom: 1rem;
    font-weight: 500;
  }
  
  .input-field {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.25rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }
  
  .input-field:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
</style>
