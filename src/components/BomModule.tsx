import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Printer, FileCheck, Wand2 } from 'lucide-react';
import { formatINR, formatNumberIN } from '../lib/calculations.ts';

interface BomModuleProps {
  boms: any[];
  measurements: any[];
  products: any[];
  customers: any[];
  projects: any[];
  business: any;
  onSaveBom: (payload: any) => Promise<void>;
  onDeleteBom: (id: number) => Promise<void>;
  onConvertToQuotation: (bomRecord: any) => void;
  onOpenPrint: (bomRecord: any) => void;
}

const BOM_CATEGORIES = [
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

export const BomModule: React.FC<BomModuleProps> = ({
  boms,
  measurements,
  products,
  customers,
  projects,
  business,
  onSaveBom,
  onDeleteBom,
  onConvertToQuotation,
  onOpenPrint,
}) => {
  const [selectedId, setSelectedId] = useState<number | 'NEW'>(boms[0]?.id || 'NEW');
  const [saving, setSaving] = useState(false);

  const activeBom = useMemo(() => {
    if (selectedId === 'NEW') return null;
    return boms.find((b) => b.id === selectedId) || null;
  }, [boms, selectedId]);

  const [bomNumber, setBomNumber] = useState<string>(
    activeBom?.bomNumber || `${business?.bomPrefix || 'NRD/26-27/BOM-'}00${boms.length + 1}`
  );
  const [date, setDate] = useState<string>(
    activeBom?.date || new Date().toISOString().slice(0, 10)
  );
  const [customerId, setCustomerId] = useState<number>(
    activeBom?.customerId || customers[0]?.id || 1
  );
  const [projectId, setProjectId] = useState<number | ''>(
    activeBom?.projectId || projects[0]?.id || ''
  );
  const [measurementId, setMeasurementId] = useState<number | ''>(
    activeBom?.measurementId || measurements[0]?.id || ''
  );
  const [notes, setNotes] = useState<string>(activeBom?.notes || '');
  const [items, setItems] = useState<any[]>(activeBom?.items || []);

  const handleSelectBom = (record: any | 'NEW') => {
    if (record === 'NEW') {
      setSelectedId('NEW');
      setBomNumber(
        `${business?.bomPrefix || 'NRD/26-27/BOM-'}${String(boms.length + 1).padStart(
          3,
          '0'
        )}`
      );
      setDate(new Date().toISOString().slice(0, 10));
      setCustomerId(customers[0]?.id || 1);
      setProjectId('');
      setMeasurementId('');
      setNotes('');
      setItems([]);
    } else {
      setSelectedId(record.id);
      setBomNumber(record.bomNumber);
      setDate(record.date);
      setCustomerId(record.customerId);
      setProjectId(record.projectId || '');
      setMeasurementId(record.measurementId || '');
      setNotes(record.notes || '');
      setItems(record.items || []);
    }
  };

  // Auto-generate BOM items from selected Measurement Sheet
  const handleGenerateFromMeasurement = () => {
    const m = measurements.find((ms) => ms.id === Number(measurementId)) || measurements[0];
    if (!m) return;

    setCustomerId(m.customerId);
    if (m.projectId) setProjectId(m.projectId);

    const pvcSqft = Number(m.pvcCeilingSqft || 0);
    const popSqft = Number(m.popCeilingSqft || 0);
    const gypSqft = Number(m.gypsumCeilingSqft || 0);
    const totalSqft = Number(m.totalAreaSqft || 0);

    const generated: any[] = [];

    if (pvcSqft > 0) {
      const finalQty = Number((pvcSqft * 1.05).toFixed(2));
      const matCost = Number((finalQty * 50).toFixed(2));
      const labCost = Number((pvcSqft * 25).toFixed(2));
      generated.push({
        id: Date.now() + 1,
        productId: products[0]?.id || null,
        itemName: 'Heavy PVC Ceiling Panel 10" x 10ft',
        category: 'PVC Ceiling',
        brand: 'Royal Plast',
        specification: '8mm Heavy Gauge Panel',
        hsnSac: '3925',
        unit: 'sq.ft',
        requiredQty: pvcSqft,
        wastagePercent: 5,
        finalQty,
        purchaseRate: 38,
        sellingRate: 50,
        materialCost: matCost,
        labourCost: labCost,
        total: Number((matCost + labCost).toFixed(2)),
      });
    }

    if (popSqft > 0) {
      const reqBags = Math.ceil(popSqft / 16);
      const finalBags = Math.ceil(reqBags * 1.05);
      const matCost = Number((finalBags * 280).toFixed(2));
      const labCost = Number((popSqft * 20).toFixed(2));
      generated.push({
        id: Date.now() + 2,
        productId: products[2]?.id || null,
        itemName: 'Sakarni Super White POP Plaster (25kg Bag)',
        category: 'POP Ceiling',
        brand: 'Sakarni',
        specification: 'Super Fine Grade POP',
        hsnSac: '2520',
        unit: 'box',
        requiredQty: reqBags,
        wastagePercent: 5,
        finalQty: finalBags,
        purchaseRate: 195,
        sellingRate: 280,
        materialCost: matCost,
        labourCost: labCost,
        total: Number((matCost + labCost).toFixed(2)),
      });
    }

    if (gypSqft > 0) {
      const finalQty = Number((gypSqft * 1.05).toFixed(2));
      const matCost = Number((finalQty * 55).toFixed(2));
      const labCost = Number((gypSqft * 25).toFixed(2));
      generated.push({
        id: Date.now() + 3,
        productId: products[1]?.id || null,
        itemName: 'Saint-Gobain Gyproc Standard Board 12.5mm',
        category: 'Gypsum Ceiling',
        brand: 'Saint-Gobain',
        specification: '6ft x 4ft 12.5mm Board',
        hsnSac: '6809',
        unit: 'sq.ft',
        requiredQty: gypSqft,
        wastagePercent: 5,
        finalQty,
        purchaseRate: 42,
        sellingRate: 55,
        materialCost: matCost,
        labourCost: labCost,
        total: Number((matCost + labCost).toFixed(2)),
      });
    }

    if (totalSqft > 0) {
      const reqChannels = Math.ceil(totalSqft / 14);
      const finalChannels = Math.ceil(reqChannels * 1.05);
      const matCost = Number((finalChannels * 165).toFixed(2));
      const labCost = Number((reqChannels * 40).toFixed(2));
      generated.push({
        id: Date.now() + 4,
        productId: products[3]?.id || null,
        itemName: 'Ultra Gyp GI Perimeter & Ceiling Section 0.55mm',
        category: 'GI Framework',
        brand: 'Ultra Gyp',
        specification: '12ft Heavy Zinc Coated Channels',
        hsnSac: '7308',
        unit: 'piece',
        requiredQty: reqChannels,
        wastagePercent: 5,
        finalQty: finalChannels,
        purchaseRate: 115,
        sellingRate: 165,
        materialCost: matCost,
        labourCost: labCost,
        total: Number((matCost + labCost).toFixed(2)),
      });
    }

    setItems(generated);
    setNotes(`Auto-generated from Measurement Sheet ${m.measurementNumber} (${totalSqft} sq.ft)`);
  };

  const handleAddItemFromProduct = (prodId: number) => {
    const p = products.find((pr) => pr.id === prodId);
    if (!p) return;
    const reqQty = 10;
    const wastage = 5;
    const finalQty = Number((reqQty * (1 + wastage / 100)).toFixed(2));
    const sellRate = Number(p.sellingPrice || 0);
    const matCost = Number((finalQty * sellRate).toFixed(2));
    const labCost = 500;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: p.id,
        itemName: p.name,
        category: p.category,
        brand: p.brand,
        specification: `SKU: ${p.sku}`,
        hsnSac: p.hsnSac,
        unit: p.unit,
        requiredQty: reqQty,
        wastagePercent: wastage,
        finalQty,
        purchaseRate: Number(p.purchasePrice || 0),
        sellingRate: sellRate,
        materialCost: matCost,
        labourCost: labCost,
        total: Number((matCost + labCost).toFixed(2)),
      },
    ]);
  };

  const handleAddManualRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: null,
        itemName: 'Custom Interior Material / Framing Item',
        category: 'PVC Ceiling',
        brand: 'Royal',
        specification: 'Standard Grade',
        hsnSac: '3925',
        unit: 'piece',
        requiredQty: 1,
        wastagePercent: 5,
        finalQty: 1.05,
        purchaseRate: 100,
        sellingRate: 150,
        materialCost: 157.5,
        labourCost: 50,
        total: 207.5,
      },
    ]);
  };

  const handleUpdateRow = (idx: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[idx], [field]: value };
      const req = Number(row.requiredQty || 0);
      const wst = Number(row.wastagePercent || 0);
      const finalQty = Number((req * (1 + wst / 100)).toFixed(2));
      const sellRate = Number(row.sellingRate || 0);
      const materialCost =
        field === 'materialCost'
          ? Number(value)
          : Number((finalQty * sellRate).toFixed(2));
      const labourCost = Number(row.labourCost || 0);
      row.finalQty = finalQty;
      row.materialCost = materialCost;
      row.total = Number((materialCost + labourCost).toFixed(2));
      updated[idx] = row;
      return updated;
    });
  };

  const totals = useMemo(() => {
    let totalMaterialCost = 0;
    let totalLabourCost = 0;
    items.forEach((i) => {
      totalMaterialCost += Number(i.materialCost || 0);
      totalLabourCost += Number(i.labourCost || 0);
    });
    return {
      totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
      totalLabourCost: Number(totalLabourCost.toFixed(2)),
      grandTotal: Number((totalMaterialCost + totalLabourCost).toFixed(2)),
    };
  }, [items]);

  const currentPayload = {
    id: selectedId === 'NEW' ? undefined : selectedId,
    bomNumber,
    date,
    customerId,
    projectId: projectId || null,
    measurementId: measurementId || null,
    ...totals,
    notes,
    items,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveBom(currentPayload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'NEW') handleSelectBom('NEW');
              else {
                const found = boms.find((b) => b.id === Number(val));
                if (found) handleSelectBom(found);
              }
            }}
            className="px-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-lg"
          >
            {boms.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bomNumber} — {formatINR(b.grandTotal)}
              </option>
            ))}
            <option value="NEW">+ Create New BOM</option>
          </select>

          <button
            onClick={() => handleSelectBom('NEW')}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap"
          >
            + New BOM
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateFromMeasurement}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg whitespace-nowrap"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Generate from Measurement
          </button>
          <button
            onClick={() => onConvertToQuotation(currentPayload)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg whitespace-nowrap"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Convert BOM to Quotation
          </button>
          <button
            onClick={() => onOpenPrint(currentPayload)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
          >
            {saving ? 'Saving...' : 'Save BOM'}
          </button>
        </div>
      </div>

      {/* BOM Header Fields */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            BOM Number
          </label>
          <input
            type="text"
            value={bomNumber}
            onChange={(e) => setBomNumber(e.target.value)}
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
            onChange={(e) => setCustomerId(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Source Measurement Sheet
          </label>
          <select
            value={measurementId}
            onChange={(e) =>
              setMeasurementId(e.target.value ? Number(e.target.value) : '')
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          >
            <option value="">-- Select Measurement --</option>
            {measurements.map((m) => (
              <option key={m.id} value={m.id}>
                {m.measurementNumber} ({m.totalAreaSqft} sq.ft)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Quick Add from Material Master
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddItemFromProduct(Number(e.target.value));
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="w-full px-3 py-2 text-xs bg-amber-50 border border-amber-300 rounded-lg font-medium"
          >
            <option value="">+ Pick Material from Master...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatINR(p.sellingPrice)}/{p.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BOM Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Bill of Materials (BOM) Breakdown
          </h3>
          <button
            onClick={handleAddManualRow}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Manual BOM Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="py-2.5 px-2.5">Item & Spec</th>
                <th className="py-2.5 px-2.5">Category</th>
                <th className="py-2.5 px-2.5">Brand / HSN</th>
                <th className="py-2.5 px-2.5">Unit</th>
                <th className="py-2.5 px-2.5 text-right">Req Qty</th>
                <th className="py-2.5 px-2.5 text-right">Wastage %</th>
                <th className="py-2.5 px-2.5 text-right">Final Qty</th>
                <th className="py-2.5 px-2.5 text-right">Purchase ₹</th>
                <th className="py-2.5 px-2.5 text-right">Selling ₹</th>
                <th className="py-2.5 px-2.5 text-right">Material Cost</th>
                <th className="py-2.5 px-2.5 text-right">Labour Cost</th>
                <th className="py-2.5 px-2.5 text-right">Total</th>
                <th className="py-2.5 px-2.5 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50">
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'itemName', e.target.value)
                      }
                      className="w-44 px-2 py-1 text-xs font-semibold border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={item.specification || ''}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'specification', e.target.value)
                      }
                      placeholder="Specification"
                      className="w-44 px-2 py-0.5 mt-1 text-[11px] text-slate-500 border border-slate-200 rounded block"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'category', e.target.value)
                      }
                      className="w-32 px-1.5 py-1 text-xs border border-slate-200 rounded bg-white"
                    >
                      {BOM_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={item.brand || ''}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'brand', e.target.value)
                      }
                      placeholder="Brand"
                      className="w-24 px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                    <input
                      type="text"
                      value={item.hsnSac || '3925'}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'hsnSac', e.target.value)
                      }
                      placeholder="HSN"
                      className="w-24 px-2 py-0.5 mt-1 text-[11px] font-mono border border-slate-200 rounded block"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'unit', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      value={item.requiredQty}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'requiredQty', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      value={item.wastagePercent}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'wastagePercent', e.target.value)
                      }
                      className="w-14 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-semibold">
                    {formatNumberIN(item.finalQty)}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      value={item.purchaseRate}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'purchaseRate', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      value={item.sellingRate}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'sellingRate', e.target.value)
                      }
                      className="w-16 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono">
                    {formatINR(item.materialCost)}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <input
                      type="number"
                      value={item.labourCost}
                      onChange={(e) =>
                        handleUpdateRow(idx, 'labourCost', e.target.value)
                      }
                      className="w-20 px-2 py-1 text-xs font-mono text-right border border-slate-200 rounded"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(item.total)}
                  </td>
                  <td className="py-2 px-2.5 text-center">
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4 font-mono text-xs">
          <span>Total Material: {formatINR(totals.totalMaterialCost)}</span>
          <span>Total Labour: {formatINR(totals.totalLabourCost)}</span>
          <span className="text-sm font-bold text-slate-950">
            BOM Grand Total: {formatINR(totals.grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
