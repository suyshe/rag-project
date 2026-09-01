import { useState, useEffect } from 'react';
import { AppLayout } from './components/Layout/AppLayout.js';
import { ChatInterface } from './components/Chat/ChatInterface.js';
import { ToastContainer, ToastMessage } from './components/UI/Toast.js';
import { useDocuments } from './hooks/useDocuments.js';
import { useChat } from './hooks/useChat.js';
import { getHealth } from './services/api.js';
import { HealthStatus } from './types/index.js';

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const {
    documents,
    selectedDocIds,
    isUploading,
    isDeletingId,
    uploadDocument,
    deleteDocument,
    toggleSelectDoc,
    selectAllDocs,
  } = useDocuments();

  const {
    messages,
    isStreaming,
    sendMessage,
    stopStreaming,
    clearChat,
  } = useChat();

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check health on mount and periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
      } catch {
        setHealth({
          status: 'error',
          timestamp: new Date().toISOString(),
          database: { ok: false, message: 'Backend unreachable' },
          config: {
            openaiConfigured: false,
            anthropicConfigured: false,
            openaiEmbeddingModel: 'text-embedding-3-small',
            anthropicModel: 'claude-3-5-sonnet-20241022',
            environment: 'development',
          },
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadWithNotification = async (file: File) => {
    try {
      await uploadDocument(file);
      addToast(
        'success',
        `${file.name} is ready to use.`,
        'Document Ready'
      );
    } catch (err: any) {
      addToast('error', err.message || 'Failed to upload document', 'Upload Error');
    }
  };

  const handleDeleteWithNotification = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    try {
      await deleteDocument(id);
      addToast(
        'info',
        `${doc?.filename || 'Document'} was deleted from knowledge base.`,
        'Document Removed'
      );
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete document', 'Delete Error');
    }
  };

  const readyDocuments = documents.filter((d) => d.status === 'ready');

  return (
    <AppLayout
      documents={documents}
      selectedDocIds={selectedDocIds}
      onToggleSelectDoc={toggleSelectDoc}
      onSelectAllDocs={selectAllDocs}
      onUploadDoc={handleUploadWithNotification}
      onDeleteDoc={handleDeleteWithNotification}
      isUploading={isUploading}
      isDeletingId={isDeletingId}
      health={health}
      onClearChat={clearChat}
      hasMessages={messages.length > 0}
      onGoHome={clearChat}
    >
      <ChatInterface
        messages={messages}
        onSendMessage={(text) => sendMessage(text, selectedDocIds)}
        onStopStreaming={stopStreaming}
        isStreaming={isStreaming}
        hasDocuments={readyDocuments.length > 0}
        selectedDocCount={selectedDocIds.length}
        totalDocCount={readyDocuments.length}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </AppLayout>
  );
}

export default App;
