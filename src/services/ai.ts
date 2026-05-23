import { AIProvider, AISettings, AnalysisResult, Suggestion } from '../types';

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume optimizer. Your job is to UPDATE the user's existing resume to better match a job description. You must NOT create a new resume - only suggest modifications to the existing content.

CRITICAL: You are modifying the user's actual resume. Preserve their existing structure, formatting, and truthful content. Only suggest changes that enhance ATS compatibility while keeping the resume authentic.

For each suggestion, provide:
1. A clear title (e.g., "Add Figma to Skills")
2. What type of change it is (add_skill, modify_text, add_section, reword, add_keyword, format_fix)
3. Which section it belongs to
4. A brief description of the change
5. Why this change will help (reference the job description)
6. The EXACT original text from the resume (for modifications/rewords) - must match exactly
7. The suggested replacement text
8. Priority (high/medium/low) based on how many times the keyword appears in JD

IMPORTANT RULES:
- Only suggest skills/keywords that are ACTUALLY mentioned in the job description
- Do NOT invent or hallucinate skills that aren't in the JD
- For "reword" and "modify_text" types, the "originalText" MUST be an EXACT substring from the resume
- Be specific about WHERE in the resume the change should be made
- Prioritize missing hard skills and tools over soft skills
- Keep the user's experience and achievements intact - only enhance wording
- Do NOT fabricate experience or lie - only reword existing content to better match JD keywords
- Keep suggestions actionable and concise
- Return ONLY valid JSON, no markdown, no explanations

Here is an example of the expected JSON output format:

{
  "score": 45,
  "summary": "Your resume matches some requirements but is missing several key technical skills mentioned in the job description. Here are suggestions to update your existing resume.",
  "missingKeywords": ["TypeScript", "GraphQL", "Docker"],
  "matchedKeywords": ["React", "JavaScript", "Git"],
  "suggestions": [
    {
      "id": "s1",
      "type": "add_skill",
      "section": "Skills",
      "title": "Add TypeScript to Skills",
      "description": "Add TypeScript to your existing technical skills section",
      "reason": "TypeScript is mentioned 3 times in the job description as a core requirement",
      "originalText": "",
      "suggestedText": "TypeScript",
      "priority": "high"
    },
    {
      "id": "s2",
      "type": "reword",
      "section": "Experience",
      "title": "Highlight component architecture experience",
      "description": "Reword your existing bullet point to emphasize scalable component design",
      "reason": "The JD emphasizes micro-frontend architecture and component design",
      "originalText": "Built reusable component libraries",
      "suggestedText": "Architected and built scalable, reusable component libraries following micro-frontend principles, improving development velocity by 40%",
      "priority": "medium"
    }
  ]
}

Now analyze the resume and job description I provide. UPDATE the existing resume content - do NOT create new content from scratch. Return ONLY the JSON object with real data based on the actual resume and job description. Do not return the example above - generate new analysis.`;

function buildUserPrompt(resumeText: string, jobDescription: string): string {
  return `## MY EXISTING RESUME (to be updated):
${resumeText}

## JOB DESCRIPTION (target):
${jobDescription}

Analyze my existing resume against the job description. Suggest specific modifications to UPDATE my resume for better ATS compatibility. Do NOT create a new resume - only modify existing content and add missing keywords/skills. For any "reword" or "modify_text" suggestions, the "originalText" field MUST contain the EXACT text from my resume. Return ONLY valid JSON.`;
}

/**
 * Generate the full prompt for manual mode (copy-paste to free ChatGPT/Gemini/Claude)
 */
export function generateManualPrompt(resumeText: string, jobDescription: string): string {
  return `${SYSTEM_PROMPT}\n\n${buildUserPrompt(resumeText, jobDescription)}`;
}

/**
 * Parse a manually pasted AI response into AnalysisResult
 */
export function parseManualResponse(rawText: string): AnalysisResult {
  return parseAIResponse(rawText);
}

async function callGitHubModels(apiKey: string, resumeText: string, jobDescription: string): Promise<string> {
  const response = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(resumeText, jobDescription) }
      ],
      temperature: 0.3,
      max_tokens: 4096,
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Invalid GitHub token. Make sure your PAT has the "models" scope or you have Copilot access.');
    }
    throw new Error(error.error?.message || `GitHub Models API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, resumeText: string, jobDescription: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${SYSTEM_PROMPT}\n\n${buildUserPrompt(resumeText, jobDescription)}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Gemini model not found. Your API key may not have access to this model, or the model name has changed.');
    }
    if (response.status === 403) {
      throw new Error('Gemini API access denied. Please check your API key is valid and has the Generative Language API enabled.');
    }
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(apiKey: string, resumeText: string, jobDescription: string): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(resumeText, jobDescription) }
      ],
      temperature: 0.3,
      max_tokens: 4096,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(apiKey: string, resumeText: string, jobDescription: string): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(resumeText, jobDescription) }
      ],
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseAIResponse(rawText: string): AnalysisResult {
  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = rawText.trim();
  
  // Remove markdown code block if present (```json ... ``` or ``` ... ```)
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find JSON object in the text if it doesn't start with {
  if (!jsonStr.startsWith('{')) {
    // Find the first { and last } to extract JSON
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
  }

  // Clean up common issues
  // Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e: any) {
    // Try one more cleanup: remove any BOM or invisible characters
    jsonStr = jsonStr.replace(/^\uFEFF/, '').replace(/[\x00-\x1F\x7F]/g, (match) => {
      // Keep newlines, tabs, and carriage returns in strings
      if (match === '\n' || match === '\r' || match === '\t') return match;
      return '';
    });
    parsed = JSON.parse(jsonStr);
  }

  // Validate required fields
  if (typeof parsed.score !== 'number') {
    parsed.score = parseInt(parsed.score) || 50;
  }

  // Add status to each suggestion
  const suggestions: Suggestion[] = (parsed.suggestions || []).map((s: any, i: number) => ({
    id: s.id || `suggestion-${i}`,
    type: s.type || 'add_keyword',
    section: s.section || 'Skills',
    title: s.title || `Suggestion ${i + 1}`,
    description: s.description || '',
    reason: s.reason || '',
    originalText: s.originalText || '',
    suggestedText: s.suggestedText || s.suggested_text || '',
    priority: s.priority || 'medium',
    status: 'pending' as const,
  }));

  return {
    score: parsed.score,
    summary: parsed.summary || 'Analysis complete.',
    missingKeywords: parsed.missingKeywords || parsed.missing_keywords || [],
    matchedKeywords: parsed.matchedKeywords || parsed.matched_keywords || [],
    suggestions,
  };
}

export async function analyzeResume(
  settings: AISettings,
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResult> {
  if (settings.provider === 'manual') {
    throw new Error('Manual mode does not use this function. Use generateManualPrompt() instead.');
  }

  if (!settings.apiKey) {
    throw new Error('Please provide an API key in Settings');
  }

  if (!resumeText.trim()) {
    throw new Error('Resume text is empty. Please upload a valid resume.');
  }

  if (!jobDescription.trim()) {
    throw new Error('Job description is empty. Please provide a job description.');
  }

  let rawResponse: string;

  switch (settings.provider) {
    case 'github':
      rawResponse = await callGitHubModels(settings.apiKey, resumeText, jobDescription);
      break;
    case 'gemini':
      rawResponse = await callGemini(settings.apiKey, resumeText, jobDescription);
      break;
    case 'openai':
      rawResponse = await callOpenAI(settings.apiKey, resumeText, jobDescription);
      break;
    case 'claude':
      rawResponse = await callClaude(settings.apiKey, resumeText, jobDescription);
      break;
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }

  try {
    return parseAIResponse(rawResponse);
  } catch (e) {
    console.error('Failed to parse AI response:', rawResponse);
    throw new Error('Failed to parse AI response. The AI returned an invalid format. Please try again.');
  }
}

export function getProviderInfo(provider: AIProvider) {
  switch (provider) {
    case 'manual':
      return {
        name: 'Manual - Free (Copy & Paste)',
        description: 'No API key needed! Copy prompt to any free AI (ChatGPT, Gemini, Claude) and paste the response back.',
        keyUrl: '',
        keyInstructions: 'No API key required. You will copy a prompt and paste the AI response manually.',
        isFree: true,
      };
    case 'github':
      return {
        name: 'GitHub Models (Copilot)',
        description: 'Free with GitHub Copilot subscription - uses GPT-4o-mini',
        keyUrl: 'https://github.com/settings/tokens',
        keyInstructions: 'Create a Personal Access Token (classic) with no special scopes needed. If you have Copilot, it works automatically.',
        isFree: true,
      };
    case 'gemini':
      return {
        name: 'Google Gemini',
        description: 'Free tier: 15 req/min, 1M tokens/day',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyInstructions: 'Get your free API key from Google AI Studio',
        isFree: true,
      };
    case 'openai':
      return {
        name: 'OpenAI (GPT-3.5)',
        description: 'Paid: ~$0.002 per analysis',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyInstructions: 'Get your API key from OpenAI Platform',
        isFree: false,
      };
    case 'claude':
      return {
        name: 'Anthropic Claude',
        description: 'Paid: ~$0.001 per analysis',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyInstructions: 'Get your API key from Anthropic Console',
        isFree: false,
      };
  }
}
