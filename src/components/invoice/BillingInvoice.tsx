"use client";
import React from 'react';

interface InvoiceProps {
  data: any; 
  vendorProfile: any;
  type?: string; 
  onDownloadPdf?: () => void;
  isCustomerView?: boolean;
  onClose?: () => void;
}

/**
 * Converts a number to Indian currency word format (Simplified)
 */
const numberToWords = (num: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return '...';
  };

  const amount = Math.floor(num);
  return amount === 0 ? 'Zero' : inWords(amount) + ' Rupees Only';
};

const BillingInvoice: React.FC<InvoiceProps> = ({ data: rawData, vendorProfile, type = 'order', onDownloadPdf: _onDownloadPdf, isCustomerView = false, onClose }) => {
  
  if (!rawData) return null;
  // Normalize data: unwrap nested structures if they exist from the detail APIs
  const isQuote = type === 'quote';
  
  // Helper to deep camelCase keys (simplified for UI)
  const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc: any, key: any) => {
        // Skip keys starting with underscore (like _id)
        if (key.startsWith('_')) {
          acc[key] = toCamel(obj[key]);
          return acc;
        }
        const camelKey = key.replace(/(_\w)/g, (m: any) => m[1].toUpperCase());
        acc[camelKey] = toCamel(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  const data = toCamel(rawData.order || rawData.quote || rawData.data || rawData);
  const camelVendorProfile = toCamel(vendorProfile);
  const displayId = isQuote ? (data._id || data.id) : (data.orderId || data._id || data.id);
  const dateStr = data.createdAt;
  const dateObj = new Date(dateStr);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  const customer = data.userId || {};
  const items = data.items || (isQuote ? [data] : []);
  const subTotal = isQuote ? (data.totalPrice || data.calculatedPrice || 0) : (data.totalAmount || 0);
  
  // eCommerce specific details (fallback values)
  let paymentMethod = data.paymentMode || data.paymentMethod || (data.paymentStatus?.toLowerCase() === 'paid' ? 'Online / Prepaid' : 'Pending');
  if (paymentMethod.toLowerCase() === 'razorpay') {
    paymentMethod = 'Online / Prepaid';
  }
  const totalGst = data.gstAmount || data.gst_amount || 0;
  const subtotalExclGst = data.subTotal || data.subtotal || (subTotal - totalGst);
  
  // Table sync data
  const orderStatus = data.vendorStatus || data.status || 'Pending';
  
  // Robust admin payout status
  const adminPaymentStatus = data.paymentStatusInfo?.paymentStatus || data.vendorPaymentInfo?.paymentStatus || data.adminPaymentStatus || 'Pending';
  const adminPaymentAmount = data.vendorPaymentInfo?.vendorAmount || data.paymentStatusInfo?.vendorAmount || 0;

  // Use vendor logo if available, else fallback to default logo
  const logoSrc = camelVendorProfile?.businessLogoImage || "/images/logo/logo.webp";

  const handleDownload = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/invoice/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          data: rawData,
          vendorProfile,
          type,
          isCustomerView: false
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${displayId?.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white font-sans text-gray-800 leading-normal shadow-lg rounded-xl border border-gray-200 relative overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 transition-colors no-print z-10 p-1.5 rounded-full"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Premium Watermark */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50/20 rounded-full blur-3xl pointer-events-none no-print"></div>
      
      <div className="print-section">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
          <div>
            <img src={logoSrc} alt="Upleex" className="h-12 w-auto mb-2 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/logo/logo.webp";
            }} />
            <div className="text-xl font-bold text-gray-900 tracking-tight leading-snug">
              {camelVendorProfile?.businessName || '-'}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
              {isQuote ? 'Quotation' : 'Tax Invoice'}
            </h1>
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-gray-500">
                {isQuote ? 'Quote' : 'Invoice'} #: <span className="text-gray-900 font-mono font-bold">
                  {displayId?.includes(',') ? displayId : `#${displayId?.slice(-8).toUpperCase()}`}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">Date: {formattedDate}</div>
            </div>
          </div>
        </div>

        {/* Info Bars */}
        <div className="grid grid-cols-4 gap-3 mb-5">
           <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
               <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Place of Supply</span>
               <span className="text-xs font-bold text-gray-800">{camelVendorProfile?.city || '-'} {camelVendorProfile?.state || ''}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
               <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Payment Method</span>
              <span className="text-xs font-bold text-gray-800">{paymentMethod}</span>
           </div>
           <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
               <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Customer Payment</span>
               <span className={`text-xs font-bold capitalize ${data.paymentStatus?.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                 {data.paymentStatus || 'Pending'}
               </span>
           </div>
           {!isCustomerView && (
             <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200/70">
                 <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Admin Payment</span>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold capitalize ${adminPaymentStatus.toLowerCase() === 'completed' || adminPaymentStatus.toLowerCase() === 'paid' || adminPaymentStatus.toLowerCase() === 'released' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {adminPaymentStatus === 'no_payment' ? 'Unprocessed' : adminPaymentStatus}
                  </span>
                  {adminPaymentAmount > 0 && (
                    <span className="text-[11px] font-medium text-gray-600 mt-0.5">Rs. {adminPaymentAmount.toLocaleString()}</span>
                  )}
                </div>
             </div>
           )}
        </div>

        {/* Addressing Details */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 w-fit pr-6">Seller / Sold By</h3>
            <div className="text-xs space-y-0.5 leading-snug">
              <p className="font-bold text-gray-900 text-sm">{camelVendorProfile?.businessName}</p>
              <p className='text-gray-600 font-medium'>{camelVendorProfile?.email}</p>
              <p className='text-gray-600 font-medium'>+91 {camelVendorProfile?.mobile}</p>
              <p className="text-gray-600 font-medium">{camelVendorProfile?.address}</p>
              <p className="text-gray-600 font-medium">
                {camelVendorProfile?.city}{camelVendorProfile?.city && camelVendorProfile?.state ? ', ' : ''}{camelVendorProfile?.state} - {camelVendorProfile?.pincode}
              </p>
              {camelVendorProfile?.gstNumber && (
                <div className="pt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">GSTIN</span>
                  <span className="font-mono text-gray-800 font-bold tracking-tight">{camelVendorProfile.gstNumber}</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5 text-right flex flex-col items-end">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-1 w-fit pl-6">Buyer / Ship To</h3>
            <div className="text-xs space-y-0.5 leading-snug text-right">
              <p className="font-bold text-gray-900 text-sm mb-0.5">{customer?.name || data?.userName || 'Customer'}</p>
              <div className="flex flex-col items-end gap-0.5 text-gray-600 font-medium">
                <p>{customer?.email || data?.userEmail || 'N/A'}</p>
                <div className="flex items-center gap-2 justify-end w-max ml-auto">
                   <p>{customer?.phone || customer?.mobile || data?.userPhone || 'N/A'}</p>
                </div>
              </div>
              {data.shippingAddress ? (
                <div className="mt-1.5 text-right">
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tight">Shipping Address</span>
                  {typeof data.shippingAddress === 'string' ? (
                    <p className="text-blue-600 pt-1 text-xs font-medium leading-tight max-w-[200px] ml-auto">{data.shippingAddress}</p>
                  ) : (
                    <div className="text-blue-600 pt-1 text-xs font-medium leading-tight max-w-[200px] ml-auto">
                      {data.shippingAddress.name && <p>{data.shippingAddress.name}</p>}
                      {data.shippingAddress.phone && <p>{data.shippingAddress.phone}</p>}
                      {data.shippingAddress.addressLine1 && <p>{data.shippingAddress.addressLine1}</p>}
                      {data.shippingAddress.addressLine2 && <p>{data.shippingAddress.addressLine2}</p>}
                      <p>
                        {[data.shippingAddress.city, data.shippingAddress.state, data.shippingAddress.pincode]
                          .filter(Boolean).join(', ')}
                      </p>
                      {data.shippingAddress.country && <p>{data.shippingAddress.country}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 pt-1 text-xs font-normal">Standard billing address used for shipping</p>
              )}
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mb-5 rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">Item & Description</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">HSN</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">Type</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">Unit Price</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">Qty</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">GST</th>
                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-left">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item: any, index: number) => {
                const product = isQuote ? (item.productId || item.product || {}) : (item.productId || {});
                const name = isQuote ? (product.productName || item.productName) : (product.name || item.productName || item.name);
                const sku = product.sku || item.sku || (isQuote ? item.productSku : null) || 'N/A';
                const typeLabel = product.productTypeName || item.productTypeName || 'Sell';
                const price = isQuote ? (item.price || product.price) : (item.price || product.price);
                const qty = isQuote ? (item.qty) : (item.quantity || 1);
                const rowTotal = isQuote ? (item.totalPrice || item.calculatedPrice) : (item.price * (item.quantity || 1));
                const hsn = item.hsnCode || item.hsn_code || product?.hsnCode || product?.hsn_code || 'N/A';
                const gstPer = item.gstPer || item.gst_per || product?.gst || 0;
                const gstAmt = item.gstAmount || item.gst_amount || (Number(price || 0) * Number(qty || 1) * Number(gstPer) / 100);

                return (
                  <tr key={index} className="hover:bg-gray-50/50 transition-all">
                    <td className="p-3">
                      <div className="flex gap-2.5 items-center">
                         {/* Thumbnail sync with table */}
                         {(product?.thumbImage || item.thumbImage || product?.productMainImage) && (
                           <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0 no-print">
                              <img src={product?.thumbImage || item.thumbImage || product?.productMainImage} alt="" className="w-full h-full object-cover" />
                           </div>
                         )}
                         <div>
                            <div className="font-bold text-xs text-gray-900">{name}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">SKU: {sku}</div>
                            {isQuote && item.numberOfDays && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {item.numberOfDays} {item.productListingTypeName?.toLowerCase() === 'hourly' ? 'HOURS' : 'DAYS'} RENTAL
                              </div>
                            )}
                         </div>
                      </div>
                    </td>
                    <td className="p-3 text-left text-xs text-gray-600 font-medium">{hsn}</td>
                    <td className="p-3 text-left">
                      <span className={`px-2 py-0.5 rounded text-[11px] border font-semibold ${
                        typeLabel.toLowerCase() === 'rent' || typeLabel.toLowerCase() === 'rental' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="p-3 text-left text-xs text-gray-700 font-medium">Rs. {Number(price || 0).toLocaleString()}</td>
                    <td className="p-3 text-left text-xs font-semibold text-gray-900">{qty}</td>
                    <td className="p-3 text-left text-xs text-gray-700 font-medium">
                      <div>{gstPer}%</div>
                      <div className="text-[10px] text-gray-400">Rs. {Number(gstAmt || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </td>
                    <td className="p-3 text-left text-xs font-bold text-gray-900 tracking-tight">Rs. {Number(rowTotal || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-8 space-y-3">
             <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 border-dashed">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Amount In Words</h4>
                <p className="text-xs font-semibold text-gray-700 capitalize">{numberToWords(subTotal)}</p>
             </div>
             
             <div className="px-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Declaration & Terms</h4>
                <ul className="text-[11px] text-gray-500 space-y-0.5 list-none p-0 leading-relaxed font-normal">
                   <li className="flex gap-1.5"><span>•</span> This is a valid system-generated document and does not require a physical signature.</li>
                   <li className="flex gap-1.5"><span>•</span> {isQuote ? 'Quotation is subject to availability of stock at time of booking.' : 'Return/exchange policies apply as per standard vendor terms.'}</li>
                </ul>
             </div>
          </div>
          
          <div className="w-56 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Gross Amount</span>
                <span className="text-gray-800 font-mono font-semibold">Rs. {Number(subtotalExclGst).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Total Tax (GST)</span>
                <span className="text-gray-800 font-mono font-semibold">Rs. {Number(totalGst).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Shipping</span>
                <span className="text-gray-800 font-mono font-semibold">Rs. 0.00</span>
              </div>
              <div className="pt-2.5 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900">Total Payable</span>
                <span className="text-xl font-bold text-blue-700 leading-none">Rs. {Number(subTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
           <div className="inline-flex flex-col items-center">
              <span className="text-xs font-bold text-gray-900">Thank you for shopping</span>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wider"> info@upleex.com</p>
           </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-4 print:hidden no-print">
        <button 
          onClick={handleDownload}
          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-9 py-3.5 rounded-xl font-black text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span className="relative z-10">Download PDF</span>
        </button>
      </div>
    </div>
  );
};

export default BillingInvoice;