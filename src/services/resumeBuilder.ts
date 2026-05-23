import { Suggestion, ResumeData, ResumeTheme, ResumeThemeConfig } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// Theme configurations
export const RESUME_THEMES: ResumeThemeConfig[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean sans-serif layout with centered header and blue accents',
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    headerAlign: 'center',
    accentColor: '#2563eb',
    sectionBorder: 'bottom',
    bulletStyle: 'disc',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Left-aligned with bold section bars and teal accents',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headerAlign: 'left',
    accentColor: '#0d9488',
    sectionBorder: 'full',
    bulletStyle: 'arrow',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and spacious with thin dividers',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    headerAlign: 'center',
    accentColor: '#6b7280',
    sectionBorder: 'bottom',
    bulletStyle: 'dash',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional serif font with formal structure',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    headerAlign: 'center',
    accentColor: '#1f2937',
    sectionBorder: 'bottom',
    bulletStyle: 'disc',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold header block with dark navy accents',
    fontFamily: "'Cambria', 'Georgia', serif",
    headerAlign: 'center',
    accentColor: '#1e3a5f',
    sectionBorder: 'full',
    bulletStyle: 'disc',
  },
];

export function getThemeConfig(themeId: ResumeTheme): ResumeThemeConfig {
  return RESUME_THEMES.find(t => t.id === themeId) || RESUME_THEMES[0];
}

export function applyAcceptedSuggestions(resume: ResumeData, suggestions: Suggestion[]): string {
  const accepted = suggestions.filter(s => s.status === 'accepted');
  let updatedText = resume.rawText;

  // Group suggestions by type
  const textReplacements = accepted.filter(s => s.originalText && (s.type === 'modify_text' || s.type === 'reword'));
  const additions = accepted.filter(s => s.type === 'add_skill' || s.type === 'add_keyword' || s.type === 'add_section');

  // Apply text replacements
  for (const suggestion of textReplacements) {
    if (suggestion.originalText) {
      updatedText = updatedText.replace(suggestion.originalText, suggestion.suggestedText);
    }
  }

  // Group skill additions by section
  const skillAdditions = additions.filter(s => s.type === 'add_skill' || s.type === 'add_keyword');
  if (skillAdditions.length > 0) {
    const skillsSection = findSection(updatedText, 'skills');
    if (skillsSection) {
      const newSkills = skillAdditions.map(s => s.suggestedText).join(', ');
      updatedText = updatedText.replace(
        skillsSection,
        `${skillsSection.trimEnd()}, ${newSkills}\n`
      );
    } else {
      // Add a skills section
      const newSkills = skillAdditions.map(s => s.suggestedText).join(', ');
      updatedText += `\n\nSKILLS\n${newSkills}\n`;
    }
  }

  // Add new sections
  const sectionAdditions = additions.filter(s => s.type === 'add_section');
  for (const suggestion of sectionAdditions) {
    updatedText += `\n\n${suggestion.suggestedText}\n`;
  }

  return updatedText;
}

function findSection(text: string, sectionType: string): string | null {
  const patterns: Record<string, RegExp> = {
    skills: /(?:technical\s+)?skills[:\s]*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n\n|$)/i,
    experience: /(?:work\s+)?experience[:\s]*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n\n|$)/i,
    education: /education[:\s]*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n\n|$)/i,
    summary: /(?:professional\s+)?summary[:\s]*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n\n|$)/i,
  };

  const match = text.match(patterns[sectionType]);
  return match ? match[0] : null;
}

export async function downloadAsPDF(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Resume preview element not found');

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: fileName || 'resume.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
      },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
    };

    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('html2pdf failed:', err);
    printResume(element);
  }
}

function printResume(element: HTMLElement): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups and try again.');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Resume</title>
      <style>
        body {
          font-size: 11pt;
          line-height: 1.5;
          margin: 0.5in;
          color: #1a1a1a;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>${element.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export async function downloadAsDOCX(resumeText: string, contactInfo: ResumeData['contactInfo'], fileName: string, themeId: ResumeTheme = 'professional'): Promise<void> {
  const theme = getThemeConfig(themeId);
  const lines = resumeText.split('\n');
  const children: Paragraph[] = [];

  const fontName = theme.id === 'classic' || theme.id === 'executive' ? 'Georgia' : 'Calibri';
  const alignment = theme.headerAlign === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;

  // Add name as title
  if (contactInfo.name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactInfo.name, bold: true, size: 32, font: fontName })],
        alignment,
        spacing: { after: 100 },
      })
    );
  }

  // Add contact info line
  const contactParts = [contactInfo.email, contactInfo.phone, contactInfo.linkedin].filter(Boolean);
  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join('  |  '), size: 20, color: '666666', font: fontName })],
        alignment,
        spacing: { after: 200 },
      })
    );
  }

  // Add separator
  children.push(
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: theme.accentColor.replace('#', '') },
      },
      spacing: { after: 200 },
    })
  );

  // Process rest of resume
  const sectionHeaderPattern = /^[A-Z][A-Z\s]{2,}$/;
  let skipContactLines = true;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (skipContactLines) {
      if (!trimmed || trimmed === contactInfo.name || trimmed.includes('@') || trimmed.includes('linkedin')) {
        continue;
      }
      if (sectionHeaderPattern.test(trimmed) || trimmed.length > 60) {
        skipContactLines = false;
      } else {
        continue;
      }
    }

    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    if (sectionHeaderPattern.test(trimmed)) {
      const borderConfig = theme.sectionBorder === 'none' ? {} : {
        border: {
          bottom: { style: BorderStyle.SINGLE, size: theme.sectionBorder === 'full' ? 2 : 1, color: theme.accentColor.replace('#', '') },
        },
      };
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 24, font: fontName, color: theme.accentColor.replace('#', '') })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
          ...borderConfig,
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.substring(2), size: 22, font: fontName })],
          bullet: { level: 0 },
          spacing: { after: 50 },
        })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22, font: fontName })],
          spacing: { after: 50 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, fileName || 'resume.docx');
}

export function downloadAsTXT(resumeText: string, _contactInfo: ResumeData['contactInfo'], fileName: string): void {
  const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, fileName || 'resume.txt');
}
