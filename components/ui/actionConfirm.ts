"use client";

import { Modal } from "antd";

export interface ActionConfirmConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
}

export class ActionConfirmBuilder {
  private config: ActionConfirmConfig = {
    title: "Confirm",
    message: "Are you sure?",
    confirmText: "Confirm",
    cancelText: "Cancel",
    danger: false,
  };

  title(value: string) {
    this.config.title = value;
    return this;
  }

  message(value: string) {
    this.config.message = value;
    return this;
  }

  confirmText(value: string) {
    this.config.confirmText = value;
    return this;
  }

  cancelText(value: string) {
    this.config.cancelText = value;
    return this;
  }

  danger(value = true) {
    this.config.danger = value;
    return this;
  }

  build(): ActionConfirmConfig {
    return { ...this.config };
  }
}

export class ActionConfirmPresets {
  static delete(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Delete ${subject}`)
      .message(`Delete this ${subject}?`)
      .confirmText("Delete")
      .danger()
      .build();
  }

  static remove(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Remove ${subject}`)
      .message(`Remove this ${subject}?`)
      .confirmText("Remove")
      .danger()
      .build();
  }

  static reject(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Reject ${subject}`)
      .message(`Reject this ${subject}?`)
      .confirmText("Reject")
      .danger()
      .build();
  }

  static suspend(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Suspend ${subject}`)
      .message(`Suspend this ${subject}?`)
      .confirmText("Suspend")
      .danger()
      .build();
  }

  static activate(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Activate ${subject}`)
      .message(`Activate this ${subject}?`)
      .confirmText("Activate")
      .build();
  }

  static approve(subject: string) {
    return new ActionConfirmBuilder()
      .title(`Approve ${subject}`)
      .message(`Approve this ${subject}?`)
      .confirmText("Approve")
      .build();
  }
}

export function openActionConfirm(
  config: ActionConfirmConfig,
  onConfirm: () => void | Promise<void>
) {
  Modal.confirm({
    title: config.title,
    content: config.message,
    okText: config.confirmText,
    cancelText: config.cancelText ?? "Cancel",
    okButtonProps: { danger: !!config.danger },
    onOk: onConfirm,
  });
}

