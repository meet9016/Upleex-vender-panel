"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
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
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm">
            Sign Up
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and password to sign up!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>First Name *</Label>
              <Input
                type="text"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
                placeholder="Enter your first name"
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
            />
          </div>

          {/* Password */}
          <div>
            <Label>Password *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
              </span>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isChecked}
              onChange={setIsChecked}
            />
            <p className="text-sm text-gray-500">
              I agree to the{" "}
              <span className="text-gray-800">Terms</span> and{" "}
              <span className="text-gray-800">Privacy Policy</span>
            </p>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full px-4 py-3 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
