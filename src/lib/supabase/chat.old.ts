import { createClient } from './client';
import { Message } from '@/lib/types/chat';

type ChatMode = 'research' | 'doctor' | 'source-finder';

// Represents a conversation (group of messages with the same session_id)
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: ChatMode;
  last_message: string;
  last_message_at?: string | Date; // Optional for backward compatibility
  message_count: number;
  created_at: string | Date;
  updated_at: string | Date;
}

// Represents a message in the user_queries table
interface DbMessage {
  id: string;
  user_id: string;
  session_id: string;
  mode: ChatMode;
  query_text: string;
  response_text: string | null;
  citations: any;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

// Convert database message to app message format
const toMessage = (dbMessage: DbMessage, isUser: boolean): Message => ({
  id: dbMessage.id,
  role: isUser ? 'user' : 'assistant',
  content: isUser ? dbMessage.query_text : (dbMessage.response_text || ''),
  timestamp: new Date(dbMessage.created_at),
  citations: dbMessage.citations || undefined,
  sessionId: dbMessage.session_id
});

// Convert app message to database message format
const toDbMessage = (
  message: Omit<Message, 'timestamp'> & { 
    userId: string;
    sessionId: string;
    mode: ChatMode;
  }
) => {
  const baseMessage = {
    user_id: message.userId,
    session_id: message.sessionId,
    mode: message.mode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (message.role === 'user') {
    return {
      ...baseMessage,
      query_text: message.content,
      response_text: null,
      citations: null,
      confidence_score: null
    };
  } else {
    return {
      ...baseMessage,
      query_text: '',
      response_text: message.content,
      citations: message.citations || null,
      confidence_score: null // Can be updated later if needed
    };
  }
};

export const chatClient = {
  // Create a new conversation (session) - don't create any messages yet
  async createConversation(userId: string, title: string, mode: ChatMode, customSessionId?: string): Promise<Conversation> {
    const sessionId = customSessionId || crypto.randomUUID();
    const now = new Date().toISOString();
    
    console.log('Creating new conversation (metadata only):', { userId, title, mode, sessionId });
    
    // Don't create any dummy messages - just return the conversation metadata
    // The first actual user message will establish the conversation in the database
    return {
      id: sessionId,
      user_id: userId,
      title,
      mode,
      last_message: '',
      last_message_at: now,
      message_count: 0,
      created_at: now,
      updated_at: now
    };
  },

  // Get all conversations (sessions) for a user
  async getConversations(userId: string): Promise<Conversation[]> {
    const supabase = createClient();
    
    try {
      console.log('Fetching conversations for user:', userId);
      
      // 1. Verify Supabase connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session) {
        console.error('Supabase auth check failed:', authError || 'No active session');
        throw new Error('Not authenticated with Supabase');
      }
      
      // 2. Get conversations by querying chat_messages table directly
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_messages')
        .select(`
          session_id,
          mode,
          role,
          content,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('session_id', { ascending: false })
        .order('created_at', { ascending: true }); // Order by creation time within each session
      
      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
      }
      
      console.log('Raw conversation data:', conversationsData);
      
      // Group messages by session_id to create conversations
      const conversationMap = new Map<string, any>();
      
      conversationsData?.forEach((message: any) => {
        const sessionId = message.session_id;
        
        if (!conversationMap.has(sessionId)) {
          // Initialize conversation with default title
          conversationMap.set(sessionId, {
            id: sessionId,
            user_id: userId,
            title: 'New Conversation',
            mode: message.mode as ChatMode,
            last_message: message.content || '',
            message_count: 1,
            created_at: message.created_at,
            updated_at: message.updated_at,
            firstUserMessage: null
          });
        } else {
          const existing = conversationMap.get(sessionId);
          existing.message_count++;
          
          // Always update last message and timestamp to the most recent
          if (new Date(message.updated_at) > new Date(existing.updated_at)) {
            existing.last_message = message.content || '';
            existing.updated_at = message.updated_at;
          }
        }
        
        // Store the first user message for title generation
        const conversation = conversationMap.get(sessionId);
        if (message.role === 'user' && !conversation.firstUserMessage) {
          conversation.firstUserMessage = message.content;
        }
      });
      
      // Generate titles from first user messages
      const conversations = Array.from(conversationMap.values()).map(conv => {
        if (conv.firstUserMessage) {
          // Generate title from first user message only
          let title = conv.firstUserMessage.trim();
          
          // Clean the title
          title = title
            .replace(/^#+\s*/, '') // Remove markdown headers
            .replace(/^(what|how|why|when|where|can|could|should|would|is|are|does|do|will|tell me|show me|explain|help|please|analyze)\s+/i, '')
            .replace(/\?+$/, '') // Remove question marks
            .replace(/[^\w\s]/g, ' ') // Remove special characters except spaces
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          // Truncate if too long
          if (title.length > 50) {
            title = title.substring(0, 47) + '...';
          }
          
          conv.title = title || 'New Conversation';
        }
        
        // Remove the temporary field
        delete conv.firstUserMessage;
        return conv;
      });
      
      console.log('Processed conversations:', conversations);
      
      return conversations;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error);
      console.error('Error in getConversations:', {
        message: errorMessage,
        details: errorDetails,
        userId,
        timestamp: new Date().toISOString()
      });
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  // Get messages for a conversation (session)
  async getMessages(sessionId: string): Promise<Message[]> {
    const supabase = createClient();
    
    try {
      console.log('Fetching messages for session:', sessionId);
      
      // Validate that sessionId looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        console.warn('Invalid UUID format for sessionId:', sessionId);
        return [];
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching messages:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }
      
      console.log('Messages fetched successfully:', data?.length || 0, 'messages');
      
      if (!data || data.length === 0) return [];
      
      // Convert database rows to messages
      const messages: Message[] = data.map((row: any) => ({
        id: row.id,
        role: row.role as 'user' | 'assistant',
        content: row.content,
        timestamp: new Date(row.created_at),
        sessionId: row.session_id,
        citations: row.citations || undefined
      }));
      
      return messages;
    } catch (error) {
      console.error('Error in getMessages:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      return [];
    }
  },

  // Add a message to a conversation
  async addMessage(message: Omit<Message, 'timestamp' | 'id'> & { userId: string; sessionId: string; mode: ChatMode }): Promise<Message> {
    const supabase = createClient();
    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    try {
      // Validate that sessionId and userId are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(message.sessionId)) {
        console.error('Invalid UUID format for sessionId:', message.sessionId);
        throw new Error(`Invalid sessionId format: ${message.sessionId}`);
      }
      if (!uuidRegex.test(message.userId)) {
        console.error('Invalid UUID format for userId:', message.userId);
        throw new Error(`Invalid userId format: ${message.userId}`);
      }
      
      console.log('Adding message to database:', {
        id: messageId,
        user_id: message.userId,
        session_id: message.sessionId,
        mode: message.mode,
        role: message.role,
        content: message.content.substring(0, 100) + '...' // Log first 100 chars
      });

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          user_id: message.userId,
          session_id: message.sessionId, // This is now properly typed as UUID
          mode: message.mode,
          role: message.role,
          content: message.content,
          citations: message.citations || null,
          confidence_score: null,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error adding message:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('Message added successfully:', data);
      
      return {
        id: messageId,
        role: message.role,
        content: message.content,
        timestamp: new Date(now),
        citations: data.citations,
        reasoningSteps: undefined,
        multiAgentResult: undefined,
        sessionId: data.session_id
      };
    } catch (error) {
      console.error('Error in addMessage:', {
        error,
        messageId,
        sessionId: message.sessionId,
        userId: message.userId,
        timestamp: now
      });
      console.error('Full error object:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  // Update conversation properties such as title (stored in the first user message)
  async updateConversation(
    sessionId: string,
    updates: Partial<Pick<Conversation, 'title'>>
  ): Promise<void> {
    const supabase = createClient();

    if (updates.title) {
      // Update the query_text of the first message in the session (assumed to be the title)
      const { error } = await supabase.rpc('update_session_title', {
        p_session_id: sessionId,
        p_title: updates.title
      });
      if (error) throw error;
    }
  },

  // Update conversation title
  async updateConversationTitle(sessionId: string, newTitle: string): Promise<void> {
    const supabase = createClient();
    
    try {
      console.log('Updating conversation title:', { sessionId, newTitle });
      
      // Update the first message (which represents the conversation) with the new title
      const { error } = await supabase
        .from('chat_messages')
        .update({ content: newTitle, updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (error) {
        console.error('Error updating conversation title:', error);
        throw error;
      }
      
      console.log('Successfully updated conversation title:', sessionId);
    } catch (error) {
      console.error('Error in updateConversationTitle:', {
        error,
        sessionId,
        newTitle,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  // Delete a conversation (session) and all its messages
  async deleteConversation(sessionId: string, userId: string): Promise<void> {
    const supabase = createClient();
    
    try {
      console.log('Deleting conversation:', { sessionId, userId });
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error deleting conversation:', error);
        throw error;
      }
      
      console.log('Successfully deleted conversation:', sessionId);
    } catch (error) {
      console.error('Error in deleteConversation:', {
        error,
        sessionId,
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  // Delete all conversations for a user
  async deleteAllConversations(userId: string): Promise<void> {
    const supabase = createClient();
    
    try {
      console.log('Deleting all conversations for user:', userId);
      
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error deleting all conversations:', error);
        throw error;
      }
      
      console.log('Successfully deleted all conversations for user:', userId);
    } catch (error) {
      console.error('Error in deleteAllConversations:', {
        error,
        userId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};
