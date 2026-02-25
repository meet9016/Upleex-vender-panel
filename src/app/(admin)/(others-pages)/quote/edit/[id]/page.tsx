"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { FiCalendar, FiImage, FiVideo, FiArrowLeft, FiX } from "react-icons/fi";
interface QuoteEditPageProps {
  params: {
    id: string;
  };
}

const QuoteEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const [quoteData, setQuoteData] = useState<any>(null);
    const [statuses, setStatuses] = useState<any[]>([]);
    console.log("🚀 ~ QuoteEditPage ~ statuses:", statuses)
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
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

   const getStatuses = async () => {
    try {
      const res = await api.post(endPointApi.getStatus);
      if (res?.data?.status === 200) {
        setStatuses(res.data.data || []);
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
      if (res?.data?.data) {
        const quote = res.data.data;
        setQuoteData(quote);
        setFormData({
          start_date: quote?.start_date || "",
          end_date: quote?.end_date || "",
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
    if (n.includes('complete')) return 'complete';
    return 'pending';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = {};
      if (formData.status) body.status = formData.status;
      // Backend update supports these fields; add when needed:
      // if (formData.start_date) body.delivery_date = formData.start_date;
      const res = await api.put(`${endPointApi.updateQuote}/${params.id}`, body);
      if (res?.data?.success) {
        router.back();
      }
    } catch (err) {
      console.error('Update quote error', err);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-8xl mx-auto">

        {/* Quote Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">

            {/* Back Arrow */}
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition"
            >
              <FiArrowLeft className="text-lg" />
            </button>


            {/* Blue Line + Title */}
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
          </div>

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
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Delivery Date</p>
              <p className="text-base font-semibold text-gray-800 dark:text-white">{quoteData.delivery_date}</p>
            </div>

            {/* Month */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Month</p>
              <p className="text-base font-semibold text-gray-800 dark:text-white">{quoteData.month_name}</p>
            </div>

            {/* Status */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Status</p>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm font-semibold"
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status._id || status.id} value={toEnum(status.name)}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Update Quote Details</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="text-blue-600" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FiCalendar className="text-purple-600" />
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  required
                />
              </div>
            </div>

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
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-300 transition-all"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-green-200 dark:border-green-800" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
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
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900 dark:file:text-red-300 transition-all"
                  />
                  {videoPreview && (
                    <div className="mt-2 relative inline-block">
                      <video src={videoPreview} controls className="w-48 h-32 rounded-lg border border-red-200 dark:border-red-800" />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
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
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 transition-all"
                  />
                  {returnImagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={returnImagePreview} alt="Return Preview" className="w-24 h-24 object-cover rounded-lg border border-blue-200 dark:border-blue-800" />
                      <button
                        type="button"
                        onClick={handleRemoveReturnImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
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
                    className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300 transition-all"
                  />
                  {returnVideoPreview && (
                    <div className="mt-2 relative inline-block">
                      <video src={returnVideoPreview} controls className="w-48 h-32 rounded-lg border border-purple-200 dark:border-purple-800" />
                      <button
                        type="button"
                        onClick={handleRemoveReturnVideo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Submit Changes
            </button>
          </form>
        </div>
      </div >
    </div >
  );
};

export default QuoteEditPage;
