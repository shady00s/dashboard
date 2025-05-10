import { Socket } from 'phoenix';
import { writable, derived } from 'svelte/store';

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

export const socketStatus = writable<SocketStatus>('disconnected');
const socketInstance = writable<Socket | null>(null);
const channels = writable<Map<string, any>>(new Map());

export const socket = derived(socketInstance, $socket => $socket);

export function initSocket() {
    const token = localStorage.getItem('token') || '';
    const userId = localStorage.getItem('user_id') || '';
    
    const newSocket = new Socket("ws://localhost:4000/socket", {
        params: { 
            token,
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
}

export async function subscribeToTopic(topic: string, handlers: ChannelHandlers = {}): Promise<{
    unsubscribe: () => void;
    channel: any;
}> {
    let channel: any;
    const unsubscribe = socket.subscribe($socket => {
        if (!$socket) return;

        channel = $socket.channel(`stock:${topic}`);
        
        if (handlers.onNewPrice) {
            channel.on('new_price', handlers.onNewPrice);
            channel.on('new_prices', (payload: StockResponse) => {
                if (handlers.onNewPrice) {
                    payload.stocks.forEach(handlers.onNewPrice);
                }
            });
        }
        
        if (handlers.onJoin) {
            channel.join()
                .receive('ok', handlers.onJoin)
                .receive('error', handlers.onJoinError || ((resp: any) => console.error('Join failed:', resp)));
        } else {
            channel.join()
                .receive('error', (resp: any) => console.error('Join failed:', resp));
        }

        channels.update($channels => {
            $channels.set(topic, channel);
            return $channels;
        });

        channel.onClose(() => {
            console.log(`Channel ${topic} closed, reconnecting...`);
            setTimeout(() => subscribeToTopic(topic, handlers), 1000);
        });
    });

    return {
        unsubscribe: () => {
            if (channel) channel.leave();
            channels.update($channels => {
                $channels.delete(topic);
                return $channels;
            });
            unsubscribe();
        },
        channel
    };
}

export function getChannel(topic: string) {
    return derived(channels, $channels => $channels.get(topic));
}

export async function pushToTopic(topic: string, event: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
        socket.subscribe($socket => {
            const channel = $socket?.channel(`stock:${topic}`);
            if (channel) {
                channel.push(event, payload)
                    .receive('ok', resolve)
                    .receive('error', (reason) => {
                        console.error('Push failed:', reason);
                        resolve({ error: reason });
                    });
            } else {
                resolve({ error: 'Channel not found' });
            }
        });
    });
}
