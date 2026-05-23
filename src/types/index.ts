export interface ResumeData {
  rawText: string;
  sections: ResumeSection[];
  contactInfo: ContactInfo;
  fileName: string;
}

export interface ResumeSection {
  title: string;
  content: string;
  type: 'experience' | 'education' | 'skills' | 'summary' | 'projects' | 'certifications' | 'other';
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface Suggestion {
  id: string;
  type: 'add_skill' | 'modify_text' | 'add_section' | 'reword' | 'add_keyword' | 'format_fix';
  section: string;
  title: string;
  description: string;
  reason: string;
  originalText?: string;
  suggestedText: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'accepted' | 'rejected';
}

export interface AnalysisResult {
  score: number;
  suggestions: Suggestion[];
  missingKeywords: string[];
  matchedKeywords: string[];
  summary: string;
}

export type AIProvider = 'manual' | 'github' | 'gemini' | 'openai' | 'claude';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
}

export type ResumeTheme = 'professional' | 'modern' | 'minimal' | 'classic' | 'executive';

export interface ResumeThemeConfig {
  id: ResumeTheme;
  name: string;
  description: string;
  fontFamily: string;
  headerAlign: 'center' | 'left';
  accentColor: string;
  sectionBorder: 'full' | 'bottom' | 'none';
  bulletStyle: 'disc' | 'dash' | 'arrow';
}

export interface AppState {
  resume: ResumeData | null;
  jobDescription: string;
  aiSettings: AISettings;
  analysis: AnalysisResult | null;
  suggestions: Suggestion[];
  isAnalyzing: boolean;
  step: 'upload' | 'job-description' | 'analysis' | 'review' | 'preview';
}
