/**
 * Y.js Collaborative Editing Setup
 *
 * This module handles the setup and teardown of Y.js bindings for collaborative
 * code editing using the Monaco editor and a WebSocket provider.
 *
 * Y.js provides real-time synchronization of shared data types (like text) across
 * multiple clients connected to the same session.
 *
 * NOTE: This module uses dynamic imports to avoid SSR issues with Y.js libraries.
 */

import type { Monaco, OnMount } from '@monaco-editor/react';
import { config } from './config';

interface YJSSetupOptions {
  sessionId: string;
  userId: string;
  editor: any;
  monaco: Monaco;
  language: string;
  username?: string;
  onSessionTerminated?: () => void;
  onError?: (message: string) => void;
}

interface YJSInstance {
  ydoc: any;
  provider: any;
  binding: any;
  undoManager: any;
  cleanup: () => void;
}

/**
 * Sets up Y.js collaborative editing for the given Monaco editor.
 *
 * This function:
 * 1. Creates a Y.js document for shared state
 * 2. Connects to the WebSocket provider (collab service)
 * 3. Binds the Y.js text to the Monaco editor
 * 4. Sets up awareness (cursor/selection tracking)
 *
 * @param options Configuration for Y.js setup
 * @returns Object containing Y.js instances and cleanup function
 *
 * @example
 * ```typescript
 * const yjs = setupYJS({
 *   sessionId: 'session-123',
 *   userId: 'user-456',
 *   editor: monacoEditor,
 *   monaco: monacoLib,
 *   language: 'javascript',
 * });
 *
 * // Later, when cleaning up:
 * yjs.cleanup();
 * ```
 */
export async function setupYJS({
  sessionId,
  userId,
  editor,
  monaco,
  language,
  username,
  onSessionTerminated,
  onError,
}: YJSSetupOptions): Promise<YJSInstance> {
  console.log('[YJS Setup] Initializing collaborative editing:', {
    sessionId,
    userId,
    username,
    language,
    wsUrl: config.collaborationService.wsUrl,
  });

  try {
    // Dynamically import Y.js libraries to avoid SSR issues
    const [Y, { WebsocketProvider }, { MonacoBinding }] = await Promise.all([
      import('yjs'),
      import('y-websocket'),
      import('y-monaco'),
    ]);

    // Create a Y.js document for this session
    const ydoc = new Y.Doc();

    console.log('[YJS Setup] Connecting to WebSocket:', {
      baseUrl: config.collaborationService.wsUrl,
      room: sessionId,
      fullUrl: `${config.collaborationService.wsUrl}${sessionId}`,
    });

    // Connect to the WebSocket provider (collab service)
    // The provider will handle syncing with other clients
    const provider = new WebsocketProvider(
      config.collaborationService.wsUrl,
      sessionId,
      ydoc,
      {
        connect: true,
        params: {
          userid: userId,
          purpose: 'doc',
        },
      }
    );

    let terminated = false;

    const markTerminated = () => {
      if (!terminated) terminated = true;
    };

    const safeOnSessionTerminated = () => {
      if (terminated) return;
      terminated = true;
      if (onSessionTerminated) onSessionTerminated();
    };

    const safeOnError = (message: string) => {
      if (terminated) return;
      if (onError) onError(message);
    };

    // Handle WebSocket close events for better error reporting
    if (provider.ws) {
      provider.ws.addEventListener('close', (event: any) => {
        console.log('[YJS] WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        // Handle different close codes as per collab service API
        switch (event.code) {
          case 1006:
            // Code 1006 can occur during normal cleanup; avoid noisy errors
            console.info('[YJS] Closed - Connection ended (code 1006)');
            break;

          case 3000:
            console.warn('[YJS] Session ended due to inactivity');
            safeOnSessionTerminated();
            break;

          case 4000:
            console.error('[YJS] Unexpected closure');
            if (onError) {
              onError('An unexpected error occurred. Please refresh the page.');
            }
            break;
          case 4001:
            console.info('[YJS] Session ended by user or other client');
            safeOnSessionTerminated();
            break;

          case 4002:
            console.error('[YJS] Check-alive failed - connection lost');
            safeOnError('Connection lost to collaboration service. Please refresh the page.');
            break;

          case 4003:
            console.error('[YJS] Known error occurred:', event.reason);
            safeOnError(`Collaboration error: ${event.reason || 'Unknown error'}. Please try again.`);
            break;

          case 4004:
            console.error('[YJS] Unknown error occurred');
            safeOnError('An unknown error occurred in the collaboration service. Please refresh the page.');
            break;

          case 4005:
            console.error('[YJS] Connection not available');
            safeOnError('Collaboration service is temporarily unavailable. Please try again later.');
            break;

          default:
            console.log('[YJS] WebSocket closed with code:', event.code);
        }
      });

      provider.ws.addEventListener('open', () => {
        console.log('[YJS] WebSocket connection established');
      });
    }

    // Set up awareness to show cursor positions and selections
    const awareness = provider.awareness;
    awareness.setLocalState({
      user: {
        name: username || userId,
        color: generateUserColor(userId),
      },
    });

    // Get or create the shared text type
    const ytext = ydoc.getText('monaco');

    // Set the EOL character to be \n to sync across different OS
    const model = editor.getModel();
    if (model) {
      model.setEOL(0); // 0 = LF (\n)
    }

    // Create Monaco binding FIRST
    // This automatically syncs edits between Monaco and Y.js
    const binding = new MonacoBinding(
      ytext,
      model!,
      new Set([editor]),
      awareness
    );

    // Create undo manager for better undo/redo functionality
    const undoManager = new Y.UndoManager(ytext, {
      captureTimeout: 50,
      trackedOrigins: new Set([binding]),
      ignoreRemoteMapChanges: true,
    });

    // Store cursor location on undo
    undoManager.on('stack-item-added', (event: any) => {
      event.stackItem.meta.set('cursor-location', editor.getPosition());
    });

    // Restore cursor location on undo/redo
    undoManager.on('stack-item-popped', (event: any) => {
      const position = event.stackItem.meta.get('cursor-location');
      if (position) {
        editor.setPosition(position);
        editor.revealPositionInCenter(position);
      }
    });

    // Override editor undo to use YJS UndoManager
    editor.addAction({
      id: 'yjs-undo',
      label: 'Undo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
      run: () => {
        undoManager.undo();
      },
    });

    // Override editor redo to use YJS UndoManager
    editor.addAction({
      id: 'yjs-redo',
      label: 'Redo',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ],
      run: () => {
        undoManager.redo();
      },
    });

    // Handle connection events
    provider.on('status', (event: any) => {
      console.log('[YJS] Connection status:', event.status);
    });

    // Handle errors (only when not already terminated)
    provider.on('connection-error', (event: Event) => {
      if (terminated) {
        console.log('[YJS] Ignoring connection-error after termination');
        return;
      }
      console.error('[YJS] Connection error:', event);
      if (onError) {
        onError('Failed to connect to collaboration service. Please check your connection and refresh the page.');
      }
    });

    provider.on('sync', (isSynced: boolean) => {
      console.log('[YJS] Sync status:', isSynced ? 'synced' : 'syncing');
    });

    // Cleanup function to disconnect and destroy Y.js
    const cleanup = () => {
      console.log('[YJS] Cleaning up collaborative editing');
      undoManager.destroy();
      binding.destroy();
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
    };

    console.log('[YJS Setup] Successfully initialized collaborative editing');

    return {
      ydoc,
      provider,
      binding,
      undoManager,
      cleanup,
    };
  } catch (error) {
    console.error('[YJS Setup] Failed to initialize collaborative editing:', error);
    throw error;
  }
}

/**
 * Generates a consistent, deterministic color based on user ID.
 * This ensures the same user always gets the same color across sessions.
 *
 * @param userId The unique user identifier
 * @returns A hex color string
 */
function generateUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky blue
    '#F8B88B', // Peach
    '#A9DFBF', // Light green
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
