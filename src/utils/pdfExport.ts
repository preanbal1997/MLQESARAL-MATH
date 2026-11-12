import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element to an A4 Landscape PDF document (297mm x 210mm).
 * Fits cleanly onto 1 A4 landscape page if possible, and automatically
 * creates additional page(s) at clean element boundaries if content overflows.
 */
export async function exportElementToA4PDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const scaleFactor = 2;
  const elementRect = element.getBoundingClientRect();

  // Measure atomic blocks that should not be sliced across page boundaries
  const keepElements = Array.from(
    element.querySelectorAll<HTMLElement>('tr, [data-pdf-keep="true"]')
  );
  const keepBoundsPx = keepElements
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        top: (r.top - elementRect.top) * scaleFactor,
        bottom: (r.bottom - elementRect.top) * scaleFactor
      };
    })
    .filter(b => b.bottom > b.top)
    .sort((a, b) => a.top - b.top);

  // Capture with high DPI (scale 2) for crisp print text, borders, and clean rendering
  const canvas = await html2canvas(element, {
    scale: scaleFactor,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollY: 0,
    scrollX: 0
  });

  // Create A4 PDF in LANDSCAPE orientation (297mm x 210mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 297;
  const pdfHeight = 210;
  const margin = 8; // 8mm uniform margin
  const availWidth = pdfWidth - margin * 2; // 281mm
  const availHeight = pdfHeight - margin * 2; // 194mm

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Width-matched scale so text remains full-size and readable on A4 Landscape
  const mmPerCanvasPx = availWidth / canvasWidth;
  const totalHeightMM = canvasHeight * mmPerCanvasPx;

  // Case 1: Fits comfortably within 1 A4 Landscape page
  if (totalHeightMM <= availHeight) {
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', margin, margin, availWidth, totalHeightMM, undefined, 'FAST');
  } else {
    // Case 2: Content exceeds 1 page — slice cleanly across 2+ A4 Landscape pages
    const maxSliceHeightPx = Math.floor(availHeight / mmPerCanvasPx);
    let currentTopPx = 0;
    let pageIndex = 0;

    while (currentTopPx < canvasHeight - 4) {
      const rawBottomPx = Math.min(currentTopPx + maxSliceHeightPx, canvasHeight);
      let sliceBottomPx = rawBottomPx;

      // If not at the very end, avoid slicing through any row or [data-pdf-keep] block
      if (rawBottomPx < canvasHeight) {
        for (const bound of keepBoundsPx) {
          // If block starts below currentTopPx and crosses rawBottomPx, break just before it
          if (bound.top > currentTopPx + 20 && bound.top < rawBottomPx && bound.bottom > rawBottomPx) {
            sliceBottomPx = Math.floor(bound.top) - 2;
            break;
          }
        }
        // Fallback safety so loop always advances
        if (sliceBottomPx <= currentTopPx + 40) {
          sliceBottomPx = rawBottomPx;
        }
      }

      const sliceHeightPx = sliceBottomPx - currentTopPx;
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeightPx;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, sliceHeightPx);
        ctx.drawImage(
          canvas,
          0,
          currentTopPx,
          canvasWidth,
          sliceHeightPx,
          0,
          0,
          canvasWidth,
          sliceHeightPx
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
      const pageHeightMM = sliceHeightPx * mmPerCanvasPx;

      if (pageIndex > 0) {
        pdf.addPage('a4', 'landscape');
      }
      pdf.addImage(pageImgData, 'PNG', margin, margin, availWidth, pageHeightMM, undefined, 'FAST');

      currentTopPx = sliceBottomPx;
      pageIndex++;
    }
  }

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
