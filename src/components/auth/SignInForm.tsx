"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import { saveToken } from "@/utils/tokenManager";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import OtpInput from 'react-otp-input';

type FormData = {
  mobile: string;
  otp: string;
};

interface ErrorState {
  mobile?: string;
  otp?: string;
}

export default function SignInForm() {

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state for button
  const [formData, setFormData] = useState<FormData>({
    mobile: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState<ErrorState>({});

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
    try {
      // Use auth service to login
      const formdata = new FormData();

      formdata.append("number", formData.mobile || "");
      const res = await api.post(`${endPointApi.login}`, formdata);

      if (res.data.status == 200) {
        toast.success(res.data.message);
        setOtpSent(true);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
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
      const formdata = new FormData();
      formdata.append("number", formData.mobile);
      formdata.append("otp", formData.otp);

      const res = await api.post(`${endPointApi.login}`, formdata);
      
      if (res.data.status == 200) {
        saveToken(res.data.data.token);
        // localStorage.setItem(
        //   "userData",
        //   JSON.stringify({
        //     full_name: res.data.data.user.full_name,
        //     email: res.data.data.user.number,
        //   })
        // );
        
        toast.success(res.data.message);
        // navigate("/");
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get('redirect') || '/';

        // Use window.location.href for hard redirect instead of router.push
        window.location.href = redirectTo;
      } else {
        console.log("res000",res);
        
        toast.error(res.data.message)
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault(); // 👈 stop refresh
                otpSent ? verifyOtp() : signIn();
              }}>
              <div className="space-y-6">
                {/* EMAIL */}
                <div>
                  <Label>
                    Mobile <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    name="mobile"
                    placeholder="**********"
                    value={formData.mobile}
                    onChange={handleChange}
                  // disabled={otpSent}
                  />
                  {/* Display mobile number validation error */}
                  {error.mobile && <p className="text-red-500 text-sm">{error.mobile}</p>}
                </div>

                {
                  otpSent && (
                    <div>
                      <Label>
                        Otp <span className="text-error-500">*</span>{" "}
                      </Label>
                      {/* <Input
                        name="otp"
                        placeholder="Enter your otp"
                        value={formData.otp}
                        onChange={handleChange}
                      /> */}

                      <OtpInput
                        value={formData.otp}
                        onChange={(otp) => setFormData(prev => ({ ...prev, otp }))}
                        numInputs={6}
                        renderSeparator={<span className="text-white">-</span>}
                        shouldAutoFocus
                        renderInput={(props) => (
                          <input
                            {...props}
                            style={{ width: "35px", height: "40px" }}
                            className="border  border-gray-300 rounded-md text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#251C4B] transition"
                          />
                        )}
                      />

                      {error.otp && <p className="text-red-500 text-sm">{error.otp}</p>}
                    </div>
                  )
                }
                {/* REMEMBER ME + FORGOT */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* SUBMIT */}
                <div>
                  <Button className="w-full bg-brand-950" size="sm">
                    {isLoading
                      ? "Please wait..."
                      : otpSent
                        ? "Login"
                        : "Send OTP"
                    }
                  </Button>
                </div>
              </div>
            </form>

            {/* SIGN UP */}
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
