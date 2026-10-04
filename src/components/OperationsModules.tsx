import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Printer,
  Upload,
  MessageSquare,
  Building2,
  Users,
  Check,
} from 'lucide-react';
import { formatINR, formatNumberIN, INDIAN_STATES } from '../lib/calculations.ts';

// ==========================================
// 1. CUSTOMER MANAGEMENT & HISTORY MODULE
// ==========================================
export const CustomersModule: React.FC<{
  customers: any[];
  measurements: any[];
  quotations: any[];
  boms: any[];
  invoices: any[];
  payments: any[];
  business: any;
  onSaveCustomer: (payload: any) => Promise<void>;
  onDeleteCustomer: (id: number) => Promise<void>;
}> = ({
  customers,
  measurements,
  quotations,
  boms,
  invoices,
  payments,
  business,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(
    customers[0] || null
  );
  const [editing, setEditing] = useState<any | null>(null);
  const [reminderCopied, setReminderCopied] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      (c.gstin || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerStats = (cid: number) => {
    const custInvs = invoices.filter((i) => i.customerId === cid);
    const custPays = payments.filter((p) => p.customerId === cid);
    const totalBilled = custInvs.reduce((s, i) => s + Number(i.grandTotal || 0), 0);
    const totalPaid = custPays.reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = custInvs.reduce((s, i) => s + Number(i.balanceDue || 0), 0);
    return { totalBilled, totalPaid, outstanding };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name, mobile, GSTIN..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>
        <button
          onClick={() =>
            setEditing({
              name: '',
              mobile: '',
              email: '',
              address: '',
              gstin: '',
              pan: '',
              state: 'Maharashtra',
              stateCode: '27',
              siteAddress: '',
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          + Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-3">Customer & GSTIN</th>
                <th className="py-3 px-3">Mobile & Site</th>
                <th className="py-3 px-3 text-right">Billed</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((c) => {
                const st = getCustomerStats(c.id);
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {c.gstin ? `GSTIN: ${c.gstin}` : 'Unregistered'} · {c.state} ({c.stateCode})
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-800">{c.mobile}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {c.siteAddress}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatINR(st.totalBilled)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {formatINR(st.outstanding)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setEditing(c)}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(c.id)}
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

        {/* Complete Customer History & Statement Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          {selectedCustomer ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedCustomer.name} — Complete History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Site: {selectedCustomer.siteAddress}
                  </p>
                </div>
                {(() => {
                  const st = getCustomerStats(selectedCustomer.id);
                  const reminderMsg = `*${
                    business?.businessName || 'NEW ROYAL DECORATORS'
                  }*\nDear *${
                    selectedCustomer.name
                  }*,\nThis is a gentle reminder regarding your outstanding balance of *${formatINR(
                    st.outstanding
                  )}* for False Ceiling / POP work at ${
                    selectedCustomer.siteAddress
                  }.\n\nUPI ID: ${business?.upiId}\nBank: ${
                    business?.bankName
                  } (A/c: ${business?.accountNumber})\nThank you!`;
                  const waHref = `https://wa.me/91${String(
                    selectedCustomer.mobile
                  ).replace(/\D/g, '')}?text=${encodeURIComponent(reminderMsg)}`;

                  return (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(reminderMsg);
                          setReminderCopied(true);
                          setTimeout(() => setReminderCopied(false), 2000);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
                      >
                        {reminderCopied ? 'Copied!' : 'Copy Reminder'}
                      </button>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp Reminder
                      </a>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const cid = selectedCustomer.id;
                const st = getCustomerStats(cid);
                const cMeas = measurements.filter((m) => m.customerId === cid);
                const cQuotes = quotations.filter((q) => q.customerId === cid);
                const cBoms = boms.filter((b) => b.customerId === cid);
                const cInvs = invoices.filter((i) => i.customerId === cid);
                const cPays = payments.filter((p) => p.customerId === cid);

                return (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 font-mono">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Total Billed</span>
                        <span className="font-bold text-slate-900">
                          {formatINR(st.totalBilled)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <span className="text-[10px] text-emerald-700 block">Total Paid</span>
                        <span className="font-bold text-emerald-800">
                          {formatINR(st.totalPaid)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                        <span className="text-[10px] text-rose-700 block">Outstanding</span>
                        <span className="font-bold text-rose-800">
                          {formatINR(st.outstanding)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      <div className="font-semibold text-slate-700">
                        Measurements ({cMeas.length}) · BOMs ({cBoms.length}) · Quotations ({cQuotes.length})
                      </div>
                      {cMeas.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between font-mono"
                        >
                          <span>{m.measurementNumber} ({m.date})</span>
                          <span className="font-bold">{m.totalAreaSqft} sq.ft</span>
                        </div>
                      ))}
                      {cQuotes.map((q) => (
                        <div
                          key={q.id}
                          className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between font-mono"
                        >
                          <span>{q.quotationNumber} ({q.status})</span>
                          <span className="font-bold">{formatINR(q.grandTotal)}</span>
                        </div>
                      ))}

                      <div className="font-semibold text-slate-700 pt-2">
                        GST Invoices ({cInvs.length}) & Payments ({cPays.length})
                      </div>
                      {cInvs.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between font-mono"
                        >
                          <span>
                            {inv.invoiceNumber} · {inv.status}
                          </span>
                          <span className="font-bold">
                            {formatINR(inv.grandTotal)} (Due: {formatINR(inv.balanceDue)})
                          </span>
                        </div>
                      ))}
                      {cPays.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-emerald-50/60 border border-emerald-200 rounded flex justify-between font-mono text-emerald-900"
                        >
                          <span>
                            {p.receiptNumber} · {p.paymentMethod}
                          </span>
                          <span className="font-bold">+{formatINR(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <p className="text-xs text-slate-500">Select a customer to view full history.</p>
          )}
        </div>
      </div>

      {/* Customer Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSaveCustomer(editing);
              setEditing(null);
            }}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl text-xs"
          >
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex justify-between">
              <span>{editing.id ? 'Edit Customer' : 'Add New Customer'}</span>
              <button type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Customer / Party Name *</label>
                <input
                  required
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile *</label>
                <input
                  required
                  type="text"
                  value={editing.mobile}
                  onChange={(e) => setEditing({ ...editing, mobile: e.target.value })}
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editing.email || ''}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">GSTIN</label>
                <input
                  type="text"
                  value={editing.gstin || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, gstin: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">PAN</label>
                <input
                  type="text"
                  value={editing.pan || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, pan: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">State</label>
                <select
                  value={editing.state}
                  onChange={(e) => {
                    const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                    setEditing({
                      ...editing,
                      state: e.target.value,
                      stateCode: st?.code || '27',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">State Code</label>
                <input
                  type="text"
                  value={editing.stateCode}
                  readOnly
                  className="w-full px-3 py-2 font-mono bg-slate-100 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Billing Address</label>
                <input
                  type="text"
                  value={editing.address || ''}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Site Address *</label>
                <input
                  required
                  type="text"
                  value={editing.siteAddress || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, siteAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 text-slate-950 rounded-lg"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. PROJECT / SITE & PHOTO ATTACHMENTS
// ==========================================
const PROJECT_STATUSES = [
  'Lead',
  'Measurement',
  'Quotation',
  'Approved',
  'Work Started',
  'Work Completed',
  'Partially Paid',
  'Fully Paid',
  'Cancelled',
];

export const ProjectsModule: React.FC<{
  projects: any[];
  customers: any[];
  attachments: any[];
  onSaveProject: (payload: any) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onUploadAttachment: (payload: any) => Promise<void>;
  onDeleteAttachment: (id: number) => Promise<void>;
}> = ({
  projects,
  customers,
  attachments,
  onSaveProject,
  onDeleteProject,
  onUploadAttachment,
  onDeleteAttachment,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editing, setEditing] = useState<any | null>(null);
  const [attTitle, setAttTitle] = useState('');
  const [attCategory, setAttCategory] = useState('Site Photo');
  const [attProjectId, setAttProjectId] = useState<number>(projects[0]?.id || 1);

  const filtered = projects.filter(
    (p) => statusFilter === 'ALL' || p.status === statusFilter
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const proj = projects.find((p) => p.id === Number(attProjectId));
      await onUploadAttachment({
        title: attTitle || file.name,
        category: attCategory,
        projectId: attProjectId,
        customerId: proj?.customerId || null,
        fileName: file.name,
        fileType: file.type || 'image/jpeg',
        fileDataUrl: String(reader.result),
      });
      setAttTitle('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', ...PROJECT_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            setEditing({
              projectName: '',
              customerId: customers[0]?.id || 1,
              siteAddress: customers[0]?.siteAddress || '',
              startDate: new Date().toISOString().slice(0, 10),
              expectedCompletionDate: '',
              status: 'Measurement',
              notes: '',
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          + New Site Project
        </button>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-3 px-4">Project & Site Address</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Timeline</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((p) => {
              const cust = customers.find((c) => c.id === p.customerId);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{p.projectName}</div>
                    <div className="text-[11px] text-slate-500">{p.siteAddress}</div>
                    {p.notes && (
                      <div className="text-[11px] text-slate-600 mt-0.5">{p.notes}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {cust?.name || 'Customer'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {p.startDate} → {p.expectedCompletionDate || 'Ongoing'}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={p.status}
                      onChange={(e) => onSaveProject({ ...p, status: e.target.value })}
                      className="px-2 py-1 text-xs font-semibold border border-slate-300 rounded bg-slate-50"
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          onSaveProject({
                            ...p,
                            id: undefined,
                            projectName: `${p.projectName} (Copy)`,
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-medium whitespace-nowrap"
                        title="Duplicate Previous Project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => setEditing(p)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProject(p.id)}
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

      {/* Site Photo & Handwritten Sheet Attachments Section (Section 18) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Site Photos, Handwritten Measurement Sheets & Purchase Bills
            </h3>
            <p className="text-xs text-slate-500">
              Attach site ceilings, handwritten pad photos, customer GST documents, or vendor bills to projects
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={attTitle}
              onChange={(e) => setAttTitle(e.target.value)}
              placeholder="Document / Photo Title"
              className="px-3 py-1.5 border border-slate-300 rounded-lg"
            />
            <select
              value={attCategory}
              onChange={(e) => setAttCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            >
              <option value="Site Photo">Site Photo</option>
              <option value="Handwritten Measurement Sheet">
                Handwritten Measurement Sheet
              </option>
              <option value="Customer Document">Customer Document</option>
              <option value="Purchase Bill">Purchase Bill</option>
            </select>
            <select
              value={attProjectId}
              onChange={(e) => setAttProjectId(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 px-3 py-1.5 font-semibold bg-slate-900 text-white rounded-lg cursor-pointer hover:bg-slate-800 whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              Attach Photo / File
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {attachments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg">
            No site photos or documents attached yet. Use "Attach Photo / File" above to upload.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col justify-between"
              >
                {att.fileDataUrl?.startsWith('data:image') ? (
                  <img
                    src={att.fileDataUrl}
                    alt={att.title}
                    className="w-full h-32 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-slate-200 text-xs font-mono text-slate-600">
                    {att.fileName}
                  </div>
                )}
                <div className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 truncate max-w-[150px]">
                      {att.title}
                    </div>
                    <div className="text-[11px] text-slate-500">{att.category}</div>
                  </div>
                  <button
                    onClick={() => onDeleteAttachment(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSaveProject(editing);
              setEditing(null);
            }}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl text-xs"
          >
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex justify-between">
              <span>{editing.id ? 'Edit Project' : 'Create Project / Site'}</span>
              <button type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block font-semibold mb-1">Project Name *</label>
                <input
                  required
                  type="text"
                  value={editing.projectName}
                  onChange={(e) =>
                    setEditing({ ...editing, projectName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Customer *</label>
                <select
                  value={editing.customerId}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const c = customers.find((cu) => cu.id === cid);
                    setEditing({
                      ...editing,
                      customerId: cid,
                      siteAddress: c?.siteAddress || editing.siteAddress,
                    });
                  }}
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
                <label className="block font-semibold mb-1">Site Address *</label>
                <input
                  required
                  type="text"
                  value={editing.siteAddress}
                  onChange={(e) =>
                    setEditing({ ...editing, siteAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editing.startDate}
                    onChange={(e) =>
                      setEditing({ ...editing, startDate: e.target.value })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={editing.expectedCompletionDate || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        expectedCompletionDate: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value })
                    }
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Site Notes</label>
                <textarea
                  rows={2}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 text-slate-950 rounded-lg"
              >
                Save Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. PRODUCT / MATERIAL MASTER MODULE
// ==========================================
const PRODUCT_UNITS = [
  'sq.ft',
  'sq.m',
  'piece',
  'box',
  'kg',
  'meter',
  'feet',
  'running feet',
  'hour',
  'day',
  'job',
];

const PRODUCT_CATEGORIES = [
  'PVC Ceiling',
  'POP Ceiling',
  'Gypsum Ceiling',
  'False Ceiling',
  'GI Framework',
  'Electrical',
  'Lighting',
  'Painting',
  'Interior Decoration',
  'Hardware',
  'Other',
];

export const ProductsModule: React.FC<{
  products: any[];
  onSaveProduct: (payload: any) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
}> = ({ products, onSaveProduct, onDeleteProduct }) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search material by name, SKU, category..."
          className="w-full max-w-md px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
        />
        <button
          onClick={() =>
            setEditing({
              name: '',
              sku: `NRD-MAT-0${products.length + 1}`,
              category: 'PVC Ceiling',
              brand: 'Royal Plast',
              hsnSac: '3925',
              unit: 'sq.ft',
              purchasePrice: 40,
              sellingPrice: 65,
              gstRate: 18,
              stockQuantity: 500,
              minStockLevel: 100,
            })
          }
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          + Add Material / Product
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-3 px-3">SKU</th>
              <th className="py-3 px-3">Material / Product Name</th>
              <th className="py-3 px-3">Category · Brand</th>
              <th className="py-3 px-3">HSN/SAC</th>
              <th className="py-3 px-3">Unit</th>
              <th className="py-3 px-3 text-right">Purchase ₹</th>
              <th className="py-3 px-3 text-right">Selling ₹</th>
              <th className="py-3 px-3 text-right">GST %</th>
              <th className="py-3 px-3 text-right">Stock</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((p) => {
              const isLowStock =
                Number(p.stockQuantity) <= Number(p.minStockLevel);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {p.sku}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-3 text-slate-600">
                    {p.category} · {p.brand}
                  </td>
                  <td className="py-3 px-3 font-mono">{p.hsnSac}</td>
                  <td className="py-3 px-3 font-mono">{p.unit}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatINR(p.purchasePrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(p.sellingPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{p.gstRate}%</td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span
                      className={
                        isLowStock ? 'text-rose-700 font-bold' : 'text-slate-900'
                      }
                    >
                      {formatNumberIN(p.stockQuantity, 0)} {p.unit}
                    </span>
                    {isLowStock && (
                      <span className="block text-[10px] text-rose-600">
                        Low Stock Alert
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSaveProduct(editing);
              setEditing(null);
            }}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl text-xs"
          >
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex justify-between">
              <span>{editing.id ? 'Edit Material' : 'Add Material to Master'}</span>
              <button type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Product / Material Name *</label>
                <input
                  required
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">SKU Code</label>
                <input
                  type="text"
                  value={editing.sku}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Brand</label>
                <input
                  type="text"
                  value={editing.brand}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">HSN / SAC</label>
                <input
                  type="text"
                  value={editing.hsnSac}
                  onChange={(e) =>
                    setEditing({ ...editing, hsnSac: e.target.value })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Unit</label>
                <select
                  value={editing.unit}
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">GST Rate (%)</label>
                <select
                  value={Number(editing.gstRate)}
                  onChange={(e) =>
                    setEditing({ ...editing, gstRate: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  value={editing.purchasePrice}
                  onChange={(e) =>
                    setEditing({ ...editing, purchasePrice: e.target.value })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  value={editing.sellingPrice}
                  onChange={(e) =>
                    setEditing({ ...editing, sellingPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editing.stockQuantity}
                  onChange={(e) =>
                    setEditing({ ...editing, stockQuantity: e.target.value })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Min Stock Alert Level</label>
                <input
                  type="number"
                  value={editing.minStockLevel}
                  onChange={(e) =>
                    setEditing({ ...editing, minStockLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-amber-500 text-slate-950 rounded-lg"
              >
                Save Material
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. REPORTS, GST SUMMARY & EXPENSES MODULE
// ==========================================
export const ReportsModule: React.FC<{
  invoices: any[];
  customers: any[];
  projects: any[];
  expenses: any[];
  boms: any[];
  onCreateExpense: (payload: any) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
}> = ({
  invoices,
  customers,
  projects,
  expenses,
  boms,
  onCreateExpense,
  onDeleteExpense,
}) => {
  const [reportTab, setReportTab] = useState<
    'GST' | 'PROFITABILITY' | 'OUTSTANDING' | 'EXPENSES'
  >('GST');
  const [expCategory, setExpCategory] = useState('Material Purchase');
  const [expProjectId, setExpProjectId] = useState<number | ''>(
    projects[0]?.id || ''
  );
  const [expVendor, setExpVendor] = useState('');
  const [expAmount, setExpAmount] = useState(5000);
  const [expMethod, setExpMethod] = useState('UPI');
  const [expNotes, setExpNotes] = useState('');

  const gstTotals = invoices.reduce(
    (acc, inv) => {
      acc.taxable += Number(inv.taxableValue || 0);
      acc.cgst += Number(inv.cgstAmount || 0);
      acc.sgst += Number(inv.sgstAmount || 0);
      acc.igst += Number(inv.igstAmount || 0);
      acc.totalGst += Number(inv.totalGst || 0);
      acc.grandTotal += Number(inv.grandTotal || 0);
      return acc;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, grandTotal: 0 }
  );

  const exportCsv = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentReport = () => {
    if (reportTab === 'GST') {
      exportCsv(
        'NRD_GST_Return_Summary.csv',
        [
          'Invoice No',
          'Date',
          'Customer',
          'Customer GSTIN',
          'Place of Supply',
          'HSN/SAC',
          'Taxable Value',
          'CGST',
          'SGST',
          'IGST',
          'Total GST',
          'Grand Total',
        ],
        invoices.map((i) => {
          const c = customers.find((cu) => cu.id === i.customerId);
          return [
            i.invoiceNumber,
            i.invoiceDate,
            c?.name || '',
            i.customerGstin || c?.gstin || 'Unregistered',
            i.placeOfSupply,
            i.items?.[0]?.hsnSac || '9954',
            i.taxableValue,
            i.cgstAmount,
            i.sgstAmount,
            i.igstAmount,
            i.totalGst,
            i.grandTotal,
          ];
        })
      );
    } else {
      exportCsv(
        'NRD_Project_Profitability_Report.csv',
        ['Project', 'Customer', 'Invoiced Revenue', 'Material Cost', 'Labour Cost', 'Net Profit'],
        projects.map((p) => {
          const c = customers.find((cu) => cu.id === p.customerId);
          const pInvs = invoices.filter((i) => i.projectId === p.id);
          const rev = pInvs.reduce((s, i) => s + Number(i.taxableValue || 0), 0);
          const pExps = expenses.filter((e) => e.projectId === p.id);
          const mat = pExps
            .filter((e) => e.category === 'Material Purchase')
            .reduce((s, e) => s + Number(e.amount || 0), 0);
          const lab = pExps
            .filter((e) => e.category === 'Site Labour')
            .reduce((s, e) => s + Number(e.amount || 0), 0);
          return [p.projectName, c?.name || '', rev, mat, lab, rev - mat - lab];
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'GST', label: 'GST Return Summary (GSTR-1)' },
            { id: 'PROFITABILITY', label: 'Project Profitability & Material/Labour' },
            { id: 'OUTSTANDING', label: 'Customer Outstanding Report' },
            { id: 'EXPENSES', label: 'Material Purchase & Site Labour Expenses' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setReportTab(t.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                reportTab === t.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrentReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel / CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {reportTab === 'GST' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 block">Taxable Sales</span>
              <span className="text-base font-bold text-slate-900">
                {formatINR(gstTotals.taxable)}
              </span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 block">Total CGST</span>
              <span className="text-base font-bold text-slate-900">
                {formatINR(gstTotals.cgst)}
              </span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 block">Total SGST</span>
              <span className="text-base font-bold text-slate-900">
                {formatINR(gstTotals.sgst)}
              </span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 block">Total IGST</span>
              <span className="text-base font-bold text-slate-900">
                {formatINR(gstTotals.igst)}
              </span>
            </div>
            <div className="p-4 bg-slate-900 text-white rounded-xl">
              <span className="text-xs text-slate-400 block">Total GST Liability</span>
              <span className="text-base font-bold text-amber-400">
                {formatINR(gstTotals.totalGst)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-3">Invoice Date</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Customer GSTIN</th>
                  <th className="py-3 px-3">HSN/SAC</th>
                  <th className="py-3 px-3 text-right">Taxable Sales</th>
                  <th className="py-3 px-3 text-right">CGST</th>
                  <th className="py-3 px-3 text-right">SGST</th>
                  <th className="py-3 px-3 text-right">IGST</th>
                  <th className="py-3 px-3 text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {invoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-3 font-sans font-medium">
                        {cust?.name}
                      </td>
                      <td className="py-2.5 px-3">
                        {inv.customerGstin || cust?.gstin || 'URD'}
                      </td>
                      <td className="py-2.5 px-3">
                        {inv.items?.[0]?.hsnSac || '9954'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatINR(inv.taxableValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatINR(inv.cgstAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatINR(inv.sgstAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatINR(inv.igstAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatINR(inv.totalGst)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportTab === 'PROFITABILITY' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Taxable Billed</th>
                <th className="py-3 px-4 text-right">Material Cost</th>
                <th className="py-3 px-4 text-right">Labour Cost</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {projects.map((p) => {
                const cust = customers.find((c) => c.id === p.customerId);
                const pInvs = invoices.filter((i) => i.projectId === p.id);
                const billed = pInvs.reduce(
                  (s, i) => s + Number(i.taxableValue || 0),
                  0
                );
                const pExps = expenses.filter((e) => e.projectId === p.id);
                const matCost = pExps
                  .filter((e) => e.category === 'Material Purchase')
                  .reduce((s, e) => s + Number(e.amount || 0), 0);
                const labCost = pExps
                  .filter((e) => e.category === 'Site Labour')
                  .reduce((s, e) => s + Number(e.amount || 0), 0);
                const profit = billed - matCost - labCost;

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {p.projectName}
                    </td>
                    <td className="py-3 px-4 font-sans">{cust?.name}</td>
                    <td className="py-3 px-4 text-right">{formatINR(billed)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatINR(matCost)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatINR(labCost)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatINR(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportTab === 'OUTSTANDING' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Customer & Mobile</th>
                <th className="py-3 px-4 text-right">Invoice Total</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {invoices
                .filter((i) => Number(i.balanceDue) > 0)
                .map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);
                  return (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-bold">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-sans">
                        {cust?.name} ({cust?.mobile})
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700">
                        {formatINR(inv.amountPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {formatINR(inv.balanceDue)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {reportTab === 'EXPENSES' && (
        <div className="space-y-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onCreateExpense({
                expenseDate: new Date().toISOString().slice(0, 10),
                category: expCategory,
                projectId: expProjectId || null,
                vendorName: expVendor,
                amount: expAmount,
                paymentMethod: expMethod,
                notes: expNotes,
              });
              setExpVendor('');
              setExpNotes('');
            }}
            className="bg-white p-4 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs"
          >
            <div>
              <label className="block font-semibold mb-1">Expense Category</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              >
                <option value="Material Purchase">Material Purchase</option>
                <option value="Site Labour">Site Labour</option>
                <option value="Transport">Transport</option>
                <option value="Scaffolding">Scaffolding</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Project</label>
              <select
                value={expProjectId}
                onChange={(e) =>
                  setExpProjectId(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Vendor / Contractor</label>
              <input
                type="text"
                required
                value={expVendor}
                onChange={(e) => setExpVendor(e.target.value)}
                placeholder="Supplier or Karigar Name"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="w-full px-2.5 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Notes</label>
              <input
                type="text"
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                placeholder="Bill No / Stage"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 font-bold bg-amber-500 text-slate-950 rounded-lg"
            >
              + Add Expense
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Crew</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td className="py-2.5 px-4 font-mono">{ex.expenseDate}</td>
                    <td className="py-2.5 px-4 font-semibold">{ex.category}</td>
                    <td className="py-2.5 px-4">{ex.vendorName}</td>
                    <td className="py-2.5 px-4 text-slate-500">{ex.notes}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {formatINR(ex.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(ex.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. SETTINGS, BUSINESS PROFILE & ROLES
// ==========================================
export const SettingsModule: React.FC<{
  business: any;
  users: any[];
  currentUserRole: string;
  onSetCurrentUserRole: (role: string) => void;
  onSaveBusiness: (payload: any) => Promise<void>;
  onAddStaffUser: (payload: any) => Promise<void>;
  fullWorkspaceData: any;
}> = ({
  business,
  users,
  currentUserRole,
  onSetCurrentUserRole,
  onSaveBusiness,
  onAddStaffUser,
  fullWorkspaceData,
}) => {
  const [form, setForm] = useState<any>({ ...business });
  const [savedBanner, setSavedBanner] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Site Staff');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveBusiness(form);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleBackupExport = () => {
    const blob = new Blob([JSON.stringify(fullWorkspaceData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEW_ROYAL_DECORATORS_BACKUP_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Editable Business Profile Form */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Business Profile, GSTIN, Bank & Invoice Prefix Settings
            </h3>
          </div>
          {savedBanner && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Check className="w-4 h-4" />
              Profile Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={form.businessName || ''}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Business Category / Specializations
            </label>
            <input
              type="text"
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Office / Showroom Address
            </label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mobile Numbers
            </label>
            <input
              type="text"
              value={form.mobileNumbers || ''}
              onChange={(e) => setForm({ ...form, mobileNumbers: e.target.value })}
              className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={form.gstin || ''}
              onChange={(e) =>
                setForm({ ...form, gstin: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              PAN
            </label>
            <input
              type="text"
              value={form.pan || ''}
              onChange={(e) =>
                setForm({ ...form, pan: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              State
            </label>
            <select
              value={form.state || 'Maharashtra'}
              onChange={(e) => {
                const st = INDIAN_STATES.find((s) => s.name === e.target.value);
                setForm({
                  ...form,
                  state: e.target.value,
                  stateCode: st?.code || '27',
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              State Code & Default GST %
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.stateCode || '27'}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
              <select
                value={Number(form.defaultGstRate || 18)}
                onChange={(e) =>
                  setForm({ ...form, defaultGstRate: e.target.value })
                }
                className="px-2 py-2 font-mono border border-slate-300 rounded-lg"
              >
                <option value={0}>0% GST</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          {/* Bank & UPI */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bank Name & Branch
            </label>
            <input
              type="text"
              value={form.bankName || ''}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Account Number & IFSC
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.accountNumber || ''}
                onChange={(e) =>
                  setForm({ ...form, accountNumber: e.target.value })
                }
                className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={form.ifscCode || ''}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              value={form.upiId || ''}
              onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Invoice & Quotation Numbering Prefix
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={form.invoicePrefix || ''}
                onChange={(e) =>
                  setForm({ ...form, invoicePrefix: e.target.value })
                }
                className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={form.quotationPrefix || ''}
                onChange={(e) =>
                  setForm({ ...form, quotationPrefix: e.target.value })
                }
                className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Terms & Conditions (Printed on Quotations & GST Invoices)
            </label>
            <textarea
              rows={4}
              value={form.termsAndConditions || ''}
              onChange={(e) =>
                setForm({ ...form, termsAndConditions: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleBackupExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export Full Database Backup (JSON)
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg"
          >
            Save Business Profile & GST Settings
          </button>
        </div>
      </form>

      {/* User Roles & RBAC Management (Section 21) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Users className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">
            User Roles & Permissions
          </h3>
        </div>

        <div className="p-3.5 bg-slate-900 text-white rounded-lg space-y-2">
          <label className="block text-[11px] text-amber-400 font-semibold">
            Active Role Simulation (RBAC Enforcement)
          </label>
          <select
            value={currentUserRole}
            onChange={(e) => onSetCurrentUserRole(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold"
          >
            <option value="Admin">Admin (Full Access)</option>
            <option value="Manager">Manager</option>
            <option value="Billing Staff">Billing Staff</option>
            <option value="Site Staff">
              Site Staff (Measurements Allowed · Finalized Invoices Locked)
            </option>
            <option value="Accountant">Accountant</option>
          </select>
          <p className="text-[11px] text-slate-400">
            Switching to "Site Staff" allows creating site measurements while restricting modifications to finalized GST invoices.
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!staffName.trim()) return;
            await onAddStaffUser({
              name: staffName,
              email: staffEmail || 'staff@newroyaldecorators.in',
              role: staffRole,
            });
            setStaffName('');
            setStaffEmail('');
          }}
          className="space-y-2 border-t border-slate-200 pt-3"
        >
          <div className="font-semibold text-slate-800">Add Staff User</div>
          <input
            type="text"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            placeholder="Staff Full Name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="Email"
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              className="px-2 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Billing Staff">Billing Staff</option>
              <option value="Site Staff">Site Staff</option>
              <option value="Accountant">Accountant</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            + Add Team Member
          </button>
        </form>

        <div className="space-y-2 pt-2">
          <div className="font-semibold text-slate-700">
            Team Directory ({users.length})
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">{u.name}</div>
                <div className="text-[11px] text-slate-500">{u.email}</div>
              </div>
              <span className="font-mono font-semibold text-slate-700">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
