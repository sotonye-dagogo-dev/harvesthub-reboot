"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { App } from "antd";
import type { MessageInstance } from "antd/es/message/interface";

type ToastSeverity = "success" | "info" | "warning" | "error";

interface ToastContextType {
  message: MessageInstance;
  notify: (opts: {
    type?: ToastSeverity;
    message: ReactNode;
    description?: ReactNode;
    duration?: number | undefined;
    placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "top" | "bottom";
  }) => void;
  success: (msg: ReactNode, desc?: ReactNode, duration?: number | undefined) => void;
  error: (msg: ReactNode, desc?: ReactNode, duration?: number | undefined) => void;
  info: (msg: ReactNode, desc?: ReactNode, duration?: number | undefined) => void;
  warning: (msg: ReactNode, desc?: ReactNode, duration?: number | undefined) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastKey = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { message: msg, notification } = App.useApp();

  const notify = ({
    type = "info",
    message: m,
    description,
    duration = 4.5,
    placement = "topRight",
    ...rest
  }: any) => {
    // Use a unique key per call so repeated/identical toasts always fire
    // instead of silently updating an existing (or previously closed) notice.
    toastKey += 1;
    notification.open({
      key: `toast-${toastKey}`,
      message: m as ReactNode,
      description: description as ReactNode,
      duration,
      placement,
      type,
      ...rest,
    } as any);
  };

  const success = (m: ReactNode, d?: ReactNode, dur?: number | undefined) => {
    if (d) notify({ type: "success", message: m, description: d, duration: dur });
    else msg.success(m, dur as number | undefined);
  };
  const error = (m: ReactNode, d?: ReactNode, dur?: number | undefined) => {
    if (d) notify({ type: "error", message: m, description: d, duration: dur });
    else msg.error(m, dur as number | undefined);
  };
  const info = (m: ReactNode, d?: ReactNode, dur?: number | undefined) => {
    if (d) notify({ type: "info", message: m, description: d, duration: dur });
    else msg.info(m, dur as number | undefined);
  };
  const warning = (m: ReactNode, d?: ReactNode, dur?: number | undefined) => {
    if (d) notify({ type: "warning", message: m, description: d, duration: dur });
    else msg.warning(m, dur as number | undefined);
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
