"use client";

import React, { useState, useRef, useEffect } from "react";
import { PieChart } from "lucide-react";

interface DoughnutChartProps {
  data: { label: string; value: number; color: string }[];
  title?: string;
  subtitle?: string;
  centerText?: string;
  centerSubtext?: string;
  isPie?: boolean;
}

export default function DoughnutChart({
  data,
  title,
  subtitle,
  centerText,
  centerSubtext,
  isPie = false,
}: DoughnutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
        <PieChart className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm font-medium">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = Math.min(dimensions.width, 280);
  const radius = size / 2 - 20;
  const innerRadius = isPie ? 0 : radius * 0.6;

  let currentAngle = -Math.PI / 2;

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    outerR: number,
    innerR: number
  ) => {
    const x1 = Math.cos(startAngle) * outerR;
    const y1 = Math.sin(startAngle) * outerR;
    const x2 = Math.cos(endAngle) * outerR;
    const y2 = Math.sin(endAngle) * outerR;
    const x3 = Math.cos(endAngle) * innerR;
    const y3 = Math.sin(endAngle) * innerR;
    const x4 = Math.cos(startAngle) * innerR;
    const y4 = Math.sin(startAngle) * innerR;

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");
  };

  const arcs = data.map((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      startAngle,
      endAngle,
      path: createArcPath(startAngle, endAngle, radius, innerRadius),
    };
  });

  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div
        ref={chartRef}
        className="flex flex-col items-center justify-center"
      >
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
            className="w-full h-full"
          >
            {arcs.map((arc, index) => (
              <path
                key={index}
                d={arc.path}
                fill={arc.color}
                className={`transition-all duration-300 cursor-pointer ${
                  hoveredIndex === index ? "opacity-100" : "opacity-80"
                }`}
                style={{
                  transform: hoveredIndex === index ? "scale(1.03)" : "scale(1)",
                  transformOrigin: "center",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {(centerText || centerSubtext) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {centerText && (
                <p className="text-2xl font-bold text-slate-800">{centerText}</p>
              )}
              {centerSubtext && (
                <p className="text-xs text-slate-500 mt-1">{centerSubtext}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                hoveredIndex === index
                  ? "bg-slate-100 ring-2 ring-slate-200"
                  : "hover:bg-slate-50"
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.value.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
