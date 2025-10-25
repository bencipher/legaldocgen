import { AssistantPage } from '@/components/AssistantPage';

// Environment-based configuration
const getWebSocketUrl = () => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  console.log('Environment check:', {
    VITE_WS_URL: import.meta.env.VITE_WS_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    NODE_ENV: import.meta.env.NODE_ENV,
    finalWsUrl: `${wsUrl}/ws/assistant/`
  });
  return `${wsUrl}/ws/assistant/`;
};

const Index = () => {
  const userId = import.meta.env.VITE_USER_ID || 'user_01';
  const projectName = import.meta.env.VITE_APP_NAME || 'Document Generator';
  
  return (
    <AssistantPage
      wsUrl={getWebSocketUrl()}
      userId={userId}
      projectName={projectName}
      theme="light"
      onDocumentGenerated={(html) => {
        console.log('Document generated:', html);
      }}
    />
  );
};

export default Index;
