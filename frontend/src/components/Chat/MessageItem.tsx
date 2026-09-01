import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Citation } from '../../types/index.js';
import { CitationCard } from './CitationCard.js';
import { Bot, User, AlertTriangle } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onSelectCitation: (citation: Citation) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSelectCitation }) => {
  const isUser = message.role === 'user';
  const citations = message.citations || [];

  // Helper to render markdown with interactive citation pills
  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Intercept text nodes to make [1], [2] clickable citation badges
          p: ({ children }) => {
            const processChildren = (node: React.ReactNode): React.ReactNode => {
              if (typeof node === 'string') {
                const parts = node.split(/(\[\d+\])/g);
                if (parts.length === 1) return node;

                return parts.map((part, index) => {
                  const match = part.match(/\[(\d+)\]/);
                  if (match) {
                    const citeNum = parseInt(match[1], 10);
                    const matchingCitation = citations.find((c) => c.index === citeNum);

                    return (
                      <button
                        key={index}
                        onClick={() => matchingCitation && onSelectCitation(matchingCitation)}
                        title={
                          matchingCitation
                            ? `${matchingCitation.filename} (Page ${matchingCitation.pageNumber})`
                            : `Citation [${citeNum}]`
                        }
                        className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 rounded-md transition-all align-middle cursor-pointer"
                      >
                        {part}
                      </button>
                    );
                  }
                  return part;
                });
              }
              return node;
            };

            return <p className="mb-2 leading-relaxed">{React.Children.map(children, processChildren)}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={`flex gap-3.5 p-4 rounded-2xl transition-colors ${
        isUser
          ? 'bg-slate-800/60 ml-auto max-w-[85%] border border-slate-700/50'
          : 'bg-slate-900/80 mr-auto w-full border border-slate-800'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-300">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-[10px] text-slate-500">{message.timestamp}</span>
        </div>

        {/* Content */}
        <div className="prose text-sm text-slate-200">
          {message.isStreaming ? (
            <div className="flex items-center gap-1.5 py-1 text-slate-400 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Thinking...</span>
            </div>
          ) : message.content ? (
            renderMessageContent(message.content)
         ) : null}
        </div>


        {/* Error notification */}
        {message.error && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{message.error}</span>
          </div>
        )}

        {/* Citations footer card */}
        {!isUser && citations.length > 0 && (
          <CitationCard citations={citations} onSelectCitation={onSelectCitation} />
        )}
      </div>
    </div>
  );
};
