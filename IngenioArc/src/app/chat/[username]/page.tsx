import React from 'react';
import ChatBox from '../../../components/ChatBox';

interface ChatPageProps {
  params: { username: string };
}

const ChatPage: React.FC<ChatPageProps> = ({ params }) => {
  const { username } = params;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <ChatBox chatWith={username} />
    </div>
  );
};

export default ChatPage;
