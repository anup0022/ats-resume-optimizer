import { useApp } from '../hooks/useAppState';
import { Suggestion } from '../types';

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const { dispatch } = useApp();

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50',
  };

  const priorityBadge = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const typeLabels: Record<string, string> = {
    add_skill: 'Add Skill',
    modify_text: 'Modify Text',
    add_section: 'Add Section',
    reword: 'Reword',
    add_keyword: 'Add Keyword',
    format_fix: 'Format Fix',
  };

  const isAccepted = suggestion.status === 'accepted';
  const isRejected = suggestion.status === 'rejected';

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isAccepted ? 'border-green-300 bg-green-50 ring-1 ring-green-200' :
      isRejected ? 'border-gray-200 bg-gray-50 opacity-60' :
      priorityColors[suggestion.priority]
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge[suggestion.priority]}`}>
            {suggestion.priority}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            {typeLabels[suggestion.type] || suggestion.type}
          </span>
          <span className="text-xs text-gray-500">{suggestion.section}</span>
        </div>
        {isAccepted && (
          <span className="text-green-600 text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Accepted
          </span>
        )}
        {isRejected && (
          <span className="text-gray-500 text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Rejected
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>

      {/* Reason */}
      <div className="text-xs text-gray-500 mb-3 italic">
        Why: {suggestion.reason}
      </div>

      {/* Suggested change */}
      <div className="bg-white border border-gray-200 rounded p-3 mb-3">
        {suggestion.originalText && (
          <div className="mb-2">
            <span className="text-xs font-medium text-red-600">Remove:</span>
            <p className="text-sm text-red-700 line-through mt-0.5">{suggestion.originalText}</p>
          </div>
        )}
        <div>
          <span className="text-xs font-medium text-green-600">
            {suggestion.originalText ? 'Replace with:' : 'Add:'}
          </span>
          <p className="text-sm text-green-700 mt-0.5">{suggestion.suggestedText}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'UPDATE_SUGGESTION', payload: { id: suggestion.id, status: 'accepted' } })}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isAccepted
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isAccepted ? 'Accepted' : 'Accept'}
        </button>
        <button
          onClick={() => dispatch({ type: 'UPDATE_SUGGESTION', payload: { id: suggestion.id, status: 'rejected' } })}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            isRejected
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isRejected ? 'Rejected' : 'Reject'}
        </button>
        {(isAccepted || isRejected) && (
          <button
            onClick={() => dispatch({ type: 'UPDATE_SUGGESTION', payload: { id: suggestion.id, status: 'pending' } })}
            className="py-2 px-3 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

export function ReviewPage() {
  const { state, dispatch } = useApp();
  const { analysis, suggestions } = state;

  if (!analysis) return null;

  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const rejectedCount = suggestions.filter(s => s.status === 'rejected').length;
  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Score Overview */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Review Suggestions</h1>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              analysis.score >= 70 ? 'text-green-600' :
              analysis.score >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {analysis.score}%
            </div>
            <p className="text-sm text-gray-500">ATS Score</p>
          </div>
          <div className="text-left text-sm text-gray-600 max-w-md">
            <p>{analysis.summary}</p>
          </div>
        </div>
      </div>

      {/* Keywords Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2 text-sm">Matched Keywords ({analysis.matchedKeywords.length})</h3>
          <div className="flex flex-wrap gap-1">
            {analysis.matchedKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 mb-2 text-sm">Missing Keywords ({analysis.missingKeywords.length})</h3>
          <div className="flex flex-wrap gap-1">
            {analysis.missingKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{suggestions.length}</span> suggestions |{' '}
          <span className="text-green-600 font-medium">{acceptedCount} accepted</span> |{' '}
          <span className="text-red-600 font-medium">{rejectedCount} rejected</span> |{' '}
          <span className="text-yellow-600 font-medium">{pendingCount} pending</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: 'ACCEPT_ALL' })}
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={() => dispatch({ type: 'REJECT_ALL' })}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium">Your permission is required</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Review each suggestion below. Only changes you <strong>Accept</strong> will be applied to your resume.
              Nothing is modified without your explicit approval.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4 mb-8">
        {suggestions.map(suggestion => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      {/* Continue Button */}
      <div className="flex justify-between items-center pb-8">
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'job-description' })}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_STEP', payload: 'preview' })}
          disabled={acceptedCount === 0}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {acceptedCount > 0
            ? `Apply ${acceptedCount} Change${acceptedCount > 1 ? 's' : ''} & Preview`
            : 'Accept at least 1 suggestion to continue'}
        </button>
      </div>
    </div>
  );
}
