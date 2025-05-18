"use client";
import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';
import { useSession } from 'next-auth/react';
import {
    getUserAndSpeaker,
    getUserAndListener,
    getExistingConversation,
    createConversation,
    getSpeakerConversationCount,
    updateSpeakerConversationCount,
    getListenerConversationCount,
    updateListenerConversationCount,
} from '../../services/chatService';
import { Bold } from 'iconoir-react';

interface Message {
    id: number;
    text: string;
    sender: string;
    timestamp: string;
    conversation_id: string;
}

interface ChatBoxProps {
    chatWith: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ chatWith }) => {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Fetch user id and create conversation on mount
    useEffect(() => {
        const fetchUserIdAndCreateConversation = async () => {
            if (!session?.user?.username) return;

            const { data: userData, error: userError } = await getUserAndSpeaker(session.user.username);
            if (userError || !userData) return;
            const userId = userData.user_id;
            const speakerId = userData.speakers ? userData.speakers.speaker_id : userData.speakers;

            const { data: otherUserData, error: otherUserError } = await getUserAndListener(chatWith);
            if (otherUserError || !otherUserData) return;
            const otherUserId = otherUserData.user_id;
            const listenerId = otherUserData.listeners ? otherUserData.listeners.listener_id : otherUserData.listeners;

            const { data: existingConv, error: existingConvError } = await getExistingConversation(speakerId, listenerId);

            if (!existingConvError && existingConv) {
                setChatSessionId(existingConv.conversation_id);
            } else {
                const { data: newConv, error: newConvError } = await createConversation(speakerId, listenerId);
                if (!newConvError && newConv) {
                    setChatSessionId(newConv.conversation_id);
                }
            }

            const { data: speakerData, error: speakerError } = await getSpeakerConversationCount(userId);
            if (!speakerError && speakerData) {
                await updateSpeakerConversationCount(userId, speakerData.conversation_count + 1);
            }

            const { data: listenerData, error: listenerError } = await getListenerConversationCount(otherUserId);
            if (!listenerError && listenerData) {
                await updateListenerConversationCount(otherUserId, listenerData.conversation_count + 1);
            }
        };
        fetchUserIdAndCreateConversation();
    }, [session, chatWith]);

    // Fetch messages from Supabase on mount (filtered by chatSessionId)
    useEffect(() => {
        if (!chatSessionId) return;
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', chatSessionId)
                .order('timestamp', { ascending: true });
            if (!error && data) {
                setMessages(data);
            }
        };
        fetchMessages();

        // Subscribe to new messages in real time for this session
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: { new: Message }) => {
                if (payload.new.conversation_id === chatSessionId) {
                    setMessages((prev) => [...prev, payload.new]);
                }
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || !chatSessionId) return;
        const sender = session?.user?.username || 'me';
        const { error } = await supabase.from('messages').insert([
            {
                text: input,
                sender: sender,
                conversation_id: chatSessionId,
            },
        ]);
        console.log('Message sent', chatSessionId, error);
        if (!error) setInput('');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 0px)',
            width: '100%',
            margin: '0 auto auto',
            border: '1px solid #ddd',
            borderRadius: '12px, 12px, 0, 0',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            overflow: 'hidden',
        }}>
            <div style={{ padding: '15px 20px', fontSize: '14px', color: '#555' }}>
                Estás conversando con: <div style={{ fontWeight: 'bold', display: 'inline-block'}}>{chatWith}</div>
            </div>
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
                            alignSelf: (msg.sender === 'me' || msg.sender === session?.user?.username) ? 'flex-end' : 'flex-start',
                            background: (msg.sender === 'me' || msg.sender === session?.user?.username) ? '#dcf8c6' : '#fff',
                            color: '#222',
                            borderRadius: 16,
                            padding: '8px 14px 16px',
                            maxWidth: '75%',
                            minWidth: 70,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            fontSize: 15,
                            position: 'relative',
                            wordBreak: 'break-word', // Ensures long words wrap
                        }}
                    >
                        {msg.text}
                        <span style={{
                            fontSize: 10,
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
