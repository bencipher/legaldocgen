import React from 'react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  onReconnect: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isReconnecting,
  reconnectAttempts,
  maxReconnectAttempts,
  onReconnect,
}) => {
  if (isConnected) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <Wifi size={12} />
        Connected
      </Badge>
    );
  }

  if (isReconnecting) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500">
        <RotateCcw size={12} className="animate-spin" />
        Reconnecting... ({reconnectAttempts}/{maxReconnectAttempts})
      </Badge>
    );
  }

  return (
    <div className="space-y-2">
      <Badge variant="destructive" className="flex items-center gap-1">
        <WifiOff size={12} />
        Disconnected
      </Badge>
      {reconnectAttempts >= maxReconnectAttempts && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Connection failed. Please check your server.</span>
            <button
              onClick={onReconnect}
              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};