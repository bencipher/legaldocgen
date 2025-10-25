import { AssistantPage } from '@/components/AssistantPage';

// Environment-based configuration
const getWebSocketUrl = () => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
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
