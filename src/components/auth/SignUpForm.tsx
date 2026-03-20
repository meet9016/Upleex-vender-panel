"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import OtpInput from "react-otp-input";

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
    const e: { mobile?: string } = {};
    const isMobileValid = (val: string) => /^[6-9]\d{9}$/.test(val);
    if (!isMobileValid(formData.mobile)) e.mobile = "Enter valid 10-digit Indian mobile number";
    if (Object.keys(e).length > 0) {
      setErrors(prev => ({ ...prev, ...e }));
      return;
    }
    setErrors(prev => ({ ...prev, mobile: "" }));
    try {
      const res = await api.post(endPointApi.businessRegister, {
        full_name: `${formData.fname} ${formData.lname}`.trim(),
        business_name: formData.businessName.trim(),
        email: formData.email.trim(),
        number: formData.mobile,
        alternate_number: formData.altMobile || "",
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
      if (!formData.businessName.trim()) e.businessName = "Business name is required";
      // const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          const emailPattern = /^[^\s@]+@[^\s@]+\.(com|in|org)$/;
      if (!emailPattern.test(formData.email.trim())) e.email = "Enter a valid email (example@domain.com/in/org)";
      // if (!emailPattern.test(formData.email.trim())) e.email = "Enter a valid email address";
      if (!/^[6-9]\d{9}$/.test(formData.mobile)) e.mobile = "Enter valid 10-digit Indian mobile number";
      if (!formData.city.trim()) e.city = "City is required";
      // if (!formData.password.trim() || formData.password.length < 6) e.password = "Password must be at least 6 characters";
      
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
          country: "97",
          otp: formData.otp
        });
        const status = res?.data?.status;
        const message = res?.data?.message || "Registered successfully";

        if (status === 200) {
          // Backend now returns auth_token using generateAuthTokens
          const authToken = res?.data?.data?.auth_token || res?.data?.data?.token;
          const vendor = res?.data?.data?.vendor;
          
          console.log('Auth token:', authToken);
          console.log('Vendor data:', vendor);
          
          if (authToken) {
            localStorage.setItem('auth_token', authToken);
            console.log('Auth token stored successfully');
          }
          
          if (vendor) {
            localStorage.setItem('user_info', JSON.stringify(vendor));
            console.log('User info stored successfully');
          }
          
          toast.success(message);
          // Now redirect to KYC page with proper authentication
          router.push("/kyc");
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
                           src="/images/logo/upleex-logo-dark.png"
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
                <Label>First Name *</Label>
                <Input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only allow letters and spaces
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
                <Label>Last Name *</Label>
                <Input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only allow letters and spaces
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
              <Label>Business Name *</Label>
              <Input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value.trim()) setErrors(prev => ({ ...prev, businessName: '' }));
                }}
                placeholder="Enter your business name"
                className="mt-1"
                error={!!errors.businessName}
              />
              {errors.businessName && <p className="error-message">{errors.businessName}</p>}
            </div>

            {/* Email */}
            <div>
              <Label>Email *</Label>
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
                <Label>Mobile Number *</Label>
                <div className="flex mt-1">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    +91
                  </span>
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
                {errors.mobile && <p className="error-message">{errors.mobile}</p>}
              </div>

              <div>
                <Label>Alternative Number</Label>
                <div className="flex mt-1">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
                    +91
                  </span>
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

            {/* City */}
            <div>
              <Label>City *</Label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value.trim()) setErrors(prev => ({ ...prev, city: '' }));
                }}
                placeholder="Enter your city"
                className="mt-1"
                error={!!errors.city}
              />
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
                  <Label>OTP Verification *</Label>
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
