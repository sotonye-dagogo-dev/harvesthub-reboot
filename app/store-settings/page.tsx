"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Upload, Camera, Store, MapPin, Clock, Truck, Phone, Mail } from "lucide-react";
import { Switch, Select, TimePicker, message, Input as AntInput } from "antd";
import { mockVendors } from "@/lib/data/mockData";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = AntInput;

export default function StoreSettingsPage() {
  const vendorId = "vendor-1"; // Mock vendor ID
  const vendor = mockVendors.find((v) => v.id === vendorId);

  const [formData, setFormData] = useState({
    storeName: vendor?.storeName || "",
    description: "",
    category: vendor?.category || "",
    campus: vendor?.campus || "",
    email: "",
    phone: "",
    whatsapp: vendor?.whatsappNumber || "",
    address: "",
    allowsPickup: false,
    allowsDelivery: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    processingTime: "1-2 days",
    returnPolicy: "",
    shippingPolicy: "",
  });

  const handleSave = () => {
    message.success("Store settings updated successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your store information and preferences
        </p>
      </div>

      {/* Store Branding */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Store className="h-5 w-5 text-purple-600" />
          Store Branding
        </h2>

        <div className="space-y-6">
          {/* Store Logo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Store Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
            </div>
          </div>

          {/* Store Banner */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Store Banner
            </label>
            <div className="flex items-center gap-4">
              <div className="h-32 w-48 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Banner
              </Button>
            </div>
          </div>

          {/* Store Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Store Name
            </label>
            <Input
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Enter store name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Store Description
            </label>
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your store"
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Store Category
            </label>
            <Select
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              className="w-full"
            >
              <Option value="FARM_PRODUCE">Farm Produce</Option>
              <Option value="FASHION">Fashion & Apparel</Option>
              <Option value="FOOD">Food & Beverages</Option>
              <Option value="BEAUTY">Beauty & Cosmetics</Option>
              <Option value="ELECTRONICS">Electronics & Gadgets</Option>
              <Option value="HOME">Home & Kitchen</Option>
              <Option value="BOOKS">Books & Stationery</Option>
              <Option value="SERVICES">Services</Option>
              <Option value="CRAFTS">Crafts & Handmade</Option>
              <Option value="OTHERS">Others</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Phone className="h-5 w-5 text-purple-600" />
          Contact Information
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Mail className="inline mr-2 h-4 w-4" />
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="store@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Phone className="inline mr-2 h-4 w-4" />
              Phone Number
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234 XXX XXX XXXX"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              WhatsApp Number
            </label>
            <Input
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+234 XXX XXX XXXX"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <MapPin className="inline mr-2 h-4 w-4" />
              Campus Location
            </label>
            <Select
              value={formData.campus}
              onChange={(value) => setFormData({ ...formData, campus: value })}
              className="w-full"
            >
              <Option value="OREGUN_HQ">Oregun (Headquarters)</Option>
              <Option value="LEKKI">Lekki</Option>
              <Option value="VICTORIA_ISLAND">Victoria Island</Option>
              <Option value="IKEJA">Ikeja</Option>
              <Option value="FESTAC">Festac</Option>
              <Option value="AJAH">Ajah</Option>
              <Option value="OUTSIDE_LAGOS">Outside Lagos</Option>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Physical Address
          </label>
          <TextArea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter your store address"
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2"
          />
        </div>
      </Card>

      {/* Delivery & Pickup Options */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Truck className="h-5 w-5 text-purple-600" />
          Delivery & Pickup Options
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Church Pickup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow customers to pick up orders at church services
              </p>
            </div>
            <Switch
              checked={formData.allowsPickup}
              onChange={(checked) => setFormData({ ...formData, allowsPickup: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Home Delivery</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Offer delivery to customer addresses
              </p>
            </div>
            <Switch
              checked={formData.allowsDelivery}
              onChange={(checked) => setFormData({ ...formData, allowsDelivery: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Business Hours */}
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Clock className="h-5 w-5 text-purple-600" />
          Business Hours
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Opening Time
            </label>
            <TimePicker
              value={dayjs(formData.businessHoursStart, "HH:mm")}
              onChange={(time) =>
                setFormData({ ...formData, businessHoursStart: time?.format("HH:mm") || "09:00" })
              }
              format="HH:mm"
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Closing Time
            </label>
            <TimePicker
              value={dayjs(formData.businessHoursEnd, "HH:mm")}
              onChange={(time) =>
                setFormData({ ...formData, businessHoursEnd: time?.format("HH:mm") || "18:00" })
              }
              format="HH:mm"
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Processing Time
          </label>
          <Select
            value={formData.processingTime}
            onChange={(value) => setFormData({ ...formData, processingTime: value })}
            className="w-full"
          >
            <Option value="Same day">Same Day</Option>
            <Option value="1-2 days">1-2 Days</Option>
            <Option value="3-5 days">3-5 Days</Option>
            <Option value="1 week">1 Week</Option>
            <Option value="2 weeks">2 Weeks</Option>
          </Select>
        </div>
      </Card>

      {/* Policies */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Store Policies</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Return Policy
            </label>
            <TextArea
              value={formData.returnPolicy}
              onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
              placeholder="Describe your return policy"
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shipping Policy
            </label>
            <TextArea
              value={formData.shippingPolicy}
              onChange={(e) => setFormData({ ...formData, shippingPolicy: e.target.value })}
              placeholder="Describe your shipping policy"
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
