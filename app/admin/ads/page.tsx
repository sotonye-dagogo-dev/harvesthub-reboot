import { redirect } from "next/navigation";

export default function AdminAdsRedirect() {
  redirect("/operations/ads");
}
