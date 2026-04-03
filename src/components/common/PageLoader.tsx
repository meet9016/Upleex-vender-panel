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
        <motion.div
          className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 border-t-4 border-indigo-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center bg-white"
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Upleex<span className="text-indigo-600">.</span>
        </h3>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-indigo-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md">
        {LoaderContent}
      </div>
    );
  }

  return LoaderContent;
};

export default PageLoader;

