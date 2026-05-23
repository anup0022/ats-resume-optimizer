import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, AISettings, ResumeData, AnalysisResult, Suggestion } from '../types';

const initialState: AppState = {
  resume: null,
  jobDescription: '',
  aiSettings: {
    provider: 'gemini',
    apiKey: localStorage.getItem('ats_api_key') || '',
  },
  analysis: null,
  suggestions: [],
  isAnalyzing: false,
  step: 'upload',
};

type Action =
  | { type: 'SET_RESUME'; payload: ResumeData }
  | { type: 'SET_JOB_DESCRIPTION'; payload: string }
  | { type: 'SET_AI_SETTINGS'; payload: AISettings }
  | { type: 'SET_ANALYSIS'; payload: AnalysisResult }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'UPDATE_SUGGESTION'; payload: { id: string; status: Suggestion['status'] } }
  | { type: 'ACCEPT_ALL' }
  | { type: 'REJECT_ALL' }
  | { type: 'SET_STEP'; payload: AppState['step'] }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_RESUME':
      return { ...state, resume: action.payload, step: 'job-description' };
    case 'SET_JOB_DESCRIPTION':
      return { ...state, jobDescription: action.payload };
    case 'SET_AI_SETTINGS':
      localStorage.setItem('ats_api_key', action.payload.apiKey);
      localStorage.setItem('ats_provider', action.payload.provider);
      return { ...state, aiSettings: action.payload };
    case 'SET_ANALYSIS':
      return {
        ...state,
        analysis: action.payload,
        suggestions: action.payload.suggestions,
        step: 'review',
      };
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
    case 'UPDATE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.map(s =>
          s.id === action.payload.id ? { ...s, status: action.payload.status } : s
        ),
      };
    case 'ACCEPT_ALL':
      return {
        ...state,
        suggestions: state.suggestions.map(s => ({ ...s, status: 'accepted' as const })),
      };
    case 'REJECT_ALL':
      return {
        ...state,
        suggestions: state.suggestions.map(s => ({ ...s, status: 'rejected' as const })),
      };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'RESET':
      return { ...initialState, aiSettings: state.aiSettings };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    aiSettings: {
      provider: (localStorage.getItem('ats_provider') as AppState['aiSettings']['provider']) || 'gemini',
      apiKey: localStorage.getItem('ats_api_key') || '',
    },
  });

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
