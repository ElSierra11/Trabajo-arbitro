// Invoice / Account Statement PDF Generator for COARC
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const generateInvoicePDF = ({
  invoiceNumber = 'CC-001',
  clientName = 'Liga de Fútbol de Córdoba',
  clientNit = '',
  matches = [],
  bankInfo = { bank: 'Bancolombia', accountType: 'Ahorros', accountNumber: '123-456789-00', holder: 'Alejandro Sierra' },
  refereeInfo = { name: 'Alejandro Sierra', refNumber: 'COARC-01' }
}) => {
  const doc = jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Colors
  const navyColor = [15, 23, 42];
  const emeraldColor = [16, 185, 129];
  const grayColor = [100, 116, 139];

  // Top Accent Bar
  doc.setFillColor(...emeraldColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Title & Brand
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CORPORACIÓN ARBITRAL DE CÓRDOBA', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('COARC · Personería Jurídica · Montería, Córdoba', 14, 24);

  // Document Type Badge / Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 65, 12, 51, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...emeraldColor);
  doc.text('CUENTA DE COBRO', pageWidth - 60, 19);
  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.text(`N°: ${invoiceNumber}`, pageWidth - 60, 25);
  doc.text(`Fecha: ${formatDate(new Date().toISOString().slice(0, 10))}`, pageWidth - 60, 30);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);

  // Client & Referee Info Box
  let y = 46;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('DEUDOR / CLIENTE:', 14, y);
  doc.text('ÁRBITRO RESPONSABLE:', pageWidth / 2 + 10, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(clientName, 14, y);
  doc.text(refereeInfo.name, pageWidth / 2 + 10, y);

  y += 5;
  if (clientNit) {
    doc.text(`NIT / C.C.: ${clientNit}`, 14, y);
  } else {
    doc.text('Entidad / Torneo Organizador', 14, y);
  }
  doc.text(`N° Registro: ${refereeInfo.refNumber || 'COARC-01'}`, pageWidth / 2 + 10, y);

  y += 10;

  // Table of itemized matches
  const tableData = matches.map((m, index) => [
    index + 1,
    m.date || '',
    `${m.homeTeam || 'Local'} vs ${m.awayTeam || 'Visitante'}${m.category ? ` (Sub-${m.category})` : ''}`,
    m.tournament || 'Torneo Local',
    m.role || 'Árbitro Central',
    formatCurrency(m.fee || 0)
  ]);

  const totalAmount = matches.reduce((sum, m) => sum + (m.fee || 0), 0);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Fecha', 'Encuentro / Categoría', 'Torneo / Cancha', 'Rol', 'Valor ($)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
      5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' }
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  let finalY = doc.lastAutoTable.finalY + 8;

  // Total Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(pageWidth - 75, finalY, 61, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...emeraldColor);
  doc.text('TOTAL A PAGAR:', pageWidth - 70, finalY + 6);
  doc.setFontSize(12);
  doc.text(formatCurrency(totalAmount), pageWidth - 70, finalY + 12);

  finalY += 24;

  // Payment Bank Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text('INFORMACIÓN DE PAGO / TRANSFERENCIA BANCARIA:', 18, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Banco: ${bankInfo.bank}  |  Tipo: Cuenta de ${bankInfo.accountType}  |  N°: ${bankInfo.accountNumber}`, 18, finalY + 12);
  doc.text(`• Titular: ${bankInfo.holder}`, 18, finalY + 17);

  // Signature Block
  const sigY = pageHeight - 35;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(14, sigY, 74, sigY);
  doc.line(pageWidth - 74, sigY, pageWidth - 14, sigY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyColor);
  doc.text(refereeInfo.name, 14, sigY + 5);
  doc.text('REPRESENTANTE COARC', pageWidth - 74, sigY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Firma Árbitro Cobrador', 14, sigY + 9);
  doc.text('Firma y Sello Recibido Liga/Torneo', pageWidth - 74, sigY + 9);

  // Footer
  doc.setFontSize(7.5);
  doc.text('Corporación Arbitral de Córdoba (COARC) — Documento generado oficialmente.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Save PDF
  doc.save(`cuenta_cobro_coarc_${invoiceNumber}.pdf`);
};
