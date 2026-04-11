"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, DatePicker, Form, Input, InputNumber, Select, message } from "antd";
import dayjs from "dayjs";
import { BannerTheme, BannerPosition, AD_BANNER_DIMENSIONS } from "@/lib/constants";
import { BannerPlacementPreview } from "@/components/features";
import ImageUpload from "@/components/ui/ImageUpload";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/utils/localDraft";
import { enqueueOfflineItem, replayOfflineQueue } from "@/lib/utils/offlineQueue";

const { RangePicker } = DatePicker;
const AD_APPLICATION_DRAFT_KEY = "myharvesthub.ad-application.draft.v1";
const AD_APPLICATION_QUEUE_TYPE = "ad-application.submit";
const GUEST_UPLOAD_ID_KEY = "myharvesthub.upload.guest-id.v1";

type UploadMeta = { url: string; publicId: string };

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
  durationType: "HOURLY" | "DAILY";
  durationValue: number;
  amountPaid: number;
  proofOfTransferUrl?: string;
}

interface DraftPayload {
  name?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  position?: BannerPosition;
  theme?: BannerTheme;
  paymentMethod?: "BANK_TRANSFER" | "CARD" | "USSD";
  durationType?: "HOURLY" | "DAILY";
  durationValue?: number;
  amountPaid?: number;
  proofOfTransferUrl?: string;
  requestedStart?: string;
  requestedEnd?: string;
  schedule?: [string, string] | null;
  imagePublicId?: string;
  proofPublicId?: string;
  paymentGateway?: "PAYSTACK" | "FLUTTERWAVE";
  paymentReference?: string;
  paymentVerificationReference?: string;
}

export default function AdvertisePage() {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [imageUpload, setImageUpload] = useState<UploadMeta | null>(null);
  const [proofUpload, setProofUpload] = useState<UploadMeta | null>(null);
  const [guestUploadId, setGuestUploadId] = useState("");
  const [rateConfig, setRateConfig] = useState<{ hourlyRate: number; dailyRate: number } | null>(
    null
  );
  const [isRateFallback, setIsRateFallback] = useState(false);
  const router = useRouter();

  const durationType = Form.useWatch("durationType", form) || "DAILY";
  const durationValue = Form.useWatch("durationValue", form) || 1;
  const paymentMethod = Form.useWatch("paymentMethod", form) || "BANK_TRANSFER";
  const previewPosition = (Form.useWatch("position", form) || "TOP") as BannerPosition;
  const previewTitle = Form.useWatch("title", form) || "";
  const estimatedAmount = rateConfig
    ? (durationType === "HOURLY" ? rateConfig.hourlyRate : rateConfig.dailyRate) * durationValue
    : null;

  useEffect(() => {
    let storedGuestId = window.localStorage.getItem(GUEST_UPLOAD_ID_KEY);
    if (!storedGuestId) {
      storedGuestId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(GUEST_UPLOAD_ID_KEY, storedGuestId);
    }
    setGuestUploadId(storedGuestId);

    const draft = loadLocalDraft<DraftPayload>(AD_APPLICATION_DRAFT_KEY);
    if (draft) {
      const schedule = draft.schedule
        ? [dayjs(draft.schedule[0]), dayjs(draft.schedule[1])]
        : undefined;

      form.setFieldsValue({
        ...draft,
        schedule: schedule as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
      });

      if (draft.imageUrl && draft.imagePublicId) {
        setImageUpload({ url: draft.imageUrl, publicId: draft.imagePublicId });
      }
      if (draft.proofOfTransferUrl && draft.proofPublicId) {
        setProofUpload({
          url: draft.proofOfTransferUrl,
          publicId: draft.proofPublicId,
        });
      }
    }

    const loadRates = async () => {
      try {
        const res = await fetch("/api/admin/ads/rates");
        const data = await res.json().catch(() => ({}));
        if (!data?.rateConfig) return;
        setRateConfig({
          hourlyRate: Number(data.rateConfig.hourlyRate || 0),
          dailyRate: Number(data.rateConfig.dailyRate || 0),
        });
        setIsRateFallback(Boolean(data.fallback));
      } catch {
        // Keep form usable even if rates endpoint is unavailable.
      }
    };

    loadRates();
  }, [form]);

  const saveDraft = (values: Partial<FormValues>) => {
    const schedule = values.schedule
      ? [values.schedule[0]?.toISOString(), values.schedule[1]?.toISOString()]
      : null;

    saveLocalDraft<DraftPayload>(AD_APPLICATION_DRAFT_KEY, {
      ...values,
      imageUrl: imageUpload?.url,
      proofOfTransferUrl: proofUpload?.url,
      imagePublicId: imageUpload?.publicId,
      proofPublicId: proofUpload?.publicId,
      schedule: schedule as [string, string] | null,
    });
  };

  const submitApplication = async (body: DraftPayload) => {
    const res = await fetch("/api/ad-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit application");
    }

    return data;
  };

  useEffect(() => {
    const replayQueue = async () => {
      if (!navigator.onLine) return;

      const { processed } = await replayOfflineQueue<DraftPayload>({
        [AD_APPLICATION_QUEUE_TYPE]: async (payload) => {
          await submitApplication(payload);
        },
      });

      if (processed > 0) {
        message.success(`Submitted ${processed} queued ad application(s).`);
      }
    };

    replayQueue();
    window.addEventListener("online", replayQueue);
    return () => window.removeEventListener("online", replayQueue);
  }, []);

  const onFinish = async (values: FormValues) => {
    if (!imageUpload?.url) {
      message.error("Please upload your banner image.");
      return;
    }

    const isBankTransfer = values.paymentMethod === "BANK_TRANSFER";
    if (isBankTransfer && !proofUpload?.url) {
      message.error("Please upload payment proof for bank transfer.");
      return;
    }

    setLoading(true);
    try {
      const [requestedStart, requestedEnd] = values.schedule || [];
      let paymentReference: string | undefined;

      if (!isBankTransfer) {
        const paymentRes = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gateway: "PAYSTACK",
            amount: values.amountPaid,
            email: values.email,
            currency: "NGN",
            metadata: {
              source: "advertise",
              paymentMethod: values.paymentMethod,
              durationType: values.durationType,
              durationValue: values.durationValue,
            },
          }),
        });
        const paymentData = await paymentRes.json().catch(() => ({}));
        if (!paymentRes.ok || !paymentData?.payment?.reference) {
          throw new Error(paymentData?.error || "Unable to initialize payment");
        }
        paymentReference = String(paymentData.payment.reference);
        if (paymentData?.payment?.authorizationUrl) {
          window.open(paymentData.payment.authorizationUrl, "_blank", "noopener,noreferrer");
          message.info("Payment initialized. Complete payment in the opened tab.");
        }
      }

      const payload: DraftPayload = {
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
        companyName: values.companyName,
        title: values.title,
        description: values.description,
        imageUrl: imageUpload.url,
        linkUrl: values.linkUrl,
        position: values.position,
        theme: values.theme,
        requestedStart: requestedStart?.toISOString(),
        requestedEnd: requestedEnd?.toISOString(),
        paymentMethod: values.paymentMethod,
        durationType: values.durationType,
        durationValue: values.durationValue,
        amountPaid: values.amountPaid,
        proofOfTransferUrl: isBankTransfer ? proofUpload?.url : undefined,
        paymentGateway: isBankTransfer ? undefined : "PAYSTACK",
        paymentReference,
        paymentVerificationReference: paymentReference ? `${paymentReference}-success` : undefined,
        imagePublicId: imageUpload.publicId,
        proofPublicId: isBankTransfer ? proofUpload?.publicId : undefined,
      };

      if (!navigator.onLine) {
        enqueueOfflineItem(AD_APPLICATION_QUEUE_TYPE, payload);
        saveDraft(values);
        message.warning(
          "You are offline. Your application has been queued and will submit automatically once you are back online."
        );
        return;
      }

      await submitApplication(payload);
      clearLocalDraft(AD_APPLICATION_DRAFT_KEY);
      message.success("Ad application submitted successfully. Our team will review it shortly.");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      message.error(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const adFormInputClassName =
    "ad-form-native-control w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-ds-text-primary";

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-ds-text-primary">Apply to Advertise</h1>
        <p className="mt-2 text-ds-text-secondary">
          Share your brand, offer or event in the top banner slot on HarvestHub.
        </p>

        <div className="mt-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-4">
          <h2 className="text-lg font-semibold">Image Guidelines</h2>
          <p className="text-sm text-ds-text-secondary mt-1">
            Top banner: {AD_BANNER_DIMENSIONS.topBanner.recommended.width}x
            {AD_BANNER_DIMENSIONS.topBanner.recommended.height} (ratio{" "}
            {AD_BANNER_DIMENSIONS.topBanner.recommended.ratio}). Minimum{" "}
            {AD_BANNER_DIMENSIONS.topBanner.min.width}x{AD_BANNER_DIMENSIONS.topBanner.min.height}.
          </p>
          <p className="text-sm text-ds-text-secondary">
            Hero banner: {AD_BANNER_DIMENSIONS.heroBanner.recommended.width}x
            {AD_BANNER_DIMENSIONS.heroBanner.recommended.height} (ratio{" "}
            {AD_BANNER_DIMENSIONS.heroBanner.recommended.ratio}). Minimum{" "}
            {AD_BANNER_DIMENSIONS.heroBanner.min.width}x{AD_BANNER_DIMENSIONS.heroBanner.min.height}
            .
          </p>
          <p className="text-sm text-ds-text-secondary">File size: max 1MB, prefer WebP/AVIF.</p>
        </div>

        <Alert
          className="mt-4"
          type="info"
          showIcon
          message="Draft and offline support enabled"
          description="Your progress is saved locally as you type. If your network drops, submission is queued and retried automatically."
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={(_, allValues) => saveDraft(allValues)}
          className="mt-6"
          initialValues={{
            position: "TOP",
            theme: "BUSINESS",
            durationType: "DAILY",
            durationValue: 1,
          }}
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
          <Form.Item label="Banner Image" required>
            <ImageUpload
              folderType="ad"
              guestUploadId={guestUploadId}
              skipPersistence
              helpText="Upload the banner image to use in your advert application."
              onUploaded={(result) => {
                setImageUpload({ url: result.url, publicId: result.publicId });
                form.setFieldsValue({ imageUrl: result.url });
                saveDraft(form.getFieldsValue());
              }}
            />
            <Form.Item
              name="imageUrl"
              noStyle
              rules={[{ required: true, message: "Please upload your banner image" }]}
            >
              <Input type="hidden" />
            </Form.Item>
          </Form.Item>
          <Form.Item name="linkUrl" label="Call-to-Action Link">
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item
            name="schedule"
            label="Preferred Schedule"
            rules={[{ required: true, message: "Select start/end dates" }]}
          >
            <RangePicker className={adFormInputClassName} />
          </Form.Item>
          <Form.Item name="position" label="Preferred Position" rules={[{ required: true }]}>
            <Select className={adFormInputClassName}>
              <Select.Option value="TOP">Top</Select.Option>
              <Select.Option value="HERO">Hero</Select.Option>
              <Select.Option value="SIDEBAR">Sidebar</Select.Option>
            </Select>
            <p className="mt-1 text-xs text-ds-text-tertiary">
              Choose where your ad should appear first; final placement depends on approved inventory.
            </p>
          </Form.Item>

          <BannerPlacementPreview
            position={previewPosition}
            imageUrl={imageUpload?.url}
            title={previewTitle}
          />

          <Form.Item name="theme" label="Theme" rules={[{ required: true }]}>
            <Select className={adFormInputClassName}>
              <Select.Option value="BUSINESS">Business</Select.Option>
              <Select.Option value="CHURCH">Church</Select.Option>
              <Select.Option value="EVENT">Event</Select.Option>
              <Select.Option value="PROMOTION">Promotion</Select.Option>
            </Select>
            <p className="mt-1 text-xs text-ds-text-tertiary">
              Theme helps operations review and tailor matching banner presentation.
            </p>
          </Form.Item>
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: "Please select a payment method" }]}
          >
            <Select className={adFormInputClassName}>
              <Select.Option value="BANK_TRANSFER">Bank Transfer</Select.Option>
              <Select.Option value="CARD">Card</Select.Option>
              <Select.Option value="USSD">USSD</Select.Option>
            </Select>
          </Form.Item>

          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item
              name="durationType"
              label="Duration Type"
              rules={[{ required: true, message: "Please select a duration type" }]}
            >
              <Select className={adFormInputClassName}>
                <Select.Option value="DAILY">Daily</Select.Option>
                <Select.Option value="HOURLY">Hourly</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="durationValue"
              label="Duration Value"
              rules={[
                { required: true, message: "Please enter duration value" },
                {
                  validator: (_, value) =>
                    typeof value === "number" && value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error("Duration must be at least 1")),
                },
              ]}
            >
              <InputNumber className={adFormInputClassName} min={1} />
            </Form.Item>
          </div>
          <p className="mb-4 text-xs text-ds-text-tertiary">
            Use duration type/value to match your campaign run length (e.g., 3 days or 6 hours).
          </p>

          <div className="mb-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-3 text-sm text-ds-text-secondary">
            <p className="font-medium text-ds-text-primary">Estimated Price</p>
            {estimatedAmount !== null ? (
              <p>
                NGN {estimatedAmount.toLocaleString("en-NG")} ({durationValue}{" "}
                {durationType === "HOURLY" ? "hour" : "day"}
                {durationValue > 1 ? "s" : ""})
              </p>
            ) : (
              <p>
                Rate configuration unavailable. You can still submit, and admin will verify pricing.
              </p>
            )}
            {isRateFallback ? (
              <p className="mt-1 text-xs text-ds-text-tertiary">
                Pricing is using temporary fallback values pending admin configuration.
              </p>
            ) : null}
          </div>

          <Form.Item
            name="amountPaid"
            label="Amount Paid (NGN)"
            rules={[
              { required: true, message: "Please enter amount paid" },
              {
                validator: (_, value) =>
                  typeof value === "number" && value >= 100
                    ? Promise.resolve()
                    : Promise.reject(new Error("Minimum payment is 100 NGN")),
              },
            ]}
          >
            <InputNumber className={adFormInputClassName} min={100} />
          </Form.Item>

          {paymentMethod === "BANK_TRANSFER" ? (
            <Form.Item label="Proof of Payment" required>
              <ImageUpload
                folderType="payment-proof"
                guestUploadId={guestUploadId}
                skipPersistence
                helpText="Upload payment confirmation screenshot or transfer receipt."
                onUploaded={(result) => {
                  setProofUpload({ url: result.url, publicId: result.publicId });
                  form.setFieldsValue({ proofOfTransferUrl: result.url });
                  saveDraft(form.getFieldsValue());
                }}
              />
              <Form.Item
                name="proofOfTransferUrl"
                noStyle
                rules={[{ required: true, message: "Please upload proof of transfer" }]}
              >
                <Input type="hidden" />
              </Form.Item>
              <p className="mt-2 text-xs text-ds-text-tertiary">
                Upload a clear transfer receipt or payment screenshot showing amount, date, and reference.
              </p>
            </Form.Item>
          ) : (
            <div className="mb-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-3 text-xs text-ds-text-secondary">
              Proof upload is not required for card/USSD. Payment references are captured automatically.
            </div>
          )}

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
