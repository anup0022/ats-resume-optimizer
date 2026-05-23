import { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import { AIProvider } from '../types';
import { getProviderInfo } from '../services/ai';

const providers: AIProvider[] = ['manual', 'github', 'gemini', 'openai', 'claude'];

export function SettingsPage({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [provider, setProvider] = useState<AIProvider>(state.aiSettings.provider);
  const [apiKey, setApiKey] = useState(state.aiSettings.apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    dispatch({
      type: 'SET_AI_SETTINGS',
      payload: { provider, apiKey },
    });
    onClose();
  };

  const info = getProviderInfo(provider);
  const needsKey = provider !== 'manual';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">AI Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="space-y-2">
              {providers.map(p => {
                const pInfo = getProviderInfo(p);
                return (
                  <label
                    key={p}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      provider === p
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p}
                      checked={provider === p}
                      onChange={() => setProvider(p)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{pInfo.name}</span>
                        {pInfo.isFree && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                            FREE
                          </span>
                        )}
                        {p === 'manual' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            NO KEY NEEDED
                          </span>
                        )}
                        {p === 'gemini' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{pInfo.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* API Key Input (only for non-manual) */}
          {needsKey && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {provider === 'github' ? 'GitHub Personal Access Token' : 'API Key'}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'github' ? 'ghp_xxxxxxxxxxxx' : 'Enter your API key'}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{info.keyInstructions}</p>
              {info.keyUrl && (
                <a
                  href={info.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 underline mt-1 inline-block"
                >
                  Get your key here
                </a>
              )}
            </div>
          )}

          {/* Manual mode info */}
          {provider === 'manual' && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 font-medium mb-1">How Manual Mode works:</p>
              <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                <li>Upload your resume and paste the job description</li>
                <li>We generate a special prompt for you</li>
                <li>You copy it to free ChatGPT / Gemini / Claude</li>
                <li>Copy the AI's response and paste it back here</li>
                <li>We parse it and show you suggestions to approve/reject</li>
              </ol>
              <p className="text-xs text-green-600 mt-2 italic">
                100% free, no API key, no account needed beyond a free AI chat.
              </p>
            </div>
          )}

          {/* GitHub-specific help */}
          {provider === 'github' && (
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-700 font-medium mb-1">How to get your GitHub token:</p>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Go to GitHub Settings &gt; Developer settings &gt; Personal access tokens</li>
                <li>Click "Generate new token (classic)"</li>
                <li>No special scopes needed - just generate it</li>
                <li>Copy the token (starts with <code className="bg-gray-200 px-1 rounded">ghp_</code>)</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2 italic">
                Works automatically if your org has GitHub Copilot enabled.
              </p>
            </div>
          )}

          {/* Security Note */}
          {needsKey && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Security:</strong> Your API key is stored only in your browser's localStorage.
                It is sent directly to the AI provider and never to any third-party server.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
