import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

const snapshotElement = async (el) => {
  const hidden = [];
  el.querySelectorAll?.('.no-export').forEach((n) => {
    hidden.push([n, n.style.display]);
    n.style.display = 'none';
  });

  try {
    const dataUrl = await htmlToImage.toPng(el, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      skipAutoScale: false,
      imagePlaceholder: '#',
      style: {
        transform: 'none',
        opacity: '1',
        filter: 'none'
      }
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((res) => (img.onload = res));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas;
  } finally {
    hidden.forEach(([n, v]) => (n.style.display = v));
  }
};

export const exportPageToPDF = async (_elementId, filename = 'player-page.pdf') => {
  try {
    const container = document.getElementById('player-export-root') || document.getElementById('player-page-container');
    if (!container) throw new Error('Export container not found');

    const headerCard = document.getElementById('export-card-header') || container.children[0];
    const percentilesCard = document.getElementById('export-card-percentiles') || container.children[1];
    if (!headerCard || !percentilesCard) throw new Error('Could not find export cards');
    headerCard.getBoundingClientRect();
    percentilesCard.getBoundingClientRect();

    const [headerCanvas, percentilesCanvas] = await Promise.all([
      snapshotElement(headerCard),
      snapshotElement(percentilesCard),
    ]);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 210;
    const pageH = 297;
    const margin = 10;
    const contentW = pageW - margin * 2;
    const gap = 6;
    const columnW = (contentW - gap) / 2;

    const hRatio = columnW / headerCanvas.width;
    const pRatio = columnW / percentilesCanvas.width;
    const headerH = headerCanvas.height * hRatio;
    const percentilesH = percentilesCanvas.height * pRatio;
    const contentH = Math.max(headerH, percentilesH);

    const maxH = pageH - margin * 2;
    const scaleDown = contentH > maxH ? maxH / contentH : 1;

    const drawW = columnW * scaleDown;
    const drawHeaderH = headerH * scaleDown;
    const drawPercentilesH = percentilesH * scaleDown;
    const y = margin + (maxH - Math.max(drawHeaderH, drawPercentilesH)) / 2;

    pdf.addImage(headerCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, y, drawW, drawHeaderH);
    pdf.addImage(percentilesCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin + drawW + gap * scaleDown, y, drawW, drawPercentilesH);

    pdf.save(filename);
    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

export const exportPlayerPageToPDF = async (playerName) => {
  const filename = `${playerName.replace(/[^a-zA-Z0-9]/g, '_')}_player_page.pdf`;
  return await exportPageToPDF('player-page-container', filename);
};
