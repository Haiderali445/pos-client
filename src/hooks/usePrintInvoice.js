import { useCallback, useRef, useState } from "react";

export function usePrintInvoice(defaultTemplate = "thermal80mm") {
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedTemplate, setTemplate] = useState(defaultTemplate);

  const printNow = useCallback(() => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const is80mm = selectedTemplate === "thermal80mm";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Print</title>
          <style>
            @page {
              size: ${is80mm ? "80mm auto" : "A4"};
              margin: ${is80mm ? "4mm" : "10mm"};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: ${is80mm ? "'Courier New', Courier, monospace" : "'Inter', 'Segoe UI', sans-serif"};
              background: #fff;
              color: #000;
            }
            * { box-sizing: border-box; }
            .ant-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  }, [selectedTemplate]);

  const generatePDF = useCallback(async () => {
    if (!printRef.current) return;
    setIsPrinting(true);

    try {
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");

      const html2canvas = html2canvasModule.default || html2canvasModule;
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const is80mm = selectedTemplate === "thermal80mm";
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: is80mm ? [80, (canvas.height / canvas.width) * 80] : "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed, falling back to print window:", err);
      printNow();
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTemplate, printNow]);

  return { printRef, printNow, generatePDF, isPrinting, selectedTemplate, setTemplate };
}

export default usePrintInvoice;