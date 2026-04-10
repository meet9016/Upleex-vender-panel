'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface PageLoaderProps {
  fullScreen?: boolean;
}

export const PageLoader = ({ fullScreen = true }: PageLoaderProps) => {
  const LoaderContent = (
    <div className="relative flex flex-col items-center">
      <div className="relative w-20 h-20 mb-4">
        {/* Pulse Outer Ring */}
        <motion.div
          className="absolute inset-0 border-4 border-sky-500/20 rounded-full"
          animate={{
            scale: [0.8, 1.1, 0.8],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Spinning Ring */}
        <motion.div
          className="absolute inset-0 border-t-4 border-sky-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Logo Card with Bounce */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              y: [0, -3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center bg-white border border-gray-50 overflow-hidden"
          >
            <Image
              src="/images/logo/small-logo.webp"
              alt="Upleex"
              width={28}
              height={28}
              priority
            />
          </motion.div>
        </div>
      </div>

      {/* Text and Dots */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight dark:text-white">
          Upleex<span className="text-sky-500">.</span>
        </h3>
        <div className="flex gap-1.5 mt-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-sky-500 rounded-full"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300">
        {LoaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-10 w-full h-full">
      {LoaderContent}
    </div>
  );
};

export default PageLoader;

