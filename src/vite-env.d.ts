/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; [key: string]: any };
    jsPDF?: { unit?: 'pt' | 'mm' | 'cm' | 'in'; format?: string; orientation?: 'portrait' | 'landscape' };
    enableLinks?: boolean;
    pagebreak?: { mode?: string | string[] };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    toPdf(): Html2PdfInstance;
    get(type: string): Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}

declare module 'mammoth' {
  interface ConvertResult {
    value: string;
    messages: any[];
  }

  interface Options {
    arrayBuffer?: ArrayBuffer;
    path?: string;
  }

  export function extractRawText(options: Options): Promise<ConvertResult>;
  export function convertToHtml(options: Options): Promise<ConvertResult>;
}

declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer | ArrayBuffer, options?: any): Promise<PDFData>;
  export default pdfParse;
}
