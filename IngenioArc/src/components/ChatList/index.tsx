import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/db';

interface User {
  id: string;
  username: string;
  is_online: boolean;
}

const ChatList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, world_nickname, created_at');
      if (!error && data) {
        setUsers(
          data.map((u: any) => ({
            id: u.user_id,
            username: u.world_nickname,
            is_online: u.is_online ?? false,
          }))
        );
      }
    };
    fetchUsers();
    // Optionally, poll or subscribe for real-time updates
  }, []);

  const handleUserClick = (user: User) => {
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
