import React, { useState } from 'react';
import { Printer, X, MessageSquare, Check, Copy, FileText, Receipt } from 'lucide-react';
import { formatINR, formatNumberIN, amountToIndianWords } from '../lib/calculations.ts';

export type PrintableDocType = 'MEASUREMENT' | 'BOM' | 'QUOTATION' | 'INVOICE' | 'RECEIPT';

interface DocumentPrintModalProps {
  docType: PrintableDocType;
  data: any;
  business: any;
  customer: any;
  onClose: () => void;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  docType,
  data,
  business,
  customer,
  onClose,
}) => {
  const [format, setFormat] = useState<'A4' | 'THERMAL'>('A4');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  const generateWhatsAppMessage = () => {
    const bizName = business?.businessName || 'NEW ROYAL DECORATORS';
    const custName = customer?.name || 'Valued Customer';

    if (docType === 'MEASUREMENT') {
      return `*${bizName}*\n*SITE MEASUREMENT SHEET*\nRef: ${data.measurementNumber}\nDate: ${data.date}\nCustomer: ${custName}\nSite: ${data.siteName}\n\n*Total Area:* ${formatNumberIN(data.totalAreaSqft)} sq.ft\n- PVC Ceiling: ${formatNumberIN(data.pvcCeilingSqft)} sq.ft\n- POP Ceiling: ${formatNumberIN(data.popCeilingSqft)} sq.ft\n- Gypsum Ceiling: ${formatNumberIN(data.gypsumCeilingSqft)} sq.ft\n\n*Estimated Grand Total:* ${formatINR(data.grandTotal)}\n\nThank you!\n${bizName}\n${business?.mobileNumbers || ''}`;
    }
    if (docType === 'QUOTATION') {
      return `*${bizName}*\n*QUOTATION FOR FALSE CEILING & POP WORK*\nQuotation No: ${data.quotationNumber}\nDate: ${data.date} (Valid till: ${data.validUntil})\nDear ${custName},\nPlease find below our quotation for site: ${data.siteAddress}\n\nSubtotal: ${formatINR(data.subtotal)}\nDiscount: ${formatINR(data.discount)}\nTaxable Amount: ${formatINR(data.taxableAmount)}\nGST (${data.gstRate}%): ${formatINR(data.gstAmount)}\n*Grand Total: ${formatINR(data.grandTotal)}*\n\nUPI ID: ${business?.upiId}\nContact: ${business?.mobileNumbers}`;
    }
    if (docType === 'INVOICE') {
      return `*${bizName}*\n*GST TAX INVOICE*\nInvoice No: ${data.invoiceNumber}\nDate: ${data.invoiceDate}\nCustomer: ${custName}\n\nTaxable Value: ${formatINR(data.taxableValue)}\n${
        data.isInterState
          ? `IGST (${data.gstRate}%): ${formatINR(data.igstAmount)}`
          : `CGST: ${formatINR(data.cgstAmount)} | SGST: ${formatINR(data.sgstAmount)}`
      }\n*Grand Total: ${formatINR(data.grandTotal)}*\nAmount Paid: ${formatINR(data.amountPaid)}\n*Balance Due: ${formatINR(data.balanceDue)}*\n\nBank: ${business?.bankName} | A/c: ${business?.accountNumber} | IFSC: ${business?.ifscCode}\nUPI: ${business?.upiId}`;
    }
    if (docType === 'RECEIPT') {
      return `*${bizName}*\n*PAYMENT RECEIPT*\nReceipt No: ${data.receiptNumber}\nDate: ${data.paymentDate}\nReceived with thanks from *${custName}*\n*Amount Received: ${formatINR(data.amount)}*\nPayment Mode: ${data.paymentMethod} (${data.referenceNumber || 'N/A'})\n\nThank you for your business!\n${bizName}`;
    }
    return `*${bizName}*\n*BILL OF MATERIALS (BOM)*\nRef: ${data.bomNumber}\nCustomer: ${custName}\nTotal Material Cost: ${formatINR(data.totalMaterialCost)}\nTotal Labour Cost: ${formatINR(data.totalLabourCost)}\n*Total Estimate: ${formatINR(data.grandTotal)}*`;
  };

  const whatsappText = generateWhatsAppMessage();
  const cleanPhone = String(customer?.mobile || '').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${
    cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone
  }?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  // Group measurement items by section for the handwritten sheet view
  const groupedSections: Record<string, any[]> = {};
  if (docType === 'MEASUREMENT' && Array.isArray(data?.items)) {
    data.items.forEach((item: any) => {
      const sec = item.section || 'General';
      if (!groupedSections[sec]) groupedSections[sec] = [];
      groupedSections[sec].push(item);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Top Action Bar (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm tracking-wide">
              {docType} PREVIEW & PRINT
            </span>
            <div className="flex items-center bg-slate-800 p-1 rounded-lg ml-2">
              <button
                onClick={() => setFormat('A4')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  format === 'A4'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                A4 Professional Format
              </button>
              <button
                onClick={() => setFormat('THERMAL')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  format === 'THERMAL'
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                80mm Thermal Format
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Share
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Message Composer Drawer */}
        {showWhatsAppPreview && (
          <div className="no-print bg-emerald-950/95 text-emerald-50 px-6 py-4 border-b border-emerald-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <p className="text-xs font-semibold text-emerald-300 mb-1">
                  Auto-Generated WhatsApp Message for {customer?.name || 'Customer'} ({customer?.mobile || 'No Mobile'})
                </p>
                <pre className="text-xs font-mono bg-emerald-900/60 border border-emerald-700/60 rounded-lg p-3 whitespace-pre-wrap text-emerald-100 max-h-36 overflow-y-auto">
                  {whatsappText}
                </pre>
              </div>
              <div className="flex flex-row md:flex-col gap-2 shrink-0">
                <button
                  onClick={handleCopyWhatsApp}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedWhatsApp ? 'Copied Message' : 'Copy Message'}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open in WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-document-area"
            className={`bg-white text-slate-900 border border-slate-300 ${
              format === 'THERMAL'
                ? 'w-[320px] p-4 text-xs font-mono'
                : 'w-full max-w-[794px] p-8 text-sm'
            }`}
          >
            {/* Header Block */}
            <div
              className={`border-b-2 border-slate-900 pb-4 mb-5 ${
                format === 'THERMAL' ? 'text-center' : 'flex justify-between items-start gap-6'
              }`}
            >
              <div>
                <h1
                  className={`font-bold tracking-tight text-slate-950 ${
                    format === 'THERMAL' ? 'text-base' : 'text-2xl'
                  }`}
                >
                  {business?.businessName || 'NEW ROYAL DECORATORS'}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 max-w-md">
                  {business?.category}
                </p>
                <p className="text-xs text-slate-700 mt-1">{business?.address}</p>
                <p className="text-xs text-slate-700">
                  Mob: {business?.mobileNumbers} · Email: {business?.email}
                </p>
                <p className="text-xs font-mono font-semibold text-slate-900 mt-1">
                  GSTIN: {business?.gstin} · PAN: {business?.pan} · State: {business?.state} ({business?.stateCode})
                </p>
              </div>

              <div className={format === 'THERMAL' ? 'mt-3 border-t border-dashed border-slate-400 pt-2' : 'text-right shrink-0'}>
                <div className="inline-block border-2 border-slate-900 px-3 py-1 font-bold text-xs tracking-wider uppercase">
                  {docType === 'MEASUREMENT' && 'SITE MEASUREMENT SHEET'}
                  {docType === 'BOM' && 'BILL OF MATERIALS (BOM)'}
                  {docType === 'QUOTATION' && 'ESTIMATE / QUOTATION'}
                  {docType === 'INVOICE' && 'TAX INVOICE'}
                  {docType === 'RECEIPT' && 'PAYMENT RECEIPT'}
                </div>
                <div className="mt-2 text-xs font-mono space-y-0.5">
                  <p>
                    <span className="text-slate-500">Ref No:</span>{' '}
                    <span className="font-semibold">
                      {data.measurementNumber ||
                        data.bomNumber ||
                        data.quotationNumber ||
                        data.invoiceNumber ||
                        data.receiptNumber}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Date:</span>{' '}
                    <span className="font-semibold">
                      {data.date || data.invoiceDate || data.paymentDate}
                    </span>
                  </p>
                  {data.validUntil && (
                    <p>
                      <span className="text-slate-500">Valid Till:</span> {data.validUntil}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Site Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 border border-slate-200 text-xs">
              <div>
                <p className="font-semibold text-slate-500">Customer / Party Details:</p>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {customer?.name || 'Walk-in Customer'}
                </p>
                {customer?.address && <p className="text-slate-700">{customer.address}</p>}
                <p className="text-slate-700 font-mono">Mobile: {customer?.mobile || 'N/A'}</p>
                {(customer?.gstin || data?.customerGstin) && (
                  <p className="font-mono font-semibold text-slate-900">
                    Party GSTIN: {data?.customerGstin || customer?.gstin}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-500">Site / Place of Supply:</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {data.siteName || data.siteAddress || customer?.siteAddress || 'Site Location'}
                </p>
                {data.placeOfSupply && (
                  <p className="font-mono text-slate-700 mt-1">
                    Place of Supply: {data.placeOfSupply} (
                    {data.isInterState ? 'INTER-STATE IGST' : 'INTRA-STATE CGST+SGST'})
                  </p>
                )}
              </div>
            </div>

            {/* 1. HANDWRITTEN CONTRACTOR MEASUREMENT SHEET FORMAT */}
            {docType === 'MEASUREMENT' && (
              <div className="space-y-5">
                {Object.entries(groupedSections).map(([sectionName, secItems]) => (
                  <div key={sectionName} className="border border-slate-300">
                    <div className="bg-slate-900 text-white px-3 py-1.5 font-bold text-xs tracking-wider uppercase flex justify-between">
                      <span>{sectionName}</span>
                      <span className="font-mono">
                        Subtotal:{' '}
                        {formatNumberIN(
                          secItems.reduce((acc, i) => acc + Number(i.areaSqft || 0), 0)
                        )}{' '}
                        sq.ft
                      </span>
                    </div>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                          <th className="py-1.5 px-2">Room / Work</th>
                          <th className="py-1.5 px-2">Measurement (L × W × Qty)</th>
                          <th className="py-1.5 px-2 text-right">Area (sq.ft)</th>
                          {format === 'A4' && (
                            <>
                              <th className="py-1.5 px-2 text-right">Rate</th>
                              <th className="py-1.5 px-2 text-right">Amount</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {secItems.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-2 font-sans">
                              <span className="font-semibold text-slate-900">
                                ROOM: {item.room}
                              </span>{' '}
                              <span className="text-slate-500">· {item.workType}</span>
                              {item.description && (
                                <div className="text-slate-600 text-[11px]">
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 font-semibold text-slate-900">
                              {item.lengthInput} × {item.widthInput}
                              {Number(item.quantity) > 1 ? ` × ${item.quantity}` : ''} ={' '}
                              {formatNumberIN(item.areaSqft)} sq.ft
                            </td>
                            <td className="py-1.5 px-2 text-right font-bold">
                              {formatNumberIN(item.areaSqft)}
                            </td>
                            {format === 'A4' && (
                              <>
                                <td className="py-1.5 px-2 text-right">
                                  {formatINR(item.rate)}
                                </td>
                                <td className="py-1.5 px-2 text-right font-semibold">
                                  {formatINR(item.amount)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Traditional Handwritten Sheet Summary Box */}
                <div className="border-2 border-slate-900 p-4 bg-amber-50/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-slate-300 pb-1">
                      <span className="font-bold">TOTAL AREA:</span>
                      <span className="font-bold text-sm">
                        {formatNumberIN(data.totalAreaSqft)} sq.ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PVC CEILING:</span>
                      <span>{formatNumberIN(data.pvcCeilingSqft)} sq.ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>POP CEILING:</span>
                      <span>{formatNumberIN(data.popCeilingSqft)} sq.ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GYPSUM CEILING:</span>
                      <span>{formatNumberIN(data.gypsumCeilingSqft)} sq.ft</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-300 md:pl-4">
                    <div className="flex justify-between">
                      <span>Material Estimate:</span>
                      <span>{formatINR(data.materialEstimate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labour Estimate:</span>
                      <span>{formatINR(data.labourEstimate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Charges / Discount:</span>
                      <span>
                        +{formatINR(data.otherCharges)} / -{formatINR(data.discount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({data.gstRate}%):</span>
                      <span>{formatINR(data.gstAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-sm font-bold">
                      <span>GRAND TOTAL:</span>
                      <span>{formatINR(data.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BOM TABLE */}
            {docType === 'BOM' && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Item & Brand</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2 text-right">Req Qty</th>
                      <th className="py-2 px-2 text-right">Wastage</th>
                      <th className="py-2 px-2 text-right">Final Qty</th>
                      <th className="py-2 px-2 text-right">Material</th>
                      <th className="py-2 px-2 text-right">Labour</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(data.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2">{idx + 1}</td>
                        <td className="py-1.5 px-2 font-sans">
                          <div className="font-semibold text-slate-900">{item.itemName}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.brand} · HSN: {item.hsnSac}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 font-sans">{item.category}</td>
                        <td className="py-1.5 px-2 text-right">
                          {item.requiredQty} {item.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right">{item.wastagePercent}%</td>
                        <td className="py-1.5 px-2 text-right font-semibold">
                          {item.finalQty} {item.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right">{formatINR(item.materialCost)}</td>
                        <td className="py-1.5 px-2 text-right">{formatINR(item.labourCost)}</td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          {formatINR(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <div className="w-72 border-2 border-slate-900 p-3 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Total Material Cost:</span>
                      <span>{formatINR(data.totalMaterialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Labour Cost:</span>
                      <span>{formatINR(data.totalLabourCost)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-900 pt-1 font-bold text-sm">
                      <span>BOM Grand Total:</span>
                      <span>{formatINR(data.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. QUOTATION OR INVOICE TABLE */}
            {(docType === 'QUOTATION' || docType === 'INVOICE') && (
              <div className="space-y-4">
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Description of Work / Material</th>
                      <th className="py-2 px-2">HSN/SAC</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2">Unit</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      <th className="py-2 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(data.items || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2 font-sans">
                          {item.section && (
                            <span className="text-[11px] font-semibold text-slate-500 block">
                              {item.section}
                            </span>
                          )}
                          <span className="font-medium text-slate-900">{item.description}</span>
                        </td>
                        <td className="py-2 px-2">{item.hsnSac || '9954'}</td>
                        <td className="py-2 px-2 text-right">{formatNumberIN(item.quantity)}</td>
                        <td className="py-2 px-2">{item.unit}</td>
                        <td className="py-2 px-2 text-right">{formatINR(item.rate)}</td>
                        <td className="py-2 px-2 text-right font-semibold">
                          {formatINR(item.amount || item.taxableValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-7 space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 font-semibold block">
                        Amount in Words:
                      </span>
                      <span className="font-bold text-slate-900">
                        {data.amountInWords || amountToIndianWords(data.grandTotal)}
                      </span>
                    </div>

                    <div className="p-2.5 border border-slate-200 space-y-0.5 font-mono text-[11px]">
                      <div className="font-sans font-bold text-slate-800">
                        Bank & UPI Payment Details:
                      </div>
                      <div>
                        Bank: {business?.bankName} ({business?.branch})
                      </div>
                      <div>
                        A/c No: {business?.accountNumber} · IFSC: {business?.ifscCode}
                      </div>
                      <div>UPI ID: {business?.upiId}</div>
                    </div>

                    {(data.termsAndConditions || business?.termsAndConditions) && (
                      <div className="text-[11px] text-slate-600 whitespace-pre-line border-t border-slate-200 pt-2">
                        <strong className="text-slate-900 block mb-0.5">
                          Terms & Conditions:
                        </strong>
                        {data.termsAndConditions || business?.termsAndConditions}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-5 border-2 border-slate-900 p-3 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatINR(data.subtotal || data.taxableValue)}</span>
                    </div>
                    {Number(data.discount) > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span>-{formatINR(data.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold">
                      <span>Taxable Value:</span>
                      <span>{formatINR(data.taxableAmount || data.taxableValue)}</span>
                    </div>
                    {docType === 'INVOICE' ? (
                      data.isInterState ? (
                        <div className="flex justify-between">
                          <span>IGST ({data.gstRate}%):</span>
                          <span>{formatINR(data.igstAmount)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span>CGST ({Number(data.gstRate) / 2}%):</span>
                            <span>{formatINR(data.cgstAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST ({Number(data.gstRate) / 2}%):</span>
                            <span>{formatINR(data.sgstAmount)}</span>
                          </div>
                        </>
                      )
                    ) : (
                      <div className="flex justify-between">
                        <span>GST ({data.gstRate}%):</span>
                        <span>{formatINR(data.gstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t-2 border-slate-900 pt-1.5 text-sm font-bold">
                      <span>Grand Total:</span>
                      <span>{formatINR(data.grandTotal)}</span>
                    </div>
                    {docType === 'INVOICE' && (
                      <>
                        <div className="flex justify-between text-emerald-700 pt-1">
                          <span>Amount Paid:</span>
                          <span>{formatINR(data.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-rose-700 border-t border-slate-300 pt-1">
                          <span>Balance Due:</span>
                          <span>{formatINR(data.balanceDue)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. PAYMENT RECEIPT VOUCHER */}
            {docType === 'RECEIPT' && (
              <div className="border-2 border-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Received From:</span>
                    <span className="text-base font-bold text-slate-900">
                      {customer?.name}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-500 block">Amount Received:</span>
                    <span className="text-xl font-bold text-emerald-700">
                      {formatINR(data.amount)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Payment Mode:</span>{' '}
                    <strong className="text-slate-900">{data.paymentMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Reference / UTR:</span>{' '}
                    <strong className="text-slate-900">{data.referenceNumber || 'N/A'}</strong>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500">In Words: </span>
                  <strong className="text-slate-900">
                    {amountToIndianWords(data.amount)}
                  </strong>
                </div>
                {data.notes && (
                  <p className="text-xs text-slate-600">Remarks: {data.notes}</p>
                )}
              </div>
            )}

            {/* Signature Footer */}
            <div className="mt-10 pt-6 border-t border-slate-300 flex justify-between items-end text-xs">
              <div>
                <p className="font-semibold text-slate-700">Customer / Receiver Signature</p>
                <p className="text-[11px] text-slate-500 mt-4">
                  Checked & verified site measurements / terms
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">
                  For {business?.businessName || 'NEW ROYAL DECORATORS'}
                </p>
                <p className="text-[11px] text-slate-500 mt-8">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
