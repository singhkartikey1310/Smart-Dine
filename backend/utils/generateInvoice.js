const generateInvoiceHTML = (order, user, payment) => {
  const itemRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 20px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        .total-row { font-weight: bold; background: #fff3e0; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <h1>SmartDine AI</h1>
          <p>Invoice #${order.orderNumber}</p>
        </div>
        <div style="margin: 20px 0; display: flex; justify-content: space-between;">
          <div>
            <h3>Bill To:</h3>
            <p>${user.name}<br>${user.email}<br>${order.deliveryAddress.street}, ${order.deliveryAddress.city}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Payment ID:</strong> ${payment?.razorpayPaymentId || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: green;">${order.paymentStatus.toUpperCase()}</span></p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr><td colspan="3" style="padding: 8px; text-align: right;">Subtotal</td><td style="padding: 8px; text-align: right;">₹${order.subtotal}</td></tr>
            <tr><td colspan="3" style="padding: 8px; text-align: right;">Tax (5%)</td><td style="padding: 8px; text-align: right;">₹${order.tax}</td></tr>
            <tr><td colspan="3" style="padding: 8px; text-align: right;">Delivery Fee</td><td style="padding: 8px; text-align: right;">₹${order.deliveryFee}</td></tr>
            ${order.discount > 0 ? `<tr><td colspan="3" style="padding: 8px; text-align: right; color: green;">Discount</td><td style="padding: 8px; text-align: right; color: green;">-₹${order.discount}</td></tr>` : ''}
            <tr class="total-row"><td colspan="3" style="padding: 10px; text-align: right; font-size: 18px;">Total</td><td style="padding: 10px; text-align: right; font-size: 18px;">₹${order.total}</td></tr>
          </tfoot>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #888;">Thank you for ordering from SmartDine AI!</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = generateInvoiceHTML;
