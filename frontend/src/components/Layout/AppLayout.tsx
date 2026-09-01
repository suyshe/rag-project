import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { DocumentItem, HealthStatus } from '../../types/index.js';

interface AppLayoutProps {
  children: React.ReactNode;
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleSelectDoc: (id: string) => void;
  onSelectAllDocs: () => void;
  onUploadDoc: (file: File) => Promise<void>;
  onDeleteDoc: (id: string) => void;
  isUploading: boolean;
  isDeletingId?: string | null;
  health: HealthStatus | null;
  onClearChat: () => void;
  hasMessages: boolean;
  onGoHome: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  documents,
  selectedDocIds,
  onToggleSelectDoc,
  onSelectAllDocs,
  onUploadDoc,
  onDeleteDoc,
  isUploading,
  isDeletingId,
  health,
  onClearChat,
  hasMessages,
  onGoHome,
}) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#050507] text-slate-100">
      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocIds={selectedDocIds}
        onToggleSelect={onToggleSelectDoc}
        onSelectAll={onSelectAllDocs}
        onUpload={onUploadDoc}
        onDelete={onDeleteDoc}
        isUploading={isUploading}
        isDeletingId={isDeletingId}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#07070b]">
        <Header
          health={health}
          onClearChat={onClearChat}
          hasMessages={hasMessages}
          onGoHome={onGoHome}
          onToggleMobileSidebar={() => setIsOpenMobile(true)}
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
