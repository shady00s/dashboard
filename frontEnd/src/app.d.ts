// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare module 'phoenix-channels' {
  export class Socket {
    constructor(socketUrl: string, opts?: object);
    connect(params?: object): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    channel(topic: string, params?: object): Channel; // Changed from any to Channel
    onOpen(callback: () => void): void;
    onError(callback: (error: any) => void): void;
    onClose(callback: (event: any) => void): void;
    isConnected(): boolean;
    // Add other methods/properties as needed, e.g., params
    params?: any; 
  }

  // Basic Channel declaration (can be expanded)
  export class Channel {
    constructor(topic: string, params?: any, socket?: Socket);
    join(timeout?: number): any; // Push
    leave(timeout?: number): any; // Push
    on(event: string, callback: (payload: any, ref?: any) => void): any; // Binding
    off(event: string, ref?: any): void;
    push(event: string, payload: any, timeout?: number): any; // Push
    // Add other relevant Channel methods/properties
    topic: string;
    socket: Socket;
  }

  // Basic Push declaration (can be expanded)
  export class Push {
    constructor(channel: Channel, event: string, payload: any, timeout?: number);
    receive(status: string, callback: (response?: any) => any): this;
    // Add other relevant Push methods/properties
  }
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}
