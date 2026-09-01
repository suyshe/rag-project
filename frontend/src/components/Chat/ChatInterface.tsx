import React, { useState } from 'react';
import { ChatMessage, Citation } from '../../types/index.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import { CitationModal } from './CitationModal.js';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  hasDocuments: boolean;
  selectedDocCount: number;
  totalDocCount: number;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  hasDocuments,
  selectedDocCount,
  totalDocCount,
}) => {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07070b]">
      {/* Message List */}
      <MessageList
        messages={messages}
        onSelectCitation={(citation) => setSelectedCitation(citation)}
        onSendSuggestion={(text) => onSendMessage(text)}
        hasDocuments={hasDocuments}
      />

      {/* Input Box */}
      <ChatInput
        onSendMessage={onSendMessage}
        onStopStreaming={onStopStreaming}
        isStreaming={isStreaming}
        disabled={!hasDocuments}
        selectedDocCount={selectedDocCount}
        totalDocCount={totalDocCount}
      />

      {/* Citation Detail Modal */}
      <CitationModal
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
};
