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

export async function getSpeakerIdByUserId(userId: string) {
    const { data, error } = await supabase
        .from('speakers')
        .select('speaker_id')
        .eq('user_id', userId)
        .single();
    return { speakerId: data?.speaker_id, error };
}

export async function getListenerIdByUserId(userId: string) {
    const { data, error } = await supabase
        .from('listeners')
        .select('listener_id')
        .eq('user_id', userId)
        .single();
    return { listenerId: data?.listener_id, error };
}

export async function getExistingConversation(speakerId: string, listenerId: string) {
    return await supabase
        .from('conversations')
        .select('conversation_id')
        .eq('speaker_id', speakerId)
        .eq('listener_id', listenerId)
        .maybeSingle();
}

export async function createConversation(speakerId: string, listenerId: string, status: number = 1) {
    return await supabase
        .from('conversations')
        .insert([{ speaker_id: speakerId, listener_id: listenerId, status }])
        .select('conversation_id')
        .single();
}

export async function getSpeakerConversationCount(speakerId: string) {
    return await supabase
        .from('speakers')
        .select('conversation_count')
        .eq('speaker_id', speakerId)
        .single();
}

export async function updateSpeakerConversationCount(speakerId: string, newCount: number) {
    return await supabase
        .from('speakers')
        .update({ conversation_count: newCount })
        .eq('speaker_id', speakerId);
}

export async function getListenerConversationCount(listenerId: string) {
    return await supabase
        .from('listeners')
        .select('conversation_count')
        .eq('listener_id', listenerId)
        .single();
}

export async function updateListenerConversationCount(listenerId: string, newCount: number) {
    return await supabase
        .from('listeners')
        .update({ conversation_count: newCount })
        .eq('listener_id', listenerId);
}

export async function updateConversationStatus(conversationId: string, status: number) {
    return await supabase
        .from('conversations')
        .update({ status })
        .eq('conversation_id', conversationId);
}

export async function deleteConversationAndMessages(conversationId: string) {
    // Delete all messages for this conversation
    const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
    if (messagesError) {
        return { error: messagesError };
    }
    // Delete the conversation itself
    const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('conversation_id', conversationId);
    if (conversationError) {
        return { error: conversationError };
    }
    return { error: null };
}