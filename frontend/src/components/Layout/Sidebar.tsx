import React from 'react';
import { X } from 'lucide-react';
import { DocumentManager } from '../Documents/DocumentManager.js';
import { DocumentItem } from '../../types/index.js';

interface SidebarProps {
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
  isUploading: boolean;
  isDeletingId?: string | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedDocIds,
  onToggleSelect,
  onSelectAll,
  onUpload,
  onDelete,
  isUploading,
  isDeletingId,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 sm:w-88 md:w-80 lg:w-96 relative bg-[#09090d] border-r border-violet-500/10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/5 blur-3xl" />
        {/* Sidebar Header */}
        <div className="p-4 border-b border-violet-500/10 flex items-center justify-center">
          <div className="flex items-center gap-2">
        <div>
        <h2 className="text-sm font-semibold text-white">
          Document Panel
        </h2>
        </div>
      </div>

            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
        </div>

        {/* Documents */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#09090d] to-[#07070b]">
          <DocumentManager
            documents={documents}
            selectedDocIds={selectedDocIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onUpload={onUpload}
            onDelete={onDelete}
            isUploading={isUploading}
            isDeletingId={isDeletingId}
          />
        </div>
      </aside>
    </>
  );
};