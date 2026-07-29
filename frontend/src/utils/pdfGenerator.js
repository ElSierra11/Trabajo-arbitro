import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

// Color palette
const COLORS = {
  primary: [0, 200, 100],        // COARC green
  dark: [11, 12, 16],            // Background dark
  surface: [22, 25, 37],         // Card surface
  border: [40, 45, 65],          // Border
  text: [220, 225, 240],         // Main text
  muted: [130, 140, 160],        // Muted text
  yellow: [250, 190, 50],        // Yellow card
  red: [220, 60, 60],            // Red card
  green: [50, 200, 100],         // Paid
  orange: [240, 150, 50],        // Pending
};

export const generateMatchPDF = (match, profile) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 18;
  const CONTENT_W = W - MARGIN * 2;

  // ── HEADER BACKGROUND ──
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, W, 45, 'F');

  // Brand accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 5, 45, 'F');

  // Logo text "COARC"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('COARC', MARGIN, 18);

  // Subtitle "RefManager"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text('RefManager — Corporación de Árbitros', MARGIN, 25);

  // Document title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);
  doc.text('PLANILLA OFICIAL DE PARTIDO', MARGIN, 35);

  // Doc date (right-aligned)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, W - MARGIN, 35, { align: 'right' });

  // ── MATCH INFO SECTION ──
  let y = 55;

  const sectionTitle = (title, yPos) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text(title.toUpperCase(), MARGIN, yPos);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, yPos + 1.5, MARGIN + CONTENT_W, yPos + 1.5);
    return yPos + 8;
  };

  // Match Info
  y = sectionTitle('Información del Partido', y);

  const infoRows = [
    ['Fecha', formatDate(match.date)],
    ['Hora', match.time || 'No especificada'],
    ['Torneo / Liga', match.tournament || 'No especificado'],
    ['Categoría', match.category || 'No especificada'],
    ['Rol del Árbitro', match.role || 'Árbitro Central'],
  ];

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: { top: 2, bottom: 2, left: 3, right: 3 }, textColor: COLORS.text },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: COLORS.muted },
      1: { cellWidth: CONTENT_W - 45 },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── RESULT SECTION ──
  y = sectionTitle('Resultado del Partido', y);

  // Score box
  const boxH = 28;
  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 3, 3, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 3, 3, 'S');

  const teamW = CONTENT_W * 0.38;
  const scoreW = CONTENT_W * 0.24;

  // Home team
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(match.homeTeam || 'Local', MARGIN + teamW / 2, y + 11, { align: 'center', maxWidth: teamW - 4 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('LOCAL', MARGIN + teamW / 2, y + 18, { align: 'center' });

  // Score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${match.homeGoals ?? 0}  -  ${match.awayGoals ?? 0}`, MARGIN + teamW + scoreW / 2, y + 14, { align: 'center' });

  // Away team
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text(match.awayTeam || 'Visitante', MARGIN + teamW + scoreW + teamW / 2, y + 11, { align: 'center', maxWidth: teamW - 4 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('VISITANTE', MARGIN + teamW + scoreW + teamW / 2, y + 18, { align: 'center' });

  // Cards summary inside result box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.yellow);
  doc.text(`■ ${match.yellowCards ?? 0} amarilla(s)`, MARGIN + 4, y + 26);
  doc.setTextColor(...COLORS.red);
  doc.text(`■ ${match.redCards ?? 0} roja(s)`, MARGIN + 35, y + 26);

  y += boxH + 12;

  // ── GOALSCORERS ──
  if (match.goals && match.goals.length > 0) {
    y = sectionTitle('Goleadores', y);
    autoTable(doc, {
      startY: y,
      head: [['Min.', 'Jugador', 'Equipo']],
      body: match.goals.map(g => [
        `${g.minute}'`,
        g.player || '-',
        g.team === 'local' ? (match.homeTeam || 'Local') : (match.awayTeam || 'Visitante'),
      ]),
      theme: 'plain',
      headStyles: { fillColor: COLORS.surface, textColor: COLORS.muted, fontSize: 8, fontStyle: 'bold', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      bodyStyles: { fontSize: 9, textColor: COLORS.text, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      alternateRowStyles: { fillColor: [18, 20, 30] },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: CONTENT_W - 60 }, 2: { cellWidth: 42 } },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // ── DISCIPLINARY REPORT ──
  if (match.cards && match.cards.length > 0) {
    y = sectionTitle('Informe Disciplinario (Tarjetas)', y);
    autoTable(doc, {
      startY: y,
      head: [['Min.', 'Jugador', 'Tipo', 'Motivo / Causa']],
      body: match.cards.map(c => [
        `${c.minute}'`,
        c.player || '-',
        c.type === 'amarilla' ? 'AMARILLA' : 'ROJA',
        c.reason || '-',
      ]),
      theme: 'plain',
      headStyles: { fillColor: COLORS.surface, textColor: COLORS.muted, fontSize: 8, fontStyle: 'bold', cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      bodyStyles: { fontSize: 9, textColor: COLORS.text, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 } },
      alternateRowStyles: { fillColor: [18, 20, 30] },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 40 }, 2: { cellWidth: 22 } },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          data.cell.styles.textColor = data.cell.raw === 'AMARILLA' ? COLORS.yellow : COLORS.red;
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // Notes
  if (match.notes && match.notes.trim()) {
    y = sectionTitle('Observaciones / Novedades', y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    const lines = doc.splitTextToSize(match.notes, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5 + 10;
  }

  // ── PAYMENT FOOTER ──
  const pageH = doc.internal.pageSize.getHeight();
  const footerY = Math.max(y + 10, pageH - 55);

  doc.setFillColor(...COLORS.surface);
  doc.rect(0, footerY, W, pageH - footerY, 'F');

  // Payment info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text('TARIFA DEL PARTIDO', MARGIN, footerY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(match.paymentStatus === 'Pagado' ? COLORS.green : COLORS.orange);
  doc.text(formatCurrency(match.fee), MARGIN, footerY + 20);

  const statusColor = match.paymentStatus === 'Pagado' ? COLORS.green : COLORS.orange;
  doc.setFillColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(11, 12, 16);
  const statusW = 26;
  doc.roundedRect(MARGIN, footerY + 24, statusW, 7, 2, 2, 'F');
  doc.text(match.paymentStatus?.toUpperCase() || 'PENDIENTE', MARGIN + statusW / 2, footerY + 29, { align: 'center' });

  // Signature line (right side)
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(W - MARGIN - 60, footerY + 28, W - MARGIN, footerY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('Firma del Árbitro', W - MARGIN - 30, footerY + 34, { align: 'center' });

  // Referee name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(profile?.name || 'Árbitro', W - MARGIN - 30, footerY + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  if (profile?.refNumber) doc.text(profile.refNumber, W - MARGIN - 30, footerY + 27, { align: 'center' });

  // COARC watermark bottom
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('COARC RefManager — Corporación de Árbitros', W / 2, pageH - 6, { align: 'center' });

  // Save
  const fileName = `COARC_Planilla_${match.homeTeam || 'Local'}_vs_${match.awayTeam || 'Visitante'}_${match.date || 'fecha'}.pdf`;
  doc.save(fileName.replace(/\s+/g, '_'));
};
