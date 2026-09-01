import React from 'react';
import { DocumentItem } from '../../types/index.js';
import { Badge } from '../UI/Badge.js';
import {
  FileText,
  Trash2,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => void;
  isDeletingId?: string | null;
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
    ' ' +
    sizes[i]
  );
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocIds,
  onToggleSelect,
  onSelectAll,
  onDelete,
  isDeletingId,
}) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 px-4 border border-slate-800 rounded-xl bg-slate-900/40">
        <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />

        <p className="text-sm font-medium text-slate-300">
          No documents yet
        </p>

        <p className="text-xs text-slate-500 mt-1">
          Upload a document to get started
        </p>
      </div>
    );
  }

  const allSelected =
    documents.length > 0 &&
    selectedDocIds.length === documents.length;

  return (
    <div className="space-y-3">

      {/* Document list header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-300">
          Your Documents
        </span>

        <button
          onClick={onSelectAll}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Documents */}
      <div className="space-y-2 max-h-[calc(100vh-330px)] overflow-y-auto pr-1">
        {documents.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.id);
          const isDeleting = isDeletingId === doc.id;

          return (
            <div
              key={doc.id}
              className={`group relative p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-950/20 border-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5">

                {/* Selection */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(doc.id)}
                  disabled={doc.status !== 'ready'}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-30 cursor-pointer"
                  title={
                    doc.status !== 'ready'
                      ? 'Document is not ready'
                      : 'Use this document for chat'
                  }
                />

                <div className="flex-1 min-w-0">

                  {/* Filename + delete */}
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className="text-sm font-medium text-slate-200 truncate cursor-pointer hover:text-white"
                      title={doc.filename}
                      onClick={() =>
                        doc.status === 'ready' &&
                        onToggleSelect(doc.id)
                      }
                    >
                      {doc.filename}
                    </h4>

                    <button
                      onClick={() => onDelete(doc.id)}
                      disabled={isDeleting}
                      title="Delete document"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status + useful metadata */}
                  <div className="flex items-center gap-2 mt-2">

                    {doc.status === 'ready' && (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}

                    {doc.status === 'processing' && (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}

                    {doc.status === 'failed' && (
                      <Badge
                        variant="error"
                        size="sm"
                        title={
                          doc.error_message || 'Document processing failed'
                        }
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}

                    <span className="text-[11px] text-slate-400">
                      {formatBytes(doc.file_size)}
                    </span>

                    {doc.status === 'ready' && (
                      <>
                        <span className="text-slate-600">•</span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {doc.total_pages}{' '}
                          {doc.total_pages === 1 ? 'page' : 'pages'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Error */}
                  {doc.error_message && (
                    <p className="mt-1.5 text-xs text-rose-400 line-clamp-2 bg-rose-950/30 p-1.5 rounded border border-rose-900/40">
                      {doc.error_message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};