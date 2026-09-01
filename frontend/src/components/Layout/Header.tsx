import React, { useState } from 'react';
import { AboutModal } from '../UI/AboutModal.js';
import FeedbackModal from '../UI/FeedbackModal.js';
import { Trash2, Menu, FileText, Info, MessageSquare } from 'lucide-react';
import { HealthStatus } from '../../types/index.js';
import { Button } from '../UI/Button.js';

interface HeaderProps {
  health: HealthStatus | null;
  onClearChat: () => void;
  hasMessages: boolean;
  onGoHome: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearChat,
  hasMessages,
  onGoHome,
  onToggleMobileSidebar,
}) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const handleLogoClick = () => {
    onGoHome();
  };
  
  return (
    <>
    <header className="h-16 border-b border-violet-500/10 bg-[#08080c]/95 px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-xl z-20 shadow-[0_1px_20px_rgba(139,92,246,0.04)]">

      {/* Left section */}
      <div className="flex items-center gap-3">

        {/* Mobile sidebar button */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
          title="Open documents"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* DocAI Logo */}
        <button
          onClick={handleLogoClick}
          className="group flex items-center gap-3 text-left rounded-xl px-2 py-1.5 -ml-2 hover:bg-violet-500/5 transition-all duration-200"
          title="Go to DocAI home"
        >
          {/* Document icon */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.08)] group-hover:border-violet-400/40 group-hover:shadow-[0_0_25px_rgba(139,92,246,0.16)] transition-all duration-200">
            <FileText className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </div>

          {/* Brand text */}
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white group-hover:text-violet-200 transition-colors">
              DocAI
            </h1>

            <p className="text-[11px] text-slate-500 hidden sm:block">
              AI document assistant
            </p>
          </div>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* About */}
        <button
          onClick={() => setShowAbout(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
          title="About DocAI"
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>

        {/* Feedback */}
        <button
          onClick={() => setShowFeedback(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
          title="Send feedback"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feedback</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-800 mx-1" />

        {/* Clear Chat */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearChat}
          disabled={!hasMessages}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <span className="hidden xs:inline">Clear Chat</span>
          <span className="sm:hidden">Clear</span>
        </Button>

      </div>
    </header>
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
};
