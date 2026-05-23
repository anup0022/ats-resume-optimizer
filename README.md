# ATS Resume Optimizer

Optimize your resume to pass Applicant Tracking Systems (ATS) by analyzing it against job descriptions and applying targeted improvements.

## Live URL

[https://ats-resume-optimizer-ochre.vercel.app](https://ats-resume-optimizer-ochre.vercel.app)

## Features

- **Upload Resume** - Supports PDF, DOCX, and TXT formats with drag-and-drop or upload button
- **Job Description Analysis** - Paste any JD and get AI-powered ATS compatibility suggestions
- **Smart Suggestions** - Updates your existing resume (not a new one) with missing keywords, reworded bullets, and added skills
- **Review & Approve** - Accept or reject each suggestion individually before applying
- **Theme Selector** - Choose from 5 resume layout themes before downloading:
  - Professional (sans-serif, blue accents)
  - Modern (left-aligned, teal accents)
  - Minimal (spacious, gray tones)
  - Classic (serif, formal structure)
  - Executive (dark navy, bold header)
- **Download** - Export as PDF, DOCX, or TXT with the selected theme applied

## AI Providers Supported

| Provider | Cost |
|----------|------|
| Manual (Free) | Copy prompt to ChatGPT/Gemini/Claude and paste response back |
| Google Gemini | Free tier (15 req/min) |
| GitHub Models | Free with Copilot |
| OpenAI | Paid (~$0.002/analysis) |
| Anthropic Claude | Paid (~$0.001/analysis) |

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- docx (DOCX generation)
- html2pdf.js (PDF generation)
- pdfjs-dist (PDF parsing)
- mammoth (DOCX parsing)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deployment

Deployed on Vercel. Push to `main` to trigger automatic deployment.

## License

MIT
