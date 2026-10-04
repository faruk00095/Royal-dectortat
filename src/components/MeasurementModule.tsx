import React, { useState, useMemo } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  Printer,
  Layers,
  FileCheck,
  Calculator,
  StickyNote,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CalcType,
  parseContractorExpression,
  calculateMeasurementItem,
  formatINR,
  formatNumberIN,
} from '../lib/calculations.ts';

interface MeasurementModuleProps {
  measurements: any[];
  customers: any[];
  projects: any[];
  business: any;
  currentUserRole: string;
  onSaveMeasurement: (payload: any) => Promise<void>;
  onDeleteMeasurement: (id: number) => Promise<void>;
  onConvertToBom: (measurement: any) => void;
  onConvertToQuotation: (measurement: any) => void;
  onOpenPrint: (measurement: any) => void;
  onOpenKeep: (title: string, body: string) => void;
}

const SECTIONS = [
  'Ground Floor',
  'First Floor',
  'Second Floor',
  'Hall',
  'Bedroom',
  'Kitchen',
  'Site Fascia',
  'Wall',
  'Ceiling',
  'Custom Section',
];

const WORK_TYPES = [
  'PVC Ceiling',
  'POP Ceiling',
  'Gypsum Ceiling',
  'False Ceiling',
  'Flower & Border',
  'GI Framing',
  'Wall Panelling',
];

export const MeasurementModule: React.FC<MeasurementModuleProps> = ({
  measurements,
  customers,
  projects,
  business,
  onSaveMeasurement,
  onDeleteMeasurement,
  onConvertToBom,
  onConvertToQuotation,
  onOpenPrint,
  onOpenKeep,
}) => {
  const [selectedId, setSelectedId] = useState<number | 'NEW'>(
    measurements[0]?.id || 'NEW'
  );
  const [viewMode, setViewMode] = useState<'SHEET' | 'HANDWRITTEN'>('SHEET');
  const [saving, setSaving] = useState(false);

  const activeRecord = useMemo(() => {
    if (selectedId === 'NEW') return null;
    return measurements.find((m) => m.id === selectedId) || null;
  }, [measurements, selectedId]);

  const [customerId, setCustomerId] = useState<number>(
    activeRecord?.customerId || customers[0]?.id || 1
  );
  const [projectId, setProjectId] = useState<number | ''>(
    activeRecord?.projectId || projects[0]?.id || ''
  );
  const [measurementNumber, setMeasurementNumber] = useState<string>(
    activeRecord?.measurementNumber ||
      `${business?.measurementPrefix || 'NRD/26-27/MS-'}00${measurements.length + 1}`
  );
  const [date, setDate] = useState<string>(
    activeRecord?.date || new Date().toISOString().slice(0, 10)
  );
  const [siteName, setSiteName] = useState<string>(
    activeRecord?.siteName ||
      customers.find((c) => c.id === customerId)?.siteAddress ||
      'Site Location'
  );
  const [items, setItems] = useState<any[]>(activeRecord?.items || []);
  const [otherCharges, setOtherCharges] = useState<number>(
    Number(activeRecord?.otherCharges || 0)
  );
  const [discount, setDiscount] = useState<number>(Number(activeRecord?.discount || 0));
  const [gstRate, setGstRate] = useState<number>(
    Number(activeRecord?.gstRate || business?.defaultGstRate || 18)
  );
  const [notes, setNotes] = useState<string>(activeRecord?.notes || '');

  // Quick Mobile-First Site Entry State
  const [quickSection, setQuickSection] = useState('Ground Floor');
  const [quickCustomSection, setQuickCustomSection] = useState('');
  const [quickRoom, setQuickRoom] = useState('Bed Room');
  const [quickWorkType, setQuickWorkType] = useState('PVC Ceiling');
  const [quickExpr, setQuickExpr] = useState('14 x 11');
  const [quickLength, setQuickLength] = useState('14');
  const [quickWidth, setQuickWidth] = useState('11');
  const [quickQty, setQuickQty] = useState(1);
  const [quickCalcType, setQuickCalcType] = useState<CalcType>('SQFT');
  const [quickRate, setQuickRate] = useState(85);
  const [quickDesc, setQuickDesc] = useState('');

  // Load selected sheet into editor when switching
  const handleSelectMeasurement = (m: any | 'NEW') => {
    if (m === 'NEW') {
      setSelectedId('NEW');
      const nextNum = `${business?.measurementPrefix || 'NRD/26-27/MS-'}${String(
        measurements.length + 1
      ).padStart(3, '0')}`;
      setMeasurementNumber(nextNum);
      setDate(new Date().toISOString().slice(0, 10));
      const defaultCust = customers[0];
      setCustomerId(defaultCust?.id || 1);
      setProjectId('');
      setSiteName(defaultCust?.siteAddress || '');
      setItems([]);
      setOtherCharges(0);
      setDiscount(0);
      setGstRate(Number(business?.defaultGstRate || 18));
      setNotes('');
    } else {
      setSelectedId(m.id);
      setMeasurementNumber(m.measurementNumber);
      setDate(m.date);
      setCustomerId(m.customerId);
      setProjectId(m.projectId || '');
      setSiteName(m.siteName);
      setItems(m.items || []);
      setOtherCharges(Number(m.otherCharges || 0));
      setDiscount(Number(m.discount || 0));
      setGstRate(Number(m.gstRate || 18));
      setNotes(m.notes || '');
    }
  };

  // Sync quick expression (e.g. "10 x 3'6"") with Length/Width/Qty
  const handleQuickExprChange = (val: string) => {
    setQuickExpr(val);
    const parsed = parseContractorExpression(val);
    setQuickLength(parsed.lengthInput);
    setQuickWidth(parsed.widthInput);
    setQuickQty(parsed.quantity);
  };

  const livePreview = useMemo(() => {
    return calculateMeasurementItem({
      lengthInput: quickLength,
      widthInput: quickWidth,
      quantity: quickQty,
      calcType: quickCalcType,
      rate: quickRate,
    });
  }, [quickLength, quickWidth, quickQty, quickCalcType, quickRate]);

  const handleAddQuickItem = () => {
    const finalSection =
      quickSection === 'Custom Section' && quickCustomSection.trim()
        ? quickCustomSection.trim()
        : quickSection;

    const newItem = {
      id: Date.now(),
      section: finalSection,
      room: quickRoom || 'Room',
      workType: quickWorkType,
      description:
        quickDesc || `${quickRoom} ${quickWorkType} (${quickLength} × ${quickWidth})`,
      rawExpression: `${quickLength} x ${quickWidth}`,
      lengthInput: quickLength,
      widthInput: quickWidth,
      lengthFeet: livePreview.lengthFeet,
      widthFeet: livePreview.widthFeet,
      quantity: quickQty,
      calcType: quickCalcType,
      areaSqft: livePreview.areaSqft,
      rate: quickRate,
      amount: livePreview.amount,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const handleRepeatLastMeasurement = () => {
    if (items.length === 0) return;
    const last = items[items.length - 1];
    setItems((prev) => [
      ...prev,
      {
        ...last,
        id: Date.now(),
      },
    ]);
  };

  const handleUpdateRow = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      const calc = calculateMeasurementItem({
        lengthInput: row.lengthInput,
        widthInput: row.widthInput,
        quantity: Number(row.quantity),
        calcType: row.calcType as CalcType,
        rate: Number(row.rate),
      });
      row.lengthFeet = calc.lengthFeet;
      row.widthFeet = calc.widthFeet;
      row.areaSqft = calc.areaSqft;
      row.amount = calc.amount;
      row.rawExpression = `${row.lengthInput} x ${row.widthInput}`;
      updated[index] = row;
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals & Estimate Summary
  const summary = useMemo(() => {
    let totalAreaSqft = 0;
    let pvcCeilingSqft = 0;
    let popCeilingSqft = 0;
    let gypsumCeilingSqft = 0;
    let itemsSubtotal = 0;

    items.forEach((item) => {
      const area = Number(item.areaSqft || 0);
      const amt = Number(item.amount || 0);
      totalAreaSqft += area;
      itemsSubtotal += amt;

      const wt = String(item.workType || '').toLowerCase();
      if (wt.includes('pvc')) pvcCeilingSqft += area;
      else if (wt.includes('pop') || wt.includes('flower')) popCeilingSqft += area;
      else if (wt.includes('gypsum')) gypsumCeilingSqft += area;
    });

    // Estimate split: 65% Material, 35% Labour
    const materialEstimate = Number((itemsSubtotal * 0.65).toFixed(2));
    const labourEstimate = Number((itemsSubtotal * 0.35).toFixed(2));
    const taxableAmount = Math.max(
      0,
      Number((itemsSubtotal + Number(otherCharges || 0) - Number(discount || 0)).toFixed(2))
    );
    const gstAmount = Number(((taxableAmount * Number(gstRate || 0)) / 100).toFixed(2));
    const grandTotal = Number((taxableAmount + gstAmount).toFixed(2));

    return {
      totalAreaSqft: Number(totalAreaSqft.toFixed(2)),
      pvcCeilingSqft: Number(pvcCeilingSqft.toFixed(2)),
      popCeilingSqft: Number(popCeilingSqft.toFixed(2)),
      gypsumCeilingSqft: Number(gypsumCeilingSqft.toFixed(2)),
      itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
      materialEstimate,
      labourEstimate,
      taxableAmount,
      gstAmount,
      grandTotal,
    };
  }, [items, otherCharges, discount, gstRate]);

  const currentPayload = {
    id: selectedId === 'NEW' ? undefined : selectedId,
    measurementNumber,
    date,
    customerId,
    projectId: projectId || null,
    siteName,
    ...summary,
    otherCharges,
    discount,
    gstRate,
    notes,
    items,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveMeasurement(currentPayload);
    } finally {
      setSaving(false);
    }
  };

  // Group items by section for Handwritten View
  const groupedBySection = useMemo(() => {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const sec = item.section || 'Ground Floor';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(item);
    });
    return groups;
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Top Bar: Sheet Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'NEW') handleSelectMeasurement('NEW');
              else {
                const found = measurements.find((m) => m.id === Number(val));
                if (found) handleSelectMeasurement(found);
              }
            }}
            className="px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
          >
            {measurements.map((m) => {
              const c = customers.find((cust) => cust.id === m.customerId);
              return (
                <option key={m.id} value={m.id}>
                  {m.measurementNumber} — {c?.name || 'Customer'} ({m.totalAreaSqft} sq.ft)
                </option>
              );
            })}
            <option value="NEW">+ Create New Measurement Sheet</option>
          </select>

          <button
            onClick={() => handleSelectMeasurement('NEW')}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
          >
            + New Sheet
          </button>

          {/* Segmented View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('SHEET')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'SHEET'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Digital Entry Grid
            </button>
            <button
              onClick={() => setViewMode('HANDWRITTEN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                viewMode === 'HANDWRITTEN'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Handwritten Pad View
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onConvertToBom(currentPayload)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5" />
            Convert to BOM
          </button>
          <button
            onClick={() => onConvertToQuotation(currentPayload)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Convert to Quotation
          </button>
          <button
            onClick={() =>
              onOpenKeep(
                `Site Measurement ${measurementNumber} - ${siteName}`,
                items
                  .map(
                    (i) =>
                      `${i.section} (${i.room}): ${i.lengthInput} x ${i.widthInput} = ${i.areaSqft} sq.ft (${i.workType})`
                  )
                  .join('\n') + `\nTotal Area: ${summary.totalAreaSqft} sq.ft`
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg transition-colors whitespace-nowrap"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Save to Google Keep
          </button>
          <button
            onClick={() => onOpenPrint(currentPayload)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
          >
            {saving ? 'Saving...' : 'Save Measurement Sheet'}
          </button>
        </div>
      </div>

      {/* Sheet Header Metadata */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Ref / Sheet No.
          </label>
          <input
            type="text"
            value={measurementNumber}
            onChange={(e) => setMeasurementNumber(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Customer
          </label>
          <select
            value={customerId}
            onChange={(e) => {
              const cid = Number(e.target.value);
              setCustomerId(cid);
              const found = customers.find((c) => c.id === cid);
              if (found?.siteAddress) setSiteName(found.siteAddress);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobile})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Linked Project
          </label>
          <select
            value={projectId}
            onChange={(e) =>
              setProjectId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            <option value="">-- Select Project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Site Location / Address
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="e.g. Royal Bunglow No. 7, Prabhat Road"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* MOBILE-FIRST FAST CONTRACTOR MEASUREMENT ENTRY PAD */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold tracking-wide text-amber-400">
              Mobile-First Site Measurement Entry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter dimensions like <span className="font-mono text-white">14 x 11</span>,{' '}
              <span className="font-mono text-white">28 x 5</span>,{' '}
              <span className="font-mono text-white">10 x 3'6"</span>, or{' '}
              <span className="font-mono text-white">16 x 5'6"</span> — Feet & inches convert automatically
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 font-mono">
            <div>
              <span className="text-[11px] text-slate-400 block">Instant Area</span>
              <span className="text-base font-bold text-amber-400">
                {formatNumberIN(livePreview.areaSqft)}{' '}
                {quickCalcType === 'RUNNING_FEET'
                  ? 'RFT'
                  : quickCalcType === 'PIECE'
                  ? 'PCS'
                  : 'sq.ft'}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-700" />
            <div>
              <span className="text-[11px] text-slate-400 block">Instant Amount</span>
              <span className="text-base font-bold text-emerald-400">
                {formatINR(livePreview.amount)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Floor / Section</label>
            <select
              value={quickSection}
              onChange={(e) => setQuickSection(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {quickSection === 'Custom Section' && (
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Custom Section</label>
              <input
                type="text"
                value={quickCustomSection}
                onChange={(e) => setQuickCustomSection(e.target.value)}
                placeholder="e.g. Terrace Lobby"
                className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Room / Area</label>
            <input
              type="text"
              value={quickRoom}
              onChange={(e) => setQuickRoom(e.target.value)}
              placeholder="Bedroom / Hall"
              className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-amber-300 font-semibold mb-1">
              Quick Size (e.g. 16 x 5'6")
            </label>
            <input
              type="text"
              value={quickExpr}
              onChange={(e) => handleQuickExprChange(e.target.value)}
              placeholder="14 x 11 or 10 x 3'6&quot;"
              className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-slate-950 border border-amber-500/70 rounded-lg text-amber-300"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">
              Length ({livePreview.lengthFeet} ft)
            </label>
            <input
              type="text"
              value={quickLength}
              onChange={(e) => setQuickLength(e.target.value)}
              placeholder="16 or 10'6&quot;"
              className="w-full px-2.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">
              Width ({livePreview.widthFeet} ft)
            </label>
            <input
              type="text"
              value={quickWidth}
              onChange={(e) => setQuickWidth(e.target.value)}
              placeholder="5'6&quot; or 11"
              className="w-full px-2.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Work Type</label>
            <select
              value={quickWorkType}
              onChange={(e) => setQuickWorkType(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Calc Type</label>
            <select
              value={quickCalcType}
              onChange={(e) => setQuickCalcType(e.target.value as CalcType)}
              className="w-full px-2.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="SQFT">SQFT (L×W×Q)</option>
              <option value="RUNNING_FEET">RUNNING_FEET (L×Q)</option>
              <option value="PIECE">PIECE (Qty)</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 mb-1">Rate (₹)</label>
            <input
              type="number"
              value={quickRate}
              onChange={(e) => setQuickRate(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Large Mobile-Friendly + ADD MEASUREMENT Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Quick Presets:</span>
            {['14 x 11', '28 x 5', '10 x 3\'6"', '16 x 5\'6"', '11 x 4', '8 x 4'].map(
              (preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickExprChange(preset)}
                  className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  {preset}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepeatLastMeasurement}
              disabled={items.length === 0}
              className="flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40 whitespace-nowrap"
            >
              <Copy className="w-4 h-4" />
              Repeat Previous
            </button>
            <button
              type="button"
              onClick={handleAddQuickItem}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              + ADD MEASUREMENT
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: DIGITAL ENTRY GRID */}
      {viewMode === 'SHEET' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Section</th>
                  <th className="py-3 px-3">Room & Work Type</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Length</th>
                  <th className="py-3 px-3">Width</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3">Calc Mode</th>
                  <th className="py-3 px-3 text-right">Calculated Area</th>
                  <th className="py-3 px-3 text-right">Rate (₹)</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-500">
                      No measurement entries yet. Use the + ADD MEASUREMENT bar above to log dimensions.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.section}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'section', e.target.value)
                          }
                          className="w-28 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            value={item.room}
                            onChange={(e) =>
                              handleUpdateRow(idx, 'room', e.target.value)
                            }
                            className="w-28 px-2 py-1 text-xs font-semibold border border-slate-200 rounded bg-white"
                          />
                          <select
                            value={item.workType}
                            onChange={(e) =>
                              handleUpdateRow(idx, 'workType', e.target.value)
                            }
                            className="w-28 px-1.5 py-0.5 text-[11px] border border-slate-200 rounded bg-slate-50"
                          >
                            {WORK_TYPES.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'description', e.target.value)
                          }
                          className="w-44 px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.lengthInput}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'lengthInput', e.target.value)
                          }
                          className="w-16 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                        <span className="block text-[10px] font-mono text-slate-400">
                          ={Number(item.lengthFeet).toFixed(2)}ft
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.widthInput}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'widthInput', e.target.value)
                          }
                          className="w-16 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                        <span className="block text-[10px] font-mono text-slate-400">
                          ={Number(item.widthFeet).toFixed(2)}ft
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'quantity', e.target.value)
                          }
                          className="w-14 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={item.calcType}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'calcType', e.target.value)
                          }
                          className="px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        >
                          <option value="SQFT">SQFT</option>
                          <option value="RUNNING_FEET">RFT</option>
                          <option value="PIECE">PIECE</option>
                          <option value="FIXED_AMOUNT">FIXED</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumberIN(item.areaSqft)}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          {item.calcType === 'RUNNING_FEET'
                            ? 'rft'
                            : item.calcType === 'PIECE'
                            ? 'pcs'
                            : 'sq.ft'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleUpdateRow(idx, 'rate', e.target.value)
                          }
                          className="w-20 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: HANDWRITTEN CONTRACTOR SHEET RECREATION (Section 24) */
        <div className="bg-amber-50/60 border-2 border-slate-900 rounded-xl p-6 max-w-3xl mx-auto font-mono shadow-sm space-y-5">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl font-bold tracking-wider text-slate-950">
              {business?.businessName || 'NEW ROYAL DECORATORS'}
            </h2>
            <p className="text-xs text-slate-700 mt-1">{business?.category}</p>
            <div className="flex justify-between text-xs mt-4 pt-2 border-t border-dashed border-slate-400">
              <span>Ref: {measurementNumber}</span>
              <span>Date: {date}</span>
            </div>
            <div className="text-left text-xs mt-2">
              <span className="font-bold">SITE:</span> {siteName}
            </div>
          </div>

          <div className="space-y-5">
            {Object.entries(groupedBySection).map(([sectionTitle, secRows]) => (
              <div key={sectionTitle} className="space-y-2">
                <div className="inline-block border-b-2 border-slate-900 font-bold text-sm uppercase tracking-wider text-slate-950">
                  {sectionTitle}
                </div>
                <div className="pl-2 space-y-1.5 text-xs">
                  {secRows.map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between border-b border-dotted border-slate-300 pb-1"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          ROOM: {String(r.room).toUpperCase()}
                        </span>{' '}
                        <span className="text-slate-500">({r.workType})</span>
                      </div>
                      <div className="font-bold text-slate-950">
                        {r.lengthInput} × {r.widthInput}
                        {Number(r.quantity) > 1 ? ` × ${r.quantity}` : ''} ={' '}
                        {formatNumberIN(r.areaSqft)} sq.ft
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-900 pt-4 space-y-2 text-sm">
            <div className="flex justify-between font-bold">
              <span>TOTAL AREA:</span>
              <span>{formatNumberIN(summary.totalAreaSqft)} sq.ft</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>PVC CEILING:</span>
              <span>{formatNumberIN(summary.pvcCeilingSqft)} sq.ft</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>POP CEILING:</span>
              <span>{formatNumberIN(summary.popCeilingSqft)} sq.ft</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>GYPSUM CEILING:</span>
              <span>{formatNumberIN(summary.gypsumCeilingSqft)} sq.ft</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t-2 border-slate-900 pt-2 text-slate-950">
              <span>GRAND TOTAL (Incl. GST):</span>
              <span>{formatINR(summary.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ESTIMATE & AREA SUMMARY PANEL (Section 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Area Breakdown & Site Notes
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Area</span>
              <span className="text-base font-bold text-slate-900">
                {formatNumberIN(summary.totalAreaSqft)} sq.ft
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">PVC Ceiling</span>
              <span className="text-base font-bold text-slate-900">
                {formatNumberIN(summary.pvcCeilingSqft)} sq.ft
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">POP Ceiling</span>
              <span className="text-base font-bold text-slate-900">
                {formatNumberIN(summary.popCeilingSqft)} sq.ft
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Gypsum Ceiling</span>
              <span className="text-base font-bold text-slate-900">
                {formatNumberIN(summary.gypsumCeilingSqft)} sq.ft
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Site Measurement Notes / Special Framing Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              placeholder="Enter scaffolding requirements, cove light border details, or flower medallion count..."
            />
          </div>
        </div>

        {/* Estimate Calculation Card */}
        <div className="lg:col-span-5 bg-white p-5 border border-slate-200 rounded-xl space-y-3 font-mono text-xs">
          <h3 className="font-sans text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Automatic Estimate Calculation
          </h3>
          <div className="flex justify-between">
            <span className="text-slate-600">Estimated Material Cost (65%):</span>
            <span className="font-semibold">{formatINR(summary.materialEstimate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Estimated Labour Cost (35%):</span>
            <span className="font-semibold">{formatINR(summary.labourEstimate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Other / Scaffolding Charges (₹):</span>
            <input
              type="number"
              value={otherCharges}
              onChange={(e) => setOtherCharges(Number(e.target.value))}
              className="w-28 px-2 py-1 text-right border border-slate-300 rounded bg-slate-50"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Discount (₹):</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-28 px-2 py-1 text-right border border-slate-300 rounded bg-slate-50"
            />
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
            <span>Taxable Estimate Amount:</span>
            <span>{formatINR(summary.taxableAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Configurable GST Rate:</span>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded bg-slate-50"
            >
              <option value={0}>0% (Exempt)</option>
              <option value={5}>5% GST</option>
              <option value={12}>12% GST</option>
              <option value={18}>18% GST</option>
              <option value={28}>28% GST</option>
            </select>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">GST Amount ({gstRate}%):</span>
            <span>{formatINR(summary.gstAmount)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-950">
            <span>ESTIMATE GRAND TOTAL:</span>
            <span>{formatINR(summary.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
