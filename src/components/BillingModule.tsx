import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  ArrowRight,
  CreditCard,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import {
  formatINR,
  formatNumberIN,
  amountToIndianWords,
  INDIAN_STATES,
} from '../lib/calculations.ts';
import { PrintableDocType } from './DocumentPrintModal.tsx';

interface BillingModuleProps {
  activeSubTab: 'QUOTATIONS' | 'INVOICES' | 'PAYMENTS';
  quotations: any[];
  invoices: any[];
  payments: any[];
  customers: any[];
  projects: any[];
  business: any;
  currentUserRole: string;
  onSaveQuotation: (payload: any) => Promise<void>;
  onDeleteQuotation: (id: number) => Promise<void>;
  onSaveInvoice: (payload: any) => Promise<void>;
  onDeleteInvoice: (id: number) => Promise<void>;
  onRecordPayment: (payload: any) => Promise<void>;
  onDeletePayment: (id: number) => Promise<void>;
  onOpenPrint: (docType: PrintableDocType, data: any, customer: any) => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  activeSubTab,
  quotations,
  invoices,
  payments,
  customers,
  projects,
  business,
  currentUserRole,
  onSaveQuotation,
  onSaveInvoice,
  onDeleteInvoice,
  onRecordPayment,
  onDeletePayment,
  onOpenPrint,
}) => {
  const isSiteStaff = currentUserRole === 'Site Staff';

  // Quotation form state
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null);

  // Invoice form state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState<any | null>(null);

  // Payment form state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState<number | ''>(
    invoices[0]?.id || ''
  );
  const [payCustomerId, setPayCustomerId] = useState<number>(
    customers[0]?.id || 1
  );
  const [payDate, setPayDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  const openNewQuotation = (prefill?: any) => {
    const nextNo = `${business?.quotationPrefix || 'NRD/26-27/QTN-'}${String(
      quotations.length + 1
    ).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    setEditingQuotation(
      prefill || {
        quotationNumber: nextNo,
        date: today,
        validUntil: today,
        customerId: customers[0]?.id || 1,
        projectId: projects[0]?.id || '',
        siteAddress: customers[0]?.siteAddress || '',
        status: 'Pending',
        discount: 0,
        gstRate: Number(business?.defaultGstRate || 18),
        termsAndConditions: business?.termsAndConditions || '',
        notes: '',
        items: [
          {
            section: 'Ground Floor',
            description: 'Supply & Installation of Heavy PVC Ceiling with GI Framing',
            hsnSac: '9954',
            quantity: 154,
            unit: 'sq.ft',
            rate: 85,
            amount: 13090,
          },
        ],
      }
    );
    setShowQuotationModal(true);
  };

  const openNewInvoice = (fromQuotation?: any) => {
    const nextNo = `${business?.invoicePrefix || 'NRD/26-27/INV-'}${String(
      invoices.length + 1
    ).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const cust =
      customers.find((c) => c.id === (fromQuotation?.customerId || customers[0]?.id)) ||
      customers[0];
    const bizStateCode = String(business?.stateCode || '27').trim();
    const custStateCode = String(cust?.stateCode || '27').trim();
    const isInter = bizStateCode !== custStateCode;

    setEditingInvoice({
      invoiceNumber: nextNo,
      invoiceDate: today,
      dueDate: today,
      customerId: cust?.id || 1,
      projectId: fromQuotation?.projectId || '',
      quotationId: fromQuotation?.id || null,
      customerGstin: cust?.gstin || '',
      placeOfSupply: `${cust?.state || 'Maharashtra'} (${custStateCode})`,
      isInterState: isInter,
      discount: Number(fromQuotation?.discount || 0),
      gstRate: Number(fromQuotation?.gstRate || business?.defaultGstRate || 18),
      amountPaid: 0,
      isFinalized: true,
      notes: fromQuotation
        ? `Converted from Quotation ${fromQuotation.quotationNumber}`
        : '',
      items: (fromQuotation?.items || [
        {
          description: 'False Ceiling & POP Contracting Work with GI Grid',
          hsnSac: '9954',
          quantity: 200,
          unit: 'sq.ft',
          rate: 85,
          taxableValue: 17000,
        },
      ]).map((it: any) => ({
        description: it.description,
        hsnSac: it.hsnSac || '9954',
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'sq.ft',
        rate: Number(it.rate || 0),
        taxableValue: Number(it.amount || it.taxableValue || 0),
      })),
    });
    setShowInvoiceModal(true);
  };

  // Compute live invoice totals inside modal
  const computedInvoiceDraft = useMemo(() => {
    if (!editingInvoice) return null;
    const subtotal = (editingInvoice.items || []).reduce(
      (sum: number, i: any) => sum + Number(i.quantity || 0) * Number(i.rate || 0),
      0
    );
    const discount = Number(editingInvoice.discount || 0);
    const taxableValue = Math.max(0, Number((subtotal - discount).toFixed(2)));
    const gstRate = Number(editingInvoice.gstRate || 0);
    const totalGst = Number(((taxableValue * gstRate) / 100).toFixed(2));
    const isInter = Boolean(editingInvoice.isInterState);
    const cgstAmount = isInter ? 0 : Number((totalGst / 2).toFixed(2));
    const sgstAmount = isInter ? 0 : Number((totalGst / 2).toFixed(2));
    const igstAmount = isInter ? totalGst : 0;
    const grandTotal = Number((taxableValue + totalGst).toFixed(2));
    const amountPaid = Number(editingInvoice.amountPaid || 0);
    const balanceDue = Math.max(0, Number((grandTotal - amountPaid).toFixed(2)));

    return {
      ...editingInvoice,
      subtotal: Number(subtotal.toFixed(2)),
      taxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst,
      grandTotal,
      balanceDue,
      amountInWords: amountToIndianWords(grandTotal),
    };
  }, [editingInvoice]);

  // Compute live quotation totals inside modal
  const computedQuotationDraft = useMemo(() => {
    if (!editingQuotation) return null;
    const subtotal = (editingQuotation.items || []).reduce(
      (sum: number, i: any) => sum + Number(i.quantity || 0) * Number(i.rate || 0),
      0
    );
    const discount = Number(editingQuotation.discount || 0);
    const taxableAmount = Math.max(0, Number((subtotal - discount).toFixed(2)));
    const gstRate = Number(editingQuotation.gstRate || 0);
    const gstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + gstAmount).toFixed(2));

    return {
      ...editingQuotation,
      materialSubtotal: Number((subtotal * 0.65).toFixed(2)),
      labourCost: Number((subtotal * 0.35).toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      taxableAmount,
      gstAmount,
      grandTotal,
    };
  }, [editingQuotation]);

  const handleSavePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNo = `${business?.receiptPrefix || 'NRD/26-27/RCP-'}${String(
      payments.length + 1
    ).padStart(3, '0')}`;
    await onRecordPayment({
      receiptNumber: receiptNo,
      paymentDate: payDate,
      invoiceId: payInvoiceId || null,
      customerId: payCustomerId,
      amount: payAmount,
      paymentMethod: payMethod,
      referenceNumber: payRef,
      notes: payNotes,
    });
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. QUOTATIONS VIEW */}
      {activeSubTab === 'QUOTATIONS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Quotations & Estimates ({quotations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Generate professional contractor quotations and convert approved quotes to GST invoices in one click
              </p>
            </div>
            <button
              onClick={() => openNewQuotation()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              + Create Quotation
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Quotation No.</th>
                    <th className="py-3 px-4">Date · Valid Till</th>
                    <th className="py-3 px-4">Customer & Site</th>
                    <th className="py-3 px-4 text-right">Taxable Value</th>
                    <th className="py-3 px-4 text-right">GST</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quotations.map((q) => {
                    const cust = customers.find((c) => c.id === q.customerId);
                    return (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {q.quotationNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {q.date} · {q.validUntil}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {cust?.name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500">{q.siteAddress}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatINR(q.taxableAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatINR(q.gstAmount)} ({q.gstRate}%)
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(q.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {q.status}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openNewInvoice(q)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded whitespace-nowrap"
                              title="Convert Quotation to GST Invoice"
                            >
                              Convert to Invoice
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onOpenPrint('QUOTATION', q, cust)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded"
                              title="Print / PDF / WhatsApp"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GST INVOICES VIEW */}
      {activeSubTab === 'INVOICES' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Indian GST Tax Invoices ({invoices.length})
              </h2>
              <p className="text-xs text-slate-500">
                Automatic Intra-State (CGST + SGST) and Inter-State (IGST) calculation with HSN/SAC & Amount in Words
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSiteStaff && (
                <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                  <ShieldAlert className="w-4 h-4" />
                  Site Staff Role: Finalized invoices are read-only
                </span>
              )}
              <button
                onClick={() => openNewInvoice()}
                disabled={isSiteStaff}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg disabled:opacity-40 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                + New GST Invoice
              </button>
            </div>
          </div>

          {/* Delete Invoice Confirmation Dialog (Section 19: Never permanently delete invoices without confirmation) */}
          {confirmDeleteInvoice && (
            <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Confirm Permanent Deletion of GST Invoice {confirmDeleteInvoice.invoiceNumber}?
                  </h4>
                  <p className="text-xs text-slate-700 mt-0.5">
                    This invoice has a Grand Total of {formatINR(confirmDeleteInvoice.grandTotal)}. Deleting a finalized GST invoice cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDeleteInvoice(null)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeleteInvoice(confirmDeleteInvoice.id);
                    setConfirmDeleteInvoice(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Confirm Delete Invoice
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-3">Invoice No.</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer & GSTIN</th>
                    <th className="py-3 px-3">Tax Type</th>
                    <th className="py-3 px-3 text-right">Taxable</th>
                    <th className="py-3 px-3 text-right">CGST+SGST / IGST</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customerId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {inv.invoiceDate}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">
                            {cust?.name || 'Customer'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            GSTIN: {inv.customerGstin || cust?.gstin || 'Unregistered'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {inv.isInterState ? 'INTER (IGST)' : 'INTRA (CGST+SGST)'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(inv.taxableValue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(inv.totalGst)} ({inv.gstRate}%)
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                          {formatINR(inv.amountPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatINR(inv.balanceDue)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {inv.status}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {Number(inv.balanceDue) > 0 && (
                              <button
                                onClick={() => {
                                  setPayInvoiceId(inv.id);
                                  setPayCustomerId(inv.customerId);
                                  setPayAmount(Number(inv.balanceDue));
                                  setShowPaymentModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded whitespace-nowrap"
                              >
                                Record Payment
                              </button>
                            )}
                            <button
                              onClick={() => onOpenPrint('INVOICE', inv, cust)}
                              className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded"
                              title="Print / PDF / WhatsApp"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {!isSiteStaff && (
                              <button
                                onClick={() => setConfirmDeleteInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAYMENTS & RECEIPTS VIEW */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Payment Ledger & Printable Receipts ({payments.length})
              </h2>
              <p className="text-xs text-slate-500">
                Record Cash, UPI, NEFT/RTGS, Card, or Cheque receipts and auto-update invoice balances
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              + Record Payment Receipt
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Linked Invoice</th>
                    <th className="py-3 px-4">Payment Mode & Ref</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((p) => {
                    const cust = customers.find((c) => c.id === p.customerId);
                    const inv = invoices.find((i) => i.id === p.invoiceId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {p.paymentDate}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {cust?.name || 'Customer'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {inv?.invoiceNumber || 'On Account / Advance'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {p.paymentMethod}
                          </span>
                          {p.referenceNumber && (
                            <span className="font-mono text-slate-500">
                              {' '}
                              · {p.referenceNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onOpenPrint('RECEIPT', p, cust)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Receipt PDF / WhatsApp
                            </button>
                            <button
                              onClick={() => onDeletePayment(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QUOTATION MODAL */}
      {showQuotationModal && computedQuotationDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">
                Create / Edit Quotation ({computedQuotationDraft.quotationNumber})
              </h3>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Quotation No.
                  </label>
                  <input
                    type="text"
                    value={editingQuotation.quotationNumber}
                    onChange={(e) =>
                      setEditingQuotation({
                        ...editingQuotation,
                        quotationNumber: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingQuotation.date}
                    onChange={(e) =>
                      setEditingQuotation({ ...editingQuotation, date: e.target.value })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={editingQuotation.validUntil}
                    onChange={(e) =>
                      setEditingQuotation({
                        ...editingQuotation,
                        validUntil: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Customer
                  </label>
                  <select
                    value={editingQuotation.customerId}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      const c = customers.find((cu) => cu.id === cid);
                      setEditingQuotation({
                        ...editingQuotation,
                        customerId: cid,
                        siteAddress: c?.siteAddress || editingQuotation.siteAddress,
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quotation Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">
                    Quotation Work & Material Items
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingQuotation({
                        ...editingQuotation,
                        items: [
                          ...editingQuotation.items,
                          {
                            section: 'General',
                            description: 'POP / Gypsum Ceiling Work',
                            hsnSac: '9954',
                            quantity: 100,
                            unit: 'sq.ft',
                            rate: 85,
                            amount: 8500,
                          },
                        ],
                      })
                    }
                    className="px-3 py-1 bg-slate-900 text-white rounded font-semibold"
                  >
                    + Add Line Item
                  </button>
                </div>
                {editingQuotation.items.map((it: any, i: number) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => {
                        const next = [...editingQuotation.items];
                        next[i] = { ...next[i], description: e.target.value };
                        setEditingQuotation({ ...editingQuotation, items: next });
                      }}
                      placeholder="Work Description"
                      className="col-span-5 px-2 py-1.5 bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        const next = [...editingQuotation.items];
                        next[i] = {
                          ...next[i],
                          quantity: qty,
                          amount: Number((qty * Number(next[i].rate)).toFixed(2)),
                        };
                        setEditingQuotation({ ...editingQuotation, items: next });
                      }}
                      className="col-span-2 px-2 py-1.5 font-mono text-right bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="text"
                      value={it.unit}
                      onChange={(e) => {
                        const next = [...editingQuotation.items];
                        next[i] = { ...next[i], unit: e.target.value };
                        setEditingQuotation({ ...editingQuotation, items: next });
                      }}
                      className="col-span-1 px-2 py-1.5 bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="number"
                      value={it.rate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        const next = [...editingQuotation.items];
                        next[i] = {
                          ...next[i],
                          rate,
                          amount: Number((Number(next[i].quantity) * rate).toFixed(2)),
                        };
                        setEditingQuotation({ ...editingQuotation, items: next });
                      }}
                      className="col-span-2 px-2 py-1.5 font-mono text-right bg-white border border-slate-300 rounded"
                    />
                    <div className="col-span-2 font-mono font-bold text-right">
                      {formatINR(Number(it.quantity) * Number(it.rate))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 font-mono">
                <div>
                  <label className="block font-sans font-semibold text-slate-600 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={editingQuotation.discount}
                    onChange={(e) =>
                      setEditingQuotation({
                        ...editingQuotation,
                        discount: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-sans font-semibold text-slate-600 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={editingQuotation.gstRate}
                    onChange={(e) =>
                      setEditingQuotation({
                        ...editingQuotation,
                        gstRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-lg flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400">Quotation Grand Total</span>
                  <span className="text-lg font-bold text-amber-400">
                    {formatINR(computedQuotationDraft.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowQuotationModal(false)}
                className="px-4 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSaveQuotation(computedQuotationDraft);
                  setShowQuotationModal(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400"
              >
                Save Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GST INVOICE MODAL */}
      {showInvoiceModal && computedInvoiceDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">
                GST Tax Invoice ({computedInvoiceDraft.invoiceNumber})
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Invoice No.
                  </label>
                  <input
                    type="text"
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceNumber: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={editingInvoice.invoiceDate}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceDate: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Customer
                  </label>
                  <select
                    value={editingInvoice.customerId}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      const cust = customers.find((c) => c.id === cid);
                      const bizStateCode = String(business?.stateCode || '27').trim();
                      const custStateCode = String(cust?.stateCode || '27').trim();
                      setEditingInvoice({
                        ...editingInvoice,
                        customerId: cid,
                        customerGstin: cust?.gstin || '',
                        placeOfSupply: `${cust?.state || 'Maharashtra'} (${custStateCode})`,
                        isInterState: bizStateCode !== custStateCode,
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.state})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Place of Supply (Auto GST Rule)
                  </label>
                  <select
                    value={editingInvoice.placeOfSupply}
                    onChange={(e) => {
                      const val = e.target.value;
                      const bizStateCode = String(business?.stateCode || '27').trim();
                      const isInter = !val.includes(`(${bizStateCode})`);
                      setEditingInvoice({
                        ...editingInvoice,
                        placeOfSupply: val,
                        isInterState: isInter,
                      });
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option
                        key={st.code}
                        value={`${st.name} (${st.code})`}
                      >
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg flex flex-wrap items-center justify-between gap-2 font-mono">
                <span>
                  Supply Mode:{' '}
                  <strong>
                    {computedInvoiceDraft.isInterState
                      ? 'INTER-STATE SUPPLY → IGST APPLICABLE'
                      : 'INTRA-STATE SUPPLY → CGST + SGST APPLICABLE'}
                  </strong>
                </span>
                <span>
                  Party GSTIN: {computedInvoiceDraft.customerGstin || 'Unregistered'}
                </span>
              </div>

              {/* Invoice Line Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Invoice Line Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingInvoice({
                        ...editingInvoice,
                        items: [
                          ...editingInvoice.items,
                          {
                            description: 'PVC / POP False Ceiling Installation',
                            hsnSac: '9954',
                            quantity: 100,
                            unit: 'sq.ft',
                            rate: 85,
                            taxableValue: 8500,
                          },
                        ],
                      })
                    }
                    className="px-3 py-1 bg-slate-900 text-white rounded font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                {editingInvoice.items.map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200"
                  >
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => {
                        const next = [...editingInvoice.items];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setEditingInvoice({ ...editingInvoice, items: next });
                      }}
                      className="col-span-5 px-2 py-1.5 bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="text"
                      value={it.hsnSac}
                      onChange={(e) => {
                        const next = [...editingInvoice.items];
                        next[idx] = { ...next[idx], hsnSac: e.target.value };
                        setEditingInvoice({ ...editingInvoice, items: next });
                      }}
                      placeholder="HSN/SAC"
                      className="col-span-2 px-2 py-1.5 font-mono bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => {
                        const qty = Number(e.target.value);
                        const next = [...editingInvoice.items];
                        next[idx] = {
                          ...next[idx],
                          quantity: qty,
                          taxableValue: Number((qty * Number(next[idx].rate)).toFixed(2)),
                        };
                        setEditingInvoice({ ...editingInvoice, items: next });
                      }}
                      className="col-span-2 px-2 py-1.5 font-mono text-right bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="number"
                      value={it.rate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        const next = [...editingInvoice.items];
                        next[idx] = {
                          ...next[idx],
                          rate,
                          taxableValue: Number((Number(next[idx].quantity) * rate).toFixed(2)),
                        };
                        setEditingInvoice({ ...editingInvoice, items: next });
                      }}
                      className="col-span-1 px-2 py-1.5 font-mono text-right bg-white border border-slate-300 rounded"
                    />
                    <div className="col-span-2 font-mono font-bold text-right">
                      {formatINR(Number(it.quantity) * Number(it.rate))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 font-mono">
                <div>
                  <label className="block font-sans font-semibold text-slate-600 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={editingInvoice.discount}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        discount: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-sans font-semibold text-slate-600 mb-1">
                    Configurable GST %
                  </label>
                  <select
                    value={editingInvoice.gstRate}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        gstRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={0}>0% GST</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans font-semibold text-slate-600 mb-1">
                    Advance / Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    value={editingInvoice.amountPaid}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        amountPaid: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-lg">
                  <span className="text-[10px] text-slate-400 block">
                    Grand Total (Tax: {formatINR(computedInvoiceDraft.totalGst)})
                  </span>
                  <span className="text-base font-bold text-amber-400">
                    {formatINR(computedInvoiceDraft.grandTotal)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs">
                <strong>Amount in Words:</strong> {computedInvoiceDraft.amountInWords}
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onSaveInvoice(computedInvoiceDraft);
                  setShowInvoiceModal(false);
                }}
                className="px-5 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400"
              >
                Save & Finalize GST Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT RECORDING MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form
            onSubmit={handleSavePaymentSubmit}
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold">Record Customer Payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Customer
                </label>
                <select
                  value={payCustomerId}
                  onChange={(e) => setPayCustomerId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Against GST Invoice
                </label>
                <select
                  value={payInvoiceId}
                  onChange={(e) =>
                    setPayInvoiceId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                >
                  <option value="">-- General / Advance Receipt --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Due: {formatINR(inv.balanceDue)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    UTR / Cheque / Ref No.
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="UPI/NEFT Ref"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Stage payment / Final settlement"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
              >
                Save Payment & Generate Receipt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
