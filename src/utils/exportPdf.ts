import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadReportPDF(elementId: string, candidateName: string = 'Candidate') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found for PDF export.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = candidateName.replace(/[^a-zA-Z0-0_]/g, '_');
    pdf.save(`${safeName}_AI_Resume_Analysis_Report.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Failed to generate PDF download. You can also print the page directly using Ctrl+P or Cmd+P.');
  }
}
