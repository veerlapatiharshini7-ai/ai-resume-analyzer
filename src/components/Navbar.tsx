import React from 'react';
import { Sparkles, FileText, Moon, Sun, RotateCcw, Award, History } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onReset: () => void;
  hasAnalysis: boolean;
  onLoadSample: (id: string) => void;

  activeView?: 'analyzer' | 'cover-letter';
  onNavigateView?: (view: 'analyzer' | 'cover-letter') => void;

  historyCount?: number;
  onScrollToHistory?: () => void;
 main
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onReset,
  hasAnalysis,
  onLoadSample,

  activeView = 'analyzer',
  onNavigateView,

  historyCount = 0,
  onScrollToHistory,

}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div 
          onClick={onReset}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                ResumeAI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:block">
              AI Resume & Career Platform
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        {onNavigateView && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              id="nav-tab-analyzer"
              onClick={() => onNavigateView('analyzer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'analyzer'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume Analyzer</span>
            </button>
            <button
              type="button"
              id="nav-tab-cover-letter"
              onClick={() => onNavigateView('cover-letter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'cover-letter'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cover Letter Generator</span>
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Sample Selector Dropdown */}
          {!hasAnalysis && (
            <div className="relative group">
              <button 
                id="sample-resumes-btn"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Try Sample Resumes</span>
                <span className="sm:hidden">Samples</span>
              </button>

              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Select a Demo Resume
                </p>
                <button
                  id="sample-software-engineer"
                  onClick={() => onLoadSample('software-engineer')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  💻 Software Engineer (Mid-Level)
                </button>
                <button
                  id="sample-data-analyst"
                  onClick={() => onLoadSample('data-analyst')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  📊 Data Analyst & BI Specialist
                </button>
                <button
                  id="sample-product-manager"
                  onClick={() => onLoadSample('product-manager')}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  🚀 Technical Product Manager
                </button>
              </div>
            </div>
          )}

          {/* History Navigation Button */}
          {historyCount > 0 && onScrollToHistory && (
            <button
              id="navbar-history-btn"
              type="button"
              onClick={onScrollToHistory}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">History</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {historyCount}
              </span>
            </button>
          )}

          {/* Reset / Analyze New Button if analyzing */}
          {hasAnalysis && (
            <button
              id="analyze-another-btn"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze Another</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* Mobile View Switcher */}
          {onNavigateView && (
            <button
              type="button"
              id="mobile-nav-toggle-btn"
              onClick={() => onNavigateView(activeView === 'analyzer' ? 'cover-letter' : 'analyzer')}
              className="md:hidden flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
            >
              {activeView === 'analyzer' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden xs:inline">Cover Letter</span>
                  <span className="xs:hidden">Letter</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden xs:inline">Analyzer</span>
                  <span className="xs:hidden">Resume</span>
                </>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            id="dark-mode-toggle"
            onClick={onToggleDarkMode}
            aria-label="Toggle Theme Mode"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
