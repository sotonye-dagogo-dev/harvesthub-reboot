"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Select, DatePicker, message, Card } from "antd";
import dayjs from "dayjs";
import { BannerTheme, BannerPosition } from "@/lib/constants";

const { RangePicker } = DatePicker;

interface FormValues {
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: BannerPosition;
  theme: BannerTheme;
  schedule: [dayjs.Dayjs, dayjs.Dayjs] | null;
  paymentMethod: "BANK_TRANSFER" | "CARD" | "USSD";
  amountPaid: number;
  proofOfTransferUrl?: string;
}

export default function AdvertisePage() {
  const [loading, setLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const router = useRouter();

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const [requestedStart, requestedEnd] = values.schedule || [];

      const body = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
        companyName: values.companyName,
        title: values.title,
        description: values.description,
        imageUrl: values.imageUrl,
        linkUrl: values.linkUrl,
        position: values.position,
        theme: values.theme,
        requestedStart: requestedStart?.toISOString(),
        requestedEnd: requestedEnd?.toISOString(),
        paymentMethod: values.paymentMethod,
        amountPaid: values.amountPaid,
        proofOfTransferUrl: proofUrl,
      };

      const res = await fetch("/api/ad-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");

      message.success("Ad application submitted successfully. Our team will review it shortly.");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-ds-text-primary">Apply to Advertise</h1>
        <p className="mt-2 text-ds-text-secondary">
          Share your brand, offer or event in the top banner slot on HarvestHub.
        </p>

        <Form
          layout="vertical"
          onFinish={onFinish}
          className="mt-6"
          initialValues={{ position: "TOP", theme: "BUSINESS" }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Enter your name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email", message: "Enter a valid email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[{ required: true, message: "Enter your phone number" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="companyName" label="Company Name" rules={[{ required: false }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="title"
            label="Banner Title"
            rules={[{ required: true, message: "Enter banner title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Enter description" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="Image URL"
            rules={[{ required: true, message: "Enter image URL" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="linkUrl" label="Call-to-Action Link">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Preferred Position" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="TOP">Top</Select.Option>
              <Select.Option value="HERO">Hero</Select.Option>
              <Select.Option value="SIDEBAR">Sidebar</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="theme" label="Theme" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="BUSINESS">Business</Select.Option>
              <Select.Option value="CHURCH">Church</Select.Option>
              <Select.Option value="EVENT">Event</Select.Option>
              <Select.Option value="PROMOTION">Promotion</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: "Please select a payment method" }]}
          >
            <Select>
              <Select.Option value="BANK_TRANSFER">Bank Transfer</Select.Option>
              <Select.Option value="CARD">Card</Select.Option>
              <Select.Option value="USSD">USSD</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amountPaid"
            label="Amount Paid (NGN)"
            rules={[
              { required: true, message: "Please enter amount paid" },
              {
                type: "number",
                min: 100,
                message: "Minimum payment is 100 NGN",
              },
            ]}
          >
            <Input type="number" min={100} />
          </Form.Item>

          <Form.Item
            name="proofOfTransferUrl"
            label="Proof of Payment URL"
            rules={[{ required: true, message: "Please upload proof of transfer" }]}
          >
            <Input
              value={proofUrl || ""}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Upload a screenshot URL or file URL"
              className="rounded-ds-md"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
