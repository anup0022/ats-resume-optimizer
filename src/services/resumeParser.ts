import { ResumeData, ResumeSection } from '../types';

export async function parseResumeFile(file: File): Promise<ResumeData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let rawText: string;

  if (extension === 'pdf') {
    rawText = await parsePDF(file);
  } else if (extension === 'docx' || extension === 'doc') {
    rawText = await parseDOCX(file);
  } else if (extension === 'txt') {
    rawText = await file.text();
  } else {
    throw new Error(`Unsupported file format: .${extension}. Please upload a PDF, DOCX, or TXT file.`);
  }

  if (!rawText.trim()) {
    throw new Error('Could not extract text from the file. The file may be image-based or corrupted.');
  }

  const sections = extractSections(rawText);
  const contactInfo = extractContactInfo(rawText);

  return {
    rawText,
    sections,
    contactInfo,
    fileName: file.name,
  };
}

async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Dynamic import for pdf-parse (works in browser with bundler)
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    text += pageText + '\n';
  }
  
  return text;
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function extractSections(text: string): ResumeSection[] {
  const sections: ResumeSection[] = [];
  const sectionHeaders = [
    { pattern: /(?:^|\n)(professional\s+)?summary|(?:^|\n)objective|(?:^|\n)profile/i, type: 'summary' as const },
    { pattern: /(?:^|\n)(?:work\s+)?experience|(?:^|\n)employment\s+history/i, type: 'experience' as const },
    { pattern: /(?:^|\n)education|(?:^|\n)academic/i, type: 'education' as const },
    { pattern: /(?:^|\n)(?:technical\s+)?skills|(?:^|\n)competencies|(?:^|\n)technologies/i, type: 'skills' as const },
    { pattern: /(?:^|\n)projects|(?:^|\n)personal\s+projects/i, type: 'projects' as const },
    { pattern: /(?:^|\n)certifications?|(?:^|\n)licenses?/i, type: 'certifications' as const },
  ];

  const lines = text.split('\n');
  let currentSection: ResumeSection | null = null;

  for (const line of lines) {
    let matched = false;
    for (const { pattern, type } of sectionHeaders) {
      if (pattern.test(line) && line.trim().length < 50) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.trim(),
          content: '',
          type,
        };
        matched = true;
        break;
      }
    }
    if (!matched && currentSection) {
      currentSection.content += line + '\n';
    } else if (!matched && !currentSection && line.trim()) {
      // Content before first section header (usually contact info + summary)
      if (!sections.length) {
        currentSection = {
          title: 'Summary',
          content: line + '\n',
          type: 'summary',
        };
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections were detected, create one generic section
  if (sections.length === 0) {
    sections.push({
      title: 'Full Resume',
      content: text,
      type: 'other',
    });
  }

  return sections;
}

function extractContactInfo(text: string) {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{10,}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const lines = text.split('\n').filter(l => l.trim());

  return {
    name: lines[0]?.trim() || undefined,
    email: emailMatch?.[0] || undefined,
    phone: phoneMatch?.[0]?.trim() || undefined,
    linkedin: linkedinMatch?.[0] || undefined,
  };
}
