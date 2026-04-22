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
  const data = rawData.order || rawData.quote || rawData.data || rawData;
  
  const isQuote = type === 'quote';
  const displayId = isQuote ? (data._id || data.id) : (data.order_id || data._id || data.id);
  const dateStr = data.createdAt;
  const dateObj = new Date(dateStr);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';

  const customer = data.user_id || {};
  const items = data.items || (isQuote ? [data] : []);
  const subTotal = isQuote ? (data.total_price || data.calculated_price || 0) : (data.total_amount || 0);
  
  // eCommerce specific details (fallback values)
  const paymentMethod = data.payment_mode || data.payment_method || (data.payment_status?.toLowerCase() === 'paid' ? 'Online/Prepaid' : 'Pending');
  const gstRate = 18; // Default to 18% for display
  const totalGst = (subTotal * gstRate) / (100 + gstRate); // Assuming inclusive
  const subtotalExclGst = subTotal - totalGst;
  
  // Table sync data
  const orderStatus = data.vendor_status || data.status || 'Pending';
  
  // Robust admin payout status
  const adminPaymentStatus = data.payment_status_info?.payment_status || data.vendor_payment_info?.payment_status || 'Unprocessed';
  const adminPaymentAmount = data.vendor_payment_info?.vendor_amount || data.payment_status_info?.vendor_amount || 0;

  // Use vendor logo if available, else fallback to default logo
  const logoSrc = vendorProfile?.business_logo_image || "/images/logo/logo.webp";

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
          type
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
    <div className="max-w-[750px] mx-auto p-6 bg-white font-sans text-gray-800 leading-tight shadow-xl rounded-xl border border-gray-100 relative overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition-colors no-print z-10 p-2 hover:bg-gray-50 rounded-full"
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
        <div className="flex justify-between items-start mb-2 pb-4 border-b border-gray-100">
          <div>
            <img src={logoSrc} alt="Upleex" className="h-12 w-auto mb-2 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/logo/logo.webp";
            }} />
            <div className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {vendorProfile?.business_name || '-'}
            </div>
            <div className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-2">
               <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px]  ">Verified Vendor</span>
               <span className="w-1 h-1 rounded-full bg-gray-300"></span>
               <span className={`px-1.5 py-0.5 rounded text-[8px] font-black  border ${
                 orderStatus.toLowerCase() === 'delivered' || orderStatus.toLowerCase() === 'success' || orderStatus.toLowerCase() === 'complete' || orderStatus.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
               }`}>
                 {orderStatus}
               </span>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight ">
              {isQuote ? 'Quotation' : 'Tax Invoice'}
            </h1>
            <div className="space-y-0.5">
              <div className="text-[10px] font-black text-gray-400  ">
                {isQuote ? 'Quote' : 'Invoice'} #: <span className="text-gray-900 font-mono">
                  {displayId?.includes(',') ? displayId : `#${displayId?.slice(-8).toUpperCase()}`}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-black  ">Date: {formattedDate}</div>
            </div>
          </div>
        </div>

        {/* Info Bars */}
        <div className="grid grid-cols-4 gap-3 mb-4">
           <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
              <span className="block text-[10px] font-black text-gray-400 ">Place of Supply</span>
              <span className="text-[10px] font-bold text-gray-700">{vendorProfile?.city || 'N/A'}, {vendorProfile?.state || 'N/A'}</span>
           </div>
           <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
              <span className="block text-[10px] font-black text-gray-400 ">Payment Method</span>
              <span className="text-[10px] font-bold text-gray-700 ">{paymentMethod}</span>
           </div>
           <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
              <span className="block text-[10px] font-black text-gray-400 ">Customer Payment</span>
              <span className={`text-[10px] font-black  ${data.payment_status?.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {data.payment_status || 'Pending'}
              </span>
           </div>
           {!isCustomerView && (
             <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100/50">
                <span className="block text-[10px] font-black text-gray-400 ">Admin Payout</span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black capitalize ${adminPaymentStatus.toLowerCase() === 'completed' || adminPaymentStatus.toLowerCase() === 'paid' || adminPaymentStatus.toLowerCase() === 'released' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {adminPaymentStatus === 'no_payment' ? 'Unprocessed' : adminPaymentStatus}
                  </span>
                  {adminPaymentAmount > 0 && (
                    <span className="text-[9px] font-bold text-gray-500 mt-0.5">Rs. {adminPaymentAmount.toLocaleString()}</span>
                  )}
                </div>
             </div>
           )}
        </div>

        {/* Addressing Details */}
        <div className="grid grid-cols-2 gap-8 mb-4">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gray-400   border-b border-gray-100 pb-1 w-fit pr-8 ">Seller / Sold By</h3>
            <div className="text-[12px] space-y-0.5 leading-snug">
              <p className="font-bold text-gray-900 text-[13px]">{vendorProfile?.business_name}</p>
              <p className='text-gray-500 font-medium'>{vendorProfile?.email}</p>
              <p className='text-gray-500 font-medium'>+91 {vendorProfile?.mobile}</p>
              <p className="text-gray-500 font-medium">{vendorProfile?.address}</p>
              <p className="text-gray-500 font-medium">
                {vendorProfile?.city}{vendorProfile?.city && vendorProfile?.state ? ', ' : ''}{vendorProfile?.state} - {vendorProfile?.pincode}
              </p>
              {vendorProfile?.gst_number && (
                <div className="pt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-black bg-gray-100 px-1 py-0.5 rounded text-gray-500 ">GSTIN</span>
                  <span className="font-mono text-gray-700 font-bold tracking-tight">{vendorProfile.gst_number}</span>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3 text-right flex flex-col items-end">
            <h3 className="text-[10px] font-black text-gray-400   border-b border-gray-100 pb-1 w-fit pl-8 ">Buyer / Ship To</h3>
            <div className="text-[12px] space-y-0.5 leading-snug text-right">
              <p className="font-bold text-gray-900 text-[13px]">{customer?.name || data?.user_name || 'Customer'}</p>
              <p className="text-gray-500 font-medium">{customer?.email || data?.user_email || 'N/A'}</p>
              <p className="text-gray-500 font-medium">{customer?.phone || customer?.mobile || data?.user_phone || 'N/A'}</p>
              {data.shipping_address ? (
                <p className="text-blue-500 pt-1 text-[11px] font-medium leading-tight max-w-[200px]">{data.shipping_address}</p>
              ) : (
                <p className="text-gray-400 pt-1 text-[10px] ">No secondary shipping address provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="mb-4 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="p-3 text-[10px] font-black text-left">Item & Description</th>
                <th className="p-3 text-[10px] font-black text-left">Type</th>
                <th className="p-3 text-[10px] font-black text-left">Unit Price</th>
                <th className="p-3 text-[10px] font-black text-left">Qty</th>
                <th className="p-3 text-[10px] font-black text-left">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any, index: number) => {
                const product = isQuote ? (item.product_id || item.product || {}) : (item.product_id || {});
                const name = isQuote ? (product.product_name || item.product_name) : (product.name || item.product_name || item.name);
                const sku = product.sku || item.sku || (isQuote ? item.product_sku : null) || 'N/A';
                const typeLabel = product.product_type_name || item.product_type_name || 'Sell';
                const price = isQuote ? (item.price || product.price) : (item.price || product.price);
                const qty = isQuote ? (item.qty) : (item.quantity || 1);
                const rowTotal = isQuote ? (item.total_price || item.calculated_price) : (item.price * (item.quantity || 1));

                return (
                  <tr key={index} className="hover:bg-gray-50/50 transition-all">
                    <td className="p-3">
                      <div className="flex gap-3">
                         {/* Thumbnail sync with table */}
                         {(product?.thumb_image || item.thumb_image || product?.product_main_image) && (
                           <div className="w-10 h-10 rounded border border-gray-100 overflow-hidden flex-shrink-0 no-print">
                              <img src={product?.thumb_image || item.thumb_image || product?.product_main_image} alt="" className="w-full h-full object-cover" />
                           </div>
                         )}
                         <div>
                            <div className="font-bold text-[13px] text-gray-900">{name}</div>
                            <div className="text-[9px] font-bold text-gray-400  mt-0.5">SKU: {sku}</div>
                            {isQuote && item.number_of_days && (
                              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {item.number_of_days} {item.product_listing_type_name?.toLowerCase() === 'hourly' ? 'HOURS' : 'DAYS'} RENTAL
                              </div>
                            )}
                         </div>
                      </div>
                    </td>
                    <td className="p-3 text-left">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] border font-black   ${
                        typeLabel.toLowerCase() === 'rent' || typeLabel.toLowerCase() === 'rental' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="p-3 text-left text-xs font-bold text-gray-600">Rs. {Number(price || 0).toLocaleString()}</td>
                    <td className="p-3 text-left text-xs font-bold text-gray-600">{qty}</td>
                    <td className="p-3 text-left text-xs font-black text-gray-900 tracking-tight">Rs. {Number(rowTotal || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Section */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-12 space-y-4">
             <div className="bg-gray-900/[0.02] p-4 rounded-xl border border-gray-100 border-dashed">
                <h4 className="text-[10px] font-black text-gray-900   mb-2">Amount In Words</h4>
                <p className="text-[11px] font-bold text-gray-500  lowercase first-letter:">{numberToWords(subTotal)}</p>
             </div>
             
             <div className="px-1">
                <h4 className="text-[9px] font-black text-gray-400   mb-1.5">Declaration & Terms</h4>
                <ul className="text-[9px] text-gray-400 space-y-1 list-none p-0 leading-tight">
                   <li className="flex gap-2"><span>•</span> This is a valid system-generated document and does not require a physical signature.</li>
                   <li className="flex gap-2"><span>•</span> {isQuote ? 'Quotation is subject to availability of stock at time of booking.' : 'Return/exchange policies apply as per standard vendor terms.'}</li>
                </ul>
             </div>
          </div>
          
          <div className="w-56 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="space-y-2.5">
              <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                <span>Gross Amount</span>
                <span className="text-gray-700 font-mono ">Rs. {Number(subtotalExclGst).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                <span>Tax (IGST 18%)</span>
                <span className="text-gray-700 font-mono ">Rs. {Number(totalGst).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                <span>Shipping</span>
                <span className="text-gray-700 font-mono ">Rs. 0.00</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center group">
                <span className="text-[13px] font-black text-gray-900">Total Payable</span>
                <span className="text-xl font-black text-blue-700 leading-none group-hover:scale-105 transition-transform">Rs. {Number(subTotal).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="text-center pt-6 border-t border-gray-100">
           <div className="inline-flex flex-col items-center">
              <span className="text-[10px] font-black  text-gray-900">Thank you for shopping</span>
              <p className="text-[8px] text-gray-400 font-bold mt-2 tracking-[0.2em]"> info@upleex.com</p>
           </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-4 print:hidden no-print">
        <button 
          onClick={handleDownload}
          className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[12px] shadow-xl transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
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