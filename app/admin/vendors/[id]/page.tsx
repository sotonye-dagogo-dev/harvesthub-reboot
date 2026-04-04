import { redirect } from "next/navigation";

interface AdminVendorDetailRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function AdminVendorDetailRedirect({ params }: AdminVendorDetailRedirectProps) {
  const { id } = await params;
  redirect(`/operations/vendors/${id}`);
}
