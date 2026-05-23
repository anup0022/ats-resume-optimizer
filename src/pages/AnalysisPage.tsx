import { useApp } from '../hooks/useAppState';

export function AnalysisPage() {
  const { state } = useApp();

  return (
    <div className="max-w-2xl mx-auto px-4 text-center">
      <div className="py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Resume</h2>
        <p className="text-gray-600 mb-4">
          Comparing your resume against the job description...
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Identifying missing keywords and skills</p>
          <p>Checking ATS compatibility</p>
          <p>Generating personalized suggestions</p>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          Using {state.aiSettings.provider === 'gemini' ? 'Google Gemini' : state.aiSettings.provider === 'openai' ? 'OpenAI' : 'Claude'} API
        </p>
      </div>
    </div>
  );
}
