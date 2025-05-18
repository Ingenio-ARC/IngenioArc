import ChatBox from '../../../components/ChatBox';
import { Suspense } from 'react';

interface ChatPageProps {
  params: { username: string };
}

const ChatPage = async ({ params }: ChatPageProps) => {
  const { username } = await params;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Suspense fallback={<div>Cargando chat...</div>}>
        <ChatBox chatWith={username} />
      </Suspense>
    </div>
  );
};

export default ChatPage;
