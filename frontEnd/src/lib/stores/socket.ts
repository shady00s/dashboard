import { Socket } from 'phoenix';
import { writable, derived, get } from 'svelte/store';

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface StockResponse {
  stocks: Stock[];
}

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
}

type ChannelHandlers = {
    onNewPrice?: (payload: PriceUpdate) => void;
    onJoin?: (response: StockResponse) => void;
    onJoinError?: (response: any) => void;
};

// Rate limiting configuration
const MAX_REQUESTS_PER_SECOND = 1;
const REQUEST_TRACKING_PERIOD = 1000; // 1 second in milliseconds

// Rate limiting state
const requestQueue = writable<Array<{ event: string, topic: string, payload: any, resolve: (value: any) => void }>>([]);
const requestTimestamps = writable<number[]>([]);
let rateLimitInterval: NodeJS.Timeout | null = null;

export const socketStatus = writable<SocketStatus>('disconnected');
const socketInstance = writable<Socket | null>(null);
const channels = writable<Map<string, any>>(new Map());
const activeSubscriptions = writable<Set<string>>(new Set());

// Throttle state - using a more efficient structure
const pendingUpdatesBySymbol = writable<Record<string, PriceUpdate>>({});
const updateInterval = 30000; // 30 seconds
let updateIntervalId: NodeJS.Timeout | null = null;

export const socket = derived(socketInstance, $socket => $socket);

// Process updates at most every 30 seconds
function processUpdates() {
  const updates = get(pendingUpdatesBySymbol);
  const symbols = Object.keys(updates);
  
  if (symbols.length > 0) {
    // Get all handlers that need to be notified
    const $channels = get(channels);
    
    // Process each channel that might have onNewPrice handlers
    $channels.forEach((channel, topic) => {
      if (channel && channel.onNewPrice) {
        // Notify handler for each symbol that has updates
        symbols.forEach(symbol => {
          channel.onNewPrice(updates[symbol]);
        });
      }
    });
    
    // Clear the updates after processing
    pendingUpdatesBySymbol.set({});
  }
}

// Global socket connection flag to ensure only one connection is ever made
let isInitializing = false;
let socketInitialized = false;

export function initSocket() {
    // Only allow a single socket connection throughout the application lifecycle
    const $socket = get(socketInstance);
    if ($socket || isInitializing || socketInitialized) return;
    
    isInitializing = true;
    const userId = localStorage.getItem('user_id');
    console.log('User ID:', userId);
    
    if (!userId) {
        isInitializing = false;
        throw new Error('User ID not found in localStorage');
    }
    
    const newSocket = new Socket("ws://localhost:4000/socket", {
        params: { 
            user_id: userId,
            vsn: "2.0.0"
        },
        reconnectAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 5000),
        logger: (kind: string, msg: string, data: any) => console.debug(`${kind}: ${msg}`, data)
    });
    
    socketStatus.set('connecting');
    
    newSocket.onOpen(() => {
        socketStatus.set('connected');
        console.log('Socket connected');
        // Set the flag to indicate a successful connection has been established
        socketInitialized = true;
        // Initialize rate limiting processor when socket connects
        startRateLimiter();
        // Start the update processor
        startUpdateProcessor();
    });
    
    newSocket.onClose(() => {
        socketStatus.set('disconnected');
        console.log('Socket disconnected');
    });
    
    newSocket.onError(() => {
        socketStatus.set('error');
        console.error('Socket error');
    });
    
    newSocket.connect();
    socketInstance.set(newSocket);
    isInitializing = false;
}

// Start the update processor
function startUpdateProcessor() {
    if (updateIntervalId !== null) return;
    
    updateIntervalId = setInterval(processUpdates, updateInterval);
}

// Stop the update processor
function stopUpdateProcessor() {
    if (updateIntervalId !== null) {
        clearInterval(updateIntervalId);
        updateIntervalId = null;
    }
}

// Start the rate limiter to process requests within the rate limit
function startRateLimiter() {
    if (rateLimitInterval !== null) return;
    
    rateLimitInterval = setInterval(() => {
        processRequestQueue();
    }, 100); // Check queue every 100ms for smoother processing
}

// Stop the rate limiter
function stopRateLimiter() {
    if (rateLimitInterval !== null) {
        clearInterval(rateLimitInterval);
        rateLimitInterval = null;
    }
}

// Process the request queue respecting rate limits
function processRequestQueue() {
    const now = Date.now();
    
    // Clean up old request timestamps (older than 1 second)
    requestTimestamps.update($timestamps => 
        $timestamps.filter(timestamp => now - timestamp < REQUEST_TRACKING_PERIOD)
    );
    
    // Get current request count in the last second
    const $timestamps = get(requestTimestamps);
    const currentRequestCount = $timestamps.length;
    
    // If we have capacity to process more requests
    if (currentRequestCount < MAX_REQUESTS_PER_SECOND) {
        const $queue = get(requestQueue);
        if ($queue.length > 0) {
            // Take the next request to process
            const requestToProcess = $queue[0];
            
            // Remove this request from the queue
            requestQueue.update($q => $q.slice(1));
            
            // Add this request to the timestamps
            requestTimestamps.update($t => [...$t, now]);
            
            // Execute the actual push
            executePush(
                requestToProcess.topic, 
                requestToProcess.event, 
                requestToProcess.payload, 
                requestToProcess.resolve
            );
        }
    }
}

// Execute a socket push directly
function executePush(topic: string, event: string, payload: any, resolve: (value: any) => void) {
    const $socket = get(socketInstance);
    if (!$socket) {
        resolve({ error: 'Socket not connected' });
        return;
    }
    
    const $channels = get(channels);
    const channel = $channels.get(topic);
    
    if (channel) {
        channel.push(event, payload)
            .receive('ok', (response: any) => {
                resolve(response);
            })
            .receive('error', (reason: any) => {
                console.error('Push failed:', reason);
                resolve({ error: reason });
            });
    } else {
        resolve({ error: 'Channel not found' });
    }
}

export function cleanupSocket() {
    // Stop the rate limiter and update processor
    stopRateLimiter();
    stopUpdateProcessor();
    
    // Clean up all channels first
    const $channels = get(channels);
    $channels.forEach((channel) => {
        if (channel && channel.leave) {
            channel.leave();
        }
    });
    
    // Then disconnect the socket
    socketInstance.update($socket => {
        if ($socket) {
            $socket.disconnect();
        }
        return null;
    });
    
    // Reset all state
    channels.set(new Map());
    activeSubscriptions.set(new Set());
    pendingUpdatesBySymbol.set({});
    socketStatus.set('disconnected');
    
    // Reset socket initialization flag
    socketInitialized = false;
}

export async function subscribeToTopic(topic: string, handlers: ChannelHandlers = {}): Promise<{
    unsubscribe: () => void;
    channel: any;
}> {
    // Ensure the socket is initialized
    if (!get(socketInstance)) {
        initSocket();
    }
    
    // Check if we already have an active subscription
    const $activeSubscriptions = get(activeSubscriptions);
    if ($activeSubscriptions.has(topic)) {
        const $channels = get(channels);
        const existingChannel = $channels.get(topic);
        if (existingChannel) {
            return {
                unsubscribe: () => {
                    if (existingChannel) {
                        if (existingChannel.joinTimer) {
                            clearTimeout(existingChannel.joinTimer);
                        }
                        existingChannel.leave();
                    }
                    channels.update($ch => {
                        $ch.delete(topic);
                        return $ch;
                    });
                    activeSubscriptions.update($subs => {
                        $subs.delete(topic);
                        return $subs;
                    });
                },
                channel: existingChannel
            };
        }
    }
    
    // Mark this topic as having an active subscription attempt
    activeSubscriptions.update($subs => {
        $subs.add(topic);
        return $subs;
    });
    
    const $socket = get(socketInstance);
    if (!$socket) {
        throw new Error('Socket not initialized');
    }
    
    const channel = $socket.channel(`stock:${topic}`);
    
    // Store the channel handlers
    channel.onNewPrice = handlers.onNewPrice;
    
    // Set up event listeners
    channel.on('new_price', (update: PriceUpdate) => {
        pendingUpdatesBySymbol.update($updates => ({
            ...$updates,
            [update.symbol]: update
        }));
        
        // If there's a direct handler, call it immediately
        if (handlers.onNewPrice) {
            handlers.onNewPrice(update);
        }
    });
    
    channel.on('new_prices', (payload: StockResponse) => {
        pendingUpdatesBySymbol.update($updates => {
            const newUpdates = { ...$updates };
            payload.stocks.forEach(stock => {
                newUpdates[stock.symbol] = {
                    symbol: stock.symbol,
                    price: stock.price,
                    change: stock.change
                };
            });
            return newUpdates;
        });
        
        // If there's a direct handler, call it immediately for each stock
        if (handlers.onNewPrice) {
            payload.stocks.forEach(stock => {
                handlers.onNewPrice({
                    symbol: stock.symbol,
                    price: stock.price,
                    change: stock.change
                });
            });
        }
    });
    
    // Store the channel reference
    channels.update($channels => {
        $channels.set(topic, channel);
        return $channels;
    });
    
    channel.on('phx_close', () => {
        console.log(`Channel ${topic} closed`);
        activeSubscriptions.update($subs => {
            $subs.delete(topic);
            return $subs;
        });
    });
    
    channel.on('phx_error', () => {
        console.error(`Channel ${topic} error`);
        // We don't remove from activeSubscriptions here to prevent immediate reconnect attempts
        // The Phoenix socket will handle reconnection
    });
    // Join the channel with retry logic
    const joinWithRetry = async (attempt = 1) => {
        const maxAttempts = 3;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
            const errorMsg = 'Cannot join channel - user authentication required';
            console.error(errorMsg);
            if (handlers.onJoinError) handlers.onJoinError({reason: errorMsg});
            return;
        }
        
        const joinParams = {
            user: {
                id: userId
            }
        };
        
        channel.join(joinParams, 10000) // 10 second timeout
            .receive('ok', (response: StockResponse) => {
                console.log('Successfully joined channel:', response);
                if (handlers.onJoin) handlers.onJoin(response);
            })
            .receive('error', (resp: any) => {
                console.error('Channel join error:', resp);
                if (attempt < maxAttempts) {
                    console.warn(`Join failed (attempt ${attempt}), retrying in ${delay}ms`);
                    channel.joinTimer = setTimeout(() => {
                        joinWithRetry(attempt + 1);
                    }, delay);
                } else {
                    console.error(`Join failed after ${maxAttempts} attempts`);
                    if (handlers.onJoinError) handlers.onJoinError(resp);
                    
                    // Remove from active subscriptions after max attempts
                    activeSubscriptions.update($subs => {
                        $subs.delete(topic);
                        return $subs;
                    });
                }
            })
            .receive('timeout', () => {
                console.error('Channel join timeout');
                if (attempt < maxAttempts) {
                    console.warn(`Retrying after timeout (attempt ${attempt})`);
                    channel.joinTimer = setTimeout(() => {
                        joinWithRetry(attempt + 1);
                    }, delay);
                } else {
                    console.error(`Join timed out after ${maxAttempts} attempts`);
                    
                    // Remove from active subscriptions after max attempts
                    activeSubscriptions.update($subs => {
                        $subs.delete(topic);
                        return $subs;
                    });
                }
            });
    };
    
    // Start the join process
    if (handlers.onJoin || handlers.onJoinError) {
        joinWithRetry();
    } else {
        channel.join()
            .receive('error', (resp: any) => console.error('Join failed:', resp));
    }
    
    return {
        unsubscribe: () => {
            if (channel) {
                if (channel.joinTimer) {
                    clearTimeout(channel.joinTimer);
                }
                channel.leave();
            }
            channels.update($channels => {
                $channels.delete(topic);
                return $channels;
            });
            activeSubscriptions.update($subs => {
                $subs.delete(topic);
                return $subs;
            });
        },
        channel
    };
}

export function getChannel(topic: string) {
    return derived(channels, $channels => $channels.get(topic));
}

export async function pushToTopic(topic: string, event: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
        // Ensure socket is initialized
        if (!get(socketInstance)) {
            initSocket();
        }
        
        // Add request to queue for rate limiting
        requestQueue.update($queue => [
            ...$queue, 
            { topic, event, payload, resolve }
        ]);
    });
}