"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/utils/axiosInstance";
import endPointApi from "@/utils/endPointApi";
import PageLoader from "@/components/common/PageLoader";

export function KycGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkKyc = async () => {
      // Allow access to KYC page regardless of status
      if (pathname === "/kyc") {
        if (mounted) {
          setApproved(true);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await api.post(endPointApi.postFetchVendorKYCFormData as string);
        const status = res?.data?.data?.status || "";
        const isApproved = String(status).toLowerCase() === "approved";

        if (mounted) {
          if (!isApproved) {
            // Redirect to KYC page if not approved
            router.replace("/kyc");
          } else {
            setApproved(true);
          }
          setChecking(false);
        }
      } catch {
        if (mounted) {
          // If check fails, redirect to KYC
          router.replace("/kyc");
          setChecking(false);
        }
      }
    };

    checkKyc();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoader fullScreen={false} />
      </div>
    );
  }

  if (!approved && pathname !== "/kyc") {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
