import { Socket } from 'phoenix';
import { writable, derived } from 'svelte/store';

export const socketStatus = writable('disconnected');
const socketInstance = writable(null);
const channels = writable(new Map());

export const socket = derived(socketInstance, $socket => $socket);

export function initSocket() {
    const newSocket = new Socket("ws://localhost:4000/socket", {
        params: { 
            token: localStorage.getItem('token'),
            user_id: localStorage.getItem('user_id')
        },
        reconnectAfterMs: (tries) => Math.min(1000 * Math.pow(2, tries), 5000),
        logger: (kind, msg, data) => console.debug(`${kind}: ${msg}`, data)
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

export async function subscribeToTopic(topic, handlers = {}) {
    let channel;
    const unsubscribe = socket.subscribe($socket => {
        if (!$socket) return;

        channel = $socket.channel(`stock:${topic}`);
        
        if (handlers.onNewPrice) {
            channel.on('new_price', handlers.onNewPrice);
        }
        
        if (handlers.onJoin) {
            channel.join()
                .receive('ok', handlers.onJoin)
                .receive('error', handlers.onJoinError || (resp => console.error('Join failed:', resp)));
        } else {
            channel.join()
                .receive('error', resp => console.error('Join failed:', resp));
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

export function getChannel(topic) {
    return derived(channels, $channels => $channels.get(topic));
}

export async function pushToTopic(topic, event, payload) {
    return new Promise((resolve) => {
        socket.subscribe($socket => {
            const channel = $socket?.channels.find(c => c.topic === `stock:${topic}`);
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
