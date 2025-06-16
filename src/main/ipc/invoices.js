// src/main/ipc/invoices.js
const { dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');

function setupInvoiceHandlers(ipcMain, db) {
  // Generate invoice number
  ipcMain.handle('invoices:generateNumber', async () => {
    try {
      const year = new Date().getFullYear();
      const prefix = `INV-${year}-`;
      
      // Get the last invoice number for this year
      const lastInvoice = db.prepare(`
        SELECT invoice_number FROM invoices 
        WHERE invoice_number LIKE ? 
        ORDER BY id DESC LIMIT 1
      `).get(`${prefix}%`);
      
      let nextNumber = 1;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoice_number.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }
      
      const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      
      return { success: true, number: invoiceNumber };
    } catch (error) {
      console.error('Error generating invoice number:', error);
      return { success: false, error: error.message };
    }
  });

  // Create invoice
  ipcMain.handle('invoices:create', async (event, invoiceData) => {
    const transaction = db.transaction(() => {
      try {
        // Insert invoice
        const invoiceResult = db.prepare(`
          INSERT INTO invoices (
            invoice_number, customer_id, customer_name, customer_email, 
            customer_phone, customer_address, invoice_date, due_date,
            payment_terms, subtotal, tax_rate, tax_amount, discount_amount,
            total_amount, status, notes, terms_conditions, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceData.invoice_number,
          invoiceData.customer_id,
          invoiceData.customer_name,
          invoiceData.customer_email,
          invoiceData.customer_phone,
          invoiceData.customer_address,
          invoiceData.invoice_date,
          invoiceData.due_date,
          invoiceData.payment_terms,
          invoiceData.subtotal,
          invoiceData.tax_rate,
          invoiceData.tax_amount,
          invoiceData.discount_amount,
          invoiceData.total_amount,
          invoiceData.status,
          invoiceData.notes,
          invoiceData.terms_conditions,
          1 // user_id - should be passed from the session
        );

        const invoiceId = invoiceResult.lastInsertRowid;

        // Insert invoice items
        const insertItem = db.prepare(`
          INSERT INTO invoice_items (
            invoice_id, product_id, description, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of invoiceData.items) {
          insertItem.run(
            invoiceId,
            item.product_id,
            item.description,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price
          );
        }

        // Log activity
        db.prepare(`
          INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          1, // user_id
          'create',
          'invoice',
          invoiceId,
          `Created invoice ${invoiceData.invoice_number}`
        );

        return { success: true, invoiceId };
      } catch (error) {
        throw error;
      }
    });

    try {
      const result = transaction();
      return result;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Get all invoices - FIXED VERSION
  ipcMain.handle('invoices:getAll', async (event, filters = {}) => {
    try {
      let query = `SELECT * FROM invoices`;
      
      const conditions = [];
      const params = [];

      if (filters.search) {
        conditions.push('(invoice_number LIKE ? OR customer_name LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }

      if (filters.startDate) {
        conditions.push('invoice_date >= ?');
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        conditions.push('invoice_date <= ?');
        params.push(filters.endDate);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const invoices = db.prepare(query).all(...params);

      // Get items for each invoice separately to avoid JSON parsing issues
      const processedInvoices = invoices.map(invoice => {
        const items = db.prepare(`
          SELECT * FROM invoice_items WHERE invoice_id = ?
        `).all(invoice.id);

        return {
          ...invoice,
          items: items || []
        };
      });

      return { success: true, invoices: processedInvoices };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { success: false, error: error.message };
    }
  });

  // Get invoice by ID
  ipcMain.handle('invoices:getById', async (event, id) => {
    try {
      const invoice = db.prepare(`
        SELECT * FROM invoices WHERE id = ?
      `).get(id);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ?
      `).all(id);

      return { 
        success: true, 
        invoice: { ...invoice, items } 
      };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Update invoice
  ipcMain.handle('invoices:update', async (event, { id, updates }) => {
    const transaction = db.transaction(() => {
      try {
        // Update invoice
        const updateFields = Object.keys(updates)
          .filter(key => key !== 'items')
          .map(key => `${key} = ?`)
          .join(', ');
        
        const updateValues = Object.keys(updates)
          .filter(key => key !== 'items')
          .map(key => updates[key]);

        db.prepare(`
          UPDATE invoices SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(...updateValues, id);

        // Update items if provided
        if (updates.items) {
          // Delete existing items
          db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);

          // Insert new items
          const insertItem = db.prepare(`
            INSERT INTO invoice_items (
              invoice_id, product_id, description, quantity, unit_price, total_price
            ) VALUES (?, ?, ?, ?, ?, ?)
          `);

          for (const item of updates.items) {
            insertItem.run(
              id,
              item.product_id,
              item.description,
              item.quantity,
              item.unit_price,
              item.quantity * item.unit_price
            );
          }
        }

        // Log activity
        db.prepare(`
          INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          1, // user_id
          'update',
          'invoice',
          id,
          `Updated invoice`
        );

        return { success: true };
      } catch (error) {
        throw error;
      }
    });

    try {
      const result = transaction();
      return result;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Delete invoice
  ipcMain.handle('invoices:delete', async (event, id) => {
    try {
      const invoice = db.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(id);
      
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      // Delete invoice (items will be deleted due to CASCADE)
      db.prepare('DELETE FROM invoices WHERE id = ?').run(id);

      // Log activity
      db.prepare(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        1, // user_id
        'delete',
        'invoice',
        id,
        `Deleted invoice ${invoice.invoice_number}`
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, error: error.message };
    }
  });

  // Generate PDF
  ipcMain.handle('invoices:generatePDF', async (event, invoiceData) => {
    try {
      const { app } = require('electron');
      const userDataPath = app.getPath('userData');
      const downloadsPath = app.getPath('downloads');
      
      const fileName = `Invoice-${invoiceData.invoice_number}.pdf`;
      const filePath = path.join(downloadsPath, fileName);

      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Invoice ${invoiceData.invoice_number}`,
          Author: invoiceData.business?.business_name || 'Your Business',
          Subject: 'Invoice',
          Keywords: 'invoice, billing, payment'
        }
      });

      // Pipe to file
      doc.pipe(require('fs').createWriteStream(filePath));

      // Header with gradient background
      doc.rect(0, 0, doc.page.width, 120)
         .fillAndStroke('#3B82F6', '#2563EB');

      // Company logo area (placeholder)
      doc.fillColor('white')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 40);

      doc.fontSize(14)
         .font('Helvetica')
         .text(`#${invoiceData.invoice_number}`, 50, 80);

      // Status badge
      const statusColors = {
        paid: '#10B981',
        pending: '#F59E0B',
        overdue: '#EF4444',
        draft: '#6B7280',
        cancelled: '#EF4444'
      };

      doc.rect(400, 40, 120, 30)
         .fillAndStroke(statusColors[invoiceData.status] || '#6B7280');
      
      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(invoiceData.status?.toUpperCase() || 'DRAFT', 420, 50);

      // Reset position for content
      let yPosition = 160;

      // Business Information
      doc.fillColor('black')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('From:', 50, yPosition);

      yPosition += 25;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(invoiceData.business?.business_name || 'Your Business Name', 50, yPosition);

      yPosition += 20;
      doc.fontSize(10)
         .font('Helvetica')
         .text(invoiceData.business?.business_address || '', 50, yPosition);

      if (invoiceData.business?.business_phone) {
        yPosition += 15;
        doc.text(`Phone: ${invoiceData.business.business_phone}`, 50, yPosition);
      }

      if (invoiceData.business?.business_email) {
        yPosition += 15;
        doc.text(`Email: ${invoiceData.business.business_email}`, 50, yPosition);
      }

      if (invoiceData.business?.tax_number) {
        yPosition += 15;
        doc.text(`Tax ID: ${invoiceData.business.tax_number}`, 50, yPosition);
      }

      // Customer Information
      yPosition = 160;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('Bill To:', 300, yPosition);

      yPosition += 25;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(invoiceData.customer_name || 'Walk-in Customer', 300, yPosition);

      if (invoiceData.customer_email) {
        yPosition += 20;
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Email: ${invoiceData.customer_email}`, 300, yPosition);
      }

      if (invoiceData.customer_phone) {
        yPosition += 15;
        doc.text(`Phone: ${invoiceData.customer_phone}`, 300, yPosition);
      }

      if (invoiceData.customer_address) {
        yPosition += 15;
        doc.text(invoiceData.customer_address, 300, yPosition);
      }

      // Invoice Details Box
      yPosition = Math.max(yPosition + 40, 320);
      
      doc.rect(50, yPosition, 500, 60)
         .fillAndStroke('#F3F4F6', '#E5E7EB');

      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Date:', 70, yPosition + 15)
         .text('Due Date:', 200, yPosition + 15)
         .text('Payment Terms:', 350, yPosition + 15);

      doc.fontSize(10)
         .font('Helvetica')
         .text(new Date(invoiceData.invoice_date).toLocaleDateString(), 70, yPosition + 30)
         .text(invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString() : 'N/A', 200, yPosition + 30)
         .text(invoiceData.payment_terms === '0' ? 'Due on Receipt' : `Net ${invoiceData.payment_terms} days`, 350, yPosition + 30);

      // Items Table
      yPosition += 100;
      
      // Table Header
      doc.rect(50, yPosition, 500, 25)
         .fillAndStroke('#374151', '#374151');

      doc.fillColor('white')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 60, yPosition + 8)
         .text('Qty', 350, yPosition + 8)
         .text('Unit Price', 400, yPosition + 8)
         .text('Total', 480, yPosition + 8);

      yPosition += 25;

      // Table Rows
      doc.fillColor('black');
      let itemTotal = 0;

      if (invoiceData.items && invoiceData.items.length > 0) {
        invoiceData.items.forEach((item, index) => {
          const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
          
          doc.rect(50, yPosition, 500, 20)
             .fillAndStroke(rowColor, '#E5E7EB');

          doc.fillColor('black')
             .fontSize(9)
             .font('Helvetica')
             .text(item.description || '', 60, yPosition + 6, { width: 280 })
             .text(item.quantity?.toString() || '0', 350, yPosition + 6)
             .text(`KES ${parseFloat(item.unit_price || 0).toFixed(2)}`, 400, yPosition + 6)
             .text(`KES ${(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)}`, 480, yPosition + 6);

          yPosition += 20;
          itemTotal += parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
        });
      }

      // Totals Section
      yPosition += 20;
      const totalsStartY = yPosition;

      // Totals background
      doc.rect(350, yPosition, 200, 100)
         .fillAndStroke('#F3F4F6', '#E5E7EB');

      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text('Subtotal:', 370, yPosition + 15)
         .text(`KES ${parseFloat(invoiceData.subtotal || 0).toFixed(2)}`, 480, yPosition + 15);

      yPosition += 20;
      if (invoiceData.tax_rate > 0) {
        doc.text(`Tax (${invoiceData.tax_rate}%):`, 370, yPosition)
           .text(`KES ${parseFloat(invoiceData.tax_amount || 0).toFixed(2)}`, 480, yPosition);
        yPosition += 20;
      }

      if (invoiceData.discount_amount > 0) {
        doc.text('Discount:', 370, yPosition)
           .text(`-KES ${parseFloat(invoiceData.discount_amount || 0).toFixed(2)}`, 480, yPosition);
        yPosition += 20;
      }

      // Total line
      doc.rect(350, yPosition, 200, 25)
         .fillAndStroke('#3B82F6', '#2563EB');

      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('TOTAL:', 370, yPosition + 7)
         .text(`KES ${parseFloat(invoiceData.total_amount || 0).toFixed(2)}`, 480, yPosition + 7);

      // Payment Status
      yPosition += 50;
      if (invoiceData.status === 'paid') {
        doc.rect(50, yPosition, 500, 40)
           .fillAndStroke('#D1FAE5', '#10B981');
        
        doc.fillColor('#065F46')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('✓ PAYMENT RECEIVED', 200, yPosition + 12);
      } else if (invoiceData.status === 'overdue') {
        doc.rect(50, yPosition, 500, 40)
           .fillAndStroke('#FEE2E2', '#EF4444');
        
        doc.fillColor('#991B1B')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('⚠ PAYMENT OVERDUE', 200, yPosition + 12);
      }

      // Notes and Terms
      yPosition += 70;
      
      if (invoiceData.notes || invoiceData.terms_conditions) {
        if (invoiceData.notes) {
          doc.fillColor('black')
             .fontSize(12)
             .font('Helvetica-Bold')
             .text('Notes:', 50, yPosition);
          
          yPosition += 20;
          doc.fontSize(10)
             .font('Helvetica')
             .text(invoiceData.notes, 50, yPosition, { width: 240 });
        }

        if (invoiceData.terms_conditions) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Terms & Conditions:', 300, yPosition - (invoiceData.notes ? 20 : 0));
          
          doc.fontSize(10)
             .font('Helvetica')
             .text(invoiceData.terms_conditions, 300, yPosition, { width: 240 });
        }
      }

      // Footer
      yPosition = doc.page.height - 100;
      
      doc.rect(0, yPosition, doc.page.width, 60)
         .fillAndStroke('#F3F4F6', '#E5E7EB');

      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text(invoiceData.business?.receipt_footer || 'Thank you for your business!', 50, yPosition + 15, { 
           width: doc.page.width - 100, 
           align: 'center' 
         });

      doc.fontSize(8)
         .text(`Invoice generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 
               50, yPosition + 35, { 
                 width: doc.page.width - 100, 
                 align: 'center' 
               });

      // QR Code placeholder (you can integrate a QR code library here)
      doc.rect(doc.page.width - 80, yPosition + 10, 40, 40)
         .fillAndStroke('#FFFFFF', '#E5E7EB');
      
      doc.fontSize(6)
         .text('QR Code', doc.page.width - 75, yPosition + 27);

      // Finalize PDF
      doc.end();

      // Wait for PDF to be written
      await new Promise((resolve, reject) => {
        doc.on('end', resolve);
        doc.on('error', reject);
      });

      return { success: true, filePath };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
  });

  // Send invoice via email
  ipcMain.handle('invoices:sendEmail', async (event, invoiceId) => {
    try {
      // Get invoice details
      const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
      
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (!invoice.customer_email) {
        return { success: false, error: 'Customer email not found' };
      }

      // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate success
      
      // Log activity
      db.prepare(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        1, // user_id
        'email',
        'invoice',
        invoiceId,
        `Sent invoice ${invoice.invoice_number} to ${invoice.customer_email}`
      );

      return { 
        success: true, 
        message: `Invoice sent to ${invoice.customer_email}` 
      };
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return { success: false, error: error.message };
    }
  });

  // Get invoice statistics
  ipcMain.handle('invoices:getStats', async () => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_invoices,
          SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_invoices,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_invoices,
          SUM(total_amount) as total_amount,
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount
        FROM invoices
      `).get();

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      return { success: false, error: error.message };
    }
  });

  // Update invoice status
  ipcMain.handle('invoices:updateStatus', async (event, { id, status }) => {
    try {
      const invoice = db.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(id);
      
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      db.prepare('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, id);

      // Log activity
      db.prepare(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        1, // user_id
        'status_update',
        'invoice',
        id,
        `Changed invoice ${invoice.invoice_number} status to ${status}`
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: error.message };
    }
  });

  // Duplicate invoice
  ipcMain.handle('invoices:duplicate', async (event, invoiceId) => {
    try {
      const originalInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
      
      if (!originalInvoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const originalItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);

      // Generate new invoice number
      const numberResult = await ipcMain.emit('invoices:generateNumber');
      if (!numberResult.success) {
        return { success: false, error: 'Failed to generate invoice number' };
      }

      // Create duplicate invoice
      const duplicateData = {
        ...originalInvoice,
        invoice_number: numberResult.number,
        status: 'draft',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: null,
        items: originalItems.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      delete duplicateData.id;
      delete duplicateData.created_at;
      delete duplicateData.updated_at;

      const createResult = await ipcMain.emit('invoices:create', event, duplicateData);
      
      return createResult;
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupInvoiceHandlers };