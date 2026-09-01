import { useState, useEffect, useCallback } from 'react';
import { DocumentItem } from '../types/index.js';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api.js';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const docs = await getDocuments();
      setDocuments(docs);
      // Auto-select all ready documents if nothing is selected
      setSelectedDocIds((prev) => {
        if (prev.length === 0) {
          return docs.filter((d) => d.status === 'ready').map((d) => d.id);
        }
        return prev;
      });
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // If any document is in 'processing' status, poll every 3 seconds
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing) return;

    const timer = setInterval(() => {
      fetchDocs();
    }, 3000);

    return () => clearInterval(timer);
  }, [documents, fetchDocs]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const doc = await uploadDocument(file);
      await fetchDocs();
      // Add new doc to selected list
      if (doc && doc.id) {
        setSelectedDocIds((prev) => [...prev, doc.id]);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
      throw err;
    } finally {
      setIsDeletingId(null);
    }
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllDocs = () => {
    const readyIds = documents.filter((d) => d.status === 'ready').map((d) => d.id);
    if (selectedDocIds.length === readyIds.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(readyIds);
    }
  };

  return {
    documents,
    selectedDocIds,
    isLoading,
    isUploading,
    isDeletingId,
    error,
    refreshDocuments: fetchDocs,
    uploadDocument: handleUpload,
    deleteDocument: handleDelete,
    toggleSelectDoc,
    selectAllDocs,
  };
}
