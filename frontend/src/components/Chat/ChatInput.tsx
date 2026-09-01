import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Filter } from 'lucide-react';
import { Button } from '../UI/Button.js';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  selectedDocCount: number;
  totalDocCount: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  disabled = false,
  selectedDocCount,
  totalDocCount,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur">
      <div className="max-w-4xl mx-auto">
        {/* Context indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-indigo-400" />
            <span>
              {totalDocCount === 0
                ? 'No documents in knowledge base'
                : selectedDocCount === 0 || selectedDocCount === totalDocCount
                ? `Searching across all ${totalDocCount} documents`
                : `Searching in ${selectedDocCount} selected ${
                    selectedDocCount === 1 ? 'document' : 'documents'
                  }`}
            </span>
          </div>

          <span className="hidden sm:inline text-[11px] text-slate-500">
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700">Shift+Enter</kbd> for new line
          </span>
        </div>

        {/* Input box */}
        <div className="relative flex items-end gap-2 bg-slate-950/80 rounded-2xl border border-slate-800 focus-within:border-indigo-500/60 p-2 shadow-inner transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Upload a document first...'
                : 'Ask a question about your documents...'
            }
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none outline-none py-2 px-3 min-h-[44px] max-h-[200px]"
          />

          {isStreaming ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={onStopStreaming}
              className="rounded-xl h-10 px-3 shrink-0"
              leftIcon={<Square className="w-4 h-4 fill-current" />}
            >
              Stop
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || disabled}
              className="rounded-xl h-10 w-10 p-0 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
