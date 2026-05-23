import { useState } from 'react';
import { AppProvider, useApp } from './hooks/useAppState';
import { StepIndicator } from './components/StepIndicator';
import { UploadPage } from './pages/UploadPage';
import { JobDescriptionPage } from './pages/JobDescriptionPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReviewPage } from './pages/ReviewPage';
import { PreviewPage } from './pages/PreviewPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { state } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  const renderPage = () => {
    switch (state.step) {
      case 'upload':
        return <UploadPage />;
      case 'job-description':
        return <JobDescriptionPage />;
      case 'analysis':
        return <AnalysisPage />;
      case 'review':
        return <ReviewPage />;
      case 'preview':
        return <PreviewPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-lg font-bold text-gray-900">ATS Resume Optimizer</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
            {state.aiSettings.provider !== 'manual' && !state.aiSettings.apiKey && (
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* No API Key Warning (only for API modes) */}
      {state.aiSettings.provider !== 'manual' && !state.aiSettings.apiKey && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <p className="text-sm text-yellow-800">
            <strong>Setup required:</strong> Click Settings to add your API key, or switch to Manual (Free) mode.{' '}
            <button onClick={() => setShowSettings(true)} className="text-blue-600 underline hover:text-blue-700">
              Configure now
            </button>
          </p>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator />

      {/* Main Content */}
      <main className="py-8">
        {renderPage()}
      </main>

      {/* Settings Modal */}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
