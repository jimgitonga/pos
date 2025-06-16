// src/components/invoices/InvoiceView.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Download, Edit, Printer, Mail, Share2,
  Calendar, Hash, User, Phone, Mail as MailIcon, MapPin,
  FileText, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceView({ invoice, onEdit, onDownload, onClose }) {
  const [businessInfo, setBusinessInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    loadBusinessInfo();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      const result = await window.api.settings.getBusinessInfo();
      if (result.success) {
setBusinessInfo(result.businessInfo);
      }
    } catch (error) {
      console.error('Error loading business info:', error);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Create a comprehensive invoice data object for PDF generation
      const invoiceData = {
        ...invoice,
        business: businessInfo,
        generatedAt: new Date().toISOString(),
        qrCode: `INV-${invoice.invoice_number}-${invoice.id}` // For QR code generation
      };

      const result = await window.api.invoices.generatePDF(invoiceData);
      if (result.success) {
        toast.success('PDF generated and downloaded successfully!');
        onDownload();
      } else {
        toast.error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailInvoice = async () => {
    if (!invoice.customer_email) {
      toast.error('Customer email is required to send invoice');
      return;
    }

    try {
      const result = await window.api.invoices.sendEmail(invoice.id);
      if (result.success) {
        toast.success('Invoice sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysUntilDue = () => {
    if (!invoice.due_date) return null;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = calculateDaysUntilDue();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Invoice #{invoice.invoice_number}
            </h1>
            <p className="text-gray-400">
              View and manage invoice details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          
          {invoice.customer_email && (
            <button
              onClick={handleEmailInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <MailIcon className="w-4 h-4" />
              Email
            </button>
          )}
          
          <button
            onClick={onEdit}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          
          <button
            onClick={generatePDF}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={printRef} className="bg-white text-gray-900 rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
              <div className="flex items-center gap-2 text-blue-100">
                <Hash className="w-4 h-4" />
                <span className="text-lg font-medium">{invoice.invoice_number}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                </span>
              </div>
              
              {daysUntilDue !== null && (
                <div className="text-blue-100 text-sm">
                  {daysUntilDue > 0 ? (
                    <span className="text-green-200">Due in {daysUntilDue} days</span>
                  ) : daysUntilDue === 0 ? (
                    <span className="text-yellow-200">Due today</span>
                  ) : (
                    <span className="text-red-200">Overdue by {Math.abs(daysUntilDue)} days</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Business and Customer Info */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Business Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">From</h3>
              <div className="space-y-2">
                <div className="font-bold text-xl text-gray-900">
                  {businessInfo.business_name || 'Your Business Name'}
                </div>
                <div className="text-gray-600">
                  {businessInfo.business_address || 'Business Address'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {businessInfo.business_phone || 'Phone Number'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MailIcon className="w-4 h-4" />
                  {businessInfo.business_email || 'Email Address'}
                </div>
                {businessInfo.tax_number && (
                  <div className="text-gray-600">
                    Tax ID: {businessInfo.tax_number}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h3>
              <div className="space-y-2">
                <div className="font-bold text-xl text-gray-900">
                  {invoice.customer_name || 'Walk-in Customer'}
                </div>
                {invoice.customer_email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MailIcon className="w-4 h-4" />
                    {invoice.customer_email}
                  </div>
                )}
                {invoice.customer_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {invoice.customer_phone}
                  </div>
                )}
                {invoice.customer_address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {invoice.customer_address}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Dates */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Invoice Date</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(invoice.invoice_date)}
              </div>
            </div>
            
            {invoice.due_date && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Due Date</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatDate(invoice.due_date)}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Payment Terms</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {invoice.payment_terms === '0' ? 'Due on Receipt' : `Net ${invoice.payment_terms} days`}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice Items</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">Description</th>
                  <th className="text-center py-4 px-2 font-semibold text-gray-900 w-20">Qty</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-900 w-24">Unit Price</th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-900 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 px-2">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        {item.product_id && (
                          <div className="text-sm text-gray-500">SKU: {item.sku || item.product_id}</div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center text-gray-900">{item.quantity}</td>
                      <td className="py-4 px-2 text-right text-gray-900">
                        KES {parseFloat(item.unit_price || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-2 text-right font-medium text-gray-900">
                        KES {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      KES {parseFloat(invoice.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                      <span className="font-medium text-gray-900">
                        KES {parseFloat(invoice.tax_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">
                        -KES {parseFloat(invoice.discount_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        KES {parseFloat(invoice.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {invoice.status === 'paid' && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Payment Received</h4>
              </div>
              <div className="text-green-700">
                This invoice has been marked as paid. Thank you for your business!
              </div>
            </div>
          )}

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms_conditions) && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                </div>
              )}
              
              {invoice.terms_conditions && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms_conditions}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                {businessInfo.receipt_footer || 'Thank you for your business!'}
              </p>
              <p className="text-xs mt-2">
                Invoice generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}