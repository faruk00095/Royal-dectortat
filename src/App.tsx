import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Ruler,
  Layers,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Briefcase,
  Package,
  BarChart3,
  Settings,
  Search,
  Plus,
  StickyNote,
  Printer,
  ArrowRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getIdToken } from './lib/firebase.ts';
import { INITIAL_WORKSPACE_DATA } from './lib/initialData.ts';
import { formatINR, formatNumberIN, amountToIndianWords } from './lib/calculations.ts';
import { MeasurementModule } from './components/MeasurementModule.tsx';
import { BomModule } from './components/BomModule.tsx';
import { BillingModule } from './components/BillingModule.tsx';
import {
  CustomersModule,
  ProjectsModule,
  ProductsModule,
  ReportsModule,
  SettingsModule,
} from './components/OperationsModules.tsx';
import {
  DocumentPrintModal,
  PrintableDocType,
} from './components/DocumentPrintModal.tsx';
import { GoogleKeepModal } from './components/GoogleKeepModal.tsx';

type ActiveModule =
  | 'DASHBOARD'
  | 'MEASUREMENTS'
  | 'BOM'
  | 'QUOTATIONS'
  | 'INVOICES'
  | 'PAYMENTS'
  | 'CUSTOMERS'
  | 'PROJECTS'
  | 'PRODUCTS'
  | 'REPORTS'
  | 'SETTINGS';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Application Data State (Seeded initially and synced with Cloud SQL PostgreSQL)
  const [workspace, setWorkspace] = useState<any>(INITIAL_WORKSPACE_DATA);
  const [currentUserRole, setCurrentUserRole] = useState<string>('Admin');

  // Global Search State (Section 13)
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Print / PDF Modal State
  const [printModal, setPrintModal] = useState<{
    docType: PrintableDocType;
    data: any;
    customer: any;
  } | null>(null);

  // Google Keep Modal State
  const [keepModal, setKeepModal] = useState<{
    open: boolean;
    title?: string;
    body?: string;
  }>({ open: false });

  const fetchCloudSqlBootstrap = async () => {
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch('/api/bootstrap', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        if (data.currentUser?.role) {
          setCurrentUserRole(data.currentUser.role);
        }
      }
    } catch (err) {
      console.error('Error syncing workspace with Cloud SQL:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      (loggedInUser) => {
        setUser(loggedInUser);
        fetchCloudSqlBootstrap();
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn(false);
      if (res?.user) {
        setUser(res.user);
        await fetchCloudSqlBootstrap();
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const apiCall = async (url: string, method: string, body?: any) => {
    const token = await getIdToken();
    if (!token) return null;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.ok) {
      await fetchCloudSqlBootstrap();
      return await res.json();
    }
    return null;
  };

  // ==========================================
  // DASHBOARD METRICS (Section 1 - All 13 KPIs)
  // ==========================================
  const dashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonthPrefix = todayStr.slice(0, 7);

    const invs = workspace.invoices || [];
    const quotes = workspace.quotations || [];
    const exps = workspace.expenses || [];
    const custs = workspace.customers || [];
    const projs = workspace.projects || [];

    const todaySales = invs
      .filter((i: any) => i.invoiceDate === todayStr)
      .reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);

    const monthlySales = invs
      .filter((i: any) => String(i.invoiceDate || '').startsWith(currentMonthPrefix))
      .reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);

    const totalQuotations = quotes.length;
    const pendingQuotations = quotes.filter(
      (q: any) => q.status === 'Pending'
    ).length;

    const totalInvoices = invs.length;
    const paidInvoices = invs.filter((i: any) => i.status === 'Paid').length;
    const unpaidInvoices = invs.filter((i: any) => i.status !== 'Paid').length;

    const outstandingAmount = invs.reduce(
      (s: number, i: any) => s + Number(i.balanceDue || 0),
      0
    );

    const totalCustomers = custs.length;
    const totalProjects = projs.length;

    const materialCost = exps
      .filter((e: any) => e.category === 'Material Purchase')
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

    const labourCost = exps
      .filter((e: any) => e.category === 'Site Labour')
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

    const totalTaxableRevenue = invs.reduce(
      (s: number, i: any) => s + Number(i.taxableValue || 0),
      0
    );
    const grossProfit = totalTaxableRevenue - materialCost - labourCost;

    return {
      todaySales,
      monthlySales,
      totalQuotations,
      pendingQuotations,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      outstandingAmount,
      totalCustomers,
      totalProjects,
      materialCost,
      labourCost,
      grossProfit,
    };
  }, [workspace]);

  // ==========================================
  // GLOBAL SEARCH RESULTS (Section 13)
  // ==========================================
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      type: string;
      title: string;
      subtitle: string;
      targetModule: ActiveModule;
    }> = [];

    (workspace.customers || []).forEach((c: any) => {
      if (
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.siteAddress || '').toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Customer',
          title: c.name,
          subtitle: `${c.mobile} · ${c.siteAddress}`,
          targetModule: 'CUSTOMERS',
        });
      }
    });

    (workspace.invoices || []).forEach((i: any) => {
      if (
        i.invoiceNumber.toLowerCase().includes(q) ||
        (i.placeOfSupply || '').toLowerCase().includes(q)
      ) {
        results.push({
          type: 'GST Invoice',
          title: i.invoiceNumber,
          subtitle: `${formatINR(i.grandTotal)} · ${i.status}`,
          targetModule: 'INVOICES',
        });
      }
    });

    (workspace.quotations || []).forEach((qt: any) => {
      if (
        qt.quotationNumber.toLowerCase().includes(q) ||
        (qt.siteAddress || '').toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Quotation',
          title: qt.quotationNumber,
          subtitle: `${formatINR(qt.grandTotal)} · ${qt.status}`,
          targetModule: 'QUOTATIONS',
        });
      }
    });

    (workspace.projects || []).forEach((p: any) => {
      if (
        p.projectName.toLowerCase().includes(q) ||
        p.siteAddress.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Project',
          title: p.projectName,
          subtitle: `${p.status} · ${p.siteAddress}`,
          targetModule: 'PROJECTS',
        });
      }
    });

    (workspace.products || []).forEach((pr: any) => {
      if (
        pr.name.toLowerCase().includes(q) ||
        pr.sku.toLowerCase().includes(q) ||
        pr.category.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Product',
          title: pr.name,
          subtitle: `${pr.sku} · ${formatINR(pr.sellingPrice)}/${pr.unit}`,
          targetModule: 'PRODUCTS',
        });
      }
    });

    (workspace.boms || []).forEach((b: any) => {
      if (b.bomNumber.toLowerCase().includes(q)) {
        results.push({
          type: 'BOM',
          title: b.bomNumber,
          subtitle: `Total: ${formatINR(b.grandTotal)}`,
          targetModule: 'BOM',
        });
      }
    });

    (workspace.measurements || []).forEach((m: any) => {
      if (
        m.measurementNumber.toLowerCase().includes(q) ||
        (m.siteName || '').toLowerCase().includes(q)
      ) {
        results.push({
          type: 'Measurement',
          title: m.measurementNumber,
          subtitle: `${m.totalAreaSqft} sq.ft · ${m.siteName}`,
          targetModule: 'MEASUREMENTS',
        });
      }
    });

    return results.slice(0, 10);
  }, [globalSearch, workspace]);

  // ==========================================
  // DATA HANDLERS (Local + Cloud SQL Sync)
  // ==========================================
  const handleSaveMeasurement = async (payload: any) => {
    const remote = await apiCall('/api/measurements', 'POST', payload);
    if (!remote) {
      setWorkspace((prev: any) => {
        const exists = prev.measurements.some((m: any) => m.id === payload.id);
        const newRecord = { ...payload, id: payload.id || Date.now() };
        return {
          ...prev,
          measurements: exists
            ? prev.measurements.map((m: any) =>
                m.id === payload.id ? newRecord : m
              )
            : [newRecord, ...prev.measurements],
        };
      });
    }
  };

  const handleConvertMeasurementToBom = async (measurement: any) => {
    const pvcSqft = Number(measurement.pvcCeilingSqft || 0);
    const popSqft = Number(measurement.popCeilingSqft || 0);
    const totalSqft = Number(measurement.totalAreaSqft || 0);
    const bomItemsList: any[] = [];

    if (pvcSqft > 0) {
      const finalQty = Number((pvcSqft * 1.05).toFixed(2));
      const matCost = Number((finalQty * 50).toFixed(2));
      const labCost = Number((pvcSqft * 25).toFixed(2));
      bomItemsList.push({
        id: Date.now() + 1,
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
        total: matCost + labCost,
      });
    }
    if (popSqft > 0) {
      const bags = Math.ceil(popSqft / 16);
      const finalBags = Math.ceil(bags * 1.05);
      const matCost = finalBags * 280;
      const labCost = popSqft * 20;
      bomItemsList.push({
        id: Date.now() + 2,
        itemName: 'Sakarni Super White POP Plaster (25kg Bag)',
        category: 'POP Ceiling',
        brand: 'Sakarni',
        specification: 'Super Fine POP',
        hsnSac: '2520',
        unit: 'box',
        requiredQty: bags,
        wastagePercent: 5,
        finalQty: finalBags,
        purchaseRate: 195,
        sellingRate: 280,
        materialCost: matCost,
        labourCost: labCost,
        total: matCost + labCost,
      });
    }
    if (totalSqft > 0) {
      const ch = Math.ceil(totalSqft / 14);
      const finalCh = Math.ceil(ch * 1.05);
      const matCost = finalCh * 165;
      const labCost = ch * 40;
      bomItemsList.push({
        id: Date.now() + 3,
        itemName: 'Ultra Gyp GI Perimeter & Ceiling Section 0.55mm',
        category: 'GI Framework',
        brand: 'Ultra Gyp',
        specification: '12ft Heavy GI Channels',
        hsnSac: '7308',
        unit: 'piece',
        requiredQty: ch,
        wastagePercent: 5,
        finalQty: finalCh,
        purchaseRate: 115,
        sellingRate: 165,
        materialCost: matCost,
        labourCost: labCost,
        total: matCost + labCost,
      });
    }

    const totalMaterialCost = bomItemsList.reduce(
      (s, i) => s + Number(i.materialCost || 0),
      0
    );
    const totalLabourCost = bomItemsList.reduce(
      (s, i) => s + Number(i.labourCost || 0),
      0
    );

    const newBom = {
      bomNumber: `${workspace.business?.bomPrefix || 'NRD/26-27/BOM-'}${String(
        workspace.boms.length + 1
      ).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: measurement.customerId,
      projectId: measurement.projectId,
      measurementId: measurement.id || null,
      totalMaterialCost,
      totalLabourCost,
      grandTotal: totalMaterialCost + totalLabourCost,
      notes: `Converted from Measurement Sheet ${measurement.measurementNumber}`,
      items: bomItemsList,
    };

    const remote = await apiCall('/api/bom', 'POST', newBom);
    if (!remote) {
      setWorkspace((prev: any) => ({
        ...prev,
        boms: [{ ...newBom, id: Date.now() }, ...prev.boms],
      }));
    }
    setActiveModule('BOM');
  };

  const handleConvertToQuotation = async (source: any) => {
    const today = new Date().toISOString().slice(0, 10);
    const qItems = (source.items || []).map((it: any) => ({
      section: it.section || it.category || 'Ceiling Work',
      description:
        it.description ||
        it.itemName ||
        `${it.room || ''} ${it.workType || ''} (${it.lengthInput} × ${it.widthInput})`,
      hsnSac: it.hsnSac || '9954',
      quantity: Number(it.areaSqft || it.finalQty || 1),
      unit: it.unit || 'sq.ft',
      rate: Number(it.rate || it.sellingRate || 85),
      amount: Number(it.amount || it.total || 0),
    }));

    const subtotal = qItems.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const gstAmount = Number(((subtotal * 18) / 100).toFixed(2));
    const grandTotal = Number((subtotal + gstAmount).toFixed(2));

    const newQuote = {
      quotationNumber: `${
        workspace.business?.quotationPrefix || 'NRD/26-27/QTN-'
      }${String(workspace.quotations.length + 1).padStart(3, '0')}`,
      date: today,
      validUntil: today,
      customerId: source.customerId,
      projectId: source.projectId || null,
      siteAddress: source.siteName || '',
      status: 'Pending',
      materialSubtotal: Number((subtotal * 0.65).toFixed(2)),
      labourCost: Number((subtotal * 0.35).toFixed(2)),
      otherCharges: 0,
      subtotal,
      discount: 0,
      taxableAmount: subtotal,
      gstRate: 18,
      gstAmount,
      grandTotal,
      termsAndConditions: workspace.business?.termsAndConditions || '',
      notes: `Converted from ${source.measurementNumber || source.bomNumber}`,
      items: qItems,
    };

    const remote = await apiCall('/api/quotations', 'POST', newQuote);
    if (!remote) {
      setWorkspace((prev: any) => ({
        ...prev,
        quotations: [{ ...newQuote, id: Date.now() }, ...prev.quotations],
      }));
    }
    setActiveModule('QUOTATIONS');
  };

  const navItems: Array<{
    id: ActiveModule;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MEASUREMENTS', label: 'Measurement Sheet', icon: Ruler },
    { id: 'BOM', label: 'BOM / Estimator', icon: Layers },
    { id: 'QUOTATIONS', label: 'Quotations', icon: FileText },
    { id: 'INVOICES', label: 'GST Invoices', icon: Receipt },
    { id: 'PAYMENTS', label: 'Payments & Receipts', icon: CreditCard },
    { id: 'CUSTOMERS', label: 'Customers', icon: Users },
    { id: 'PROJECTS', label: 'Projects & Sites', icon: Briefcase },
    { id: 'PRODUCTS', label: 'Material Master', icon: Package },
    { id: 'REPORTS', label: 'Reports & GST', icon: BarChart3 },
    { id: 'SETTINGS', label: 'Settings & Roles', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* TOP BAR CONTRACT: 3 Zones (Brand Wordmark — Top Nav Links — Primary Actions) */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('DASHBOARD');
            }}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-amber-400 whitespace-nowrap"
          >
            {workspace.business?.businessName || 'NEW ROYAL DECORATORS'}
          </a>
        </div>

        {/* Zone 2: Clean Single-Line Nav Links + Global Search */}
        <div className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveModule('MEASUREMENTS')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Site Measurements
          </button>
          <button
            onClick={() => setActiveModule('BOM')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            BOM
          </button>
          <button
            onClick={() => setActiveModule('QUOTATIONS')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            Quotations
          </button>
          <button
            onClick={() => setActiveModule('INVOICES')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            GST Invoices
          </button>
          <button
            onClick={() => setActiveModule('REPORTS')}
            className="hover:text-white transition-colors whitespace-nowrap"
          >
            GST Reports
          </button>
        </div>

        {/* Zone 3: Global Search, Google Keep & Google Sign-In */}
        <div className="flex items-center gap-2.5">
          {/* Global Search Input */}
          <div className="relative">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 w-44 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 180)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setShowSearchDropdown(true);
                }}
                placeholder="Search customer, invoice, BOM..."
                className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
              />
            </div>

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute right-0 mt-1 w-80 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onMouseDown={() => {
                      setActiveModule(res.targetModule);
                      setGlobalSearch('');
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{res.title}</div>
                      <div className="text-[11px] text-slate-500">{res.subtitle}</div>
                    </div>
                    <span className="font-mono text-[10px] text-amber-700 font-semibold">
                      {res.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setKeepModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Keep</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs text-slate-300 font-mono truncate max-w-[130px]">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          )}
        </div>
      </header>

      {/* WORKSPACE CANVAS: Sidebar + Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-40 pt-16' : 'hidden'
          } lg:static lg:block w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 flex flex-col justify-between`}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] text-slate-400 border-b border-slate-800 mb-2">
              <div className="font-semibold text-white truncate">
                {workspace.business?.category}
              </div>
              <div className="font-mono mt-0.5 text-amber-400">
                GSTIN: {workspace.business?.gstin}
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>
              Active Role:{' '}
              <strong className="text-amber-400 font-mono">{currentUserRole}</strong>
            </div>
            <div>State: {workspace.business?.state} ({workspace.business?.stateCode})</div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 max-w-[1440px] mx-auto w-full space-y-6">
          {/* Quick Action Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">
                {workspace.business?.address} · Mob: {workspace.business?.mobileNumbers}
              </div>
              <div className="text-xs font-mono text-slate-700 mt-0.5">
                Workflow: Site Measurement → Area Calculation → BOM → Estimate → Quotation → GST Invoice → Payment → Receipt → Reports
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModule('MEASUREMENTS')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                + ADD MEASUREMENT
              </button>
              <button
                onClick={() => setActiveModule('INVOICES')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg whitespace-nowrap"
              >
                + GST Invoice
              </button>
            </div>
          </div>

          {/* 1. DASHBOARD MODULE */}
          {activeModule === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* 13 KPI Grid (Section 1) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Today's Sales</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {formatINR(dashboardStats.todaySales)}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Monthly Sales</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {formatINR(dashboardStats.monthlySales)}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">
                    Total Quotations · Pending
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {dashboardStats.totalQuotations} ·{' '}
                    <span className="text-amber-600">
                      {dashboardStats.pendingQuotations} Pending
                    </span>
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">
                    Total Invoices (Paid / Unpaid)
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {dashboardStats.totalInvoices}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({dashboardStats.paidInvoices} Paid · {dashboardStats.unpaidInvoices} Due)
                    </span>
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-rose-700 font-semibold block">
                    Outstanding Amount
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-rose-700 mt-1 block">
                    {formatINR(dashboardStats.outstandingAmount)}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Total Customers</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {dashboardStats.totalCustomers}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Total Projects</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {dashboardStats.totalProjects}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Material Cost</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {formatINR(dashboardStats.materialCost)}
                  </span>
                </div>
                <div className="bg-white p-4 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-500 block">Labour Cost</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {formatINR(dashboardStats.labourCost)}
                  </span>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-xl">
                  <span className="text-xs text-amber-400 font-semibold block">
                    Gross Profit
                  </span>
                  <span className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1 block">
                    {formatINR(dashboardStats.grossProfit)}
                  </span>
                </div>
              </div>

              {/* Interactive End-to-End Contractor Pipeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Contractor Site-to-Billing Pipeline
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { label: '1. Site Measurement', target: 'MEASUREMENTS' },
                    { label: '2. Area Calculation', target: 'MEASUREMENTS' },
                    { label: '3. BOM Generation', target: 'BOM' },
                    { label: '4. Cost Estimate', target: 'MEASUREMENTS' },
                    { label: '5. Quotation PDF', target: 'QUOTATIONS' },
                    { label: '6. GST Invoice', target: 'INVOICES' },
                    { label: '7. Payment & Receipt', target: 'PAYMENTS' },
                    { label: '8. GST & Profit Reports', target: 'REPORTS' },
                  ].map((step, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveModule(step.target as ActiveModule)}
                      className="p-3 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-lg transition-colors group"
                    >
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-900 block">
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Measurements & GST Invoices Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">
                      Recent Site Measurement Sheets
                    </h3>
                    <button
                      onClick={() => setActiveModule('MEASUREMENTS')}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Open Measurement Pad →
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="py-2.5 px-3">Sheet Ref</th>
                        <th className="py-2.5 px-3">Customer / Site</th>
                        <th className="py-2.5 px-3 text-right">Total Area</th>
                        <th className="py-2.5 px-3 text-right">Estimate</th>
                        <th className="py-2.5 px-3 text-right">Print</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(workspace.measurements || []).map((m: any) => {
                        const cust = workspace.customers.find(
                          (c: any) => c.id === m.customerId
                        );
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {m.measurementNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">
                                {cust?.name}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                {m.siteName}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {formatNumberIN(m.totalAreaSqft)} sq.ft
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {formatINR(m.grandTotal)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  setPrintModal({
                                    docType: 'MEASUREMENT',
                                    data: m,
                                    customer: cust,
                                  })
                                }
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">
                      Recent GST Tax Invoices
                    </h3>
                    <button
                      onClick={() => setActiveModule('INVOICES')}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      All GST Invoices →
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                        <th className="py-2.5 px-3">Invoice No.</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                        <th className="py-2.5 px-3 text-right">Print</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(workspace.invoices || []).map((inv: any) => {
                        const cust = workspace.customers.find(
                          (c: any) => c.id === inv.customerId
                        );
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {cust?.name}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {formatINR(inv.grandTotal)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                              {formatINR(inv.balanceDue)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  setPrintModal({
                                    docType: 'INVOICE',
                                    data: inv,
                                    customer: cust,
                                  })
                                }
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
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

          {/* 2. DIGITAL MEASUREMENT SHEET MODULE */}
          {activeModule === 'MEASUREMENTS' && (
            <MeasurementModule
              measurements={workspace.measurements}
              customers={workspace.customers}
              projects={workspace.projects}
              business={workspace.business}
              currentUserRole={currentUserRole}
              onSaveMeasurement={handleSaveMeasurement}
              onDeleteMeasurement={async (id) => {
                const remote = await apiCall(`/api/measurements/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((p: any) => ({
                    ...p,
                    measurements: p.measurements.filter((m: any) => m.id !== id),
                  }));
                }
              }}
              onConvertToBom={handleConvertMeasurementToBom}
              onConvertToQuotation={handleConvertToQuotation}
              onOpenPrint={(m) => {
                const cust = workspace.customers.find(
                  (c: any) => c.id === Number(m.customerId)
                );
                setPrintModal({
                  docType: 'MEASUREMENT',
                  data: m,
                  customer: cust,
                });
              }}
              onOpenKeep={(title, body) =>
                setKeepModal({ open: true, title, body })
              }
            />
          )}

          {/* 3. BOM MODULE */}
          {activeModule === 'BOM' && (
            <BomModule
              boms={workspace.boms}
              measurements={workspace.measurements}
              products={workspace.products}
              customers={workspace.customers}
              projects={workspace.projects}
              business={workspace.business}
              onSaveBom={async (payload) => {
                const remote = await apiCall('/api/bom', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => {
                    const exists = prev.boms.some((b: any) => b.id === payload.id);
                    const rec = { ...payload, id: payload.id || Date.now() };
                    return {
                      ...prev,
                      boms: exists
                        ? prev.boms.map((b: any) =>
                            b.id === payload.id ? rec : b
                          )
                        : [rec, ...prev.boms],
                    };
                  });
                }
              }}
              onDeleteBom={async (id) => {
                const remote = await apiCall(`/api/bom/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((p: any) => ({
                    ...p,
                    boms: p.boms.filter((b: any) => b.id !== id),
                  }));
                }
              }}
              onConvertToQuotation={handleConvertToQuotation}
              onOpenPrint={(b) => {
                const cust = workspace.customers.find(
                  (c: any) => c.id === Number(b.customerId)
                );
                setPrintModal({ docType: 'BOM', data: b, customer: cust });
              }}
            />
          )}

          {/* 4. QUOTATIONS, INVOICES & PAYMENTS MODULES */}
          {(activeModule === 'QUOTATIONS' ||
            activeModule === 'INVOICES' ||
            activeModule === 'PAYMENTS') && (
            <BillingModule
              activeSubTab={activeModule}
              quotations={workspace.quotations}
              invoices={workspace.invoices}
              payments={workspace.payments}
              customers={workspace.customers}
              projects={workspace.projects}
              business={workspace.business}
              currentUserRole={currentUserRole}
              onSaveQuotation={async (payload) => {
                const remote = await apiCall('/api/quotations', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    quotations: [
                      { ...payload, id: payload.id || Date.now() },
                      ...prev.quotations,
                    ],
                  }));
                }
              }}
              onDeleteQuotation={async (id) => {
                const remote = await apiCall(`/api/quotations/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    quotations: prev.quotations.filter((q: any) => q.id !== id),
                  }));
                }
              }}
              onSaveInvoice={async (payload) => {
                const remote = await apiCall('/api/invoices', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    invoices: [
                      {
                        ...payload,
                        id: payload.id || Date.now(),
                        status:
                          payload.balanceDue <= 0
                            ? 'Paid'
                            : payload.amountPaid > 0
                            ? 'Partially Paid'
                            : 'Unpaid',
                      },
                      ...prev.invoices,
                    ],
                  }));
                }
              }}
              onDeleteInvoice={async (id) => {
                const remote = await apiCall(`/api/invoices/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    invoices: prev.invoices.filter((i: any) => i.id !== id),
                  }));
                }
              }}
              onRecordPayment={async (payload) => {
                const remote = await apiCall('/api/payments', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => {
                    const newPay = { ...payload, id: Date.now() };
                    const updatedInvoices = prev.invoices.map((inv: any) => {
                      if (inv.id === Number(payload.invoiceId)) {
                        const paid =
                          Number(inv.amountPaid || 0) + Number(payload.amount || 0);
                        const bal = Math.max(
                          0,
                          Number(inv.grandTotal || 0) - paid
                        );
                        return {
                          ...inv,
                          amountPaid: paid,
                          balanceDue: bal,
                          status:
                            bal <= 0
                              ? 'Paid'
                              : paid > 0
                              ? 'Partially Paid'
                              : 'Unpaid',
                        };
                      }
                      return inv;
                    });
                    return {
                      ...prev,
                      payments: [newPay, ...prev.payments],
                      invoices: updatedInvoices,
                    };
                  });
                }
              }}
              onDeletePayment={async (id) => {
                const remote = await apiCall(`/api/payments/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    payments: prev.payments.filter((p: any) => p.id !== id),
                  }));
                }
              }}
              onOpenPrint={(docType, data, customer) =>
                setPrintModal({ docType, data, customer })
              }
            />
          )}

          {/* 5. CUSTOMERS MODULE */}
          {activeModule === 'CUSTOMERS' && (
            <CustomersModule
              customers={workspace.customers}
              measurements={workspace.measurements}
              quotations={workspace.quotations}
              boms={workspace.boms}
              invoices={workspace.invoices}
              payments={workspace.payments}
              business={workspace.business}
              onSaveCustomer={async (payload) => {
                const remote = await apiCall('/api/customers', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => {
                    const exists = prev.customers.some(
                      (c: any) => c.id === payload.id
                    );
                    const rec = { ...payload, id: payload.id || Date.now() };
                    return {
                      ...prev,
                      customers: exists
                        ? prev.customers.map((c: any) =>
                            c.id === payload.id ? rec : c
                          )
                        : [rec, ...prev.customers],
                    };
                  });
                }
              }}
              onDeleteCustomer={async (id) => {
                const remote = await apiCall(`/api/customers/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    customers: prev.customers.filter((c: any) => c.id !== id),
                  }));
                }
              }}
            />
          )}

          {/* 6. PROJECTS & ATTACHMENTS MODULE */}
          {activeModule === 'PROJECTS' && (
            <ProjectsModule
              projects={workspace.projects}
              customers={workspace.customers}
              attachments={workspace.attachments}
              onSaveProject={async (payload) => {
                const remote = await apiCall('/api/projects', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => {
                    const exists = prev.projects.some(
                      (p: any) => p.id === payload.id
                    );
                    const rec = { ...payload, id: payload.id || Date.now() };
                    return {
                      ...prev,
                      projects: exists
                        ? prev.projects.map((p: any) =>
                            p.id === payload.id ? rec : p
                          )
                        : [rec, ...prev.projects],
                    };
                  });
                }
              }}
              onDeleteProject={async (id) => {
                const remote = await apiCall(`/api/projects/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    projects: prev.projects.filter((p: any) => p.id !== id),
                  }));
                }
              }}
              onUploadAttachment={async (payload) => {
                const remote = await apiCall('/api/attachments', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    attachments: [
                      { ...payload, id: Date.now() },
                      ...prev.attachments,
                    ],
                  }));
                }
              }}
              onDeleteAttachment={async (id) => {
                const remote = await apiCall(`/api/attachments/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    attachments: prev.attachments.filter((a: any) => a.id !== id),
                  }));
                }
              }}
            />
          )}

          {/* 7. PRODUCT / MATERIAL MASTER MODULE */}
          {activeModule === 'PRODUCTS' && (
            <ProductsModule
              products={workspace.products}
              onSaveProduct={async (payload) => {
                const remote = await apiCall('/api/products', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => {
                    const exists = prev.products.some(
                      (p: any) => p.id === payload.id
                    );
                    const rec = { ...payload, id: payload.id || Date.now() };
                    return {
                      ...prev,
                      products: exists
                        ? prev.products.map((p: any) =>
                            p.id === payload.id ? rec : p
                          )
                        : [rec, ...prev.products],
                    };
                  });
                }
              }}
              onDeleteProduct={async (id) => {
                const remote = await apiCall(`/api/products/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    products: prev.products.filter((p: any) => p.id !== id),
                  }));
                }
              }}
            />
          )}

          {/* 8. REPORTS & GST SUMMARY MODULE */}
          {activeModule === 'REPORTS' && (
            <ReportsModule
              invoices={workspace.invoices}
              customers={workspace.customers}
              projects={workspace.projects}
              expenses={workspace.expenses}
              boms={workspace.boms}
              onCreateExpense={async (payload) => {
                const remote = await apiCall('/api/expenses', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    expenses: [{ ...payload, id: Date.now() }, ...prev.expenses],
                  }));
                }
              }}
              onDeleteExpense={async (id) => {
                const remote = await apiCall(`/api/expenses/${id}`, 'DELETE');
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    expenses: prev.expenses.filter((e: any) => e.id !== id),
                  }));
                }
              }}
            />
          )}

          {/* 9. SETTINGS & USER ROLES MODULE */}
          {activeModule === 'SETTINGS' && (
            <SettingsModule
              business={workspace.business}
              users={workspace.users}
              currentUserRole={currentUserRole}
              onSetCurrentUserRole={setCurrentUserRole}
              onSaveBusiness={async (payload) => {
                const remote = await apiCall('/api/business', 'PUT', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    business: { ...prev.business, ...payload },
                  }));
                }
              }}
              onAddStaffUser={async (payload) => {
                const remote = await apiCall('/api/users/staff', 'POST', payload);
                if (!remote) {
                  setWorkspace((prev: any) => ({
                    ...prev,
                    users: [
                      ...prev.users,
                      { ...payload, id: Date.now(), active: true },
                    ],
                  }));
                }
              }}
              fullWorkspaceData={workspace}
            />
          )}
        </main>
      </div>

      {/* PRINT / PDF & WHATSAPP MODAL (A4 + 80mm Thermal) */}
      {printModal && (
        <DocumentPrintModal
          docType={printModal.docType}
          data={printModal.data}
          business={workspace.business}
          customer={printModal.customer}
          onClose={() => setPrintModal(null)}
        />
      )}

      {/* GOOGLE KEEP INTEGRATION MODAL */}
      {keepModal.open && (
        <GoogleKeepModal
          defaultTitle={keepModal.title}
          defaultBody={keepModal.body}
          onClose={() => setKeepModal({ open: false })}
        />
      )}
    </div>
  );
}
