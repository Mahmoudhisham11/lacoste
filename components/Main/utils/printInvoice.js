"use client";

export const printInvoice = (invoice) => {
  if (!invoice) return;

  if (!invoice.cart || invoice.cart.length === 0) {
    return { success: false, message: "الفاتورة فارغة" };
  }

  const printWindow = window.open("", "", "width=450,height=600");
  if (!printWindow) {
    return { success: false, message: "يرجى السماح بفتح النوافذ المنبثقة" };
  }

  const total = invoice.discount > 0
    ? invoice.total
    : invoice.cart.reduce((sum, item) => sum + (item.total || item.sellPrice * item.quantity), 0);

  const invoiceHTML = `
<html>
<head>
  <title>فاتورة</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 0; padding: 0; }
    }
    body {
      font-family: 'Courier New', monospace;
      direction: rtl;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .invoice {
      max-width: 280mm;
      margin: 0 auto;
      padding: 10px 8px;
      font-size: 11px;
      line-height: 1.3;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
    }
    .header img {
      width: 140px;
      height: 90px;
      object-fit: contain;
      margin-bottom: 4px;
    }
    .header h2 {
      font-size: 14px;
      margin: 2px 0;
      font-weight: 700;
    }
    .divider {
      border-top: 1px dashed #333;
      margin: 6px 0;
    }
    .info {
      font-size: 11px;
      margin: 4px 0;
    }
    .info p {
      margin: 2px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: center;
      font-size: 10px;
    }
    th {
      background: #000;
      color: #fff;
      font-weight: 700;
      font-size: 10px;
    }
    td:nth-child(2) {
      text-align: right;
    }
    tfoot td {
      font-weight: 700;
      border-top: 2px solid #000;
      font-size: 11px;
    }
    .total-row td {
      border-top: 2px solid #000;
    }
    .footer {
      text-align: center;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #333;
      font-size: 10px;
    }
    .footer p {
      margin: 2px 0;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <img id="invoiceLogo" src="${
        typeof window !== "undefined" ? window.location.origin : ""
      }/images/logo.png" alt="Logo" />
    </div>
    
    <div class="divider"></div>
    
    <div class="info">
      <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleDateString("ar-EG")}</p>
      <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>العميل:</strong> ${invoice.clientName || "بدون اسم"}</p>
      <p><strong>الهاتف:</strong> ${invoice.phone || "-"}</p>
      ${invoice.employee ? `<p><strong>الموظف:</strong> ${invoice.employee}</p>` : ""}
      <p><strong>طريقة الدفع:</strong> ${invoice.paymentMethod === "wallet" ? "محفظة" : "نقدي"}${invoice.paymentMethod === "wallet" && invoice.walletNumber ? ` (رقم: ${invoice.walletNumber})` : ""}</p>
    </div>
    
    <div class="divider"></div>
    
    <table>
      <thead>
        <tr>
          <th>الرمز</th>
          <th>المنتج</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.cart
          .map(
            (item) => `
          <tr>
            <td>${item.code || "-"}</td>
            <td>${item.name}${item.color ? ` - ${item.color}` : ""}${item.size ? ` - ${item.size}` : ""}</td>
            <td>${item.quantity}</td>
            <td>${Number(item.sellPrice).toFixed(2)}</td>
            <td>${(item.total || item.sellPrice * item.quantity).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="4" style="text-align: left;"><strong>الإجمالي:</strong></td>
          <td><strong>${total.toFixed(2)}</strong></td>
        </tr>
        ${invoice.discount > 0 ? `
        <tr>
          <td colspan="4" style="text-align: left;"><strong>الخصم:</strong></td>
          <td><strong>${Number(invoice.discount).toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: left;"><strong>الإجمالي بعد الخصم:</strong></td>
          <td><strong>${(total - Number(invoice.discount)).toFixed(2)}</strong></td>
        </tr>
        ${invoice.discountNotes ? `
        <tr>
          <td colspan="5" style="text-align: center; font-size: 9px; color: #555;">
            ملاحظة الخصم: ${invoice.discountNotes}
          </td>
        </tr>` : ""}
        ` : ""}
      </tfoot>
    </table>
    
    <p style="text-align: center; margin: 4px 0; font-size: 10px;">
      عدد الأصناف: ${invoice.cart.length}
    </p>
    
    <div class="divider"></div>
    
    <div class="footer">
      <p>البضاعة المباعة لا ترد</p>
      <p>ولكن تستبدل خلال ثلاث ايام</p>
      <p style="font-size: 9px; color: #666;">تم التوجيه بواسطة: Devoria</p>
    </div>
  </div>

  <script>
    var logo = document.getElementById('invoiceLogo');
    function doPrint() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 500);
      }, 300);
    }
    if (logo.complete) {
      doPrint();
    } else {
      logo.onload = doPrint;
      logo.onerror = doPrint;
    }
  </script>
</body>
</html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  printWindow.focus();

  return { success: true };
};
