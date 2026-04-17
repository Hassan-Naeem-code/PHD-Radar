import { redirect } from "next/navigation";

export default async function DiscoverDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/professors/${id}`);
}
