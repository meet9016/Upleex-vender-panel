"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";
import { useKyc } from "@/context/KycContext";

export function KycGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { kycApproved, isLoading } = useKyc();

  useEffect(() => {
    // If we've finished checking and the user is NOT approved AND NOT on the KYC page, redirect to KYC.
    if (!isLoading && kycApproved === false && pathname !== "/kyc") {
      router.replace("/kyc");
    }
  }, [kycApproved, isLoading, pathname, router]);

  // Only show the PageLoader if we're still checking AND NOT already approved (from cache) AND NOT on the KYC page.
  if (isLoading && pathname !== "/kyc") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoader fullScreen={false} />
      </div>
    );
  }

  // If not approved and not on kyc page, don't show children while we're about to redirect.
  if (kycApproved === false && pathname !== "/kyc") {
    return null;
  }

  return <>{children}</>;
}
