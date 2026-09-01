import React from 'react';
import { DocumentItem } from '../../types/index.js';
import { DocumentUpload } from './DocumentUpload.js';
import { DocumentList } from './DocumentList.js';

interface DocumentManagerProps {
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
  isUploading: boolean;
  isDeletingId?: string | null;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  selectedDocIds,
  onToggleSelect,
  onSelectAll,
  onUpload,
  onDelete,
  isUploading,
  isDeletingId,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Upload */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            Documents
          </h3>

          {documents.length > 0 && (
            <span className="text-xs text-slate-500">
              {documents.length}
            </span>
          )}
        </div>

        <DocumentUpload
          onUpload={onUpload}
          isUploading={isUploading}
        />
      </div>

      {/* Document list */}
      {documents.length > 0 && (
        <div className="border-t border-slate-800 pt-5">
          <DocumentList
            documents={documents}
            selectedDocIds={selectedDocIds}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onDelete={onDelete}
            isDeletingId={isDeletingId}
          />
        </div>
      )}
    </div>
  );
};