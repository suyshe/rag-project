import React from 'react';
import {
  X,
  FileText,
  Sparkles,
  ExternalLink,
  Linkedin,
  Github,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-violet-500/20 bg-[#0b0b10] shadow-2xl shadow-violet-950/40">
        
        {/* Violet glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div className="flex items-center gap-3">
            
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
              <FileText className="h-5 w-5 text-violet-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                About DocAI
              </h2>

              <p className="text-xs text-slate-500">
                AI-powered document intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close about"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative max-h-[calc(85vh-80px)] overflow-y-auto p-6 sm:p-8">

          {/* About DocAI */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-400" />

              <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300">
                What is DocAI?
              </h3>
            </div>

            <p className="leading-7 text-slate-400">
              DocAI is an AI-powered document question-answering
              application built using Retrieval-Augmented Generation (RAG).
            </p>

            <p className="mt-3 leading-7 text-slate-400">
              Upload your documents, build a searchable knowledge base,
              and ask questions about their contents using natural language.
              DocAI retrieves relevant information from your documents and
              uses it to generate grounded answers.
            </p>
          </section>

          {/* How it works */}
          <section className="mt-7">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300">
              How it works
            </h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <FileText className="mb-3 h-5 w-5 text-violet-400" />

                <h4 className="text-sm font-medium text-white">
                  01. Upload
                </h4>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Upload your documents to create your knowledge base.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <Sparkles className="mb-3 h-5 w-5 text-violet-400" />

                <h4 className="text-sm font-medium text-white">
                  02. Retrieve
                </h4>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Relevant information is retrieved from your documents.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <span className="mb-3 block text-lg text-violet-400">
                  ✦
                </span>

                <h4 className="text-sm font-medium text-white">
                  03. Ask
                </h4>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Ask questions and receive answers grounded in your files.
                </p>
              </div>

            </div>
          </section>

          {/* Developer */}
          <section className="mt-8 border-t border-white/[0.06] pt-7">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-300">
              About the Developer
            </h3>

            <div className="mt-4 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-5">

              <h4 className="text-lg font-semibold text-white">
                Suyog Shete
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Developer passionate about building useful applications
                with AI, modern web technologies, and intelligent
                information retrieval.
              </p>

              {/* Links */}
              <div className="mt-5 flex flex-wrap gap-2">

                <a
                  href="https://my-portfolio-jwvp-b5x3sm5qa-sush5.vercel.app/"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Portfolio
                </a>

                <a
                  href="https://linkedin.com/in/suyog-shete-b5b27a397"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>

                <a
                  href="https://github.com/suyshe"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>

              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
