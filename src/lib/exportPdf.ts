import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportTripPdf(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let yOffset = 0;

  while (yOffset < imgHeight) {
    if (yOffset > 0) pdf.addPage();

    const sliceHeight = Math.min(pageHeight - margin * 2, imgHeight - yOffset);
    const srcY = (yOffset / imgHeight) * canvas.height;
    const srcH = (sliceHeight / imgHeight) * canvas.height;

    // Create a slice canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcH;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeight);
    yOffset += sliceHeight;
  }

  pdf.save(`${filename}.pdf`);
}
