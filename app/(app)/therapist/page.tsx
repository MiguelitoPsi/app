"use client";

import { useRouter } from "next/navigation";
import { TherapistView } from "@/views/TherapistView";

export default function TherapistPage() {
  const router = useRouter();

  return <TherapistView goBack={() => router.push("/home")} />;
}
