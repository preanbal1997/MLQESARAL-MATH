import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element to an 11x13 inch PDF document.
 * 11x13 inches (792pt x 936pt / 279.4mm x 330.2mm)
 */
export async function exportElementTo11x13PDF(
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

  // 11 in x 13 in
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [11, 13]
  });

  const pdfWidth = 11;
  const pdfHeight = 13;
  const margin = 0.35; // 0.35 inch margins
  const availWidth = pdfWidth - margin * 2;
  const availHeight = pdfHeight - margin * 2;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Calculate proportional scaling to fit neatly within 11x13 available dimensions
  const scale = Math.min(availWidth / (canvasWidth / 96), availHeight / (canvasHeight / 96));
  const finalWidth = (canvasWidth / 96) * scale;
  const finalHeight = (canvasHeight / 96) * scale;

  // Center horizontally within margins
  const x = margin + (availWidth - finalWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');
  pdf.save(filename);
}
