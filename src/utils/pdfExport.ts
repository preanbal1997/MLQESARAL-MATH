import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element to an A4 PDF document.
 * A4 standard size: 210mm x 297mm
 */
export async function exportElementToA4PDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Capture with high DPI (scale 2) for crisp print text and borders
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 portrait
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 8; // 8mm margin
  const availWidth = pdfWidth - margin * 2;
  const availHeight = pdfHeight - margin * 2;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Scale to fit within A4 printable area
  const scale = Math.min(availWidth / canvasWidth, availHeight / canvasHeight);
  const finalWidth = canvasWidth * scale;
  const finalHeight = canvasHeight * scale;

  // Center horizontally
  const x = margin + (availWidth - finalWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
  pdf.save(filename);
}
