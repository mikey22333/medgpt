'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ChatSidebarProps {
  currentSessionId?: string;
  currentMode?: 'research' | 'doctor' | 'source-finder';
  onSessionSelect: (sessionId: string, mode: 'research' | 'doctor' | 'source-finder') => void;
  onNewChat: (mode: 'research' | 'doctor' | 'source-finder') => void;
  className?: string;
}

export function ChatSidebar({ 
  currentSessionId, 
  currentMode, 
  onSessionSelect, 
  onNewChat,
  className 
}: ChatSidebarProps) {
  return (
    <div className={`h-full bg-gray-50 border-r border-gray-200 flex flex-col ${className || ''}`}>
      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={() => onNewChat('research')}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 p-4">
        <div className="text-sm text-gray-500 text-center">
          Conversations will appear here
        </div>
      </div>
    </div>
  );
}
