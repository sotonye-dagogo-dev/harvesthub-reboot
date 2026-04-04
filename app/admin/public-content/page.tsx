import { redirect } from "next/navigation";

export default function AdminPublicContentRedirect() {
  redirect("/operations/public-content");
}
