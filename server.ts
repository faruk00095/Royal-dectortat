import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  getFullBootstrapData,
  updateBusinessProfile,
  createOrUpdateCustomer,
  deleteCustomerById,
  createOrUpdateProject,
  deleteProjectById,
  createOrUpdateProduct,
  deleteProductById,
  saveMeasurementWithItems,
  deleteMeasurementById,
  saveBomWithItems,
  deleteBomById,
  saveQuotationWithItems,
  deleteQuotationById,
  saveInvoiceWithItems,
  deleteInvoiceById,
  recordPayment,
  deletePaymentById,
  createExpenseRecord,
  deleteExpenseById,
  createAttachmentRecord,
  deleteAttachmentById,
  updateUserRoleRecord,
  createStaffMemberRecord,
} from './src/db/repository.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // Healthcheck route
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 1. Bootstrap full workspace data
  app.get('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'info@newroyaldecorators.in';
      const name = req.user!.name || 'Proprietor';
      const data = await getFullBootstrapData(uid, email, name);
      res.json(data);
    } catch (error: any) {
      console.error('Failed to bootstrap data:', error);
      res.status(500).json({ error: error.message || 'Failed to load workspace data' });
    }
  });

  // 2. Business Profile Update
  app.put('/api/business', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateBusinessProfile(req.user!.uid, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update business:', error);
      res.status(500).json({ error: error.message || 'Failed to update business profile' });
    }
  });

  // 3. Customers CRUD
  app.post('/api/customers', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await createOrUpdateCustomer(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      res.status(500).json({ error: error.message || 'Failed to save customer' });
    }
  });

  app.delete('/api/customers/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteCustomerById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      res.status(500).json({ error: error.message || 'Failed to delete customer' });
    }
  });

  // 4. Projects CRUD
  app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await createOrUpdateProject(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save project:', error);
      res.status(500).json({ error: error.message || 'Failed to save project' });
    }
  });

  app.delete('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteProjectById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      res.status(500).json({ error: error.message || 'Failed to delete project' });
    }
  });

  // 5. Products / Material Master CRUD
  app.post('/api/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await createOrUpdateProduct(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      res.status(500).json({ error: error.message || 'Failed to save product' });
    }
  });

  app.delete('/api/products/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteProductById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  });

  // 6. Measurements CRUD
  app.post('/api/measurements', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await saveMeasurementWithItems(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save measurement:', error);
      res.status(500).json({ error: error.message || 'Failed to save measurement' });
    }
  });

  app.delete('/api/measurements/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteMeasurementById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete measurement:', error);
      res.status(500).json({ error: error.message || 'Failed to delete measurement' });
    }
  });

  // 7. BOM CRUD
  app.post('/api/bom', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await saveBomWithItems(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save BOM:', error);
      res.status(500).json({ error: error.message || 'Failed to save BOM' });
    }
  });

  app.delete('/api/bom/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteBomById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete BOM:', error);
      res.status(500).json({ error: error.message || 'Failed to delete BOM' });
    }
  });

  // 8. Quotations CRUD
  app.post('/api/quotations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await saveQuotationWithItems(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to save quotation' });
    }
  });

  app.delete('/api/quotations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteQuotationById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete quotation:', error);
      res.status(500).json({ error: error.message || 'Failed to delete quotation' });
    }
  });

  // 9. GST Invoices CRUD
  app.post('/api/invoices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await saveInvoiceWithItems(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      res.status(500).json({ error: error.message || 'Failed to save invoice' });
    }
  });

  app.delete('/api/invoices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteInvoiceById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      res.status(500).json({ error: error.message || 'Failed to delete invoice' });
    }
  });

  // 10. Payments & Receipts CRUD
  app.post('/api/payments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await recordPayment(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      res.status(500).json({ error: error.message || 'Failed to record payment' });
    }
  });

  app.delete('/api/payments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deletePaymentById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete payment:', error);
      res.status(500).json({ error: error.message || 'Failed to delete payment' });
    }
  });

  // 11. Expenses CRUD
  app.post('/api/expenses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await createExpenseRecord(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save expense:', error);
      res.status(500).json({ error: error.message || 'Failed to save expense' });
    }
  });

  app.delete('/api/expenses/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteExpenseById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      res.status(500).json({ error: error.message || 'Failed to delete expense' });
    }
  });

  // 12. Attachments CRUD
  app.post('/api/attachments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await createAttachmentRecord(req.user!.uid, req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed to save attachment:', error);
      res.status(500).json({ error: error.message || 'Failed to save attachment' });
    }
  });

  app.delete('/api/attachments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await deleteAttachmentById(req.user!.uid, Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      res.status(500).json({ error: error.message || 'Failed to delete attachment' });
    }
  });

  // 13. Staff & User Role Management
  app.post('/api/users/staff', requireAuth, async (req: AuthRequest, res) => {
    try {
      const created = await createStaffMemberRecord(req.body);
      res.json(created);
    } catch (error: any) {
      console.error('Failed to create staff user:', error);
      res.status(500).json({ error: error.message || 'Failed to create staff user' });
    }
  });

  app.put('/api/users/:id/role', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateUserRoleRecord(
        Number(req.params.id),
        req.body.role,
        req.body.name
      );
      res.json(updated);
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      res.status(500).json({ error: error.message || 'Failed to update user role' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`New Royal Decorators ERP Server running on http://localhost:${PORT}`);
  });
}

startServer();
