'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit2,
  Stethoscope,
  Search as SearchIcon,
  BookOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { chatClient, type ChatMode, type Conversation } from '@/lib/supabase/chat';
import { createClient } from '@/lib/supabase/client';

interface ChatSidebarProps {
  currentSessionId?: string;
  currentMode?: ChatMode;
  onSessionSelect: (sessionId: string, mode: ChatMode) => void;
  onNewChat: (mode: ChatMode) => void;
  className?: string;
}

const modeIcons = {
  research: BookOpen,
  doctor: Stethoscope,
  'source-finder': SearchIcon
};

const modeLabels = {
  research: 'Research',
  doctor: 'Doctor',
  'source-finder': 'Source Finder'
};

const modeColors = {
  research: 'bg-blue-100 text-blue-800',
  doctor: 'bg-green-100 text-green-800',
  'source-finder': 'bg-purple-100 text-purple-800'
};

export function ChatSidebar({ 
  currentSessionId, 
  currentMode, 
  onSessionSelect, 
  onNewChat,
  className 
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<{ [mode in ChatMode]: Conversation[] }>({
    research: [],
    doctor: [],
    'source-finder': []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [isLoading, setIsLoading] = useState(true);
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Load conversations
  const loadConversations = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading conversations');
      return;
    }
    
    console.log('Loading conversations for user:', user.id);
    setIsLoading(true);
    try {
      const userConversations = await chatClient.getUserConversations(user.id);
      console.log('Loaded conversations:', userConversations);
      setConversations(userConversations);
      setFilteredConversations(userConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load conversations when user changes
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  // Filter conversations based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered: { [mode in ChatMode]: Conversation[] } = {
      research: [],
      doctor: [],
      'source-finder': []
    };

    for (const mode of Object.keys(conversations) as ChatMode[]) {
      filtered[mode] = conversations[mode].filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const handleDeleteConversation = async (sessionId: string) => {
    if (!user?.id) return;
    
    const success = await chatClient.deleteConversation(sessionId, user.id);
    if (success) {
      await loadConversations();
    }
  };

  const handleRenameConversation = async (sessionId: string, newTitle: string) => {
    if (!user?.id || !newTitle.trim()) return;
    
    const success = await chatClient.updateConversationTitle(sessionId, user.id, newTitle.trim());
    if (success) {
      setEditingConversation(null);
      setEditTitle('');
      await loadConversations();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderConversationItem = (conversation: Conversation) => {
    const Icon = modeIcons[conversation.mode];
    const isActive = conversation.id === currentSessionId;
    const isEditing = editingConversation === conversation.id;

    return (
      <div
        key={conversation.id}
        className={cn(
          'group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50',
          isActive && 'bg-blue-50 border border-blue-200'
        )}
        onClick={() => !isEditing && onSessionSelect(conversation.id, conversation.mode)}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', 
          isActive ? 'text-blue-600' : 'text-gray-500'
        )} />
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => handleRenameConversation(conversation.id, editTitle)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameConversation(conversation.id, editTitle);
                } else if (e.key === 'Escape') {
                  setEditingConversation(null);
                  setEditTitle('');
                }
              }}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <>
              <div className={cn(
                'font-medium text-sm truncate',
                isActive ? 'text-blue-900' : 'text-gray-900'
              )}>
                {conversation.title}
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {conversation.last_message}
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className={cn('text-xs', modeColors[conversation.mode])}>
                  {modeLabels[conversation.mode]}
                </Badge>
                <span className="text-xs text-gray-400">
                  {formatDate(conversation.last_message_at)}
                </span>
              </div>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditingConversation(conversation.id);
                setEditTitle(conversation.title);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConversation(conversation.id);
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderModeSection = (mode: ChatMode) => {
    const modeConversations = filteredConversations[mode];
    const Icon = modeIcons[mode];
    
    if (modeConversations.length === 0 && !searchQuery) return null;

    return (
      <div key={mode} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">{modeLabels[mode]}</h3>
            <Badge variant="secondary" className="text-xs">
              {modeConversations.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNewChat(mode)}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {modeConversations.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {modeConversations.map(renderConversationItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Conversations</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              Loading conversations...
            </div>
          ) : (
            <>
              {renderModeSection('research')}
              {renderModeSection('doctor')}
              {renderModeSection('source-finder')}
              
              {/* Empty state */}
              {Object.values(filteredConversations).every(arr => arr.length === 0) && !isLoading && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-gray-400 mt-2">
                      Start a new conversation with any mode
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* New Chat Buttons */}
      {!searchQuery && !isLoading && (
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNewChat('research')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            New Research Chat
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNewChat('doctor')}
          >
            <Stethoscope className="h-4 w-4 mr-2" />
            New Doctor Chat
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onNewChat('source-finder')}
          >
            <SearchIcon className="h-4 w-4 mr-2" />
            New Source Finder
          </Button>
        </div>
      )}
    </div>
  );
}
