declare module 'phoenix' {
  class Socket {
    constructor(endpoint: string, opts?: {
      params?: Record<string, string>;
      reconnectAfterMs?: (tries: number) => number;
      logger?: (kind: string, msg: string, data: any) => void;
    });
    connect(): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    onOpen(callback: () => void): void;
    onClose(callback: () => void): void;
    onError(callback: () => void): void;
    channel(topic: string, params?: Record<string, any>): Channel;
  }

  class Channel {
    constructor(topic: string, params?: Record<string, any>, socket?: Socket);
    join(params?: Record<string, any>, timeout?: number): Push;
    on(event: string, callback: (payload: any) => void): void;
    off(event: string): void;
    push(event: string, payload: any, timeout?: number): Push;
    leave(timeout?: number): Push;
    state: string;
    joinTimer?: NodeJS.Timeout;
  }

  class Push {
    receive(status: 'ok' | 'error' | 'timeout', callback: (response: any) => void): Push;
  }
}
