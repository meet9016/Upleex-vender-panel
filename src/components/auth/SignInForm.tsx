"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { saveToken } from "@/utils/tokenManager";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import OtpInput from "react-otp-input";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import PageLoader from "../common/PageLoader";

type FormData = {
  mobile: string;
  otp: string;
};

interface ErrorState {
  mobile?: string;
  otp?: string;
}

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state for button
  const [isChecking, setIsChecking] = useState(true); // Added to prevent flicker
  const [formData, setFormData] = useState<FormData>({
    mobile: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlToken = searchParams.get('token');
        const userInfoStr = searchParams.get('user_info');
        const localToken = localStorage.getItem("auth_token");
        
        // 1. Check for URL params (Auto-login)
        if (urlToken && userInfoStr) {
          try {
            const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
            saveToken(urlToken);
            localStorage.setItem("user_info", JSON.stringify(userInfo));
            
            toast.success("Welcome back!");
            
            // Check KYC status and redirect
            try {
              const kycRes = await api.post(endPointApi.postFetchVendorKYCFormData as string);
              const kycStatus = kycRes?.data?.data?.status || "";
              if (String(kycStatus).toLowerCase() === "approved") {
                router.push('/');
              } else {
                router.push('/kyc');
              }
            } catch {
              router.push('/kyc');
            }
            return; // Stay in checking mode until redirected
          } catch (e) {
            console.error("Failed to auto-login:", e);
          }
        } 
        
        // 2. Check for existing local session
        if (localToken) {
          try {
            const kycRes = await api.post(endPointApi.postFetchVendorKYCFormData as string);
            const kycStatus = kycRes?.data?.data?.status || "";
            if (String(kycStatus).toLowerCase() === "approved") {
              router.push('/');
            } else {
              router.push('/kyc');
            }
            return; // Stay in checking mode until redirected
          } catch {
            // If token is invalid or kyc check fails, maybe clear it? 
            // For now, let's just allow signin
          }
        }
        
        // No auto-login or existing session found
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const [error, setError] = useState<ErrorState>({});

  if (isChecking) {
    return <PageLoader />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear the specific field error when the user starts typing
    setError((prev) => ({
      ...prev,
      [name]: "",
      message: "", // Clear general message error on input change
    }));
  };

  const signIn = async () => {
    if (isLoading) return;
    let newErrors: { mobile?: string } = {};

    // Validation
    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    setError({});
    setIsLoading(true);
    try {
      const res = await api.post(`${endPointApi.login}`, {
        number: formData.mobile
      });

      if (res.data.status == 200) {
        toast.success(res.data.message);
        setOtpSent(true);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response.data.message);
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const verifyOtp = async () => {
    const newErrors: ErrorState = {};

    if (!formData.otp) {
      newErrors.otp = "OTP is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post(`${endPointApi.login}`, {
        number: formData.mobile,
        otp: formData.otp
      });

      if (res.data.status == 200) {
        saveToken(res.data.data.token);
        localStorage.setItem("user_info", JSON.stringify(res?.data?.data?.vendor));

        toast.success(res.data.message);
        
        // Check KYC status and redirect accordingly
        try {
          const kycRes = await api.post(endPointApi.postFetchVendorKYCFormData as string);
          const kycStatus = kycRes?.data?.data?.status || "";
          const isApproved = String(kycStatus).toLowerCase() === "approved";
          
          if (isApproved) {
            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo = searchParams.get('redirect') || '/';
            router.push(redirectTo);
          } else {
            router.push('/kyc');
          }
        } catch {
          // If KYC check fails, redirect to KYC page
          router.push('/kyc');
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "Invalid OTP. Please try again.";
      toast.error(errorMessage);
      setError({ otp: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-[#EEF2FF] via-white to-[#E0F2FE] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-8 overflow-x-hidden">
      <div className="relative w-full max-w-md m-auto">
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
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
              Sign In
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              otpSent ? verifyOtp() : signIn();
            }}
          >
            <div className="space-y-6">
              {/* Mobile */}
              <div>
                <Label>
                  Mobile <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="mobile"
                  placeholder="Enter 10‑digit mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    // Only allow digits and max 10 characters
                    const value = e.target.value.replace(/\D/g, ""); // remove non-digit characters
                    if (value.length <= 10) {
                      setFormData((prev) => ({ ...prev, mobile: value }));
                      setError((prev) => ({ ...prev, mobile: "" })); // clear error on change
                    }
                  }}
                  className="mt-1"
                  error={!!error.mobile}
                />
                {error.mobile && (
                  <p className="error-message">{error.mobile}</p>
                )}
              </div>

              {/* OTP */}
              {otpSent && (
                <div>
                  <Label>
                    OTP <span className="text-error-500">*</span>
                  </Label>
                  <div className="mt-2 flex justify-center">
                    <OtpInput
                      value={formData.otp}
                      onChange={(otp) => {
                        setFormData((prev) => ({ ...prev, otp }));
                        if (otp.replace(/\D/g, '').length >= 4) {
                          setError((prev) => ({ ...prev, otp: '' }));
                        }
                      }}
                      numInputs={6}
                      shouldAutoFocus
                      renderSeparator={<span className="mx-1 sm:mx-2 text-slate-300"><span className="hidden sm:inline">•</span></span>}
                      renderInput={(props) => (
                        <input
                          {...props}
                          inputMode="numeric"
                          pattern="\d*"
                          className={`border ${error.otp ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-[#4F46E5] focus:ring-[#4F46E5]/20'} h-10 !w-10 sm:h-12 sm:!w-12 rounded-lg bg-slate-50 dark:bg-gray-800 text-center text-base font-medium text-slate-900 dark:text-white outline-none transition-all focus:bg-white dark:focus:bg-gray-700`}
                        />
                      )}
                    />
                  </div>
                  {error.otp && (
                    <p className="error-message text-center">
                      {error.otp}
                    </p>
                  )}
                </div>
              )}

              {/* Remember + forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    Keep me logged in
                  </span>
                </label>
                {/* <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm font-medium text-[#4F46E5] hover:text-[#4338CA] dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Forgot password?
                </Link> */}
              </div>

              {/* Submit */}
              <div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE] hover:shadow-[0_10px_40px_rgba(79,70,229,0.35)] hover:translate-y-[0.5px] transition-all border-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader type="button" text="Authenticating..." iconClassName="text-white" />
                  ) : otpSent ? (
                    "Login"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-6 border-t border-slate-100 dark:border-gray-800 pt-4">
            <p className="text-xs sm:text-sm text-center text-slate-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#4F46E5] hover:text-[#4338CA] dark:text-brand-400 dark:hover:text-brand-300"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
