"use client";
import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';
import { useSession } from 'next-auth/react';
import { AuthButton } from '../AuthButton';
import {
    getUserAndSpeaker,
    getUserAndListener,
    getExistingConversation,
    createConversation,
    getSpeakerConversationCount,
    updateSpeakerConversationCount,
    getListenerConversationCount,
    updateListenerConversationCount,
    deleteConversationAndMessages,
} from '../../services/chatService';
import { Bold } from 'iconoir-react';
import CountdownTimer from './CountdownTimer';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [chatSessionId, setChatSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    console.log('ChatBox session', session);

    if (!session?.user?.username) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <AuthButton />
            </div>
        );
    }

    // Fetch user id and create conversation on mount
    useEffect(() => {
        const fetchUserIdAndCreateConversation = async () => {
            if (!session?.user?.username) return;

            // Primero intentamos obtener el speaker del usuario actual
            let userData, userError, otherUserData, otherUserError;
            ({ data: userData, error: userError } = await getUserAndSpeaker(session.user.username));
            if (!userError && userData && userData.speakers && ((Array.isArray(userData.speakers) && userData.speakers.length > 0) || (!Array.isArray(userData.speakers) && userData.speakers))) {
                // El usuario actual es speaker
                ({ data: otherUserData, error: otherUserError } = await getUserAndListener(chatWith));
                if (otherUserError || !otherUserData) {
                    console.log('SPEAKER: Error o no se encontró otherUserData', otherUserError, otherUserData);
                    return;
                }
                const userId = userData?.user_id;
                const otherUserId = otherUserData?.user_id;
                // Always extract the id, not the object, and ensure it's a string (SPEAKER CASE)
                let speakerId: string | undefined;
                if (Array.isArray(userData?.speakers) && userData.speakers.length > 0) {
                    speakerId = String(userData.speakers[0].speaker_id);
                } else if (userData?.speakers && typeof userData.speakers === 'object' && userData.speakers !== null && 'speaker_id' in userData.speakers) {
                    speakerId = String(userData.speakers.speaker_id);
                } else {
                    speakerId = undefined;
                }
                let listenerId: string | undefined;
                if (Array.isArray(otherUserData?.listeners) && otherUserData.listeners.length > 0) {
                    listenerId = String(otherUserData.listeners[0].listener_id);
                } else if (otherUserData?.listeners && typeof otherUserData.listeners === 'object' && otherUserData.listeners !== null && 'listener_id' in otherUserData.listeners) {
                    listenerId = String(otherUserData.listeners.listener_id);
                } else {
                    listenerId = undefined;
                }
                if (!speakerId || !listenerId) {
                    console.log('SPEAKER: No valid speakerId or listenerId', speakerId, listenerId);
                    return;
                }
                const { data: existingConv, error: existingConvError } = await getExistingConversation(speakerId, listenerId);
                console.log('SPEAKER existingConv:', existingConv);
                let newConv = null;
                if (!existingConvError && existingConv) {
                    setChatSessionId(existingConv.conversation_id);
                } else {
                    const result = await createConversation(speakerId, listenerId);
                    newConv = result.data;
                    console.log('SPEAKER newConv:', newConv);
                    if (!result.error && newConv) {
                        setChatSessionId(newConv.conversation_id);
                    }
                }
                // LOGS PARA SPEAKER
                console.log('SPEAKER userData:', userData);
                console.log('SPEAKER otherUserData:', otherUserData);
                console.log('SPEAKER speakerId:', speakerId);
                console.log('SPEAKER listenerId:', listenerId);
                if (otherUserError || !otherUserData) return;
                const { data: speakerData, error: speakerError } = await getSpeakerConversationCount(speakerId);
                if (!speakerError && speakerData) {
                    await updateSpeakerConversationCount(speakerId, speakerData.conversation_count + 1);
                }
                const { data: listenerData, error: listenerError } = await getListenerConversationCount(listenerId);
                if (!listenerError && listenerData) {
                    await updateListenerConversationCount(listenerId, listenerData.conversation_count + 1);
                }
            } else {
                // El usuario actual es listener
                ({ data: userData, error: userError } = await getUserAndListener(session.user.username));
                ({ data: otherUserData, error: otherUserError } = await getUserAndSpeaker(chatWith));
                if (userError || !userData) {
                    console.log('LISTENER: Error o no se encontró userData', userError, userData);
                    return;
                }
                if (otherUserError || !otherUserData) {
                    console.log('LISTENER: Error o no se encontró otherUserData', otherUserError, otherUserData);
                    return;
                }
                // Always extract the id, not the object, and ensure it's a string (LISTENER CASE)
                let speakerId: string | undefined;
                if (Array.isArray(otherUserData?.speakers) && otherUserData.speakers.length > 0) {
                    speakerId = String(otherUserData.speakers[0].speaker_id);
                } else if (otherUserData?.speakers && typeof otherUserData.speakers === 'object' && otherUserData.speakers !== null && 'speaker_id' in otherUserData.speakers) {
                    speakerId = String(otherUserData.speakers.speaker_id);
                } else {
                    speakerId = undefined;
                }
                let listenerId: string | undefined;
                if (Array.isArray(userData?.listeners) && userData.listeners.length > 0) {
                    listenerId = String(userData.listeners[0].listener_id);
                } else if (userData?.listeners && typeof userData.listeners === 'object' && userData.listeners !== null && 'listener_id' in userData.listeners) {
                    listenerId = String(userData.listeners.listener_id);
                } else {
                    listenerId = undefined;
                }
                if (!speakerId || !listenerId) {
                    console.log('LISTENER: No valid speakerId or listenerId', speakerId, listenerId);
                    return;
                }
                const { data: existingConv, error: existingConvError } = await getExistingConversation(speakerId, listenerId);
                let newConv = null;
                if (!existingConvError && existingConv) {
                    setChatSessionId(existingConv.conversation_id);
                } else {
                    const result = await createConversation(speakerId, listenerId);
                    newConv = result.data;
                    if (!result.error && newConv) {
                        setChatSessionId(newConv.conversation_id);
                    }
                }
                // LOGS PARA LISTENER
                console.log('LISTENER userData:', userData);
                console.log('LISTENER otherUserData:', otherUserData);
                console.log('LISTENER speakerId:', speakerId);
                console.log('LISTENER listenerId:', listenerId);
                console.log('LISTENER existingConv:', existingConv);
                console.log('LISTENER newConv:', newConv);
                if (userError || !userData) return;
                if (otherUserError || !otherUserData) return;
                const { data: speakerData, error: speakerError } = await getSpeakerConversationCount(speakerId);
                if (!speakerError && speakerData) {
                    await updateSpeakerConversationCount(speakerId, speakerData.conversation_count + 1);
                }
                const { data: listenerData, error: listenerError } = await getListenerConversationCount(listenerId);
                if (!listenerError && listenerData) {
                    await updateListenerConversationCount(listenerId, listenerData.conversation_count + 1);
                }
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
        // Siempre usar el username real como sender
        const sender = session?.user?.username;
        if (!sender) return;
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

    // Add a handler to close the chat and delete conversation/messages
    const handleCloseChat = async () => {
        if (chatSessionId) {
            await deleteConversationAndMessages(chatSessionId);
            setMessages([]);
            setChatSessionId(null);
        }
        router.back(); // Redirect to previous page (chat list)
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
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '15px 20px', 
                fontSize: '14px', 
                color: '#555' 
            }}>
                <span>
                    Estás conversando con: <span style={{ fontWeight: 'bold', display: 'inline-block'}}>{chatWith}</span>
                </span>
                <CountdownTimer initialSeconds={300} />
                <button onClick={handleCloseChat} style={{ marginLeft: 16, background: '#eee', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Cerrar chat</button>
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
                            alignSelf: (msg.sender === session?.user?.username) ? 'flex-end' : 'flex-start',
                            background: (msg.sender === session?.user?.username) ? '#dcf8c6' : '#fff',
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
