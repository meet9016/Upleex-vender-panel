"use client";

import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import PageLoader from "@/components/common/PageLoader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const urlToken = searchParams.get("token");
        const userInfoStr = searchParams.get("user_info");
        const localToken = localStorage.getItem("auth_token");

        // If there's an auto-login token in URL, let the SignInForm handle it
        if (urlToken && userInfoStr) {
          setIsChecking(false);
          return;
        }

        // If already logged in locally, redirect
        if (localToken) {
          const redirectTo = searchParams.get("redirect") || "/";
          router.replace(redirectTo);
        } else {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return <PageLoader />;
  }

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
     
          {/* <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div> */}
        </div>
      </ThemeProvider>
    </div>
  );
}
