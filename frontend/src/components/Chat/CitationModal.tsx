import React from 'react';
import { Citation } from '../../types/index.js';
import { Modal } from '../UI/Modal.js';
import { Badge } from '../UI/Badge.js';
import { FileText, BookOpen, Percent, Layers, Copy, Check } from 'lucide-react';

interface CitationModalProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const similarityPercent = Math.round(citation.similarity * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Citation [${citation.index}]: Source Excerpt`}
      subtitle={`Retrieved chunk from ${citation.filename}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold">{citation.filename}</span>
          </div>

          <span className="text-slate-600">•</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Page {citation.pageNumber}</span>
          </div>

          <span className="text-slate-600">•</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{citation.tokenCount} tokens</span>
          </div>

          <div className="ml-auto">
            <Badge variant={similarityPercent >= 75 ? 'success' : 'info'} size="sm">
              <Percent className="w-3 h-3 mr-1" />
              {similarityPercent}% match
            </Badge>
          </div>
        </div>

        {/* Snippet text */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Raw Extracted Chunk Text:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy excerpt</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {citation.snippet}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
