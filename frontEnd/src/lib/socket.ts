import PhoenixChannels from 'phoenix-channels';
const { Socket: PhoenixSocket, Channel: PhoenixChannel } = PhoenixChannels;
import { writable, get } from 'svelte/store';
import { userId } from './auth';

const SOCKET_URL = 'ws://localhost:4001/socket';

export const stockData = writable<Record<string, any>>({});
export const socketConnectionStatus = writable<'connecting' | 'connected' | 'error' | 'closed'>('connecting');

let socket: InstanceType<typeof PhoenixSocket> | null = null;
let channel: InstanceType<typeof PhoenixChannel> | null = null;

const companyNames: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc.',
  NVDA: 'NVIDIA Corporation',
  JPM: 'JPMorgan Chase & Co.',
  BAC: 'Bank of America Corp',
  V: 'Visa Inc.',
  AMZN: 'Amazon.com Inc.',
  WMT: 'Walmart Inc.',
  MCD: 'McDonald\'s Corp'
};

function initializeStockData() {
  stockData.set({});
}

export function connectSocket() {
  const currentUserId = get(userId);
  if (!currentUserId) {
    console.error('User not authenticated. Cannot connect to socket.');
    socketConnectionStatus.set('error');
    return;
  }

  if (socket?.isConnected()) {
    console.log('Socket already connected.');
    return;
  }

  console.log('Initializing socket connection...');
  initializeStockData();
  socketConnectionStatus.set('connecting');

  socket = new PhoenixSocket(SOCKET_URL, { 
    params: { user_id: currentUserId },
    logger: (kind: string, msg: string, data: any) => { console.log(`Socket ${kind}: ${msg}`, data); }
  });

  socket.onOpen(() => {
    console.log('Socket connected successfully!');
    socketConnectionStatus.set('connected');
    joinStockChannel();
  });

  socket.onError((error) => {
    console.error('Socket connection error:', error);
    socketConnectionStatus.set('error');
  });

  socket.onClose((event) => {
    console.log('Socket closed:', event);
    socketConnectionStatus.set('closed');
    channel = null;
  });

  console.log('Connecting to socket...');
  socket.connect();
}

function joinStockChannel() {
  if (!socket) {
    console.error('Cannot join channel - socket not initialized');
    return;
  }

  const currentUserId = get(userId);
  if (!currentUserId) {
    console.error('Cannot join channel - no user ID');
    return;
  }

  const channelTopic = `stocks:${currentUserId}`;
  const channelParams = { user_id: currentUserId };
  console.log(`Joining channel with topic: ${channelTopic} and params:`, channelParams);
  channel = socket.channel(channelTopic, channelParams);

  channel.join()
    .receive('ok', (resp: any) => {
      console.log('Successfully joined channel:', resp);
      if (resp?.stocks) {
      stockData.update((currentData) => {
        const newData = { ...currentData };
        resp.stocks.forEach((stock: any) => {
          if (stock?.symbol && stock?.price !== undefined) {
            const prevPrice = newData[stock.symbol]?.price;
            const change = prevPrice ? stock.price - prevPrice : 0;
            
            newData[stock.symbol] = {
              name: companyNames[stock.symbol] || stock.name || stock.symbol,
              symbol: stock.symbol,
              price: stock.price,
              change: stock.change,
              lastUpdate: new Date().toLocaleTimeString()
            };
          }
        });
        console.log('Updated stockData:', newData);
        return newData;
      });
    }
    })
    .receive('error', (resp: any) => {
      console.error('Failed to join channel:', resp);
      socketConnectionStatus.set('error');
    })
    .receive('timeout', () => {
      console.error('Channel join timed out');
    });

  // Log all incoming messages for debugging
  channel.on('*', (event: string, payload: any) => {
    console.log(`Received channel event '${event}':`, payload);
  });

  channel.on('update', (payload: any) => {
    console.log('Received stock_update event with payload:', payload);
    if (payload?.status === 'ok' && payload?.response?.stocks) {
      stockData.update((currentData) => {
        console.log(currentData.stockes);
        const newData = { ...currentData };
        payload.response.stocks.forEach((stock: any) => {
          if (stock?.symbol && stock?.price !== undefined) {
            const prevPrice = newData[stock.symbol]?.price;
            const change = prevPrice ? stock.price - prevPrice : 0;
            
            newData[stock.symbol] = {
              name: companyNames[stock.symbol] || stock.name || stock.symbol,
              symbol: stock.symbol,
              price: stock.price,
              change,
              lastUpdate: new Date().toLocaleTimeString()
            };
          }
        });
        console.log('Updated stockData:', newData);
        return newData;
      });
    }
  });
}

export function disconnectSocket() {
  if (channel) {
    console.log('Leaving channel...');
    channel.leave().receive('ok', () => console.log('Left channel'));
    channel = null;
  }
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect(() => console.log('Socket disconnected'));
    socket = null;
  }
  socketConnectionStatus.set('closed');
}

// Auto-connect if user is already logged in
let connectionAttempted = false;
userId.subscribe(id => {
  if (id && !connectionAttempted) {
    console.log('User logged in - attempting socket connection');
    connectionAttempted = true;
    connectSocket();
  } else if (!id && socket) {
    console.log('User logged out - disconnecting socket');
    disconnectSocket();
    connectionAttempted = false;
    initializeStockData();
  }
});
