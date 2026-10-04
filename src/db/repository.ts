import { eq, desc, and } from 'drizzle-orm';
import { db } from './index.ts';
import {
  users,
  businesses,
  customers,
  projects,
  sites,
  measurements,
  measurementItems,
  products,
  bom,
  bomItems,
  quotations,
  quotationItems,
  invoices,
  invoiceItems,
  payments,
  expenses,
  attachments,
  settings,
} from './schema.ts';
import { getOrCreateUser } from './users.ts';
import { amountToIndianWords } from '../lib/calculations.ts';

export async function ensureWorkspaceSeeded(uid: string, email: string, name?: string) {
  try {
    const user = await getOrCreateUser(uid, email, name);

    const existingBusinesses = await db
      .select()
      .from(businesses)
      .where(eq(businesses.uid, uid));

    if (existingBusinesses.length > 0) {
      return { user, business: existingBusinesses[0] };
    }

    // 1. Seed Business Profile: NEW ROYAL DECORATORS
    const [business] = await db
      .insert(businesses)
      .values({
        uid,
        businessName: 'NEW ROYAL DECORATORS',
        category:
          'False Ceiling Works, PVC Ceiling, Gypsum Board, POP Work, Flower & Border Fitting, Interior Decoration.',
        address: 'Shop No. 14, Timber Market Road, Near Royal Chowk, Pune - 411002',
        mobileNumbers: '+91 98230 45112, +91 97654 32109',
        email: email || 'info@newroyaldecorators.in',
        gstin: '27AABCN1234F1Z5',
        pan: 'AABCN1234F',
        state: 'Maharashtra',
        stateCode: '27',
        bankName: 'HDFC Bank Ltd.',
        accountName: 'NEW ROYAL DECORATORS',
        accountNumber: '50200048291044',
        ifscCode: 'HDFC0000142',
        branch: 'Station Road Branch, Pune',
        upiId: 'newroyaldecorators@hdfcbank',
        invoicePrefix: 'NRD/26-27/INV-',
        quotationPrefix: 'NRD/26-27/QTN-',
        measurementPrefix: 'NRD/26-27/MS-',
        bomPrefix: 'NRD/26-27/BOM-',
        receiptPrefix: 'NRD/26-27/RCP-',
        defaultGstRate: '18.00',
        termsAndConditions:
          '1. 50% advance payment at the time of order confirmation.\n2. 30% running payment after GI framework & board/panel structure completion.\n3. Balance 20% strictly upon completion of work before site handover.\n4. Scaffolding, electricity, and water at site to be provided by the customer.\n5. Extra work beyond quotation will be billed per actual site measurement.\n6. Subject to local jurisdiction only.',
      })
      .returning();

    // 2. Seed Products / Material Master
    const seededProducts = await db
      .insert(products)
      .values([
        {
          uid,
          name: 'Heavy PVC Ceiling Panel 10" x 10ft (Royal Teak)',
          sku: 'NRD-PVC-001',
          category: 'PVC Ceiling',
          brand: 'Royal Plast',
          hsnSac: '3925',
          unit: 'sq.ft',
          purchasePrice: '38.00',
          sellingPrice: '65.00',
          gstRate: '18.00',
          stockQuantity: '2400.00',
          minStockLevel: '500.00',
        },
        {
          uid,
          name: 'Saint-Gobain Gyproc Standard Board 12.5mm (6x4 ft)',
          sku: 'NRD-GYP-002',
          category: 'Gypsum Ceiling',
          brand: 'Saint-Gobain Gyproc',
          hsnSac: '6809',
          unit: 'sq.ft',
          purchasePrice: '42.00',
          sellingPrice: '75.00',
          gstRate: '18.00',
          stockQuantity: '1800.00',
          minStockLevel: '400.00',
        },
        {
          uid,
          name: 'Sakarni Super White POP Plaster (25kg Bag)',
          sku: 'NRD-POP-003',
          category: 'POP Ceiling',
          brand: 'Sakarni',
          hsnSac: '2520',
          unit: 'box',
          purchasePrice: '195.00',
          sellingPrice: '280.00',
          gstRate: '18.00',
          stockQuantity: '85.00',
          minStockLevel: '20.00',
        },
        {
          uid,
          name: 'Ultra Gyp GI Perimeter Channel 0.55mm (12ft)',
          sku: 'NRD-GI-004',
          category: 'GI Framework',
          brand: 'Ultra Gyp',
          hsnSac: '7308',
          unit: 'piece',
          purchasePrice: '115.00',
          sellingPrice: '165.00',
          gstRate: '18.00',
          stockQuantity: '320.00',
          minStockLevel: '50.00',
        },
        {
          uid,
          name: 'Ultra Gyp GI Ceiling Section 0.55mm (12ft)',
          sku: 'NRD-GI-005',
          category: 'GI Framework',
          brand: 'Ultra Gyp',
          hsnSac: '7308',
          unit: 'piece',
          purchasePrice: '145.00',
          sellingPrice: '210.00',
          gstRate: '18.00',
          stockQuantity: '290.00',
          minStockLevel: '50.00',
        },
        {
          uid,
          name: 'POP Ornamental Cornice & Border Moulding',
          sku: 'NRD-DEC-006',
          category: 'Interior Decoration',
          brand: 'New Royal Custom',
          hsnSac: '6809',
          unit: 'running feet',
          purchasePrice: '28.00',
          sellingPrice: '55.00',
          gstRate: '18.00',
          stockQuantity: '950.00',
          minStockLevel: '150.00',
        },
        {
          uid,
          name: 'POP Central Ceiling Medallion Flower (36 inch)',
          sku: 'NRD-DEC-007',
          category: 'Interior Decoration',
          brand: 'New Royal Custom',
          hsnSac: '6809',
          unit: 'piece',
          purchasePrice: '450.00',
          sellingPrice: '950.00',
          gstRate: '18.00',
          stockQuantity: '24.00',
          minStockLevel: '5.00',
        },
        {
          uid,
          name: '15W Warm White Concealed LED Panel Light + Cove Strip',
          sku: 'NRD-LGT-008',
          category: 'Lighting',
          brand: 'Philips',
          hsnSac: '9405',
          unit: 'piece',
          purchasePrice: '310.00',
          sellingPrice: '480.00',
          gstRate: '18.00',
          stockQuantity: '110.00',
          minStockLevel: '25.00',
        },
        {
          uid,
          name: 'High-Carbon Drywall Star Screws 25mm (1000 pcs Box)',
          sku: 'NRD-HRD-009',
          category: 'Hardware',
          brand: 'Hilti / Grip',
          hsnSac: '7318',
          unit: 'box',
          purchasePrice: '240.00',
          sellingPrice: '360.00',
          gstRate: '18.00',
          stockQuantity: '18.00',
          minStockLevel: '5.00',
        },
        {
          uid,
          name: 'Skilled False Ceiling & POP Installation Labour',
          sku: 'NRD-LAB-010',
          category: 'False Ceiling',
          brand: 'NRD In-House Team',
          hsnSac: '9954',
          unit: 'sq.ft',
          purchasePrice: '22.00',
          sellingPrice: '35.00',
          gstRate: '18.00',
          stockQuantity: '9999.00',
          minStockLevel: '0.00',
        },
      ])
      .returning();

    // 3. Seed Customers
    const seededCustomers = await db
      .insert(customers)
      .values([
        {
          uid,
          name: 'Rajeshwar Deshmukh',
          mobile: '9822114455',
          email: 'rajeshwar.deshmukh@gmail.com',
          address: 'Plot 18, Mayur Colony, Kothrud, Pune - 411038',
          gstin: '27AALPD4821M1Z2',
          pan: 'AALPD4821M',
          state: 'Maharashtra',
          stateCode: '27',
          siteAddress: 'Royal Bunglow No. 7, Prabhat Road, Deccan, Pune',
          openingBalance: '0.00',
        },
        {
          uid,
          name: 'Shriram Spaces & Developers Pvt. Ltd.',
          mobile: '9765008811',
          email: 'projects@shriramspaces.in',
          address: '402, Elite Business Park, Baner High Street, Pune - 411045',
          gstin: '27AAHCS9102K1Z8',
          pan: 'AAHCS9102K',
          state: 'Maharashtra',
          stateCode: '27',
          siteAddress: 'Shriram Commercial Arcade, Balewadi Phata, Pune',
          openingBalance: '0.00',
        },
        {
          uid,
          name: 'Metro Suites & Hospitality LLP',
          mobile: '9900442210',
          email: 'procurement@metrosuites.co.in',
          address: 'MG Road, Indiranagar, Bengaluru - 560038',
          gstin: '29AABFM7721E1Z4',
          pan: 'AABFM7721E',
          state: 'Karnataka',
          stateCode: '29',
          siteAddress: 'Metro Boutique Hotel, Belagavi Highway Wing',
          openingBalance: '0.00',
        },
      ])
      .returning();

    // 4. Seed Projects & Sites
    const seededProjects = await db
      .insert(projects)
      .values([
        {
          uid,
          projectName: 'Deshmukh Duplex Bungalow - Full PVC & POP Ceiling',
          customerId: seededCustomers[0].id,
          siteAddress: 'Royal Bunglow No. 7, Prabhat Road, Deccan, Pune',
          startDate: '2026-09-25',
          expectedCompletionDate: '2026-10-18',
          status: 'Partially Paid',
          notes:
            'Ground floor + First floor bedrooms PVC ceiling, Hall gypsum cove ceiling, and exterior site fascia.',
        },
        {
          uid,
          projectName: 'Shriram Commercial Showroom - Gypsum Grid & Cove',
          customerId: seededCustomers[1].id,
          siteAddress: 'Shriram Commercial Arcade, Balewadi Phata, Pune',
          startDate: '2026-09-28',
          expectedCompletionDate: '2026-10-25',
          status: 'Work Started',
          notes: 'Double layer Saint-Gobain gypsum ceiling with 15W COB LED cutout provision.',
        },
        {
          uid,
          projectName: 'Metro Suites Banquet Hall - POP Flower & Golden Border',
          customerId: seededCustomers[2].id,
          siteAddress: 'Metro Boutique Hotel, Belagavi Highway Wing',
          startDate: '2026-10-01',
          expectedCompletionDate: '2026-11-05',
          status: 'Quotation',
          notes: 'Inter-state project (IGST 18%). Ornamental POP cornice and 6 ceiling medallions.',
        },
      ])
      .returning();

    await db.insert(sites).values([
      {
        uid,
        projectId: seededProjects[0].id,
        customerId: seededCustomers[0].id,
        siteName: 'Deshmukh Duplex - Prabhat Road Site',
        siteAddress: 'Royal Bunglow No. 7, Prabhat Road, Deccan, Pune',
        supervisorName: 'Imran Shaikh',
        supervisorMobile: '9823401190',
        floors: 'Ground Floor, First Floor, Site Fascia',
      },
      {
        uid,
        projectId: seededProjects[1].id,
        customerId: seededCustomers[1].id,
        siteName: 'Shriram Arcade - Showroom Floor 1',
        siteAddress: 'Shriram Commercial Arcade, Balewadi Phata, Pune',
        supervisorName: 'Sandeep Jadhav',
        supervisorMobile: '9764112280',
        floors: 'Ground Floor, Mezzanine Hall',
      },
    ]);

    // 5. Seed Digital Measurement Sheet (Recreating the exact prompt handwritten reference)
    // Ground Floor: 14 x 11 = 154, 28 x 5 = 140
    // First Floor: 14 x 11 = 154, 11 x 4 = 44, 8 x 4 = 32
    // Site Fascia: 10 x 3'6" = 35, 16 x 5'6" = 88
    // Total Area = 154 + 140 + 154 + 44 + 32 + 35 + 88 = 647 sq.ft
    const [m1] = await db
      .insert(measurements)
      .values({
        uid,
        measurementNumber: 'NRD/26-27/MS-001',
        date: '2026-10-01',
        customerId: seededCustomers[0].id,
        projectId: seededProjects[0].id,
        siteName: 'Royal Bunglow No. 7, Prabhat Road, Deccan, Pune',
        totalAreaSqft: '647.00',
        pvcCeilingSqft: '448.00',
        popCeilingSqft: '199.00',
        gypsumCeilingSqft: '0.00',
        materialEstimate: '36420.00',
        labourEstimate: '18535.00',
        otherCharges: '2500.00',
        discount: '1455.00',
        gstRate: '18.00',
        gstAmount: '10080.00',
        grandTotal: '66080.00',
        notes:
          'Handwritten site sheet digitized: Ground Floor Bed Room, First Floor Rooms, and Exterior Site Fascia.',
      })
      .returning();

    await db.insert(measurementItems).values([
      {
        measurementId: m1.id,
        section: 'Ground Floor',
        room: 'Bed Room',
        workType: 'PVC Ceiling',
        description: 'Master Bed Room Teak Wood Finish PVC Panel',
        rawExpression: '14 x 11',
        lengthInput: '14',
        widthInput: '11',
        lengthFeet: '14.0000',
        widthFeet: '11.0000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '154.00',
        rate: '85.00',
        amount: '13090.00',
      },
      {
        measurementId: m1.id,
        section: 'Ground Floor',
        room: 'Hall Passage',
        workType: 'PVC Ceiling',
        description: 'Living Room & Passage Heavy PVC Ceiling',
        rawExpression: '28 x 5',
        lengthInput: '28',
        widthInput: '5',
        lengthFeet: '28.0000',
        widthFeet: '5.0000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '140.00',
        rate: '85.00',
        amount: '11900.00',
      },
      {
        measurementId: m1.id,
        section: 'First Floor',
        room: 'Bed Room 2',
        workType: 'PVC Ceiling',
        description: 'First Floor Master Bed Room PVC Ceiling',
        rawExpression: '14 x 11',
        lengthInput: '14',
        widthInput: '11',
        lengthFeet: '14.0000',
        widthFeet: '11.0000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '154.00',
        rate: '85.00',
        amount: '13090.00',
      },
      {
        measurementId: m1.id,
        section: 'First Floor',
        room: 'Balcony Lobby',
        workType: 'POP Ceiling',
        description: 'First Floor Lobby POP Ceiling with Cove Border',
        rawExpression: '11 x 4',
        lengthInput: '11',
        widthInput: '4',
        lengthFeet: '11.0000',
        widthFeet: '4.0000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '44.00',
        rate: '90.00',
        amount: '3960.00',
      },
      {
        measurementId: m1.id,
        section: 'First Floor',
        room: 'Pooja & Dressing',
        workType: 'POP Ceiling',
        description: 'Pooja Room Ornamental POP & Flower Fitting',
        rawExpression: '8 x 4',
        lengthInput: '8',
        widthInput: '4',
        lengthFeet: '8.0000',
        widthFeet: '4.0000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '32.00',
        rate: '90.00',
        amount: '2880.00',
      },
      {
        measurementId: m1.id,
        section: 'Site Fascia',
        room: 'Front Fascia Left',
        workType: 'POP Ceiling',
        description: 'Front Elevation Fascia Drop 3ft 6in',
        rawExpression: '10 x 3\'6"',
        lengthInput: '10',
        widthInput: '3\'6"',
        lengthFeet: '10.0000',
        widthFeet: '3.5000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '35.00',
        rate: '80.00',
        amount: '2800.00',
      },
      {
        measurementId: m1.id,
        section: 'Site Fascia',
        room: 'Main Porch Fascia',
        workType: 'POP Ceiling',
        description: 'Main Entrance Canopy Fascia 16ft x 5ft 6in',
        rawExpression: '16 x 5\'6"',
        lengthInput: '16',
        widthInput: '5\'6"',
        lengthFeet: '16.0000',
        widthFeet: '5.5000',
        quantity: '1.00',
        calcType: 'SQFT',
        areaSqft: '88.00',
        rate: '82.00',
        amount: '7216.00',
      },
    ]);

    // 6. Seed BOM (Bill of Materials) from Measurement m1
    const [b1] = await db
      .insert(bom)
      .values({
        uid,
        bomNumber: 'NRD/26-27/BOM-001',
        date: '2026-10-01',
        customerId: seededCustomers[0].id,
        projectId: seededProjects[0].id,
        measurementId: m1.id,
        totalMaterialCost: '34860.00',
        totalLabourCost: '16450.00',
        grandTotal: '51310.00',
        notes: 'Generated automatically from Measurement Sheet NRD/26-27/MS-001 with 5% material wastage.',
      })
      .returning();

    await db.insert(bomItems).values([
      {
        bomId: b1.id,
        productId: seededProducts[0].id,
        itemName: 'Heavy PVC Ceiling Panel 10" x 10ft (Royal Teak)',
        category: 'PVC Ceiling',
        brand: 'Royal Plast',
        specification: '10 inch width x 10 ft length, 8mm heavy gauge',
        hsnSac: '3925',
        unit: 'sq.ft',
        requiredQty: '448.00',
        wastagePercent: '5.00',
        finalQty: '470.40',
        purchaseRate: '38.00',
        sellingRate: '50.00',
        materialCost: '23520.00',
        labourCost: '11200.00',
        total: '34720.00',
      },
      {
        bomId: b1.id,
        productId: seededProducts[2].id,
        itemName: 'Sakarni Super White POP Plaster (25kg Bag)',
        category: 'POP Ceiling',
        brand: 'Sakarni',
        specification: 'Super fine grade for 199 sq.ft POP ceiling & fascia',
        hsnSac: '2520',
        unit: 'box',
        requiredQty: '12.00',
        wastagePercent: '5.00',
        finalQty: '13.00',
        purchaseRate: '195.00',
        sellingRate: '280.00',
        materialCost: '3640.00',
        labourCost: '3250.00',
        total: '6890.00',
      },
      {
        bomId: b1.id,
        productId: seededProducts[3].id,
        itemName: 'Ultra Gyp GI Perimeter & Ceiling Section Framework',
        category: 'GI Framework',
        brand: 'Ultra Gyp',
        specification: '0.55mm Zinc Coated GI Channels (12ft lengths)',
        hsnSac: '7308',
        unit: 'piece',
        requiredQty: '45.00',
        wastagePercent: '4.00',
        finalQty: '47.00',
        purchaseRate: '115.00',
        sellingRate: '163.83',
        materialCost: '7700.00',
        labourCost: '2000.00',
        total: '9700.00',
      },
    ]);

    // 7. Seed Quotations
    const [q1] = await db
      .insert(quotations)
      .values({
        uid,
        quotationNumber: 'NRD/26-27/QTN-001',
        date: '2026-10-01',
        validUntil: '2026-10-16',
        customerId: seededCustomers[0].id,
        projectId: seededProjects[0].id,
        measurementId: m1.id,
        bomId: b1.id,
        siteAddress: 'Royal Bunglow No. 7, Prabhat Road, Deccan, Pune',
        status: 'Converted',
        materialSubtotal: '38080.00',
        labourCost: '16856.00',
        otherCharges: '2500.00',
        subtotal: '57436.00',
        discount: '1436.00',
        taxableAmount: '56000.00',
        gstRate: '18.00',
        gstAmount: '10080.00',
        grandTotal: '66080.00',
        termsAndConditions: business.termsAndConditions,
        notes: 'Includes GI heavy gauge framing, Royal Plast PVC sheets, and Sakarni POP fascia work.',
      })
      .returning();

    await db.insert(quotationItems).values([
      {
        quotationId: q1.id,
        section: 'Ground & First Floor',
        description: 'Supply & Installation of Heavy PVC Ceiling with GI Framing (448 sq.ft)',
        hsnSac: '9954',
        quantity: '448.00',
        unit: 'sq.ft',
        rate: '85.00',
        amount: '38080.00',
      },
      {
        quotationId: q1.id,
        section: 'First Floor & Site Fascia',
        description: 'Supply & Execution of Sakarni POP Ceiling, Cove & Fascia Work (199 sq.ft)',
        hsnSac: '9954',
        quantity: '199.00',
        unit: 'sq.ft',
        rate: '84.70',
        amount: '16856.00',
      },
      {
        quotationId: q1.id,
        section: 'Site Accessories',
        description: 'POP Central Flower Medallion & LED Cutout Finishing',
        hsnSac: '9954',
        quantity: '1.00',
        unit: 'job',
        rate: '2500.00',
        amount: '2500.00',
      },
    ]);

    const [q2] = await db
      .insert(quotations)
      .values({
        uid,
        quotationNumber: 'NRD/26-27/QTN-002',
        date: '2026-10-02',
        validUntil: '2026-10-20',
        customerId: seededCustomers[2].id,
        projectId: seededProjects[2].id,
        siteAddress: 'Metro Boutique Hotel, Belagavi Highway Wing',
        status: 'Pending',
        materialSubtotal: '62000.00',
        labourCost: '28000.00',
        otherCharges: '5000.00',
        subtotal: '95000.00',
        discount: '5000.00',
        taxableAmount: '90000.00',
        gstRate: '18.00',
        gstAmount: '16200.00',
        grandTotal: '106200.00',
        termsAndConditions: business.termsAndConditions,
        notes: 'Banquet Hall ornamental POP ceiling with golden border moulding.',
      })
      .returning();

    await db.insert(quotationItems).values([
      {
        quotationId: q2.id,
        section: 'Banquet Hall',
        description: 'Designer POP False Ceiling with Acoustic GI Grid (1000 sq.ft)',
        hsnSac: '9954',
        quantity: '1000.00',
        unit: 'sq.ft',
        rate: '95.00',
        amount: '95000.00',
      },
    ]);

    // 8. Seed GST Invoices (1 Intra-State Partially Paid, 1 Intra-State Paid today, 1 Inter-State Unpaid)
    const todayStr = new Date().toISOString().slice(0, 10);

    const [inv1] = await db
      .insert(invoices)
      .values({
        uid,
        invoiceNumber: 'NRD/26-27/INV-001',
        invoiceDate: todayStr,
        dueDate: '2026-10-18',
        customerId: seededCustomers[0].id,
        projectId: seededProjects[0].id,
        quotationId: q1.id,
        measurementId: m1.id,
        customerGstin: seededCustomers[0].gstin || '',
        placeOfSupply: 'Maharashtra (27)',
        isInterState: false,
        subtotal: '57436.00',
        discount: '1436.00',
        taxableValue: '56000.00',
        gstRate: '18.00',
        cgstAmount: '5040.00',
        sgstAmount: '5040.00',
        igstAmount: '0.00',
        totalGst: '10080.00',
        grandTotal: '66080.00',
        amountPaid: '40000.00',
        balanceDue: '26080.00',
        amountInWords: amountToIndianWords(66080),
        status: 'Partially Paid',
        isFinalized: true,
        notes: '50%+ running payment received via UPI. Balance due upon site completion.',
      })
      .returning();

    await db.insert(invoiceItems).values([
      {
        invoiceId: inv1.id,
        description: 'PVC Ceiling Supply & Installation (Ground & First Floor - 448 sq.ft)',
        hsnSac: '9954',
        quantity: '448.00',
        unit: 'sq.ft',
        rate: '85.00',
        taxableValue: '38080.00',
        gstRate: '18.00',
        cgstAmount: '3427.20',
        sgstAmount: '3427.20',
        igstAmount: '0.00',
        totalAmount: '44934.40',
      },
      {
        invoiceId: inv1.id,
        description: 'POP Ceiling & Site Fascia Work (199 sq.ft after ₹1,436 discount)',
        hsnSac: '9954',
        quantity: '199.00',
        unit: 'sq.ft',
        rate: '90.05',
        taxableValue: '17920.00',
        gstRate: '18.00',
        cgstAmount: '1612.80',
        sgstAmount: '1612.80',
        igstAmount: '0.00',
        totalAmount: '21145.60',
      },
    ]);

    const [inv2] = await db
      .insert(invoices)
      .values({
        uid,
        invoiceNumber: 'NRD/26-27/INV-002',
        invoiceDate: todayStr,
        dueDate: '2026-10-25',
        customerId: seededCustomers[1].id,
        projectId: seededProjects[1].id,
        customerGstin: seededCustomers[1].gstin || '',
        placeOfSupply: 'Maharashtra (27)',
        isInterState: false,
        subtotal: '85000.00',
        discount: '0.00',
        taxableValue: '85000.00',
        gstRate: '18.00',
        cgstAmount: '7650.00',
        sgstAmount: '7650.00',
        igstAmount: '0.00',
        totalGst: '15300.00',
        grandTotal: '100300.00',
        amountPaid: '100300.00',
        balanceDue: '0.00',
        amountInWords: amountToIndianWords(100300),
        status: 'Paid',
        isFinalized: true,
        notes: 'Phase 1 Showroom Saint-Gobain Gypsum Board ceiling completed & settled.',
      })
      .returning();

    await db.insert(invoiceItems).values([
      {
        invoiceId: inv2.id,
        description: 'Saint-Gobain Gyproc 12.5mm False Ceiling with Heavy GI Grid (1000 sq.ft)',
        hsnSac: '9954',
        quantity: '1000.00',
        unit: 'sq.ft',
        rate: '85.00',
        taxableValue: '85000.00',
        gstRate: '18.00',
        cgstAmount: '7650.00',
        sgstAmount: '7650.00',
        igstAmount: '0.00',
        totalAmount: '100300.00',
      },
    ]);

    // 9. Seed Payments & Receipts
    await db.insert(payments).values([
      {
        uid,
        receiptNumber: 'NRD/26-27/RCP-001',
        paymentDate: todayStr,
        invoiceId: inv1.id,
        customerId: seededCustomers[0].id,
        projectId: seededProjects[0].id,
        amount: '40000.00',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/427719283412/HDFC',
        notes: 'Advance + 1st stage payment for Deshmukh Duplex PVC & POP work',
      },
      {
        uid,
        receiptNumber: 'NRD/26-27/RCP-002',
        paymentDate: todayStr,
        invoiceId: inv2.id,
        customerId: seededCustomers[1].id,
        projectId: seededProjects[1].id,
        amount: '100300.00',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'NEFT/HDFCN520261003991',
        notes: 'Full settlement against Invoice NRD/26-27/INV-002',
      },
    ]);

    // 10. Seed Expenses (Material & Labour Costs for profitability tracking)
    await db.insert(expenses).values([
      {
        uid,
        expenseDate: todayStr,
        category: 'Material Purchase',
        projectId: seededProjects[0].id,
        vendorName: 'Royal Plast Distributors, Timber Market',
        amount: '24500.00',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'BILL-RP-882',
        notes: 'PVC Panels 10"x10ft & GI Channels for Deshmukh Duplex site',
      },
      {
        uid,
        expenseDate: todayStr,
        category: 'Site Labour',
        projectId: seededProjects[0].id,
        vendorName: 'Imran Shaikh & POP Contractor Team',
        amount: '14200.00',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-LAB-109',
        notes: 'Site framing & PVC panel fitting labour payout',
      },
      {
        uid,
        expenseDate: todayStr,
        category: 'Material Purchase',
        projectId: seededProjects[1].id,
        vendorName: 'Pune Gypsum & Hardware Mart',
        amount: '41000.00',
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'PGHM-1920',
        notes: 'Saint-Gobain Gyproc boards, GI channels & drywall screws',
      },
      {
        uid,
        expenseDate: todayStr,
        category: 'Site Labour',
        projectId: seededProjects[1].id,
        vendorName: 'Sandeep Jadhav Gypsum Crew',
        amount: '19500.00',
        paymentMethod: 'Cash',
        referenceNumber: 'VOUCH-44',
        notes: 'Showroom gypsum boarding and jointing compound finishing',
      },
    ]);

    return { user, business };
  } catch (error) {
    console.error('Database query failed in ensureWorkspaceSeeded:', error);
    throw new Error('Failed to initialize workspace data.', { cause: error });
  }
}

export async function getFullBootstrapData(uid: string, email: string, name?: string) {
  try {
    await ensureWorkspaceSeeded(uid, email, name);

    const [
      userList,
      businessList,
      customerList,
      projectList,
      siteList,
      measurementList,
      measurementItemList,
      productList,
      bomList,
      bomItemList,
      quotationList,
      quotationItemList,
      invoiceList,
      invoiceItemList,
      paymentList,
      expenseList,
      attachmentList,
      settingList,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(businesses).where(eq(businesses.uid, uid)),
      db.select().from(customers).where(eq(customers.uid, uid)).orderBy(desc(customers.id)),
      db.select().from(projects).where(eq(projects.uid, uid)).orderBy(desc(projects.id)),
      db.select().from(sites).where(eq(sites.uid, uid)).orderBy(desc(sites.id)),
      db
        .select()
        .from(measurements)
        .where(eq(measurements.uid, uid))
        .orderBy(desc(measurements.id)),
      db.select().from(measurementItems),
      db.select().from(products).where(eq(products.uid, uid)).orderBy(desc(products.id)),
      db.select().from(bom).where(eq(bom.uid, uid)).orderBy(desc(bom.id)),
      db.select().from(bomItems),
      db
        .select()
        .from(quotations)
        .where(eq(quotations.uid, uid))
        .orderBy(desc(quotations.id)),
      db.select().from(quotationItems),
      db.select().from(invoices).where(eq(invoices.uid, uid)).orderBy(desc(invoices.id)),
      db.select().from(invoiceItems),
      db.select().from(payments).where(eq(payments.uid, uid)).orderBy(desc(payments.id)),
      db.select().from(expenses).where(eq(expenses.uid, uid)).orderBy(desc(expenses.id)),
      db
        .select()
        .from(attachments)
        .where(eq(attachments.uid, uid))
        .orderBy(desc(attachments.id)),
      db.select().from(settings).where(eq(settings.uid, uid)),
    ]);

    const mIds = new Set(measurementList.map((m) => m.id));
    const bIds = new Set(bomList.map((b) => b.id));
    const qIds = new Set(quotationList.map((q) => q.id));
    const invIds = new Set(invoiceList.map((i) => i.id));

    return {
      currentUser: userList.find((u) => u.uid === uid) || userList[0],
      users: userList,
      business: businessList[0],
      customers: customerList,
      projects: projectList,
      sites: siteList,
      measurements: measurementList.map((m) => ({
        ...m,
        items: measurementItemList.filter((item) => item.measurementId === m.id),
      })),
      measurementItems: measurementItemList.filter((i) => mIds.has(i.measurementId)),
      products: productList,
      boms: bomList.map((b) => ({
        ...b,
        items: bomItemList.filter((item) => item.bomId === b.id),
      })),
      bomItems: bomItemList.filter((i) => bIds.has(i.bomId)),
      quotations: quotationList.map((q) => ({
        ...q,
        items: quotationItemList.filter((item) => item.quotationId === q.id),
      })),
      quotationItems: quotationItemList.filter((i) => qIds.has(i.quotationId)),
      invoices: invoiceList.map((inv) => ({
        ...inv,
        items: invoiceItemList.filter((item) => item.invoiceId === inv.id),
      })),
      invoiceItems: invoiceItemList.filter((i) => invIds.has(i.invoiceId)),
      payments: paymentList,
      expenses: expenseList,
      attachments: attachmentList,
      settings: settingList,
    };
  } catch (error) {
    console.error('Database query failed in getFullBootstrapData:', error);
    throw new Error('Failed to load application data.', { cause: error });
  }
}

export async function updateBusinessProfile(uid: string, payload: any) {
  try {
    const [updated] = await db
      .update(businesses)
      .set({
        businessName: payload.businessName,
        category: payload.category,
        logoUrl: payload.logoUrl ?? '',
        address: payload.address,
        mobileNumbers: payload.mobileNumbers,
        email: payload.email,
        gstin: payload.gstin,
        pan: payload.pan,
        state: payload.state,
        stateCode: payload.stateCode,
        bankName: payload.bankName,
        accountName: payload.accountName,
        accountNumber: payload.accountNumber,
        ifscCode: payload.ifscCode,
        branch: payload.branch,
        upiId: payload.upiId,
        invoicePrefix: payload.invoicePrefix,
        quotationPrefix: payload.quotationPrefix,
        measurementPrefix: payload.measurementPrefix,
        bomPrefix: payload.bomPrefix,
        receiptPrefix: payload.receiptPrefix,
        defaultGstRate: String(payload.defaultGstRate || '18.00'),
        termsAndConditions: payload.termsAndConditions,
        updatedAt: new Date(),
      })
      .where(eq(businesses.uid, uid))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database query failed in updateBusinessProfile:', error);
    throw new Error('Failed to update business profile.', { cause: error });
  }
}

export async function createOrUpdateCustomer(uid: string, payload: any) {
  try {
    if (payload.id) {
      const [updated] = await db
        .update(customers)
        .set({
          name: payload.name,
          mobile: payload.mobile,
          email: payload.email || '',
          address: payload.address || '',
          gstin: payload.gstin || '',
          pan: payload.pan || '',
          state: payload.state || 'Maharashtra',
          stateCode: payload.stateCode || '27',
          siteAddress: payload.siteAddress || '',
          openingBalance: String(payload.openingBalance || '0.00'),
          updatedBy: payload.updatedBy || 'Admin',
          updatedAt: new Date(),
        })
        .where(and(eq(customers.id, Number(payload.id)), eq(customers.uid, uid)))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(customers)
      .values({
        uid,
        name: payload.name,
        mobile: payload.mobile,
        email: payload.email || '',
        address: payload.address || '',
        gstin: payload.gstin || '',
        pan: payload.pan || '',
        state: payload.state || 'Maharashtra',
        stateCode: payload.stateCode || '27',
        siteAddress: payload.siteAddress || '',
        openingBalance: String(payload.openingBalance || '0.00'),
        createdBy: payload.createdBy || 'Admin',
        updatedBy: payload.createdBy || 'Admin',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createOrUpdateCustomer:', error);
    throw new Error('Failed to save customer.', { cause: error });
  }
}

export async function deleteCustomerById(uid: string, id: number) {
  try {
    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteCustomerById:', error);
    throw new Error('Failed to delete customer.', { cause: error });
  }
}

export async function createOrUpdateProject(uid: string, payload: any) {
  try {
    if (payload.id) {
      const [updated] = await db
        .update(projects)
        .set({
          projectName: payload.projectName,
          customerId: Number(payload.customerId),
          siteAddress: payload.siteAddress,
          startDate: payload.startDate,
          expectedCompletionDate: payload.expectedCompletionDate || '',
          status: payload.status || 'Measurement',
          notes: payload.notes || '',
          updatedBy: payload.updatedBy || 'Admin',
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, Number(payload.id)), eq(projects.uid, uid)))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(projects)
      .values({
        uid,
        projectName: payload.projectName,
        customerId: Number(payload.customerId),
        siteAddress: payload.siteAddress,
        startDate: payload.startDate,
        expectedCompletionDate: payload.expectedCompletionDate || '',
        status: payload.status || 'Measurement',
        notes: payload.notes || '',
        createdBy: payload.createdBy || 'Admin',
        updatedBy: payload.createdBy || 'Admin',
      })
      .returning();

    await db.insert(sites).values({
      uid,
      projectId: created.id,
      customerId: Number(payload.customerId),
      siteName: payload.projectName,
      siteAddress: payload.siteAddress,
      supervisorName: payload.supervisorName || '',
      supervisorMobile: payload.supervisorMobile || '',
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createOrUpdateProject:', error);
    throw new Error('Failed to save project.', { cause: error });
  }
}

export async function deleteProjectById(uid: string, id: number) {
  try {
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteProjectById:', error);
    throw new Error('Failed to delete project.', { cause: error });
  }
}

export async function createOrUpdateProduct(uid: string, payload: any) {
  try {
    if (payload.id) {
      const [updated] = await db
        .update(products)
        .set({
          name: payload.name,
          sku: payload.sku,
          category: payload.category,
          brand: payload.brand || '',
          hsnSac: payload.hsnSac || '3925',
          unit: payload.unit || 'sq.ft',
          purchasePrice: String(payload.purchasePrice || '0.00'),
          sellingPrice: String(payload.sellingPrice || '0.00'),
          gstRate: String(payload.gstRate || '18.00'),
          stockQuantity: String(payload.stockQuantity || '0.00'),
          minStockLevel: String(payload.minStockLevel || '10.00'),
          updatedBy: payload.updatedBy || 'Admin',
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, Number(payload.id)), eq(products.uid, uid)))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(products)
      .values({
        uid,
        name: payload.name,
        sku: payload.sku,
        category: payload.category,
        brand: payload.brand || '',
        hsnSac: payload.hsnSac || '3925',
        unit: payload.unit || 'sq.ft',
        purchasePrice: String(payload.purchasePrice || '0.00'),
        sellingPrice: String(payload.sellingPrice || '0.00'),
        gstRate: String(payload.gstRate || '18.00'),
        stockQuantity: String(payload.stockQuantity || '0.00'),
        minStockLevel: String(payload.minStockLevel || '10.00'),
        createdBy: payload.createdBy || 'Admin',
        updatedBy: payload.createdBy || 'Admin',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createOrUpdateProduct:', error);
    throw new Error('Failed to save product.', { cause: error });
  }
}

export async function deleteProductById(uid: string, id: number) {
  try {
    await db.delete(products).where(and(eq(products.id, id), eq(products.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteProductById:', error);
    throw new Error('Failed to delete product.', { cause: error });
  }
}

export async function saveMeasurementWithItems(uid: string, payload: any) {
  try {
    let measurementRecord;
    const headerValues = {
      measurementNumber: payload.measurementNumber,
      date: payload.date,
      customerId: Number(payload.customerId),
      projectId: payload.projectId ? Number(payload.projectId) : null,
      siteName: payload.siteName || '',
      totalAreaSqft: String(payload.totalAreaSqft || '0.00'),
      pvcCeilingSqft: String(payload.pvcCeilingSqft || '0.00'),
      popCeilingSqft: String(payload.popCeilingSqft || '0.00'),
      gypsumCeilingSqft: String(payload.gypsumCeilingSqft || '0.00'),
      materialEstimate: String(payload.materialEstimate || '0.00'),
      labourEstimate: String(payload.labourEstimate || '0.00'),
      otherCharges: String(payload.otherCharges || '0.00'),
      discount: String(payload.discount || '0.00'),
      gstRate: String(payload.gstRate || '18.00'),
      gstAmount: String(payload.gstAmount || '0.00'),
      grandTotal: String(payload.grandTotal || '0.00'),
      notes: payload.notes || '',
      updatedBy: payload.updatedBy || 'Admin',
      updatedAt: new Date(),
    };

    if (payload.id) {
      const [updated] = await db
        .update(measurements)
        .set(headerValues)
        .where(and(eq(measurements.id, Number(payload.id)), eq(measurements.uid, uid)))
        .returning();
      measurementRecord = updated;
      await db
        .delete(measurementItems)
        .where(eq(measurementItems.measurementId, measurementRecord.id));
    } else {
      const [created] = await db
        .insert(measurements)
        .values({
          uid,
          ...headerValues,
          createdBy: payload.createdBy || 'Admin',
        })
        .returning();
      measurementRecord = created;
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length > 0) {
      await db.insert(measurementItems).values(
        items.map((item: any) => ({
          measurementId: measurementRecord.id,
          section: item.section || 'Ground Floor',
          room: item.room || 'Bedroom',
          workType: item.workType || 'PVC Ceiling',
          description: item.description || '',
          rawExpression: item.rawExpression || `${item.lengthInput} x ${item.widthInput}`,
          lengthInput: String(item.lengthInput || '0'),
          widthInput: String(item.widthInput || '0'),
          lengthFeet: String(item.lengthFeet || '0'),
          widthFeet: String(item.widthFeet || '0'),
          quantity: String(item.quantity || '1'),
          calcType: item.calcType || 'SQFT',
          areaSqft: String(item.areaSqft || '0.00'),
          rate: String(item.rate || '0.00'),
          amount: String(item.amount || '0.00'),
        }))
      );
    }

    return measurementRecord;
  } catch (error) {
    console.error('Database query failed in saveMeasurementWithItems:', error);
    throw new Error('Failed to save measurement sheet.', { cause: error });
  }
}

export async function deleteMeasurementById(uid: string, id: number) {
  try {
    await db
      .delete(measurements)
      .where(and(eq(measurements.id, id), eq(measurements.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteMeasurementById:', error);
    throw new Error('Failed to delete measurement sheet.', { cause: error });
  }
}

export async function saveBomWithItems(uid: string, payload: any) {
  try {
    let bomRecord;
    const headerValues = {
      bomNumber: payload.bomNumber,
      date: payload.date,
      customerId: Number(payload.customerId),
      projectId: payload.projectId ? Number(payload.projectId) : null,
      measurementId: payload.measurementId ? Number(payload.measurementId) : null,
      totalMaterialCost: String(payload.totalMaterialCost || '0.00'),
      totalLabourCost: String(payload.totalLabourCost || '0.00'),
      grandTotal: String(payload.grandTotal || '0.00'),
      notes: payload.notes || '',
      updatedBy: payload.updatedBy || 'Admin',
      updatedAt: new Date(),
    };

    if (payload.id) {
      const [updated] = await db
        .update(bom)
        .set(headerValues)
        .where(and(eq(bom.id, Number(payload.id)), eq(bom.uid, uid)))
        .returning();
      bomRecord = updated;
      await db.delete(bomItems).where(eq(bomItems.bomId, bomRecord.id));
    } else {
      const [created] = await db
        .insert(bom)
        .values({
          uid,
          ...headerValues,
          createdBy: payload.createdBy || 'Admin',
        })
        .returning();
      bomRecord = created;
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length > 0) {
      await db.insert(bomItems).values(
        items.map((item: any) => ({
          bomId: bomRecord.id,
          productId: item.productId ? Number(item.productId) : null,
          itemName: item.itemName || 'Material Item',
          category: item.category || 'PVC Ceiling',
          brand: item.brand || '',
          specification: item.specification || '',
          hsnSac: item.hsnSac || '3925',
          unit: item.unit || 'piece',
          requiredQty: String(item.requiredQty || '1.00'),
          wastagePercent: String(item.wastagePercent || '0.00'),
          finalQty: String(item.finalQty || '1.00'),
          purchaseRate: String(item.purchaseRate || '0.00'),
          sellingRate: String(item.sellingRate || '0.00'),
          materialCost: String(item.materialCost || '0.00'),
          labourCost: String(item.labourCost || '0.00'),
          total: String(item.total || '0.00'),
        }))
      );
    }

    return bomRecord;
  } catch (error) {
    console.error('Database query failed in saveBomWithItems:', error);
    throw new Error('Failed to save BOM.', { cause: error });
  }
}

export async function deleteBomById(uid: string, id: number) {
  try {
    await db.delete(bom).where(and(eq(bom.id, id), eq(bom.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteBomById:', error);
    throw new Error('Failed to delete BOM.', { cause: error });
  }
}

export async function saveQuotationWithItems(uid: string, payload: any) {
  try {
    let qRecord;
    const headerValues = {
      quotationNumber: payload.quotationNumber,
      date: payload.date,
      validUntil: payload.validUntil || payload.date,
      customerId: Number(payload.customerId),
      projectId: payload.projectId ? Number(payload.projectId) : null,
      measurementId: payload.measurementId ? Number(payload.measurementId) : null,
      bomId: payload.bomId ? Number(payload.bomId) : null,
      siteAddress: payload.siteAddress || '',
      status: payload.status || 'Pending',
      materialSubtotal: String(payload.materialSubtotal || '0.00'),
      labourCost: String(payload.labourCost || '0.00'),
      otherCharges: String(payload.otherCharges || '0.00'),
      subtotal: String(payload.subtotal || '0.00'),
      discount: String(payload.discount || '0.00'),
      taxableAmount: String(payload.taxableAmount || '0.00'),
      gstRate: String(payload.gstRate || '18.00'),
      gstAmount: String(payload.gstAmount || '0.00'),
      grandTotal: String(payload.grandTotal || '0.00'),
      termsAndConditions: payload.termsAndConditions || '',
      notes: payload.notes || '',
      updatedBy: payload.updatedBy || 'Admin',
      updatedAt: new Date(),
    };

    if (payload.id) {
      const [updated] = await db
        .update(quotations)
        .set(headerValues)
        .where(and(eq(quotations.id, Number(payload.id)), eq(quotations.uid, uid)))
        .returning();
      qRecord = updated;
      await db
        .delete(quotationItems)
        .where(eq(quotationItems.quotationId, qRecord.id));
    } else {
      const [created] = await db
        .insert(quotations)
        .values({
          uid,
          ...headerValues,
          createdBy: payload.createdBy || 'Admin',
        })
        .returning();
      qRecord = created;
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length > 0) {
      await db.insert(quotationItems).values(
        items.map((item: any) => ({
          quotationId: qRecord.id,
          section: item.section || 'General',
          description: item.description || '',
          hsnSac: item.hsnSac || '9954',
          quantity: String(item.quantity || '1.00'),
          unit: item.unit || 'sq.ft',
          rate: String(item.rate || '0.00'),
          amount: String(item.amount || '0.00'),
        }))
      );
    }

    return qRecord;
  } catch (error) {
    console.error('Database query failed in saveQuotationWithItems:', error);
    throw new Error('Failed to save quotation.', { cause: error });
  }
}

export async function deleteQuotationById(uid: string, id: number) {
  try {
    await db
      .delete(quotations)
      .where(and(eq(quotations.id, id), eq(quotations.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteQuotationById:', error);
    throw new Error('Failed to delete quotation.', { cause: error });
  }
}

export async function saveInvoiceWithItems(uid: string, payload: any) {
  try {
    let invRecord;
    const grandTotalNum = Number(payload.grandTotal || 0);
    const amountPaidNum = Number(payload.amountPaid || 0);
    const balanceDueNum = Math.max(0, Number((grandTotalNum - amountPaidNum).toFixed(2)));
    const computedStatus =
      payload.status === 'Cancelled'
        ? 'Cancelled'
        : balanceDueNum <= 0 && grandTotalNum > 0
        ? 'Paid'
        : amountPaidNum > 0
        ? 'Partially Paid'
        : 'Unpaid';

    const headerValues = {
      invoiceNumber: payload.invoiceNumber,
      invoiceDate: payload.invoiceDate,
      dueDate: payload.dueDate || '',
      customerId: Number(payload.customerId),
      projectId: payload.projectId ? Number(payload.projectId) : null,
      quotationId: payload.quotationId ? Number(payload.quotationId) : null,
      measurementId: payload.measurementId ? Number(payload.measurementId) : null,
      customerGstin: payload.customerGstin || '',
      placeOfSupply: payload.placeOfSupply || 'Maharashtra (27)',
      isInterState: Boolean(payload.isInterState),
      subtotal: String(payload.subtotal || '0.00'),
      discount: String(payload.discount || '0.00'),
      taxableValue: String(payload.taxableValue || '0.00'),
      gstRate: String(payload.gstRate || '18.00'),
      cgstAmount: String(payload.cgstAmount || '0.00'),
      sgstAmount: String(payload.sgstAmount || '0.00'),
      igstAmount: String(payload.igstAmount || '0.00'),
      totalGst: String(payload.totalGst || '0.00'),
      grandTotal: String(grandTotalNum.toFixed(2)),
      amountPaid: String(amountPaidNum.toFixed(2)),
      balanceDue: String(balanceDueNum.toFixed(2)),
      amountInWords: payload.amountInWords || amountToIndianWords(grandTotalNum),
      status: computedStatus,
      isFinalized: payload.isFinalized !== undefined ? Boolean(payload.isFinalized) : true,
      notes: payload.notes || '',
      updatedBy: payload.updatedBy || 'Admin',
      updatedAt: new Date(),
    };

    if (payload.id) {
      const [updated] = await db
        .update(invoices)
        .set(headerValues)
        .where(and(eq(invoices.id, Number(payload.id)), eq(invoices.uid, uid)))
        .returning();
      invRecord = updated;
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invRecord.id));
    } else {
      const [created] = await db
        .insert(invoices)
        .values({
          uid,
          ...headerValues,
          createdBy: payload.createdBy || 'Admin',
        })
        .returning();
      invRecord = created;

      if (payload.quotationId) {
        await db
          .update(quotations)
          .set({ status: 'Converted', updatedAt: new Date() })
          .where(eq(quotations.id, Number(payload.quotationId)));
      }
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    if (items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map((item: any) => ({
          invoiceId: invRecord.id,
          description: item.description || '',
          hsnSac: item.hsnSac || '9954',
          quantity: String(item.quantity || '1.00'),
          unit: item.unit || 'sq.ft',
          rate: String(item.rate || '0.00'),
          taxableValue: String(item.taxableValue || '0.00'),
          gstRate: String(item.gstRate || payload.gstRate || '18.00'),
          cgstAmount: String(item.cgstAmount || '0.00'),
          sgstAmount: String(item.sgstAmount || '0.00'),
          igstAmount: String(item.igstAmount || '0.00'),
          totalAmount: String(item.totalAmount || '0.00'),
        }))
      );
    }

    return invRecord;
  } catch (error) {
    console.error('Database query failed in saveInvoiceWithItems:', error);
    throw new Error('Failed to save GST invoice.', { cause: error });
  }
}

export async function deleteInvoiceById(uid: string, id: number) {
  try {
    await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteInvoiceById:', error);
    throw new Error('Failed to delete invoice.', { cause: error });
  }
}

export async function recordPayment(uid: string, payload: any) {
  try {
    const [created] = await db
      .insert(payments)
      .values({
        uid,
        receiptNumber: payload.receiptNumber,
        paymentDate: payload.paymentDate,
        invoiceId: payload.invoiceId ? Number(payload.invoiceId) : null,
        customerId: Number(payload.customerId),
        projectId: payload.projectId ? Number(payload.projectId) : null,
        amount: String(payload.amount || '0.00'),
        paymentMethod: payload.paymentMethod || 'UPI',
        referenceNumber: payload.referenceNumber || '',
        notes: payload.notes || '',
        createdBy: payload.createdBy || 'Admin',
        updatedBy: payload.createdBy || 'Admin',
      })
      .returning();

    if (payload.invoiceId) {
      const invId = Number(payload.invoiceId);
      const [inv] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invId), eq(invoices.uid, uid)));

      if (inv) {
        const allInvoicePayments = await db
          .select()
          .from(payments)
          .where(and(eq(payments.invoiceId, invId), eq(payments.uid, uid)));

        const totalPaid = allInvoicePayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
        const grandTotal = Number(inv.grandTotal || 0);
        const balance = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));
        const newStatus =
          balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid';

        await db
          .update(invoices)
          .set({
            amountPaid: String(totalPaid.toFixed(2)),
            balanceDue: String(balance.toFixed(2)),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invId));
      }
    }

    return created;
  } catch (error) {
    console.error('Database query failed in recordPayment:', error);
    throw new Error('Failed to record payment.', { cause: error });
  }
}

export async function deletePaymentById(uid: string, id: number) {
  try {
    const [existing] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.uid, uid)));

    await db.delete(payments).where(and(eq(payments.id, id), eq(payments.uid, uid)));

    if (existing?.invoiceId) {
      const invId = existing.invoiceId;
      const [inv] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invId), eq(invoices.uid, uid)));

      if (inv) {
        const remainingPayments = await db
          .select()
          .from(payments)
          .where(and(eq(payments.invoiceId, invId), eq(payments.uid, uid)));

        const totalPaid = remainingPayments.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );
        const grandTotal = Number(inv.grandTotal || 0);
        const balance = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));
        const newStatus =
          balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid';

        await db
          .update(invoices)
          .set({
            amountPaid: String(totalPaid.toFixed(2)),
            balanceDue: String(balance.toFixed(2)),
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invId));
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Database query failed in deletePaymentById:', error);
    throw new Error('Failed to delete payment.', { cause: error });
  }
}

export async function createExpenseRecord(uid: string, payload: any) {
  try {
    const [created] = await db
      .insert(expenses)
      .values({
        uid,
        expenseDate: payload.expenseDate,
        category: payload.category || 'Material Purchase',
        projectId: payload.projectId ? Number(payload.projectId) : null,
        vendorName: payload.vendorName || '',
        amount: String(payload.amount || '0.00'),
        paymentMethod: payload.paymentMethod || 'Cash',
        referenceNumber: payload.referenceNumber || '',
        notes: payload.notes || '',
        createdBy: payload.createdBy || 'Admin',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createExpenseRecord:', error);
    throw new Error('Failed to record expense.', { cause: error });
  }
}

export async function deleteExpenseById(uid: string, id: number) {
  try {
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteExpenseById:', error);
    throw new Error('Failed to delete expense.', { cause: error });
  }
}

export async function createAttachmentRecord(uid: string, payload: any) {
  try {
    const [created] = await db
      .insert(attachments)
      .values({
        uid,
        title: payload.title,
        category: payload.category || 'Site Photo',
        customerId: payload.customerId ? Number(payload.customerId) : null,
        projectId: payload.projectId ? Number(payload.projectId) : null,
        fileName: payload.fileName || 'attachment.jpg',
        fileType: payload.fileType || 'image/jpeg',
        fileDataUrl: payload.fileDataUrl,
        notes: payload.notes || '',
        createdBy: payload.createdBy || 'Admin',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createAttachmentRecord:', error);
    throw new Error('Failed to upload attachment.', { cause: error });
  }
}

export async function deleteAttachmentById(uid: string, id: number) {
  try {
    await db
      .delete(attachments)
      .where(and(eq(attachments.id, id), eq(attachments.uid, uid)));
    return { success: true };
  } catch (error) {
    console.error('Database query failed in deleteAttachmentById:', error);
    throw new Error('Failed to delete attachment.', { cause: error });
  }
}

export async function updateUserRoleRecord(id: number, role: string, name?: string) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        role,
        ...(name ? { name } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database query failed in updateUserRoleRecord:', error);
    throw new Error('Failed to update user role.', { cause: error });
  }
}

export async function createStaffMemberRecord(payload: {
  name: string;
  email: string;
  role: string;
  phone?: string;
}) {
  try {
    const syntheticUid = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const [created] = await db
      .insert(users)
      .values({
        uid: syntheticUid,
        name: payload.name,
        email: payload.email,
        role: payload.role || 'Site Staff',
        phone: payload.phone || '',
        active: true,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database query failed in createStaffMemberRecord:', error);
    throw new Error('Failed to create staff user.', { cause: error });
  }
}
