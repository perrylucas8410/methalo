import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  favicon?: string;
}

interface BrowserState {
  isConnected?: boolean;
  isLoading: boolean;
  tabs: Tab[];
  error?: string;
}

interface UseSocketProps {
  userId: string;
  sessionId: string;
  onBrowserStateChange?: (state: BrowserState) => void;
  onFrame?: (frameData: string) => void;
}

export function useSocket({ userId, sessionId, onBrowserStateChange, onFrame }: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isControllerReady, setIsControllerReady] = useState(false);
  const [browserState, setBrowserState] = useState<BrowserState>({ isLoading: false, tabs: [] });
  const socketRef = useRef<Socket | null>(null);

  // Dynamic Server URL Detection
  const getServerUrl = () => {
    // Priority 1: .env override
    if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
    
    // Priority 2: Current Host (detects subdomains automatically)
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '3001';
    
    // For local development on localhost:5173 -> localhost:3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port}`;
    }
    
    // For Production (e.g. premium.methalo.online)
    // If you use Nginx to map port 80/443 to the app and port 3001 to the server:
    return `${protocol}//${hostname}:${port}`;
  };

  const serverUrl = getServerUrl();

  useEffect(() => {
    if (!userId) return;

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      query: { userId, sessionId }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to gateway:', serverUrl);
      setIsConnected(true);
      socket.emit('authenticate', { userId, sessionId, clientType: 'portal' });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
      setIsControllerReady(false);
      setBrowserState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('controller:ready', () => {
      console.log('[Socket] Controller is live and ready');
      setIsControllerReady(true);
      setBrowserState(prev => ({ ...prev, isLoading: false, isConnected: true }));
    });

    socket.on('browser:connected', () => {
      setBrowserState(prev => ({ ...prev, isLoading: false, isConnected: true }));
    });

    socket.on('browser:disconnected', () => {
      setBrowserState(prev => ({ ...prev, isConnected: false }));
      setIsControllerReady(false);
    });

    socket.on('browser:tabs', (tabs: Tab[]) => {
      const newState = { isLoading: false, tabs, isConnected: true };
      setBrowserState(newState);
      onBrowserStateChange?.(newState);
    });

    socket.on('browser:frame', (data: any) => {
      // Direct base64 string
      onFrame?.(data);
    });

    socket.on('browser:frame:bin', (data: ArrayBuffer) => {
      // High-performance binary frame
      const blob = new Blob([data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      onFrame?.(url);
      // We don't revoke here because the Dashboard Image.onload handles it or uses it
    });

    socket.on('browser:error', (data: { message: string }) => {
      setBrowserState(prev => ({ ...prev, error: data.message, isLoading: false }));
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, sessionId, serverUrl]);

  const launchBrowser = useCallback((options?: { accountType?: string; tabLimit?: number }) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('browser:launch', options);
    setBrowserState(prev => ({ ...prev, isLoading: true, error: undefined }));
  }, []);

  const closeBrowser = useCallback(() => {
    socketRef.current?.emit('browser:close');
  }, []);

  const createTab = useCallback((url?: string) => {
    socketRef.current?.emit('tab:create', { url });
  }, []);

  const switchTab = useCallback((tabId: string) => {
    socketRef.current?.emit('tab:switch', { tabId });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    socketRef.current?.emit('tab:close', { tabId });
  }, []);

  const navigateTo = useCallback((url: string) => {
    socketRef.current?.emit('tab:navigate', { url });
  }, []);

  const goBack = useCallback(() => {
    socketRef.current?.emit('tab:back');
  }, []);

  const goForward = useCallback(() => {
    socketRef.current?.emit('tab:forward');
  }, []);

  const sendMouseEvent = useCallback((data: any) => {
    socketRef.current?.emit('input:mouse', data);
  }, []);

  const sendKeyboardEvent = useCallback((data: any) => {
    socketRef.current?.emit('input:keyboard', data);
  }, []);

  const sendScrollEvent = useCallback((data: any) => {
    socketRef.current?.emit('input:scroll', data);
  }, []);

  return {
    isConnected,
    isControllerReady,
    browserState,
    launchBrowser,
    closeBrowser,
    createTab,
    switchTab,
    closeTab,
    navigateTo,
    goBack,
    goForward,
    sendMouseEvent,
    sendKeyboardEvent,
    sendScrollEvent,
    socket: socketRef.current
  };
}
