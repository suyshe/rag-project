import React, { useEffect, useRef } from 'react';
import { ChatMessage, Citation } from '../../types/index.js';
import { MessageItem } from './MessageItem.js';
import { FileText } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  onSelectCitation: (citation: Citation) => void;
  onSendSuggestion?: (text: string) => void;
  hasDocuments: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSelectCitation,
  hasDocuments,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messages.map((m) => m.content).join('')]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        
        {/* Minimal welcome icon */}
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-400/20 flex items-center justify-center text-violet-400 mb-5 shadow-[0_0_35px_rgba(139,92,246,0.12)]">
          <FileText className="w-8 h-8 text-violet-400 group-hover:text-violet-300 transition-colors" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">
          Welcome to DocAI
        </h2>

        <p className="text-sm leading-6 text-slate-500 max-w-md">
          {hasDocuments
            ? 'Ask a question about your documents.'
            : 'Upload a document to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onSelectCitation={onSelectCitation}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
};