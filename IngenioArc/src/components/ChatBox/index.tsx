"use client";
import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';
import { useSession } from 'next-auth/react';

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
            // Get current user id and speaker_id with a join
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('user_id, speakers(speaker_id)')
                .eq('world_nickname', session.user.username)
                .single();
            if (userError || !userData) return;
            const userId = userData.user_id;
            const speakerId = userData.speakers ? userData.speakers.speaker_id : userData.speakers;

            // Get chatWith user id and listener_id with a join
            const { data: otherUserData, error: otherUserError } = await supabase
                .from('users')
                .select('user_id, listeners(listener_id)')
                .eq('world_nickname', chatWith)
                .single();
            if (otherUserError || !otherUserData) return;
            const otherUserId = otherUserData.user_id;
            const listenerId = otherUserData.listeners ? otherUserData.listeners.listener_id : otherUserData.listeners;

            // Check if conversation already exists
            const { data: existingConv, error: existingConvError } = await supabase
                .from('conversations')
                .select('conversation_id')
                .eq('speaker_id', speakerId)
                .eq('listener_id', listenerId)
                .maybeSingle();

            console.log('userId:', userId, 'otherUserId:', otherUserId);
            console.log('speakerId:', speakerId, 'listenerId:', listenerId);
            console.log('Existing conversation:', existingConv, 'Error:', existingConvError);

            if (!existingConvError && existingConv) {
                setChatSessionId(existingConv.conversation_id);
            } else {
                // Create new conversation
                const { data: newConv, error: newConvError } = await supabase
                    .from('conversations')
                    .insert([
                        {
                            speaker_id: speakerId,
                            listener_id: listenerId,
                        },
                    ])
                    .select('conversation_id')
                    .single();

                console.log('New conversation:', newConv, 'Error:', newConvError);

                if (!newConvError && newConv) {
                    setChatSessionId(newConv.conversation_id);
                }
            }
            // Add 1 to the conversation_count of the speaker
            const { data: speakerData, error: speakerError } = await supabase
                .from('speakers')
                .select('conversation_count')
                .eq('user_id', userId)
                .single();
            if (!speakerError && speakerData) {
                await supabase
                    .from('speakers')
                    .update({ conversation_count: speakerData.conversation_count + 1 })
                    .eq('user_id', userId);
            }
            console.log('speakerData:', speakerData, 'speakerError:', speakerError);

            // Add 1 to the conversation_count of the listener
            const { data: listenerData, error: listenerError } = await supabase
                .from('listeners')
                .select('conversation_count')
                .eq('user_id', otherUserId)
                .single();
            if (!listenerError && listenerData) {
                await supabase
                    .from('listeners')
                    .update({ conversation_count: listenerData.conversation_count + 1 })
                    .eq('user_id', otherUserId);
            }
            console.log('listenerData:', listenerData, 'listenerError:', listenerError);
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
                            alignSelf: (msg.sender === 'me' || msg.sender === session?.user?.username) ? 'flex-end' : 'flex-start',
                            background: (msg.sender === 'me' || msg.sender === session?.user?.username) ? '#dcf8c6' : '#fff',
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
            <div style={{ padding: '10px', fontSize: '14px', color: '#555' }}>
                Chatting with: {chatWith}
            </div>
        </div>
    );
};

export default ChatBox;
