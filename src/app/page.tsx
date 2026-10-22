import { redirect } from "next/navigation";
import { getSessionProfileId } from "@/lib/session";

export default async function RootPage() {
  const profileId = await getSessionProfileId();
  redirect(profileId ? "/inicio" : "/login");
}
