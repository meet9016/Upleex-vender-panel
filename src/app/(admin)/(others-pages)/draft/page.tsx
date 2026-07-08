"use client";
import React, { Suspense } from 'react';
import DraftsPage from '@/pages/draft/page';

export default function DraftRoute() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <DraftsPage />
    </Suspense>
  );
}
