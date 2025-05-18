import { supabase } from '../../lib/db';

export async function getUserAndSpeaker(username: string) {
    return await supabase
        .from('users')
        .select('user_id, speakers(speaker_id)')
        .eq('world_nickname', username)
        .single();
}

export async function getUserAndListener(username: string) {
    return await supabase
        .from('users')
        .select('user_id, listeners(listener_id)')
        .eq('world_nickname', username)
        .single();
}

export async function getExistingConversation(speakerId: string, listenerId: string) {
    return await supabase
        .from('conversations')
        .select('conversation_id')
        .eq('speaker_id', speakerId)
        .eq('listener_id', listenerId)
        .maybeSingle();
}

export async function createConversation(speakerId: string, listenerId: string) {
    return await supabase
        .from('conversations')
        .insert([{ speaker_id: speakerId, listener_id: listenerId }])
        .select('conversation_id')
        .single();
}

export async function getSpeakerConversationCount(userId: string) {
    return await supabase
        .from('speakers')
        .select('conversation_count')
        .eq('user_id', userId)
        .single();
}

export async function updateSpeakerConversationCount(userId: string, newCount: number) {
    return await supabase
        .from('speakers')
        .update({ conversation_count: newCount })
        .eq('user_id', userId);
}

export async function getListenerConversationCount(userId: string) {
    return await supabase
        .from('listeners')
        .select('conversation_count')
        .eq('user_id', userId)
        .single();
}

export async function updateListenerConversationCount(userId: string, newCount: number) {
    return await supabase
        .from('listeners')
        .update({ conversation_count: newCount })
        .eq('user_id', userId);
}