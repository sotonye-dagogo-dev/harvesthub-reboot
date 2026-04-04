import { redirect } from "next/navigation";

export default function AdminVendorsRedirect() {
  redirect("/operations/vendors");
}
