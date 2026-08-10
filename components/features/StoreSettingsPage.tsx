"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, Button, PageLoader } from "@/components/ui";
import ImageUpload from "@/components/ui/ImageUpload";
import { Camera, Store, MapPin, Percent, Info, X } from "lucide-react";
import { Switch, Select, message, Input as AntInput } from "antd";
import { CAMPUS_LOCATIONS, VENDOR_CATEGORIES, COMMISSION_RATES } from "@/lib/constants";

const { TextArea } = AntInput;

export default function StoreSettingsFeature() {
  const { user } = useAuth();

  const [vendor, setVendor] = useState<any>(undefined);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    storeLogo: "",
    description: "",
    category: "",
    campus: "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    whatsapp: "",
    address: "",
    allowsPickup: false,
    allowsDelivery: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    processingTime: "1-2 days",
    returnPolicy: "",
    shippingPolicy: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  const validatedVendorId = typeof vendor?.id === "string" && vendor.id.trim().length > 0 ? vendor.id : null;

  useEffect(() => {
    let mounted = true;

    if (!user) {
      setLoadingSettings(false);
      return () => {
        mounted = false;
      };
    }

    if (user.role !== "VENDOR") {
      setLoadingSettings(false);
      return () => {
        mounted = false;
      };
    }

    async function loadVendor() {
      setLoadingSettings(true);
      try {
        const res = await fetch("/api/vendors/me/store-settings");
        if (!res.ok) throw new Error("Failed to load store settings");
        const json = await res.json();
        if (!mounted) return;

        if (!json.success || !json.settings) {
          throw new Error(json.error || "Unable to load store settings");
        }

        const settings = json.settings;
        setVendor({
          id: json.vendorId,
          isChurchAffiliated: Boolean(settings.isChurchAffiliated),
          commissionRate: settings.commissionRate,
        });

        setFormData((prev) => ({
          ...prev,
          storeName: settings.storeName || prev.storeName,
          storeLogo: settings.storeLogo || prev.storeLogo,
          description: settings.description || prev.description,
          category: settings.category || prev.category,
          campus: settings.campus || prev.campus,
          email: settings.email || user?.email || prev.email,
          phone: settings.phone || user?.phoneNumber || prev.phone,
          whatsapp: settings.whatsapp || prev.whatsapp,
          address: settings.businessAddress || prev.address,
          allowsPickup: settings.allowsPickup ?? prev.allowsPickup,
          allowsDelivery: settings.allowsDelivery ?? prev.allowsDelivery,
          businessHoursStart: settings.businessHoursStart || prev.businessHoursStart,
          businessHoursEnd: settings.businessHoursEnd || prev.businessHoursEnd,
          processingTime: settings.processingTime || prev.processingTime,
          returnPolicy: settings.returnPolicy || prev.returnPolicy,
          shippingPolicy: settings.shippingPolicy || prev.shippingPolicy,
          bankName: settings.bankName || prev.bankName,
          accountName: settings.accountName || prev.accountName,
          accountNumber: settings.accountNumber || prev.accountNumber,
        }));
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : "Unable to load store settings";
        message.error(errMessage);
      } finally {
        if (mounted) {
          setLoadingSettings(false);
        }
      }
    }

    loadVendor();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/vendors/me/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: formData.storeName,
          storeLogo: formData.storeLogo || undefined,
          description: formData.description,
          category: formData.category,
          campus: formData.campus,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          businessAddress: formData.address,
          allowsPickup: formData.allowsPickup,
          allowsDelivery: formData.allowsDelivery,
          businessHoursStart: formData.businessHoursStart,
          businessHoursEnd: formData.businessHoursEnd,
          processingTime: formData.processingTime,
          returnPolicy: formData.returnPolicy,
          shippingPolicy: formData.shippingPolicy,
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings");
      }

      message.success("Store settings updated successfully!");
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Unable to update store settings";
      message.error(errMessage);
    } finally {
      setSavingSettings(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Please log in to view store settings</p>
      </div>
    );
  }

  if (user.role !== "VENDOR") {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-ds-text-primary">Unauthorized</h1>
        <p className="text-ds-text-secondary mt-2">Store settings are only available to vendors.</p>
      </div>
    );
  }

  if (loadingSettings) {
    return <PageLoader minHeight="min-h-[360px]" message="Loading store settings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Store Settings</h1>
          <p className="mt-1 text-ds-text-secondary">
            Manage your store information and preferences
          </p>
        </div>
        <Button onClick={handleSave} loading={savingSettings}>
          Save Changes
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Percent className="h-5 w-5 text-ds-text-brand" />
          <h2 className="text-lg font-semibold text-ds-text-primary">Platform Commission</h2>
        </div>
        <div className="flex items-center justify-between rounded-ds-md border border-ds-border-base p-4">
          <div>
            <p className="font-medium text-ds-text-primary">Your Commission Rate</p>
            <p className="text-xs text-ds-text-secondary">
              {vendor?.isChurchAffiliated
                ? "Church-affiliated vendor rate"
                : "Standard vendor rate"}{" "}
              — applied to each sale
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-ds-text-brand">
              {((vendor?.commissionRate ?? COMMISSION_RATES.DEFAULT) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-ds-sm bg-ds-surface-sunken p-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-ds-text-tertiary" />
          <p className="text-xs text-ds-text-tertiary">
            Commission is automatically deducted from your earnings on each sale. Contact the admin
            team for questions about your commission tier.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <Store className="h-5 w-5 text-ds-text-brand" />
          Store Branding
        </h2>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-ds-md bg-ds-surface-sunken">
                {formData.storeLogo ? (
                  <Image
                    src={formData.storeLogo}
                    alt="Store logo preview"
                    width={96}
                    height={96}
                    className="h-full w-full rounded-ds-md object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-ds-text-placeholder" />
                )}
              </div>
              <div className="space-y-2">
                <ImageUpload
                  folderType="vendor-logo"
                  vendorId={validatedVendorId ?? undefined}
                  valueUrl={formData.storeLogo || undefined}
                  onUploaded={(res) => handleChange("storeLogo", res.cacheBustedUrl || res.url)}
                  disabled={!validatedVendorId}
                  helpText={
                    validatedVendorId
                      ? "Upload a square logo image for your storefront."
                      : "Store profile must be loaded before logo upload."
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChange("storeLogo", "")}
                  disabled={!formData.storeLogo}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Logo
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Store Name
            </label>
            <AntInput
              value={formData.storeName}
              onChange={(e) => handleChange("storeName", e.target.value)}
              placeholder="Enter your store name"
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Store Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your store..."
              rows={4}
              maxLength={500}
              showCount
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Store Category
            </label>
            <Select
              value={formData.category || undefined}
              onChange={(value) => handleChange("category", value)}
              className="w-full"
              placeholder="Select a category"
              options={VENDOR_CATEGORIES.map((cat) => ({
                value: cat.value,
                label: cat.label,
              }))}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <MapPin className="h-5 w-5 text-ds-text-brand" />
          Location & Contact
        </h2>
          <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Campus Location
            </label>
            <Select
              value={formData.campus || undefined}
              onChange={(value) => handleChange("campus", value)}
              className="w-full"
              options={CAMPUS_LOCATIONS.map((location) => ({
                value: location.value,
                label: location.label,
              }))}
              placeholder="Select campus"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">Email</label>
            <AntInput value={formData.email} disabled />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">Phone</label>
            <AntInput
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Phone number"
            />
          </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                WhatsApp
              </label>
              <AntInput
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="WhatsApp number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
                Business Address
              </label>
              <AntInput
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address, city, state"
              />
            </div>
          </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Bank Details</h2>
        <p className="mb-4 text-sm text-ds-text-secondary">
          These bank details will be shown to customers during checkout for bank transfer payments.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Bank Name
            </label>
            <AntInput
              value={formData.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="e.g. First Bank"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Account Name
            </label>
            <AntInput
              value={formData.accountName}
              onChange={(e) => handleChange("accountName", e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Account Number
            </label>
            <AntInput
              value={formData.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
              placeholder="e.g. 0123456789"
              maxLength={10}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Delivery & Store Hours</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Allows Pickup
            </label>
            <Switch
              checked={formData.allowsPickup}
              onChange={(checked) => handleChange("allowsPickup", checked)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Allows Delivery
            </label>
            <Switch
              checked={formData.allowsDelivery}
              onChange={(checked) => handleChange("allowsDelivery", checked)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Start Time
            </label>
            <AntInput
              type="time"
              value={formData.businessHoursStart}
              onChange={(e) => handleChange("businessHoursStart", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              End Time
            </label>
            <AntInput
              type="time"
              value={formData.businessHoursEnd}
              onChange={(e) => handleChange("businessHoursEnd", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Processing Time
            </label>
            <AntInput
              value={formData.processingTime}
              onChange={(e) => handleChange("processingTime", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Store Policies</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Return Policy
            </label>
            <TextArea
              value={formData.returnPolicy}
              onChange={(e) => handleChange("returnPolicy", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Shipping Policy
            </label>
            <TextArea
              value={formData.shippingPolicy}
              onChange={(e) => handleChange("shippingPolicy", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
