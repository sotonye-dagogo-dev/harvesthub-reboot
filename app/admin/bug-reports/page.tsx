import { redirect } from "next/navigation";

export default function AdminBugReportsRedirect() {
  redirect("/operations/bug-reports");
}
