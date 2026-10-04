import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull().default('Admin User'),
  email: text('email').notNull(),
  role: text('role').notNull().default('Admin'), // Admin, Manager, Billing Staff, Site Staff, Accountant
  phone: text('phone').default(''),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. businesses
export const businesses = pgTable('businesses', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  businessName: text('business_name').notNull().default('NEW ROYAL DECORATORS'),
  category: text('category')
    .notNull()
    .default(
      'False Ceiling Works, PVC Ceiling, Gypsum Board, POP Work, Flower & Border Fitting, Interior Decoration.'
    ),
  logoUrl: text('logo_url').default(''),
  address: text('address')
    .notNull()
    .default('Shop No. 14, Timber Market Road, Near Royal Chowk, Pune - 411002'),
  mobileNumbers: text('mobile_numbers')
    .notNull()
    .default('+91 98230 45112, +91 97654 32109'),
  email: text('email').notNull().default('info@newroyaldecorators.in'),
  gstin: text('gstin').notNull().default('27AABCN1234F1Z5'),
  pan: text('pan').notNull().default('AABCN1234F'),
  state: text('state').notNull().default('Maharashtra'),
  stateCode: text('state_code').notNull().default('27'),
  bankName: text('bank_name').notNull().default('HDFC Bank Ltd.'),
  accountName: text('account_name').notNull().default('NEW ROYAL DECORATORS'),
  accountNumber: text('account_number').notNull().default('50200048291044'),
  ifscCode: text('ifsc_code').notNull().default('HDFC0000142'),
  branch: text('branch').notNull().default('Station Road Branch, Pune'),
  upiId: text('upi_id').notNull().default('newroyaldecorators@hdfcbank'),
  invoicePrefix: text('invoice_prefix').notNull().default('NRD/26-27/INV-'),
  quotationPrefix: text('quotation_prefix').notNull().default('NRD/26-27/QTN-'),
  measurementPrefix: text('measurement_prefix').notNull().default('NRD/26-27/MS-'),
  bomPrefix: text('bom_prefix').notNull().default('NRD/26-27/BOM-'),
  receiptPrefix: text('receipt_prefix').notNull().default('NRD/26-27/RCP-'),
  defaultGstRate: numeric('default_gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  termsAndConditions: text('terms_and_conditions')
    .notNull()
    .default(
      '1. 50% advance payment at the time of order confirmation.\n2. 30% running payment after GI framework & board/panel structure completion.\n3. Balance 20% strictly upon completion of work before site handover.\n4. Scaffolding, electricity, and water at site to be provided by the customer.\n5. Extra work beyond quotation will be billed per actual site measurement.\n6. Subject to local jurisdiction only.'
    ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. customers
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').default(''),
  address: text('address').notNull().default(''),
  gstin: text('gstin').default(''),
  pan: text('pan').default(''),
  state: text('state').notNull().default('Maharashtra'),
  stateCode: text('state_code').notNull().default('27'),
  siteAddress: text('site_address').notNull().default(''),
  openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).default('0.00'),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. projects
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  projectName: text('project_name').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  siteAddress: text('site_address').notNull(),
  startDate: text('start_date').notNull(),
  expectedCompletionDate: text('expected_completion_date').default(''),
  status: text('status').notNull().default('Measurement'),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. sites
export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  projectId: integer('project_id')
    .references(() => projects.id, { onDelete: 'cascade' })
    .notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  siteName: text('site_name').notNull(),
  siteAddress: text('site_address').notNull(),
  supervisorName: text('supervisor_name').default(''),
  supervisorMobile: text('supervisor_mobile').default(''),
  floors: text('floors').default('Ground Floor, First Floor'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. measurements
export const measurements = pgTable('measurements', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  measurementNumber: text('measurement_number').notNull(),
  date: text('date').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  siteName: text('site_name').notNull().default(''),
  totalAreaSqft: numeric('total_area_sqft', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  pvcCeilingSqft: numeric('pvc_ceiling_sqft', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  popCeilingSqft: numeric('pop_ceiling_sqft', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gypsumCeilingSqft: numeric('gypsum_ceiling_sqft', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  materialEstimate: numeric('material_estimate', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  labourEstimate: numeric('labour_estimate', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  otherCharges: numeric('other_charges', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  discount: numeric('discount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  gstAmount: numeric('gst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. measurement_items
export const measurementItems = pgTable('measurement_items', {
  id: serial('id').primaryKey(),
  measurementId: integer('measurement_id')
    .references(() => measurements.id, { onDelete: 'cascade' })
    .notNull(),
  section: text('section').notNull().default('Ground Floor'),
  room: text('room').notNull().default('Bedroom'),
  workType: text('work_type').notNull().default('PVC Ceiling'),
  description: text('description').notNull().default(''),
  rawExpression: text('raw_expression').notNull().default(''),
  lengthInput: text('length_input').notNull().default('0'),
  widthInput: text('width_input').notNull().default('0'),
  lengthFeet: numeric('length_feet', { precision: 10, scale: 4 })
    .notNull()
    .default('0'),
  widthFeet: numeric('width_feet', { precision: 10, scale: 4 })
    .notNull()
    .default('0'),
  quantity: numeric('quantity', { precision: 10, scale: 2 })
    .notNull()
    .default('1'),
  calcType: text('calc_type').notNull().default('SQFT'),
  areaSqft: numeric('area_sqft', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  rate: numeric('rate', { precision: 12, scale: 2 }).notNull().default('0.00'),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category').notNull(),
  brand: text('brand').notNull().default(''),
  hsnSac: text('hsn_sac').notNull().default('3925'),
  unit: text('unit').notNull().default('sq.ft'),
  purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  stockQuantity: numeric('stock_quantity', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  minStockLevel: numeric('min_stock_level', { precision: 12, scale: 2 })
    .notNull()
    .default('10.00'),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 9. bom
export const bom = pgTable('bom', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  bomNumber: text('bom_number').notNull(),
  date: text('date').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  measurementId: integer('measurement_id').references(() => measurements.id, {
    onDelete: 'set null',
  }),
  totalMaterialCost: numeric('total_material_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  totalLabourCost: numeric('total_labour_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. bom_items
export const bomItems = pgTable('bom_items', {
  id: serial('id').primaryKey(),
  bomId: integer('bom_id')
    .references(() => bom.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  itemName: text('item_name').notNull(),
  category: text('category').notNull().default('PVC Ceiling'),
  brand: text('brand').default(''),
  specification: text('specification').default(''),
  hsnSac: text('hsn_sac').default('3925'),
  unit: text('unit').notNull().default('piece'),
  requiredQty: numeric('required_qty', { precision: 12, scale: 2 })
    .notNull()
    .default('1.00'),
  wastagePercent: numeric('wastage_percent', { precision: 5, scale: 2 })
    .notNull()
    .default('5.00'),
  finalQty: numeric('final_qty', { precision: 12, scale: 2 })
    .notNull()
    .default('1.05'),
  purchaseRate: numeric('purchase_rate', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  sellingRate: numeric('selling_rate', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  materialCost: numeric('material_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  labourCost: numeric('labour_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  total: numeric('total', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. quotations
export const quotations = pgTable('quotations', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  quotationNumber: text('quotation_number').notNull(),
  date: text('date').notNull(),
  validUntil: text('valid_until').notNull(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  measurementId: integer('measurement_id').references(() => measurements.id, {
    onDelete: 'set null',
  }),
  bomId: integer('bom_id').references(() => bom.id, {
    onDelete: 'set null',
  }),
  siteAddress: text('site_address').notNull().default(''),
  status: text('status').notNull().default('Pending'),
  materialSubtotal: numeric('material_subtotal', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  labourCost: numeric('labour_cost', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  otherCharges: numeric('other_charges', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  discount: numeric('discount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  taxableAmount: numeric('taxable_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  gstAmount: numeric('gst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  termsAndConditions: text('terms_and_conditions').default(''),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 12. quotation_items
export const quotationItems = pgTable('quotation_items', {
  id: serial('id').primaryKey(),
  quotationId: integer('quotation_id')
    .references(() => quotations.id, { onDelete: 'cascade' })
    .notNull(),
  section: text('section').default('General'),
  description: text('description').notNull(),
  hsnSac: text('hsn_sac').default('9954'),
  quantity: numeric('quantity', { precision: 12, scale: 2 })
    .notNull()
    .default('1.00'),
  unit: text('unit').notNull().default('sq.ft'),
  rate: numeric('rate', { precision: 12, scale: 2 }).notNull().default('0.00'),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. invoices
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date').default(''),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  quotationId: integer('quotation_id').references(() => quotations.id, {
    onDelete: 'set null',
  }),
  measurementId: integer('measurement_id').references(() => measurements.id, {
    onDelete: 'set null',
  }),
  customerGstin: text('customer_gstin').default(''),
  placeOfSupply: text('place_of_supply').notNull().default('Maharashtra (27)'),
  isInterState: boolean('is_inter_state').notNull().default(false),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  discount: numeric('discount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  taxableValue: numeric('taxable_value', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  cgstAmount: numeric('cgst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  sgstAmount: numeric('sgst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  igstAmount: numeric('igst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  totalGst: numeric('total_gst', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  balanceDue: numeric('balance_due', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  amountInWords: text('amount_in_words').notNull().default(''),
  status: text('status').notNull().default('Unpaid'),
  isFinalized: boolean('is_finalized').notNull().default(true),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 14. invoice_items
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .references(() => invoices.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  hsnSac: text('hsn_sac').notNull().default('9954'),
  quantity: numeric('quantity', { precision: 12, scale: 2 })
    .notNull()
    .default('1.00'),
  unit: text('unit').notNull().default('sq.ft'),
  rate: numeric('rate', { precision: 12, scale: 2 }).notNull().default('0.00'),
  taxableValue: numeric('taxable_value', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  gstRate: numeric('gst_rate', { precision: 5, scale: 2 })
    .notNull()
    .default('18.00'),
  cgstAmount: numeric('cgst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  sgstAmount: numeric('sgst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  igstAmount: numeric('igst_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. payments
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  paymentDate: text('payment_date').notNull(),
  invoiceId: integer('invoice_id').references(() => invoices.id, {
    onDelete: 'set null',
  }),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  paymentMethod: text('payment_method').notNull().default('UPI'),
  referenceNumber: text('reference_number').default(''),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  updatedBy: text('updated_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 16. expenses
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  expenseDate: text('expense_date').notNull(),
  category: text('category').notNull().default('Material Purchase'),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  vendorName: text('vendor_name').default(''),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
  paymentMethod: text('payment_method').notNull().default('Cash'),
  referenceNumber: text('reference_number').default(''),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 17. attachments
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull().default('Site Photo'),
  customerId: integer('customer_id').references(() => customers.id, {
    onDelete: 'set null',
  }),
  projectId: integer('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull().default('image/jpeg'),
  fileDataUrl: text('file_data_url').notNull(),
  notes: text('notes').default(''),
  createdBy: text('created_by').default('Admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 18. settings
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value').notNull(),
  updatedBy: text('updated_by').default('Admin'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
  measurements: many(measurements),
  boms: many(bom),
  quotations: many(quotations),
  invoices: many(invoices),
  payments: many(payments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  sites: many(sites),
  measurements: many(measurements),
  boms: many(bom),
  quotations: many(quotations),
  invoices: many(invoices),
}));

export const measurementsRelations = relations(measurements, ({ one, many }) => ({
  customer: one(customers, {
    fields: [measurements.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [measurements.projectId],
    references: [projects.id],
  }),
  items: many(measurementItems),
}));

export const measurementItemsRelations = relations(measurementItems, ({ one }) => ({
  measurement: one(measurements, {
    fields: [measurementItems.measurementId],
    references: [measurements.id],
  }),
}));

export const bomRelations = relations(bom, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bom.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [bom.projectId],
    references: [projects.id],
  }),
  measurement: one(measurements, {
    fields: [bom.measurementId],
    references: [measurements.id],
  }),
  items: many(bomItems),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(bom, {
    fields: [bomItems.bomId],
    references: [bom.id],
  }),
  product: one(products, {
    fields: [bomItems.productId],
    references: [products.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [quotations.projectId],
    references: [projects.id],
  }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));
