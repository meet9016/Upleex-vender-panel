"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { FiCalendar, FiImage, FiVideo, FiArrowLeft, FiX, FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import Loader from "@/components/common/Loader";
import PageLoader from "@/components/common/PageLoader";
import DatePicker from "@/components/common/DatePicker"; // Import your DatePicker component

const QuoteEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    status: "",
    image: null as File | null,
    video: null as File | null,
    return_image: null as File | null,
    return_video: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [returnImagePreview, setReturnImagePreview] = useState<string | null>(null);
  const [returnVideoPreview, setReturnVideoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getStatuses = async () => {
    try {
      const res = await api.post(endPointApi.getStatus);
      if (res?.data?.status === 200 && Array.isArray(res.data.data)) {
        setStatuses(res.data.data);
      }
    } catch (error) {
      console.log("fetch statuses error:", error);
    }
  };

  const getQuoteById = async () => {
    if (!params?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`${endPointApi.getQuoteById}/${params.id}`);
      console.log("🚀 ~ API Response:", res.data);

      if (res?.data?.success && res?.data?.data) {
        const quote = res.data.data;

        // Extract product details from nested product_id object
        const productDetails = quote.product_id || {};

        // Transform the data to include flattened product fields
        const transformedQuote = {
          ...quote,
          product_name: productDetails.product_name || 'N/A',
          product_type_name: productDetails.product_type_name || 'N/A',
          product_listing_type_name: productDetails.product_listing_type_name || 'N/A',
          price: productDetails.price || '0',
          product_main_image: productDetails.product_main_image || '',
          category_name: productDetails.category_name || '',
          sub_category_name: productDetails.sub_category_name || '',
          description: productDetails.description || '',
          delivery_date: quote.delivery_date
            ? new Date(quote.delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A',
        };

        // Calculate prices using same logic as QuoteTable
        let totalPrice = '0';
        let unitPrice = '0';
        let monthName = '-';

        // Get month name from product's month_arr if months_id exists
        if (quote.months_id && productDetails.month_arr && Array.isArray(productDetails.month_arr)) {
          const month = productDetails.month_arr.find((m: any) =>
            m.months_id === quote.months_id || m.product_months_id === quote.months_id
          );
          if (month) {
            monthName = month.month_name;
          }
        }

        if (quote.calculated_price) {
          // Use calculated price from backend if available
          totalPrice = quote.calculated_price.toString();
          // Calculate unit price from total
          const qty = parseInt(quote.qty || '1');
          const days = parseInt(quote.number_of_days || '1');
          if (quote.months_id && productDetails.month_arr && Array.isArray(productDetails.month_arr)) {
            // Monthly product - unit price is per month
            const month = productDetails.month_arr.find((m: any) =>
              m.months_id === quote.months_id || m.product_months_id === quote.months_id
            );
            unitPrice = month?.price || '0';
          } else {
            // Daily/Hourly product - calculate unit price
            unitPrice = days > 0 ? (parseFloat(totalPrice) / (qty * days)).toString() : '0';
          }
          console.log('Using calculated price:', { totalPrice, unitPrice });
        } else if (quote.months_id && productDetails.month_arr && Array.isArray(productDetails.month_arr)) {
          // Monthly product - calculate from month_arr
          const month = productDetails.month_arr.find((m: any) =>
            m.months_id === quote.months_id || m.product_months_id === quote.months_id
          );
          if (month) {
            unitPrice = month.price || '0';
            totalPrice = (parseFloat(month.price || '0') * parseInt(quote.qty || '1')).toString();
            console.log('Monthly calculation:', { month, unitPrice, totalPrice });
          }
        } else {
          // Daily/Hourly product - calculate from base price
          unitPrice = productDetails.price || '0';
          const days = parseInt(quote.number_of_days || '1');
          const qty = parseInt(quote.qty || '1');
          totalPrice = (parseFloat(unitPrice) * days * qty).toString();
          console.log('Daily/Hourly calculation:', { unitPrice, days, qty, totalPrice });
        }

        // Add calculated fields to transformed quote
        transformedQuote.price = unitPrice;
        transformedQuote.total_price = totalPrice;
        transformedQuote.month_name = monthName;

        console.log("🚀 ~ Transformed Quote:", transformedQuote);
        setQuoteData(transformedQuote);

        const toInputDate = (d: any) => {
          if (!d) return "";
          const date = new Date(d);
          if (Number.isNaN(date.getTime())) return "";
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        setFormData({
          start_date: toInputDate(quote?.start_date),
          end_date: toInputDate(quote?.end_date),
          start_time: quote?.start_time || '',
          end_time: quote?.end_time || '',
          status: quote?.status || "",
          image: null,
          video: null,
          return_image: null,
          return_video: null,
        });
      }
    } catch (error) {
      console.log("fetch quote error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toEnum = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('approve')) return 'approval';
    if (n.includes('reject')) return 'reject';
    if (n.includes('active')) return 'active';
    if (n.includes('complete')) return 'complete';
    if (n.includes('success')) return 'successful';
    if (n.includes('delivery')) return 'delivery';
    return n; // Return the name itself if no match, instead of always defaulting to pending
  };

  // Check if user can access date/image/video upload based on status
  const canAccessUploadFeatures = useMemo(() => {
    const currentStatus = formData.status || quoteData?.status;
    return currentStatus === 'approval';
  }, [formData.status, quoteData?.status]);

  const isHourly = useMemo(() => {
    return quoteData?.product_listing_type_name?.toLowerCase() === 'hourly';
  }, [quoteData]);

  // Check if all features should be disabled (when status is complete)
  const isCompleteStatus = useMemo(() => {
    const currentStatus = formData.status || quoteData?.status;
    return currentStatus === 'complete';
  }, [formData.status, quoteData?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if params or params.id is null/undefined
    if (!params?.id) {
      return;
    }
    if (submitting) return;

    try {
      setSubmitting(true);
      // Use multipart for optional files and dates
      const fd = new FormData();
      if (formData.status) fd.append('status', formData.status);
      if (formData.start_date) fd.append('start_date', formData.start_date);
      if (formData.end_date) fd.append('end_date', formData.end_date);
      if (formData.start_time) fd.append('start_time', formData.start_time);
      if (formData.end_time) fd.append('end_time', formData.end_time);
      if (formData.image) fd.append('image', formData.image);
      if (formData.video) fd.append('video', formData.video);
      if (formData.return_image) fd.append('return_image', formData.return_image);
      if (formData.return_video) fd.append('return_video', formData.return_video);

      const res = await api.put(`${endPointApi.updateQuote}/${params.id}`, fd);
      if (res?.data?.success) {
        toast.success("Quote updated successfully");
        router.back();
      } else {
        toast.error(res?.data?.message || "Failed to update quote");
      }
    } catch (err) {
      console.error('Update quote error', err);
      toast.error("Failed to update quote");
    } finally {
      setSubmitting(false); // Set loading false after API call completes
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, video: file });
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: null });
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveVideo = () => {
    setVideoPreview(null);
    setFormData({ ...formData, video: null });
    const fileInput = document.getElementById('video-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleReturnImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, return_image: file });
      setReturnImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReturnVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, return_video: file });
      setReturnVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReturnImage = () => {
    setReturnImagePreview(null);
    setFormData({ ...formData, return_image: null });
    const fileInput = document.getElementById('return-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveReturnVideo = () => {
    setReturnVideoPreview(null);
    setFormData({ ...formData, return_video: null });
    const fileInput = document.getElementById('return-video-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  useEffect(() => {
    if (params?.id) {
      getQuoteById();
      getStatuses();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader fullScreen={false} />
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-red-600">Quote not found!</p>
        </div>
      </div>
    );
  }

  // Convert statuses to dropdown options
  const statusOptions = statuses.map(status => ({
    label: status.name,
    value: toEnum(status.name),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-8xl mx-auto">

        {/* Quote Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5 border border-gray-200 dark:border-gray-700">
          {/* <div className="flex items-center gap-4 mb-6">

            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition"
            >
              <FiArrowLeft className="text-lg" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-1 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Edit Quote
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quote Information
                </p>
              </div>
            </div>
          </div> */}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Info with Image */}
            <div className="md:col-span-2 lg:col-span-4 flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              {quoteData.product_main_image && (
                <img
                  src={quoteData.product_main_image}
                  alt={quoteData.product_name}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm"
                  onError={(e: any) => {
                    e.target.src = "https://via.placeholder.com/96x96?text=No+Image";
                  }}
                />
              )}
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Product Name</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{quoteData.product_name}</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{quoteData.product_type_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Listing Type</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{quoteData.product_listing_type_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Quantity</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{quoteData.qty}</p>
            </div>

            {/* Price */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Unit Price</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{Number(quoteData.price).toFixed(2)}</p>
            </div>

            {/* Total Price */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Total Price</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{Number(quoteData.total_price).toFixed(2)}</p>
            </div>

            {/* Delivery Date */}
            {/* <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Delivery Date</p>
                <p className="text-base font-semibold text-gray-800 dark:text-white">{quoteData.delivery_date}</p>
              </div> */}

            {/* Month */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Month</p>
              <p className="text-base font-semibold text-gray-800 dark:text-white">
                {quoteData.month_name || quoteData.months_id || 'N/A'}
              </p>
            </div>

            
             <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Note</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{quoteData.note}</p>
            </div>

            {/* Status */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Status</p>
              <SearchableDropdown
                options={statusOptions}
                value={formData.status}
                placeholder="Select Status"
                onChange={(value) => setFormData({ ...formData, status: value })}
                searchable={true}
                usePortal={true}
              />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Update Quote Details</h2>

          {/* Access Control Warning */}
          {!canAccessUploadFeatures && (
            <div className="mb-6 p-4 rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    {isCompleteStatus
                      ? 'Upload features are disabled because the quote status is Complete.'
                      : 'Upload features (dates, images, videos) are only available when the quote status is Approved.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date Fields - Updated with DatePicker */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="text-blue-600" />
                  Start Date
                </label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(date) => setFormData({ ...formData, start_date: date })}
                  min={new Date().toISOString().split('T')[0]}
                  className={!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="text-purple-600" />
                  End Date
                </label>
                <DatePicker
                  value={formData.end_date}
                  onChange={(date) => setFormData({ ...formData, end_date: date })}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className={!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </div>
            </div>

            {/* Time Fields */}
            {isHourly && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FiCalendar className="text-orange-600" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <FiCalendar className="text-pink-600" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiImage className="text-green-600" />
                  Upload Image
                </label>
                <div className="relative">
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-300 transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-green-200 dark:border-green-800" />
                      {canAccessUploadFeatures && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiVideo className="text-red-600" />
                  Upload Video
                </label>
                <div className="relative">
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900 dark:file:text-red-300 transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                  {videoPreview && (
                    <div className="mt-2 relative inline-block">
                      <video src={videoPreview} controls className="w-48 h-32 rounded-lg border border-red-200 dark:border-red-800" />
                      {canAccessUploadFeatures && (
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Return Image Upload */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiImage className="text-blue-600" />
                  Return Image
                </label>
                <div className="relative">
                  <input
                    id="return-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleReturnImageChange}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                  {returnImagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={returnImagePreview} alt="Return Preview" className="w-24 h-24 object-cover rounded-lg border border-blue-200 dark:border-blue-800" />
                      {canAccessUploadFeatures && (
                        <button
                          type="button"
                          onClick={handleRemoveReturnImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Return Video Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiVideo className="text-purple-600" />
                  Return Video
                </label>
                <div className="relative">
                  <input
                    id="return-video-input"
                    type="file"
                    accept="video/*"
                    onChange={handleReturnVideoChange}
                    disabled={!canAccessUploadFeatures}
                    className={`w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300 transition-all ${!canAccessUploadFeatures ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                  />
                  {returnVideoPreview && (
                    <div className="mt-2 relative inline-block">
                      <video src={returnVideoPreview} controls className="w-48 h-32 rounded-lg border border-purple-200 dark:border-purple-800" />
                      {canAccessUploadFeatures && (
                        <button
                          type="button"
                          onClick={handleRemoveReturnVideo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-4 py-2.5 btn-primary transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {submitting ? (
                <Loader type="button" text="Submitting..." iconClassName="text-white" />
              ) : (
                'Submit Changes'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuoteEditPage;
