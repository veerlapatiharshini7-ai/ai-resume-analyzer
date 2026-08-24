import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles, FileCode, ArrowRight, Clipboard } from 'lucide-react';
import { parseFileToText } from '../utils/pdfParser';

interface FileUploaderProps {
  onAnalyze: (resumeText: string, fileName?: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onAnalyze,
  isLoading,
  error: externalError,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setParseError(null);
    setSelectedFile(file);
    setIsParsing(true);

    try {
      const text = await parseFileToText(file);
      setExtractedText(text);
    } catch (err: unknown) {
      console.error('Error parsing file:', err);
      setParseError(err instanceof Error ? err.message : 'Failed to read file contents.');
      setSelectedFile(null);
      setExtractedText('');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'upload') {
      if (!extractedText || extractedText.trim().length < 30) {
        setParseError('Please upload a valid resume PDF or text file with readable content.');
        return;
      }
      onAnalyze(extractedText, selectedFile?.name || 'Uploaded_Resume.pdf');
    } else {
      if (!pastedText || pastedText.trim().length < 30) {
        setParseError('Please paste at least 30 characters of resume text to analyze.');
        return;
      }
      onAnalyze(pastedText, 'Pasted_Resume.txt');
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        {/* Top Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            id="tab-upload-file"
            onClick={() => {
              setActiveTab('upload');
              setParseError(null);
            }}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload PDF / Document
          </button>
          <button
            type="button"
            id="tab-paste-text"
            onClick={() => {
              setActiveTab('paste');
              setParseError(null);
            }}
            className={`flex-1 py-3 px-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Paste Resume Text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-700/40'
                }`}
              >
                {!selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Drag & Drop your resume here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF, DOCX, TXT files (Up to 10MB)
                    </p>
                    <button
                      type="button"
                      id="browse-files-btn"
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {extractedText.length} characters extracted
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setExtractedText('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-red-500 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Text Paste */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Paste Resume Text Content
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your full resume text here (Summary, Experience, Education, Skills)..."
                rows={8}
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-all"
              />
            </div>
          )}

          {/* Error Message Display */}
          {(parseError || externalError) && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{parseError || externalError}</span>
            </div>
          )}

          {/* Analyze CTA Button */}
          <button
            type="submit"
            id="analyze-resume-submit-btn"
            disabled={
              isLoading ||
              isParsing ||
              (activeTab === 'upload' && !extractedText) ||
              (activeTab === 'paste' && !pastedText)
            }
            className={`w-full mt-5 py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all ${
              isLoading || isParsing || (activeTab === 'upload' && !extractedText) || (activeTab === 'paste' && !pastedText)
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 active:scale-[0.99]'
            }`}
          >
            {isParsing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Parsing PDF Text...</span>
              </>
            ) : isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Resume with Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Resume Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
