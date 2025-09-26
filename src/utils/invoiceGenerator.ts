export interface InvoiceData {
  orderId: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

export const generateInvoiceHTML = (invoice: InvoiceData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0.00';
    }
    return `₹${Number(amount).toFixed(2)}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${invoice.orderNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .invoice-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .invoice-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="80" cy="40" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="40" cy="80" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
          opacity: 0.3;
        }
        .invoice-header h1 {
          margin: 0;
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }
        .invoice-header p {
          margin: 15px 0 0 0;
          opacity: 0.9;
          font-size: 1.1rem;
          font-weight: 300;
          position: relative;
          z-index: 1;
        }
        .invoice-body {
          padding: 30px;
        }
        .invoice-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .info-section {
          flex: 1;
          min-width: 250px;
          margin-bottom: 20px;
        }
        .info-section h3 {
          color: #1e293b;
          margin-bottom: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .info-section p {
          margin: 5px 0;
          line-height: 1.5;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          border: 1px solid #e2e8f0;
        }
        .items-table th {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          padding: 18px 15px;
          text-align: left;
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.85rem;
        }
        .items-table td {
          padding: 18px 15px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .items-table tr:nth-child(even) {
          background-color: #fafbfc;
        }
        .items-table tr:hover {
          background-color: #f8fafc;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
        .total-section {
          margin-top: 30px;
          padding: 25px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 12px 0;
          padding: 8px 0;
          font-size: 1rem;
        }
        .total-row.final {
          border-top: 3px solid #1e293b;
          padding-top: 18px;
          margin-top: 18px;
          font-weight: 700;
          font-size: 1.4rem;
          color: #1e293b;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 18px;
          margin: 18px -25px -25px -25px;
          border-radius: 0 0 12px 12px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-delivered { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-processing { background: #cce5ff; color: #004085; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          color: #6c757d;
          font-size: 0.9rem;
        }
        @media print {
          body { background: white; }
          .invoice-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <h1>SOLEWAALE</h1>
          <p>Premium Footwear Collection</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); position: relative; z-index: 1;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.8;">INVOICE</p>
          </div>
        </div>
        
        <div class="invoice-body">
          <div class="invoice-info">
            <div class="info-section">
              <h3>Invoice Details</h3>
              <p><strong>Invoice #:</strong> ${invoice.orderNumber}</p>
              <p><strong>Order ID:</strong> ${invoice.orderId}</p>
              <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
              <p><strong>Status:</strong> <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
            </div>
            
            <div class="info-section">
              <h3>Customer Information</h3>
              <p><strong>${invoice.customerName}</strong></p>
              <p>${invoice.customerEmail}</p>
            </div>
            
            <div class="info-section">
              <h3>Shipping Address</h3>
              <p>${invoice.shippingAddress.fullName}</p>
              <p>${invoice.shippingAddress.address}</p>
              <p>${invoice.shippingAddress.city}, ${invoice.shippingAddress.state}</p>
              <p>${invoice.shippingAddress.zipCode}, ${invoice.shippingAddress.country}</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.discount > 0 ? `
              <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(invoice.discount)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>Shipping:</span>
              <span>${formatCurrency(invoice.shippingCost)}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 0.9rem;">Thank you for shopping with Solewaale!</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated invoice. No signature required.</p>
          <p>For any queries, contact us at support@solewaale.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadInvoicePDF = (invoice: InvoiceData) => {
  const htmlContent = generateInvoiceHTML(invoice);
  
  // Create a blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.orderNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
  
  // Silent success - invoice downloaded
};

export const downloadInvoiceHTML = (invoice: InvoiceData) => {
  const htmlContent = generateInvoiceHTML(invoice);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.orderNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};