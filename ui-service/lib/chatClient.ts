// AI Assistance Disclosure:
// Tool: sst/opencode (Polaris Alpha), date: 2025‑11-11
// Scope: Generated implementation based on API requirements.
// Author review: Validated correctness, fixed bugs

/**
 * Chat WebSocket Client
 *
 * Handles WebSocket connection to the collab service for real-time chat messaging.
 * Manages message protocol with types: JoinChat, ChatMessage, ChatNotif
 */

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  avatar?: string;
}

interface JoinChatMessage {
  type: 'JoinChat';
  status: 'Success' | 'Failed';
  msg?: string;
  message?: string;
}

interface ChatMessagePayload {
  type: 'ChatMessage';
  username: string;
  content: string;
  timestamp?: string;
}

interface ChatNotification {
  type: 'ChatNotif';
  content: string;
}

type WebSocketMessage = JoinChatMessage | ChatMessagePayload | ChatNotification;

export interface ChatClientOptions {
  sessionId: string;
  userId: string;
  username: string;
  wsUrl: string;
  onMessageReceived?: (message: ChatMessage) => void;
  onNotificationReceived?: (notification: string) => void;
  onConnected?: () => void;
  onError?: (error: string) => void;
  onConnectionClose?: () => void;
}

export interface ChatClientInstance {
  sendMessage: (content: string) => void;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  cleanup: () => void;
  setOnMessageReceived: (callback: (message: ChatMessage) => void) => void;
  setOnNotificationReceived: (callback: (notification: string) => void) => void;
  setOnConnected: (callback: () => void) => void;
  setOnError: (callback: (error: string) => void) => void;
  setOnConnectionClose: (callback: () => void) => void;
}

/**
 * Creates a chat WebSocket client for a collaborative session
 *
 * @param options Configuration for the chat client
 * @returns ChatClientInstance with send, connect, disconnect methods
 *
 * @example
 * ```typescript
 * const chatClient = createChatClient({
 *   sessionId: 'session-123',
 *   userId: 'user-456',
 *   username: 'Alice',
 *   wsUrl: 'ws://localhost:1234',
 *   onMessageReceived: (msg) => console.log('New message:', msg),
 *   onError: (err) => console.error(err),
 * });
 *
 * chatClient.connect();
 * chatClient.sendMessage('Hello!');
 * ```
 */
export function createChatClient({
  sessionId,
  userId,
  username,
  wsUrl,
  onMessageReceived,
  onNotificationReceived,
  onConnected,
  onError,
  onConnectionClose,
}: ChatClientOptions): ChatClientInstance {
  let ws: WebSocket | null = null;
  let isConnecting = false;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // ms
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let isTerminating = false;

  // Mutable callbacks for runtime updates
  let callbacks = {
    onMessageReceived,
    onNotificationReceived,
    onConnected,
    onError,
    onConnectionClose,
  };

  const connect = () => {
    if (ws !== null && ws.readyState === WebSocket.OPEN) {
      console.log('[Chat Client] Already connected');
      return;
    }

    if (isConnecting) {
      console.log('[Chat Client] Already connecting');
      return;
    }

    isConnecting = true;

    try {
      // Construct the WebSocket URL properly
      // wsUrl is expected to be a full URL like 'wss://localhost:8082' or 'ws://localhost:8082'
      let baseUrl = wsUrl;
      
      // If wsUrl doesn't start with ws protocol, convert http(s) to ws(s)
      if (!baseUrl.startsWith('ws')) {
        baseUrl = baseUrl.replace(/^https?:/, (match) => {
          return match === 'https:' ? 'wss:' : 'ws:';
        });
      }
      
      // Remove any trailing slashes
      baseUrl = baseUrl.replace(/\/$/, '');
      
      const params = `userid=${encodeURIComponent(userId)}&purpose=chat`;
      const fullUrl = `${baseUrl}/${sessionId}?${params}`;

      console.log('[Chat Client] Connecting to:', {
        sessionId,
        userId,
        username,
        baseUrl,
        url: fullUrl,
      });

      ws = new WebSocket(fullUrl);

      ws.addEventListener('open', () => {
        console.log('[Chat Client] Connected to WebSocket');
        isConnecting = false;
        reconnectAttempts = 0;

        // Server will send JoinChat message immediately
        // No need to send anything on our end

        if (callbacks.onConnected) {
          callbacks.onConnected();
        }
      });

      ws.addEventListener('message', (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          console.log('[Chat Client] Received message:', { type: data.type });

          if (data.type === 'JoinChat') {
            const joinMsg = data as JoinChatMessage;
            if (joinMsg.status === 'Success') {
              console.log('[Chat Client] Successfully joined chat');
            } else {
              console.error('[Chat Client] Failed to join chat:', joinMsg.msg || joinMsg.message);
              if (callbacks.onError) {
                callbacks.onError(`Failed to join chat: ${joinMsg.msg || joinMsg.message || 'Unknown error'}`);
              }
            }
          } else if (data.type === 'ChatMessage') {
            const chatMsg = data as ChatMessagePayload;
            // The backend doesn't send userid, so we create a message from the sender
            const message: ChatMessage = {
              id: `${Date.now()}-${Math.random()}`,
              userId: chatMsg.username, // Use username as userId since backend doesn't send it
              username: chatMsg.username,
              content: chatMsg.content,
              timestamp: new Date(),
            };

            console.log('[Chat Client] Chat message received:', {
              from: message.username,
              contentLength: message.content.length,
            });

            if (callbacks.onMessageReceived) {
              callbacks.onMessageReceived(message);
            }
          } else if (data.type === 'ChatNotif') {
            const notif = data as ChatNotification;
            console.log('[Chat Client] Notification:', notif.content);

            if (callbacks.onNotificationReceived) {
              callbacks.onNotificationReceived(notif.content);
            }
          }
        } catch (error) {
          console.error('[Chat Client] Error parsing message:', error);
        }
      });

      ws.addEventListener('error', (event) => {
        if (isTerminating) {
          console.log('[Chat Client] WebSocket error during intentional termination, suppressing callbacks')
          isConnecting = false
          return
        }

        console.error('[Chat Client] WebSocket error:', {
          readyState: ws?.readyState,
          url: ws?.url,
          error: event,
        });
        isConnecting = false;

        if (callbacks.onError) {
          callbacks.onError('Chat connection error. Please check your connection and refresh the page.');
        }
      });

      ws.addEventListener('close', (event) => {
        console.log('[Chat Client] WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        isConnecting = false;
        ws = null;

        // Handle different close codes
        if (isTerminating) {
          console.log('[Chat Client] Close during intentional termination, not reconnecting or notifying')
          return
        }

        if (event.code === 3000 || event.code === 4001) {
          // Session ended - don't reconnect
          console.log('[Chat Client] Session ended, not reconnecting');
          if (callbacks.onConnectionClose) {
            callbacks.onConnectionClose();
          }
        } else if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
          // Unexpected close - try to reconnect
          reconnectAttempts++;
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);

          console.log('[Chat Client] Attempting reconnect:', {
            attempt: reconnectAttempts,
            maxAttempts: maxReconnectAttempts,
            delayMs: delay,
          });

          reconnectTimeout = setTimeout(() => {
            if (ws === null) {
              connect();
            }
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('[Chat Client] Max reconnect attempts reached');
          if (callbacks.onError) {
            callbacks.onError('Chat connection lost. Please refresh the page.');
          }
        }

        if (callbacks.onConnectionClose) {
          callbacks.onConnectionClose();
        }
      });
    } catch (error) {
      console.error('[Chat Client] Error creating WebSocket:', error);
      isConnecting = false;

      if (callbacks.onError) {
        callbacks.onError(`Failed to create chat connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const disconnect = () => {
    console.log('[Chat Client] Disconnect requested')
    isTerminating = true
    console.log('[Chat Client] Disconnecting');

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (ws !== null) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Client disconnecting');
      }
      ws = null;
    }

    isConnecting = false;
    reconnectAttempts = 0;
  };

  const sendMessage = (content: string) => {
    if (ws === null || ws.readyState !== WebSocket.OPEN) {
      console.warn('[Chat Client] Not connected, cannot send message');
      if (callbacks.onError) {
        callbacks.onError('Chat not connected. Please refresh the page.');
      }
      return;
    }

    try {
      // Backend expects 'SendMsg' type, not 'ChatMessage'
      const message = {
        type: 'SendMsg',
        content: content,
      };

      console.log('[Chat Client] Sending message:', {
        to: sessionId,
        contentLength: content.length,
      });

      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[Chat Client] Error sending message:', error);
      if (callbacks.onError) {
        callbacks.onError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const isConnected = (): boolean => {
    return ws !== null && ws.readyState === WebSocket.OPEN;
  };

  const cleanup = () => {
    console.log('[Chat Client] Cleaning up');
    disconnect();
  };

  const setOnMessageReceived = (callback: (message: ChatMessage) => void) => {
    callbacks.onMessageReceived = callback;
  };

  const setOnNotificationReceived = (callback: (notification: string) => void) => {
    callbacks.onNotificationReceived = callback;
  };

  const setOnConnected = (callback: () => void) => {
    callbacks.onConnected = callback;
  };

  const setOnError = (callback: (error: string) => void) => {
    callbacks.onError = callback;
  };

  const setOnConnectionClose = (callback: () => void) => {
    callbacks.onConnectionClose = callback;
  };

  return {
    sendMessage,
    connect,
    disconnect,
    isConnected,
    cleanup,
    setOnMessageReceived,
    setOnNotificationReceived,
    setOnConnected,
    setOnError,
    setOnConnectionClose,
  };
}
