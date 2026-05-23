import { useApp } from '../hooks/useAppState';

const steps = [
  { key: 'upload', label: 'Upload Resume' },
  { key: 'job-description', label: 'Job Description' },
  { key: 'analysis', label: 'Analyze' },
  { key: 'review', label: 'Review Suggestions' },
  { key: 'preview', label: 'Download' },
] as const;

export function StepIndicator() {
  const { state } = useApp();
  const currentIndex = steps.findIndex(s => s.key === state.step);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentIndex ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${
                index <= currentIndex ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 sm:w-20 h-0.5 mx-1 ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
