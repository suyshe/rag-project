import React from 'react';
import { Citation } from '../../types/index.js';
import { BookOpen, ExternalLink } from 'lucide-react';

interface CitationCardProps {
  citations: Citation[];
  onSelectCitation: (citation: Citation) => void;
}

export const CitationCard: React.FC<CitationCardProps> = ({
  citations,
  onSelectCitation,
}) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-800/80">
      <div className="text-xs font-semibold text-slate-400 mb-2">
        Sources ({citations.length})
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {citations.map((c) => {
          const matchPercent = Math.round(c.similarity * 100);

          return (
            <button
              key={c.id || c.index}
              onClick={() => onSelectCitation(c)}
              className="flex flex-col text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 transition-all duration-150 group cursor-pointer"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    {c.index}
                  </span>

                  <span className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">
                    {c.filename}
                  </span>
                </div>

                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5">
                <span className="flex items-center gap-0.5">
                  <BookOpen className="w-2.5 h-2.5" />
                  Page {c.pageNumber}
                </span>

                <span>•</span>

                <span className="text-emerald-400 font-medium">
                  {matchPercent}% match
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};