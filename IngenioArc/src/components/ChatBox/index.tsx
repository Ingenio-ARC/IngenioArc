"use client";
import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages from Supabase on mount
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
    };
    fetchMessages();

    // Subscribe to new messages in real time
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: { new: Message }) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;
    console.log('Sending message:', input);
    const { error } = await supabase.from('messages').insert([
      {
        text: input,
        sender: 'me', // Replace with actual user if available
        timestamp: new Date().toISOString(),
      },
    ]);
    if (!error) setInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 400,
      width: 350,
      border: '1px solid #ddd',
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        background: '#f7f7f7',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'me' ? '#dcf8c6' : '#fff',
              color: '#222',
              borderRadius: 16,
              padding: '8px 14px',
              maxWidth: '75%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              fontSize: 15,
              position: 'relative',
            }}
          >
            {msg.text}
            <span style={{
              fontSize: 11,
              color: '#888',
              marginLeft: 8,
              position: 'absolute',
              right: 10,
              bottom: 2,
            }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          padding: 12,
          borderTop: '1px solid #eee',
          background: '#fafafa',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Type a message"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            borderRadius: 20,
            padding: '10px 16px',
            fontSize: 15,
            background: '#f1f1f1',
            marginRight: 8,
            color: '#000',
          }}
        />
        <button
          type="submit"
          style={{
            background: '#25d366',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '0 18px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
