import { redirect } from "next/navigation";

interface AdminUserDetailRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailRedirect({ params }: AdminUserDetailRedirectProps) {
  const { id } = await params;
  redirect(`/operations/users/${id}`);
}
