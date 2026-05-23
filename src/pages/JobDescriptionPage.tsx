import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import { analyzeResume, generateManualPrompt, parseManualResponse } from '../services/ai';

export function JobDescriptionPage() {
  const { state, dispatch } = useApp();
  const [jd, setJd] = useState(state.jobDescription);
  const [error, setError] = useState<string | null>(null);
  const [manualStep, setManualStep] = useState<'input' | 'copy-prompt' | 'paste-response'>('input');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const isManualMode = state.aiSettings.provider === 'manual';

  const handleAnalyzeAPI = async () => {
    if (!jd.trim()) {
      setError('Please paste a job description');
      return;
    }
    if (!state.aiSettings.apiKey) {
      setError('Please set your API key in Settings first');
      return;
    }

    setError(null);
    dispatch({ type: 'SET_JOB_DESCRIPTION', payload: jd });
    dispatch({ type: 'SET_ANALYZING', payload: true });

    try {
      const result = await analyzeResume(
        state.aiSettings,
        state.resume!.rawText,
        jd
      );
      dispatch({ type: 'SET_ANALYSIS', payload: result });
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      dispatch({ type: 'SET_ANALYZING', payload: false });
    }
  };

  const handleGeneratePrompt = () => {
    if (!jd.trim()) {
      setError('Please paste a job description');
      return;
    }
    setError(null);
    dispatch({ type: 'SET_JOB_DESCRIPTION', payload: jd });
    const prompt = generateManualPrompt(state.resume!.rawText, jd);
    setGeneratedPrompt(prompt);
    setManualStep('copy-prompt');
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text in textarea
      const el = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleProceedToPaste = () => {
    setManualStep('paste-response');
  };

  const handleParseResponse = () => {
    if (!aiResponse.trim()) {
      setError('Please paste the AI response');
      return;
    }
    setError(null);
    try {
      const result = parseManualResponse(aiResponse);
      dispatch({ type: 'SET_ANALYSIS', payload: result });
    } catch (err: any) {
      setError('Could not parse the response. Make sure you copied the complete JSON response from the AI. ' + (err.message || ''));
    }
  };

  // Manual Mode - Step: Copy Prompt
  if (isManualMode && manualStep === 'copy-prompt') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 1: Copy This Prompt</h1>
          <p className="text-gray-600">
            Copy the prompt below and paste it into <strong>ChatGPT</strong>, <strong>Gemini</strong>, or any free AI chat.
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">How to use:</p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click "Copy Prompt" below</li>
            <li>Open <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">ChatGPT</a>, <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Gemini</a>, or <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="underline font-medium">Claude</a></li>
            <li>Paste the prompt and send it</li>
            <li>Wait for the AI to respond with JSON</li>
            <li>Copy the entire response</li>
            <li>Come back here and click "Next: Paste Response"</li>
          </ol>
        </div>

        {/* Prompt Display */}
        <div className="relative">
          <textarea
            id="prompt-textarea"
            readOnly
            value={generatedPrompt}
            className="w-full h-48 p-4 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50 resize-y"
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={handleCopyPrompt}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setManualStep('input')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleProceedToPaste}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Next: Paste Response
          </button>
        </div>
      </div>
    );
  }

  // Manual Mode - Step: Paste Response
  if (isManualMode && manualStep === 'paste-response') {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 2: Paste AI Response</h1>
          <p className="text-gray-600">
            Paste the complete response from ChatGPT/Gemini/Claude below.
          </p>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Tip:</strong> The response should be a JSON object starting with <code className="bg-yellow-100 px-1 rounded">{'{'}</code> and ending with <code className="bg-yellow-100 px-1 rounded">{'}'}</code>. 
            If the AI wrapped it in a code block (```json ... ```), that's fine too - we'll handle it.
          </p>
        </div>

        <textarea
          value={aiResponse}
          onChange={(e) => setAiResponse(e.target.value)}
          placeholder='Paste the AI response here...&#10;&#10;It should look like:&#10;{&#10;  "score": 65,&#10;  "summary": "...",&#10;  "missingKeywords": [...],&#10;  ...&#10;}'
          className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setManualStep('copy-prompt')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Prompt
          </button>
          <button
            onClick={handleParseResponse}
            disabled={!aiResponse.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Parse & Review Suggestions
          </button>
        </div>
      </div>
    );
  }

  // Default: Job Description Input
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paste Job Description</h1>
        <p className="text-gray-600">
          Paste the job description you're applying for. The AI will compare it with your resume
          and suggest improvements.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the complete job description here...&#10;&#10;Example:&#10;We are looking for a Senior Frontend Developer with 5+ years experience in React, TypeScript, and Node.js..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {jd.length > 0 ? `${jd.split(/\s+/).filter(Boolean).length} words` : 'No content yet'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => dispatch({ type: 'SET_STEP', payload: 'upload' })}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            {isManualMode ? (
              <button
                onClick={handleGeneratePrompt}
                disabled={!jd.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Generate Prompt for ChatGPT
              </button>
            ) : (
              <button
                onClick={handleAnalyzeAPI}
                disabled={!jd.trim() || state.isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {state.isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Resume'
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Mode indicator */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Mode:</span>{' '}
            {isManualMode ? (
              <>
                <span className="text-green-700 font-medium">Free (Manual)</span>
                {' '}- You'll copy a prompt to any free AI and paste the response back
              </>
            ) : (
              <>
                <span className="text-blue-700 font-medium">
                  {state.aiSettings.provider === 'github' ? 'GitHub Copilot' : 
                   state.aiSettings.provider === 'gemini' ? 'Google Gemini' :
                   state.aiSettings.provider === 'openai' ? 'OpenAI' : 'Claude'}
                </span>
                {' '}- Automatic analysis via API
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
