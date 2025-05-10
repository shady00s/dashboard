<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { subscribeToTopic } from '$lib/stores/socket';

  const stocks = writable([]);

  onMount(() => {
    const { unsubscribe } = subscribeToTopic('all', {
      onNewPrice: (trade) => {
        stocks.update(current => {
          const existing = current.find(s => s.symbol === trade.symbol);
          if (existing) {
            return current.map(stock => 
              stock.symbol === trade.symbol 
                ? { ...stock, price: trade.price, change: trade.change }
                : stock
            );
          }
          return [...current, trade];
        });
      },
      onJoin: (resp) => {
        console.log('Joined stock channel - Response:', resp);
        if (resp.stocks) {
          console.log('Received initial stocks:', resp.stocks);
          stocks.set(resp.stocks);
        } else {
          console.error('No stocks received in join response');
          // Initialize with empty array if no stocks received
          stocks.set([]);
        }
      },
      onJoinError: (resp) => console.log('Unable to join', resp)
    });

    return unsubscribe;
  });
</script>

<div class="stock-list">
  <h2>Your Watchlist</h2>
  {#each $stocks as stock}
    <div class="stock-card">
      <div class="stock-info">
        <h3>{stock.symbol}</h3>
        <p>{stock.name}</p>
      </div>
      <div class="stock-price">
        <span class="price">${stock.price.toFixed(2)}</span>
        <span class:positive={stock.change >= 0} class:negative={stock.change < 0}>
          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
        </span>
      </div>
    </div>
  {/each}
</div>

<style>
  .stock-list {
    display: grid;
    gap: 1rem;
  }
  
  h2 {
    color: #444;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
  
  .stock-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }
  
  .stock-card:hover {
    transform: translateY(-2px);
  }
  
  .stock-info h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }
  
  .stock-info p {
    margin: 0.25rem 0 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .stock-price {
    text-align: right;
  }
  
  .price {
    display: block;
    font-weight: bold;
    font-size: 1.1rem;
  }
  
  .positive {
    color: #4CAF50;
  }
  
  .negative {
    color: #f44336;
  }
</style>
