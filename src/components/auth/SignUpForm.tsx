"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#E0F2FE] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-md">
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
              src="/images/logo/upleex-logo-dark.png"
              alt="Upleex"
              width={180}
              height={48}
              priority
              className="mb-2"
            />
            <h1 className="mb-2 mt-3 font-semibold text-gray-800 dark:text-white text-title-sm">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up!
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
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className="mt-1 "
                />
              </div>

              <div>
                <Label>Last Name *</Label>
                <Input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="mt-1 "
              />
            </div>

            {/* Password */}
            <div>
              <Label>Password *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                </span>
              </div>

            </div>

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
              className="w-full px-4 py-3 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE] hover:shadow-[0_10px_40px_rgba(79,70,229,0.35)] hover:translate-y-[0.5px] transition-all border-0"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-xs sm:text-sm text-center text-slate-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/signin"
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
