"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { message, notification } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

type ToastSeverity = "success" | "info" | "warning" | "error";

interface ToastContextType {
  message: MessageInstance;
  notify: (opts: {
    type?: ToastSeverity;
    message: ReactNode;
    description?: ReactNode;
    duration?: number | null;
    placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "top" | "bottom";
  }) => void;
  success: (msg: ReactNode, desc?: ReactNode, duration?: number | null) => void;
  error: (msg: ReactNode, desc?: ReactNode, duration?: number | null) => void;
  info: (msg: ReactNode, desc?: ReactNode, duration?: number | null) => void;
  warning: (msg: ReactNode, desc?: ReactNode, duration?: number | null) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const msg = message;

  const notify = ({
    type = "info",
    message: m,
    description,
    duration = 4.5,
    placement = "topRight",
  }: any) => {
    notification.open({
      message: m as ReactNode,
      description: description as ReactNode,
      duration,
      placement,
      type,
    } as any);
  };

  const success = (m: ReactNode, d?: ReactNode, dur?: number | null) => {
    msg.success(m, dur);
    if (d) notify({ type: "success", message: m, description: d, duration: dur });
  };
  const error = (m: ReactNode, d?: ReactNode, dur?: number | null) => {
    msg.error(m, dur);
    if (d) notify({ type: "error", message: m, description: d, duration: dur });
  };
  const info = (m: ReactNode, d?: ReactNode, dur?: number | null) => {
    msg.info(m, dur);
    if (d) notify({ type: "info", message: m, description: d, duration: dur });
  };
  const warning = (m: ReactNode, d?: ReactNode, dur?: number | null) => {
    msg.warning(m, dur);
    if (d) notify({ type: "warning", message: m, description: d, duration: dur });
  };

  return (
    <ToastContext.Provider value={{ message: msg, notify, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
