"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, Button } from "@/components/ui";
import { Upload, Camera, Store, MapPin, Clock, Truck, Phone, Mail } from "lucide-react";
import { Switch, Select, TimePicker, message, Input as AntInput } from "antd";
import { mockVendors } from "@/lib/data/mockData";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { CAMPUS_LOCATIONS, VENDOR_CATEGORIES } from "@/lib/constants";

const { TextArea } = AntInput;

export default function VendorStoreSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const vendor = mockVendors.find((v) => v.userId === user?.id);

  const [formData, setFormData] = useState({
    storeName: vendor?.storeName || "",
    description: vendor?.storeDescription || "",
    category: vendor?.category || "",
    campus: vendor?.campus || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
    whatsapp: vendor?.whatsappNumber || "",
    address: "",
    allowsPickup: vendor?.storeSettings?.allowsPickup ?? false,
    allowsDelivery: vendor?.storeSettings?.allowsDelivery ?? false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    processingTime: "1-2 days",
    returnPolicy: vendor?.storeSettings?.policies?.returnPolicy || "",
    shippingPolicy: vendor?.storeSettings?.policies?.shippingPolicy || "",
  });

  // Redirect if not vendor
  if (user?.role !== "VENDOR") {
    router.push("/unauthorized");
    return null;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    message.success("Store settings updated successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Store Settings</h1>
          <p className="mt-1 text-ds-text-secondary">
            Manage your store information and preferences
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Store Branding */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <Store className="h-5 w-5 text-ds-text-brand" />
          Store Branding
        </h2>

        <div className="space-y-6">
          {/* Store Logo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-ds-surface-sunken">
                <Camera className="h-8 w-8 text-ds-text-placeholder" />
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
            </div>
          </div>

          {/* Store Name */}
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

          {/* Description */}
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

          {/* Category */}
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

      {/* Location & Contact */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <MapPin className="h-5 w-5 text-ds-text-brand" />
          Location & Contact
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Campus */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Campus Location
            </label>
            <Select
              value={formData.campus || undefined}
              onChange={(value) => handleChange("campus", value)}
              className="w-full"
              placeholder="Select campus"
              options={CAMPUS_LOCATIONS.map((loc) => ({
                value: loc.value,
                label: loc.label,
              }))}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              <Phone className="mr-1 inline h-4 w-4" />
              Phone Number
            </label>
            <AntInput
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+234..."
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              WhatsApp Number
            </label>
            <AntInput
              value={formData.whatsapp}
              onChange={(e) => handleChange("whatsapp", e.target.value)}
              placeholder="+234..."
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              <Mail className="mr-1 inline h-4 w-4" />
              Email
            </label>
            <AntInput
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="store@email.com"
            />
          </div>
        </div>
      </Card>

      {/* Delivery & Pickup */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <Truck className="h-5 w-5 text-ds-text-brand" />
          Delivery & Pickup
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-ds-border-base p-4">
            <div>
              <p className="font-medium text-ds-text-primary">Allow Church Pickup</p>
              <p className="text-sm text-ds-text-secondary">
                Buyers can pick up orders at church services
              </p>
            </div>
            <Switch
              checked={formData.allowsPickup}
              onChange={(checked) => handleChange("allowsPickup", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-ds-border-base p-4">
            <div>
              <p className="font-medium text-ds-text-primary">Allow Home Delivery</p>
              <p className="text-sm text-ds-text-secondary">
                Buyers can have orders delivered to their address
              </p>
            </div>
            <Switch
              checked={formData.allowsDelivery}
              onChange={(checked) => handleChange("allowsDelivery", checked)}
            />
          </div>
        </div>
      </Card>

      {/* Business Hours */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ds-text-primary">
          <Clock className="h-5 w-5 text-ds-text-brand" />
          Business Hours
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Opening Time
            </label>
            <TimePicker
              value={dayjs(formData.businessHoursStart, "HH:mm")}
              onChange={(_, timeString) => handleChange("businessHoursStart", timeString as string)}
              format="HH:mm"
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Closing Time
            </label>
            <TimePicker
              value={dayjs(formData.businessHoursEnd, "HH:mm")}
              onChange={(_, timeString) => handleChange("businessHoursEnd", timeString as string)}
              format="HH:mm"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
            Processing Time
          </label>
          <Select
            value={formData.processingTime}
            onChange={(value) => handleChange("processingTime", value)}
            className="w-full"
            options={[
              { value: "Same day", label: "Same day" },
              { value: "1-2 days", label: "1-2 days" },
              { value: "2-3 days", label: "2-3 days" },
              { value: "3-5 days", label: "3-5 days" },
              { value: "1 week", label: "1 week" },
            ]}
          />
        </div>
      </Card>

      {/* Policies */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ds-text-primary">Store Policies</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-ds-text-secondary">
              Return Policy
            </label>
            <TextArea
              value={formData.returnPolicy}
              onChange={(e) => handleChange("returnPolicy", e.target.value)}
              placeholder="Describe your return policy..."
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
              placeholder="Describe your shipping policy..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
