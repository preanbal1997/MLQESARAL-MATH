import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element to an A4 PDF document.
 * A4 standard dimensions: 210mm x 297mm
 */
export async function exportElementToA4PDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Capture with high DPI (scale 2) for crisp print text, borders, and clean rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollY: 0,
    scrollX: 0
  });

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Create A4 PDF in portrait orientation
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 8; // 8mm margin
  const availWidth = pdfWidth - margin * 2; // 194mm
  const availHeight = pdfHeight - margin * 2; // 281mm

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Fit neatly within A4 printable area
  const scale = Math.min(availWidth / canvasWidth, availHeight / canvasHeight);
  const finalWidth = canvasWidth * scale;
  const finalHeight = canvasHeight * scale;

  // Center horizontally, top-align within margin
  const x = margin + (availWidth - finalWidth) / 2;
  const y = margin;

  pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, undefined, 'FAST');

  // Trigger universal download using Blob URL anchor (works in iframes and all browsers)
  try {
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    // Fallback to default jsPDF save method
    pdf.save(filename);
  }
}
