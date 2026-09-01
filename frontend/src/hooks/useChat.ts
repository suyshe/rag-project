import { useState, useRef, useCallback } from 'react';
import { ChatMessage, Citation } from '../types/index.js';
import { streamChatQuery } from '../services/api.js';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, documentIds?: string[]) => {
      if (!text.trim() || isStreaming) return;

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `assistant-${Date.now()}`;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: nowStr,
      };

      const initialAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        citations: [],
        isStreaming: true,
        timestamp: nowStr,
      };

      // Prepare conversation history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await streamChatQuery({
          message: text,
          history,
          documentIds: documentIds && documentIds.length > 0 ? documentIds : undefined,
          signal: controller.signal,
          onCitations: (citations: Citation[]) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, citations } : msg
              )
            );
          },
          onDelta: (textDelta: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + textDelta }
                  : msg
              )
            );
          },
          onDone: (fullAnswer?: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: fullAnswer || msg.content,
                      isStreaming: false,
                    }
                  : msg
              )
            );
            setIsStreaming(false);
            abortControllerRef.current = null;
          },
          onError: (errMsg: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      isStreaming: false,
                      error: errMsg,
                    }
                  : msg
              )
            );
            setIsStreaming(false);
            abortControllerRef.current = null;
          },
        });
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isStreaming: false,
                  error: err.message || 'An unexpected error occurred during generation.',
                }
              : msg
          )
        );
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, messages]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
    );
  }, []);

  const clearChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}
