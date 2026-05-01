"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import OtpInput from "react-otp-input";
import { saveToken } from "@/utils/tokenManager";
import SearchableDropdown from "@/components/common/SearchableDropdown";

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    businessName: "",
    email: "",
    mobile: "",
    altMobile: "",
    city: "",
    password: "",
    otp: ""
  });

  const [cityOptions, setCityOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [hasMoreCities, setHasMoreCities] = useState(true);
  const cityPageRef = useRef(1);
  const cityInFlightRef = useRef<Set<string>>(new Set());
  const cityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const citySearchRef = useRef("");

  const [errors, setErrors] = useState<{
    fname?: string;
    lname?: string;
    businessName?: string;
    email?: string;
    mobile?: string;
    city?: string;
    password?: string;
    otp?: string;
  }>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const fetchCities = async (search: string, page: number) => {
    const requestKey = `${search}|${page}`;
    if (cityInFlightRef.current.has(requestKey)) return;
    if (loadingCities) return;
    cityInFlightRef.current.add(requestKey);
    setLoadingCities(true);

    try {
      const res = await api.post(endPointApi.postVendorCityList as string, {
        page,
        search,
      });
      const list = res?.data?.data || [];

      if (!Array.isArray(list) || list.length === 0) {
        setHasMoreCities(false);
        return;
      }

      const mapped = list
        .map((item: any) => {
          const name = String(item?.city_name || item?.name || item?.city || "").trim();
          const id = String(item?.city_id || item?.id || item?._id || "");
          if (!name || !id) return null;
          return { label: name, value: id };
        })
        .filter(Boolean) as { label: string; value: string }[];

      setCityOptions((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      cityPageRef.current = page + 1;
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to load cities";
      toast.error(message);
    } finally {
      setLoadingCities(false);
      cityInFlightRef.current.delete(requestKey);
    }
  };

  useEffect(() => {
    fetchCities("", 1);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async () => {
    const e: { mobile?: string; businessName?: string } = {};
    const isMobileValid = (val: string) => /^[6-9]\d{9}$/.test(val);
    
    // Business name validation - minimum 3 characters
    const businessNameTrimmed = formData.businessName.trim();
    if (businessNameTrimmed.length < 3) {
      e.businessName = "Business name must be at least 3 characters";
    }
    
    if (!isMobileValid(formData.mobile)) e.mobile = "Enter valid 10-digit Indian mobile number";
    if (Object.keys(e).length > 0) {
      setErrors(prev => ({ ...prev, ...e }));
      return;
    }
    
    setErrors(prev => ({ ...prev, mobile: "", businessName: "" }));
    
    try {
      const res = await api.post(endPointApi.businessRegister, {
        full_name: `${formData.fname} ${formData.lname}`.trim(),
        business_name: formData.businessName.trim(),
        email: formData.email.trim(),
        number: formData.mobile,
        alternate_number: formData.altMobile || "",
        city_id: formData.city,
        country: "97"
      });
      const status = res?.data?.status;
      const message = res?.data?.message || "OTP sent successfully";
      if (status === 200) {
        toast.success(message);
        setOtpSent(true);
        setTimer(120);
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to send OTP";
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpSent) {
      const e: { fname?: string; lname?: string; businessName?: string; email?: string; mobile?: string; city?: string; password?: string } = {};
      if (!formData.fname.trim()) e.fname = "First name is required";
      if (!formData.lname.trim()) e.lname = "Last name is required";
      
      // Business name validation - minimum 3 characters
      const businessNameTrimmed = formData.businessName.trim();
      if (!businessNameTrimmed) {
        e.businessName = "Business name is required";
      } else if (businessNameTrimmed.length < 3) {
        e.businessName = "Business name must be at least 3 characters";
      }
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.(com|in|org)$/;
      if (!emailPattern.test(formData.email.trim())) e.email = "Enter a valid email";
      if (!/^[6-9]\d{9}$/.test(formData.mobile)) e.mobile = "Enter valid 10-digit Indian mobile number";
      if (!formData.city.trim()) e.city = "City is required";
      
      if (Object.keys(e).length > 0) {
        setErrors(prev => ({ ...prev, ...e }));
        return;
      }
      
      if (!isChecked) {
        toast.error("Please accept the Terms and Privacy Policy");
        return;
      }
      await handleSendOtp();
    } else {
      const e: { otp?: string } = {};
      if ((formData.otp || "").replace(/\D/g, "").length < 4) e.otp = "Enter the OTP";
      if (Object.keys(e).length > 0) {
        setErrors(prev => ({ ...prev, ...e }));
        return;
      }
      try {
        setIsSubmitting(true);
        const res = await api.post(endPointApi.businessRegister, {
          full_name: `${formData.fname} ${formData.lname}`.trim(),
          business_name: formData.businessName.trim(),
          email: formData.email.trim(),
          number: formData.mobile,
          alternate_number: formData.altMobile || "",
          city_id: formData.city,
          country: "97",
          otp: formData.otp
        });
        const status = res?.data?.status;
        const message = res?.data?.message || "Registered successfully";

        if (status === 200) {
          // Backend now returns auth_token using generateAuthTokens
          const authToken = res?.data?.data?.auth_token || res?.data?.data?.token;
          const vendor = res?.data?.data?.vendor;
          
          if (authToken) {
            saveToken(authToken);
          }
          
          if (vendor) {
            // Find the city label from cityOptions to store it for KYC autofill
            const selectedCity = cityOptions.find(c => c.value === formData.city);
            if (selectedCity) {
              vendor.city_name = selectedCity.label;
            }
            localStorage.setItem('user_info', JSON.stringify(vendor));
          }
          
          toast.success(message);
          // Redirect to login page after successful registration
          router.push("/");
        } else {
          toast.error(message);
        }
      } catch (error: any) {
        const message = error?.response?.data?.message || "Something went wrong while registering";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#E0F2FE] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-2xl">
        {/* Soft glow background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-40 w-40 rounded-full bg-gradient-to-br from-[#4F46E5]/30 to-[#22D3EE]/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-40 w-40 rounded-full bg-gradient-to-tr from-[#22D3EE]/30 to-[#4F46E5]/35 blur-3xl" />
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-gray-900/95 shadow-xl border border-blue-50 dark:border-gray-800 px-7 py-7 sm:px-10 sm:py-9">
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE]" />
          {/* Logo + heading */}
          <div className="mb-6 flex flex-col items-center text-center">
            <Image
                           className="dark:hidden"
                           src="/images/logo/logo.webp"
                           alt="Upleex Logo"
                           width={150}
                           height={40}
                           priority
                         />
                         <Image
                           className="hidden dark:block"
                           src="/images/logo/upleex-logo.png"
                           alt="Upleex Logo"
                           width={150}
                           height={40}
                           priority
                         />
            <h1 className="mb-2 mt-3 font-semibold text-gray-800 dark:text-white text-title-sm">
              Vendor Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Register your business with us!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>First Name <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s.'\-]/g, ''); // letters, spaces, . ' -
                    setFormData(prev => ({ ...prev, fname: value }));
                    if (value.trim()) setErrors(prev => ({ ...prev, fname: '' }));
                  }}
                  placeholder="Enter your first name"
                  className="mt-1"
                  error={!!errors.fname}
                />
                {errors.fname && <p className="error-message">{errors.fname}</p>}
              </div>

              <div>
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s.'\-]/g, ''); // letters, spaces, . ' -
                    setFormData(prev => ({ ...prev, lname: value }));
                    if (value.trim()) setErrors(prev => ({ ...prev, lname: '' }));
                  }}
                  placeholder="Enter your last name"
                  className="mt-1"
                  error={!!errors.lname}
                />
                {errors.lname && <p className="error-message">{errors.lname}</p>}
              </div>
            </div>

            {/* Business Name */}
            <div>
              <Label>Business Name <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, businessName: value }));
                  
                  // Real-time validation
                  const trimmed = value.trim();
                  if (trimmed.length >= 3) {
                    setErrors(prev => ({ ...prev, businessName: '' }));
                  } else if (trimmed.length > 0 && trimmed.length < 3) {
                    setErrors(prev => ({ ...prev, businessName: 'Business name must be at least 3 characters' }));
                  } else if (!trimmed) {
                    setErrors(prev => ({ ...prev, businessName: 'Business name is required' }));
                  }
                }}
                placeholder="Enter your business name (min. 3 characters)"
                className="mt-1"
                error={!!errors.businessName}
              />
              {errors.businessName && (
                <p className="error-message" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.businessName}
                </p>
              )}
              {/* Character counter */}
              <p className="text-xs text-gray-500 mt-1">
                {formData.businessName.trim().length}/3 characters minimum
                {formData.businessName.trim().length >= 3 && formData.businessName.trim().length < 3 && (
                  <span className="text-red-500"> (Need {3 - formData.businessName.trim().length} more)</span>
                )}
                {formData.businessName.trim().length >= 3 && (
                  <span className="text-green-500"> ✓ Valid</span>
                )}
              </p>
            </div>

            {/* Email */}
            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                name="email"
                value={formData.email}
                onChange={(e) => {
                  handleChange(e);
                  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.target.value.trim())) setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Enter your email"
                className="mt-1"
                error={!!errors.email}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            {/* Mobile Numbers */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Mobile Number <span className="text-red-500">*</span></Label>
                <div className="flex mt-1">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    +91
                  </span>
                  <div className="flex-1 min-w-0">
                    <Input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setFormData(prev => ({ ...prev, mobile: val }));
                        if (val.length === 10) setErrors(prev => ({ ...prev, mobile: '' }));
                      }}
                      placeholder="9876543210"
                      className="rounded-l-none"
                      error={!!errors.mobile}
                    />
                  </div>
                </div>
                {errors.mobile && <p className="error-message">{errors.mobile}</p>}
              </div>

              <div>
                <Label>Alternative Number</Label>
                <div className="flex mt-1">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    +91
                  </span>
                  <div className="flex-1 min-w-0">
                    <Input
                      type="tel"
                      name="altMobile"
                      value={formData.altMobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setFormData(prev => ({ ...prev, altMobile: val }));
                      }}
                      placeholder="Optional"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* City */}
            <div>
              <Label>City <span className="text-red-500">*</span></Label>
              <div className="mt-1">
                <SearchableDropdown
                  options={cityOptions}
                  value={formData.city || null}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, city: val }));
                    if (val.trim()) setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                  placeholder="Select City"
                  searchable={true}
                  onSearch={(value) => {
                    const next = value.trim();
                    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
                    cityDebounceRef.current = setTimeout(() => {
                      citySearchRef.current = next;
                      setHasMoreCities(true);
                      cityPageRef.current = 1;
                      setCityOptions([]);
                      fetchCities(next, 1);
                    }, 400);
                  }}
                  onScrollNearBottom={() => {
                    if (!hasMoreCities || loadingCities) return;
                    fetchCities(citySearchRef.current, cityPageRef.current);
                  }}
                  footer={
                    hasMoreCities && loadingCities ? (
                      <div className="px-4 py-3 text-center text-sm text-gray-400">Loading…</div>
                    ) : null
                  }
                  error={!!errors.city}
                />
              </div>
              {errors.city && <p className="error-message">{errors.city}</p>}
            </div>

            {/* Password */}
            {/* <div>
              <Label>Password *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value.length >= 6) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div> */}

            {/* OTP Section */}
            {otpSent && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>OTP Verification <span className="text-red-500">*</span></Label>
                  {timer > 0 ? (
                    <span className="text-xs text-blue-600 font-medium">Resend in {timer}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleSendOtp}
                      className="text-xs text-blue-600 font-medium hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <div className="mt-2 flex justify-center">
                  <OtpInput
                    value={formData.otp}
                    onChange={(val) => {
                      const clean = val.replace(/\D/g, '').slice(0, 6);
                      setFormData(prev => ({ ...prev, otp: clean }));
                      if (clean.length >= 4) setErrors(prev => ({ ...prev, otp: '' }));
                    }}
                    numInputs={6}
                    shouldAutoFocus
                    renderSeparator={<span className="mx-2 text-slate-300">•</span>}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className={`${errors.otp ? 'border-2 border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-2 border-slate-300 focus:border-[#4F46E5] focus:ring-[#4F46E5]/20'} h-12 !w-12 rounded-lg bg-slate-50 dark:bg-gray-800 text-center text-base font-medium text-slate-900 dark:text-white outline-none transition-all`}
                      />
                    )}
                  />
                </div>
                {errors.otp && <p className="error-message">{errors.otp}</p>}
              </div>
            )}

            {/* Checkbox */}
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-gray-800 px-3 py-3">
              <Checkbox checked={isChecked} onChange={setIsChecked} />
              <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                I agree to the{" "}
                <span className="font-semibold text-slate-900 dark:text-white">Terms</span> and{" "}
                <span className="font-semibold text-slate-900 dark:text-white">Privacy Policy</span>
              </p>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isSubmitting || (otpSent && !formData.otp)}
              className="w-full px-4 py-3 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE] hover:shadow-[0_10px_40px_rgba(79,70,229,0.35)] hover:translate-y-[0.5px] transition-all border-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {otpSent ? (isSubmitting ? "Registering..." : "Register Now") : "Send OTP"}
            </button>
          </form>

          <p className="mt-6 text-xs sm:text-sm text-center text-slate-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/"
              className="font-medium text-[#4F46E5] hover:text-[#4338CA] dark:text-brand-400 dark:hover:text-brand-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
