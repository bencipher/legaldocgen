import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export type BackendStatus = 'checking' | 'active' | 'waking' | 'error';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('Backend API Base URL:', API_BASE);

export const useBackendStatus = () => {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const { toast } = useToast();
  
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(API_BASE);
      // keep a light log for diagnostics
      console.log('Backend status response:', response.status);
      if (response.ok) {
        setStatus('active');
        return true;
      }
      throw new Error('Backend not responding');
    } catch (error) {
      console.error('Backend status check failed:', error);
      return false;
    }
  };

  const wakeBackend = async () => {
    setStatus('waking');
    toast({
      title: "Starting up the service",
      description: "Please wait while we initialize the backend server...",
      duration: 10000,
    });

    // Try up to 5 times with increasing delays
    for (let i = 0; i < 5; i++) {
      const delay = (i + 1) * 10000; // 10s, 20s, 30s, 40s, 50s delays
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isActive = await checkBackendStatus();
      if (isActive) {
        toast({
          title: "Service ready",
          description: "The backend server is now active.",
          duration: 5000,
        });
        return true;
      }
    }

    setStatus('error');
    toast({
      title: "Connection error",
      description: "Unable to connect to the backend server. Please try again later.",
      variant: "destructive",
      duration: null,
    });
    return false;
  };

  useEffect(() => {
    const initializeBackend = async () => {
      const isActive = await checkBackendStatus();
      if (!isActive) {
        await wakeBackend();
      }
    };

    initializeBackend();
  }, []);

  return { status, checkBackendStatus, wakeBackend };
};