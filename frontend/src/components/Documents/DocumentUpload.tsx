import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, isUploading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF documents (.pdf) are supported.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be smaller than 25MB.');
      return;
    }

    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await validateAndUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await validateAndUpload(files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70',
          isUploading && 'opacity-60 cursor-not-allowed pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <>
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-full animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-sm font-medium text-slate-200">
                Processing PDF & generating embeddings...
              </div>
              <div className="text-xs text-slate-400">
                Extracting text, 500-token chunking, and pgvector storage
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-slate-800 text-indigo-400 border border-slate-700 rounded-full group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-slate-200">
                <span className="text-indigo-400 font-semibold hover:underline">Click to upload</span> or drag & drop
              </div>
              <p className="text-xs text-slate-400">PDF up to 25MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
