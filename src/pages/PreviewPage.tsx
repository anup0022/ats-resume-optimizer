import { useState, useEffect } from 'react';
import { useApp } from '../hooks/useAppState';
import { ResumeTheme, ResumeThemeConfig } from '../types';
import { applyAcceptedSuggestions, downloadAsPDF, downloadAsDOCX, downloadAsTXT, RESUME_THEMES, getThemeConfig } from '../services/resumeBuilder';

function ThemeCard({ theme, isSelected, onSelect }: { theme: ResumeThemeConfig; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left w-full ${
        isSelected
          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* Mini preview swatch */}
      <div className="w-full h-14 rounded mb-2 border border-gray-100 bg-white flex flex-col items-center justify-center px-2 overflow-hidden">
        <div
          className="w-8 h-1 rounded-full mb-1"
          style={{ backgroundColor: theme.accentColor }}
        />
        <div className="w-full flex flex-col gap-0.5">
          <div className="h-0.5 rounded-full bg-gray-300 w-full" />
          <div className="h-0.5 rounded-full bg-gray-200 w-3/4" style={{ marginLeft: theme.headerAlign === 'left' ? 0 : 'auto', marginRight: theme.headerAlign === 'left' ? 'auto' : undefined, ...(theme.headerAlign === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) }} />
          <div
            className="h-0.5 rounded-full w-full mt-1"
            style={{ backgroundColor: theme.accentColor, opacity: 0.6 }}
          />
          <div className="h-0.5 rounded-full bg-gray-200 w-5/6" />
          <div className="h-0.5 rounded-full bg-gray-200 w-4/6" />
        </div>
      </div>
      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{theme.name}</span>
      <span className="text-xs text-gray-500 leading-tight">{theme.description}</span>
    </button>
  );
}

function ThemedResumePreview({ text, contactInfo, theme }: {
  text: string;
  contactInfo: { name?: string; email?: string; phone?: string; linkedin?: string };
  theme: ResumeThemeConfig;
}) {
  const bulletChar = theme.bulletStyle === 'disc' ? '\u25CF' : theme.bulletStyle === 'arrow' ? '\u25B8' : '\u2014';

  const headerAlignClass = theme.headerAlign === 'center' ? 'text-center' : 'text-left';

  const sectionBorderStyle = (() => {
    if (theme.sectionBorder === 'full') return `2px solid ${theme.accentColor}`;
    if (theme.sectionBorder === 'bottom') return `1px solid ${theme.accentColor}40`;
    return 'none';
  })();

  return (
    <div
      id="resume-preview"
      className="p-8 md:p-12 min-h-[600px] text-sm leading-relaxed bg-white"
      style={{ maxWidth: '8.5in', margin: '0 auto', fontFamily: theme.fontFamily }}
    >
      {/* Contact Header */}
      {contactInfo.name && (
        <div className={`mb-5 pb-4 ${headerAlignClass}`} style={{ borderBottom: `2px solid ${theme.accentColor}` }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: theme.accentColor }}>
            {contactInfo.name}
          </h1>
          <p className="text-sm text-gray-600">
            {[contactInfo.email, contactInfo.phone, contactInfo.linkedin].filter(Boolean).join('  |  ')}
          </p>
        </div>
      )}

      {/* Resume Body */}
      <div className="text-gray-800">
        {text.split('\n').map((line, i) => {
          const trimmed = line.trim();

          // Section headers (ALL CAPS lines)
          if (/^[A-Z][A-Z\s]{2,}$/.test(trimmed)) {
            return (
              <h2
                key={i}
                className="text-sm font-bold mt-5 mb-2 pb-1 uppercase tracking-wide"
                style={{ color: theme.accentColor, borderBottom: sectionBorderStyle }}
              >
                {trimmed}
              </h2>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
              <p key={i} className="ml-4 mb-1 flex items-start">
                <span className="mr-2 mt-0.5 text-xs" style={{ color: theme.accentColor }}>{bulletChar}</span>
                <span>{trimmed.substring(2)}</span>
              </p>
            );
          }

          // Empty lines
          if (!trimmed) {
            return <div key={i} className="h-3" />;
          }

          // Regular text
          return <p key={i} className="mb-1">{line}</p>;
        })}
      </div>
    </div>
  );
}

export function PreviewPage() {
  const { state, dispatch } = useApp();
  const [updatedText, setUpdatedText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ResumeTheme>('professional');

  useEffect(() => {
    if (state.resume && state.suggestions.length > 0) {
      const result = applyAcceptedSuggestions(state.resume, state.suggestions);
      setUpdatedText(result);
    }
  }, [state.resume, state.suggestions]);

  const acceptedCount = state.suggestions.filter(s => s.status === 'accepted').length;
  const themeConfig = getThemeConfig(selectedTheme);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadAsPDF('resume-preview', `${state.resume?.contactInfo.name || 'resume'}_optimized.pdf`);
    } catch (err: any) {
      setDownloadError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadAsDOCX(
        updatedText,
        state.resume?.contactInfo || {},
        `${state.resume?.contactInfo.name || 'resume'}_optimized.docx`,
        selectedTheme
      );
    } catch (err: any) {
      setDownloadError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadTXT = () => {
    setDownloadError(null);
    try {
      downloadAsTXT(
        updatedText,
        state.resume?.contactInfo || {},
        `${state.resume?.contactInfo.name || 'resume'}_optimized.txt`
      );
    } catch (err: any) {
      setDownloadError(err.message);
    }
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Updated Resume</h1>
        <p className="text-gray-600">
          {acceptedCount} suggestion{acceptedCount !== 1 ? 's' : ''} applied. Choose a layout theme and download.
        </p>
      </div>

      {/* Theme Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Resume Layout</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {RESUME_THEMES.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onSelect={() => setSelectedTheme(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Download Buttons */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
          <button
            onClick={handleDownloadDOCX}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download DOCX
          </button>
          <button
            onClick={handleDownloadTXT}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download TXT
          </button>
        </div>
        {isDownloading && (
          <p className="text-center text-sm text-gray-500 mt-3">Preparing download...</p>
        )}
      </div>

      {downloadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-700 text-sm">{downloadError}</p>
        </div>
      )}

      {/* Resume Preview */}
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">PREVIEW - {themeConfig.name} Layout</span>
          <span className="text-xs text-blue-600 font-medium">{acceptedCount} changes applied</span>
        </div>
        <ThemedResumePreview
          text={updatedText}
          contactInfo={state.resume?.contactInfo || {}}
          theme={themeConfig}
        />
      </div>

      {/* Changes Summary */}
      <div className="mt-6 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2 text-sm">Changes Applied:</h3>
        <ul className="space-y-1">
          {state.suggestions
            .filter(s => s.status === 'accepted')
            .map(s => (
              <li key={s.id} className="text-sm text-blue-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {s.title}
              </li>
            ))}
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pb-8">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'review' })}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Suggestions
        </button>
        <button
          onClick={handleStartOver}
          className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
