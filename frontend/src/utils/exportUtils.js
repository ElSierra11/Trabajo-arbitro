import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Exporta el listado de partidos a PDF
 */
export const exportMatchesToPDF = (matches, title = 'Reporte de Partidos - COARC') => {
  const doc = new jsPDF();

  // Header COARC
  doc.setFillColor(16, 185, 129); // COARC primary color (#10b981)
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CORPORACIÓN ARBITRAL DE CÓRDOBA (COARC)', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestión Oficial de Partidos y Designaciones', 14, 19);

  // Document Title & Date
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')} - Total de partidos: ${matches.length}`, 14, 40);

  // Table Data
  const tableData = matches.map((m, index) => [
    index + 1,
    formatDate(m.date),
    m.category || 'N/A',
    `${m.teams?.home || m.homeTeam || 'Local'} vs ${m.teams?.away || m.awayTeam || 'Visitante'}`,
    m.role || 'Árbitro',
    m.field || 'Cancha n/a',
    m.status === 'completed' ? 'Finalizado' : m.status === 'cancelled' ? 'Cancelado' : 'Programado',
    formatCurrency(m.fee || 0),
  ]);

  doc.autoTable({
    startY: 45,
    head: [['#', 'Fecha', 'Categoría', 'Partido', 'Rol', 'Cancha', 'Estado', 'Honorario']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Total Summary
  const totalFees = matches.reduce((sum, m) => sum + (Number(m.fee) || 0), 0);
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Honorarios Acumulados: ${formatCurrency(totalFees)}`, 14, finalY);

  doc.save(`COARC_Partidos_${new Date().toISOString().slice(0,10)}.pdf`);
};

/**
 * Exporta el listado de partidos a Excel
 */
export const exportMatchesToExcel = (matches, fileName = 'COARC_Partidos') => {
  const excelData = matches.map((m, idx) => ({
    'N°': idx + 1,
    'Fecha': m.date || '',
    'Categoría': m.category || '',
    'Equipo Local': m.teams?.home || m.homeTeam || '',
    'Equipo Visitante': m.teams?.away || m.awayTeam || '',
    'Rol Arbitral': m.role || '',
    'Cancha / Lugar': m.field || '',
    'Estado': m.status === 'completed' ? 'Finalizado' : m.status === 'cancelled' ? 'Cancelado' : 'Programado',
    'Honorario (COP)': Number(m.fee) || 0,
    'Estado de Pago': m.paid ? 'Pagado' : 'Pendiente',
    'Notas': m.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partidos');
  
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

/**
 * Exporta la liquidación/resumen de finanzas a PDF
 */
export const exportFinancialsToPDF = (stats, profileName = 'Árbitro') => {
  const doc = new jsPDF();

  // Header COARC
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CORPORACIÓN ARBITRAL DE CÓRDOBA (COARC)', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORME Y LIQUIDACIÓN FINANCIERA', 14, 19);

  // Metadata
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Resumen de Cobros - ${profileName}`, 14, 35);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')}`, 14, 41);

  // Financial Cards Summary Table
  const summaryData = [
    ['Total Ingresos Generados', formatCurrency(stats.totalEarnings || 0)],
    ['Honorarios Cobrados (Pagados)', formatCurrency(stats.paidEarnings || 0)],
    ['Saldo Pendiente de Cobro', formatCurrency(stats.pendingEarnings || 0)],
    ['Total Partidos Dirigidos', stats.totalMatches || 0],
    ['Promedio por Partido', formatCurrency(stats.avgPerMatch || 0)]
  ];

  doc.autoTable({
    startY: 48,
    head: [['Concepto', 'Valor']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  doc.save(`COARC_Liquidacion_${profileName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
};
