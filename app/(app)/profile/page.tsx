"use client";

import { useRouter } from "next/navigation";
import { Tab } from "@/types";
import { ProfileView } from "@/views/ProfileView";

export default function ProfilePage() {
  const router = useRouter();

  const handleNavigate = (tab: Tab) => {
    const routes: Record<Tab, string> = {
      [Tab.HOME]: "/home",
      [Tab.ROUTINE]: "/routine",
      [Tab.ADD]: "/journal",
      [Tab.REWARDS]: "/rewards",
      [Tab.PROFILE]: "/profile",
      [Tab.MEDITATION]: "/meditation",
      [Tab.THERAPIST]: "/therapist",
    };
    router.push(routes[tab]);
  };

  return <ProfileView onNavigate={handleNavigate} />;
}
