"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 애니메이션을 위한 약간의 지연
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // 자동 닫기
    const closeTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // 애니메이션 시간
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const icon =
    type === "success" ? (
      <CheckCircle2 className="w-5 h-5 text-white" />
    ) : (
      <XCircle className="w-5 h-5 text-white" />
    );

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-[60]",
        "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl",
        "min-w-[280px] max-w-[calc(100%-2rem)]",
        "backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        type === "success" ? "bg-green-500" : "bg-red-500",
        isVisible && !isExiting
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      )}
    >
      {icon}
      <p className="flex-1 text-white text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="text-white/80 hover:text-white transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
