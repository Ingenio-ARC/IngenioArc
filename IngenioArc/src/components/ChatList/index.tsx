import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/db';
import { useSession } from 'next-auth/react';
import { getUserAndSpeaker, getUserAndListener, createConversation, updateConversationStatus, getSpeakerIdByUserId, getListenerIdByUserId } from '../../services/chatService';

interface User {
  id: string;
  username: string;
  created_at: string;
}

const ChatList: React.FC = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState<'speaker' | 'listener' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Detectar el rol del usuario actual
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user?.username) return;
      const speakerRes = await getUserAndSpeaker(session.user.username);
      if (speakerRes.data && speakerRes.data.speakers) {
        setRole('speaker');
        setUserId(speakerRes.data.user_id);
        return;
      }
      const listenerRes = await getUserAndListener(session.user.username);
      if (listenerRes.data && listenerRes.data.listeners) {
        setRole('listener');
        setUserId(listenerRes.data.user_id);
      }
    };
    fetchRole();
  }, [session]);

  // Escuchar cambios en conversations y users, y actualizar usuarios
  useEffect(() => {
    if (!role || !userId) return;
    const fetchUsers = async () => {
      const currentUsername = session?.user?.username;
      let query = supabase
        .from('users')
        .select('user_id, world_nickname, created_at');
      if (role === 'speaker') {
        // Los speakers ven todos los listeners menos los que están en un chat con status=2
        const { data: convs } = await supabase
          .from('conversations')
          .select('listener_id')
          .eq('status', 2);
        const busyListenerIds = (convs || []).map((c: any) => c.listener_id);
        query = query.neq('world_nickname', currentUsername);
        // Solo mostrar usuarios que sean listeners y no estén ocupados
        const { data, error } = await query;
        console.log('data', data);
        console.log('error', error);
        console.log('busyListenerIds', busyListenerIds);
        if (!error && data) {
          const filtered = [];
          for (const u of data) {
            const res = await getUserAndListener(u.world_nickname);
            if (res.data && res.data.listeners && !busyListenerIds.includes(u.user_id)) {
              filtered.push({
                id: u.user_id,
                username: u.world_nickname,
                created_at: u.created_at,
              });
            }
          }
          setUsers(filtered);
        }
      } else if (role === 'listener') {
        // Los listeners ven speakers con conversación status=1 donde ellos son el listener
        const { data: convs } = await supabase
          .from('conversations')
          .select('speaker_id')
          .eq('listener_id', userId)
          .eq('status', 1);
        const speakerIds = (convs || []).map((c: any) => c.speaker_id);
        if (speakerIds.length === 0) {
          setUsers([]);
          return;
        }
        const { data, error } = await query.in('user_id', speakerIds);
        if (!error && data) {
          const filtered = [];
          for (const u of data) {
            const res = await getUserAndSpeaker(u.world_nickname);
            if (res.data && res.data.speakers) {
              filtered.push({
                id: u.user_id,
                username: u.world_nickname,
                created_at: u.created_at,
              });
            }
          }
          setUsers(filtered);
        }
      }
    };
    fetchUsers();
    // Suscripción a cambios en conversations
    const convChannel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchUsers)
      .subscribe();
    // Suscripción a cambios en users (alta/baja/cambio de listeners/speakers)
    const usersChannel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers)
      .subscribe();
    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [role, userId, session]);

  const handleUserClick = async (user: User) => {
    if (!userId) return; // Ensure userId is not null
    if (role === 'speaker') {
      // Get speaker_id and listener_id
      const { speakerId } = await getSpeakerIdByUserId(userId);
      const { listenerId } = await getListenerIdByUserId(user.id);
      if (!speakerId || !listenerId) return;
      console.log('speakerId', speakerId, 'listenerId', listenerId);
      // Buscar o crear la conversación con este listener y poner status=1
      const { data: conv } = await supabase
        .from('conversations')
        .select('conversation_id, status')
        .eq('speaker_id', speakerId)
        .eq('listener_id', listenerId)
        .maybeSingle();
      if (!conv) {
        // Crear conversación con status=1
        await createConversation(speakerId, listenerId, 1);
      } else if (conv.status !== 1) {
        await updateConversationStatus(conv.conversation_id, 1);
      }
    } else if (role === 'listener') {
      // Get speaker_id and listener_id
      const { speakerId } = await getSpeakerIdByUserId(user.id);
      const { listenerId } = await getListenerIdByUserId(userId);
      if (!speakerId || !listenerId) return;
      console.log('speakerId', speakerId, 'listenerId', listenerId);
      // Buscar la conversación con este speaker y poner status=2
      const { data: conv } = await supabase
        .from('conversations')
        .select('conversation_id, status')
        .eq('speaker_id', speakerId)
        .eq('listener_id', listenerId)
        .maybeSingle();
      if (conv && conv.status !== 2) {
        await updateConversationStatus(conv.conversation_id, 2);
      }
    }
    router.push(`/chat/${user.username}`);
  };

  return (
    <div style={{ width: 300, border: '1px solid #ddd', borderRadius: 10, background: '#fff', padding: 16 }}>
      <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Usuarios en línea</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {users.map((user) => (
          <li
            key={user.id}
            style={{
              padding: '10px 12px',
              marginBottom: 8,
              borderRadius: 8,
              color: '#000',
              background: '#f1f1f1',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onClick={() => handleUserClick(user)}
          >
            {user.username}
          </li>
        ))}
        {users.length === 0 && <li style={{ color: '#888' }}>No hay usuarios en línea</li>}
      </ul>
    </div>
  );
};

export default ChatList;
