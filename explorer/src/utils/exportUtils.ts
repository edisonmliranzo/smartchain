import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';

interface Transaction {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    valueFormatted?: string;
    timestamp?: number;
    blockNumber?: number;
    status?: string;
    gasUsed?: string;
}

export function exportToCSV(transactions: Transaction[], address: string): void {
    const headers = ['Hash', 'From', 'To', 'Value (SMC)', 'Block', 'Timestamp', 'Status'];

    const rows = transactions.map(tx => [
        tx.hash,
        tx.from,
        tx.to || 'Contract Creation',
        tx.valueFormatted || tx.value,
        tx.blockNumber?.toString() || '',
        tx.timestamp ? new Date(tx.timestamp).toISOString() : '',
        tx.status || 'Success'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `smartchain-transactions-${address.slice(0, 8)}-${Date.now()}.csv`);
}

export function exportToPDF(transactions: Transaction[], address: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartChain Explorer', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Transaction History Report', 14, 30);

    // Address info
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', 14, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(address, 14, 62);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 72);
    doc.text(`Total Transactions: ${transactions.length}`, 14, 80);

    // Table header
    const startY = 95;
    const colWidths = [45, 45, 30, 25, 40];
    const headers = ['From', 'To', 'Value', 'Block', 'Time'];

    doc.setFillColor(248, 250, 252);
    doc.rect(14, startY - 6, pageWidth - 28, 10, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);

    let xPos = 14;
    headers.forEach((header, i) => {
        doc.text(header, xPos, startY);
        xPos += colWidths[i];
    });

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    let yPos = startY + 10;
    const maxRowsPerPage = 25;

    transactions.slice(0, 100).forEach((tx, index) => {
        if (index > 0 && index % maxRowsPerPage === 0) {
            doc.addPage();
            yPos = 20;
        }

        xPos = 14;
        const row = [
            tx.from.slice(0, 10) + '...',
            (tx.to || 'Contract').slice(0, 10) + '...',
            (tx.valueFormatted || tx.value).split('.')[0] + ' SMC',
            tx.blockNumber?.toString() || '-',
            tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '-'
        ];

        row.forEach((cell, i) => {
            doc.text(cell, xPos, yPos);
            xPos += colWidths[i];
        });

        yPos += 8;
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`smartchain-transactions-${address.slice(0, 8)}-${Date.now()}.pdf`);
}
