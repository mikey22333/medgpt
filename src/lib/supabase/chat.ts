'use client';

import { createClient } from '@/lib/supabase/client';
import { Message } from '@/lib/types/chat';

export type ChatMode = 'research' | 'doctor' | 'source-finder';

export interface Conversation {
  id: string;
  mode: ChatMode;
  title: string;
  last_message: string;
  last_message_at: string;
  created_at: string;
  user_id: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  mode: ChatMode;
  query: string;
  response: string;
  citations?: any[];
  reasoning_steps?: any[];
  created_at: string;
  updated_at: string;
}

class ChatClient {
  private supabase = createClient();

  // Create a new conversation
  async createConversation(userId: string, mode: ChatMode, title?: string): Promise<string | null> {
    try {
      // Verify user is authenticated
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError || !user || user.id !== userId) {
        console.error('Authentication error:', authError || 'User mismatch');
        return null;
      }

      // Generate a UUID for session_id to match the schema
      const sessionId = crypto.randomUUID();
      
      const insertData = {
        session_id: sessionId,
        user_id: userId,
        mode: mode,
        role: 'system',
        content: title || `New ${mode} conversation`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Attempting to create conversation with data:', insertData);
      
      // Create initial entry in chat_messages table
      const { error } = await this.supabase
        .from('chat_messages')
        .insert(insertData);

      if (error) {
        console.error('Error creating conversation:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return null;
      }

      return sessionId;
    } catch (error) {
      console.error('Error creating conversation catch block:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  // Save a message to an existing conversation
  async saveMessage(
    sessionId: string, 
    userId: string, 
    mode: ChatMode, 
    userQuery: string, 
    assistantResponse: string,
    citations?: any[],
    reasoningSteps?: any[]
  ): Promise<boolean> {
    try {
      // First, save the user message
      const { error: userError } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          mode: mode,
          role: 'user',
          content: userQuery,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        console.error('Error saving user message:', userError);
        return false;
      }

      // Then, save the assistant response
      const { error: assistantError } = await this.supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          mode: mode,
          role: 'assistant',
          content: assistantResponse,
          citations: citations || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }

  // Get all messages for a conversation
  async getConversationMessages(sessionId: string, userId: string): Promise<Message[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      const messages: Message[] = [];
      
      for (const record of data || []) {
        // Skip system messages in the chat display
        if (record.role === 'system') continue;

        messages.push({
          id: record.id,
          role: record.role as 'user' | 'assistant',
          content: record.content,
          timestamp: new Date(record.created_at),
          citations: record.citations || [],
          reasoningSteps: [], // Not stored in current schema
          sessionId: sessionId
        });
      }

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Get all conversations for a user, grouped by mode
  async getUserConversations(userId: string): Promise<{ [mode in ChatMode]: Conversation[] }> {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ChatClient: getUserConversations called with userId:`, userId);
      
      // Simple test - just get all messages for the user
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log(`[${timestamp}] ChatClient: Supabase query result:`, { 
        error: error?.message, 
        dataCount: data?.length || 0,
        userId: userId
      });

      if (error) {
        console.error('ChatClient: Error fetching conversations:', error);
        return { research: [], doctor: [], 'source-finder': [] };
      }

      // If no data, return empty
      if (!data || data.length === 0) {
        console.log(`[${timestamp}] ChatClient: No messages found for user:`, userId);
        return { research: [], doctor: [], 'source-finder': [] };
      }

      // Group by session_id
      const sessionGroups = new Map<string, any[]>();
      for (const message of data) {
        const sessionId = message.session_id;
        if (!sessionGroups.has(sessionId)) {
          sessionGroups.set(sessionId, []);
        }
        sessionGroups.get(sessionId)!.push(message);
      }

      // Convert to conversations
      const result: { [mode in ChatMode]: Conversation[] } = {
        research: [],
        doctor: [],
        'source-finder': []
      };

      for (const [sessionId, messages] of sessionGroups.entries()) {
        // Find first user message for title
        const firstUserMessage = messages.find(m => m.role === 'user');
        const lastMessage = messages[0]; // Since we ordered by created_at DESC
        
        if (firstUserMessage) {
          const mode = firstUserMessage.mode as ChatMode;
          const title = firstUserMessage.content?.slice(0, 50) + (firstUserMessage.content?.length > 50 ? '...' : '') || 'New Conversation';
          const lastMessageContent = lastMessage.content?.slice(0, 100) + (lastMessage.content?.length > 100 ? '...' : '') || 'No content';
          
          result[mode].push({
            id: sessionId,
            mode,
            title,
            last_message: lastMessageContent,
            last_message_at: lastMessage.created_at,
            created_at: firstUserMessage.created_at,
            user_id: userId,
            message_count: messages.length
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching conversations (catch):', error);
      return { research: [], doctor: [], 'source-finder': [] };
    }
  }

  // Delete a conversation
  async deleteConversation(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Update conversation title (updates the first user message)
  async updateConversationTitle(sessionId: string, userId: string, newTitle: string): Promise<boolean> {
    try {
      // Get the first user message for this session to update its content (which serves as title)
      const { data: firstRecord, error: fetchError } = await this.supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (fetchError || !firstRecord) {
        console.error('Error finding conversation to update:', fetchError);
        return false;
      }

      // Update the first user message's content to serve as the new title
      const { error } = await this.supabase
        .from('chat_messages')
        .update({ 
          content: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', firstRecord.id);

      if (error) {
        console.error('Error updating conversation title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      return false;
    }
  }

  // Check if conversation exists
  async conversationExists(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('session_id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .limit(1)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}

export const chatClient = new ChatClient();
