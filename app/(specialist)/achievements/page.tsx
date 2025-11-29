"use client";

import { Award } from "lucide-react";
import {
  TherapistPageContent,
  TherapistPageHeader,
  TherapistPageLayout,
} from "@/components/TherapistPageLayout";
import { AchievementsList } from "@/components/therapist";

export default function AchievementsPage() {
  return (
    <TherapistPageLayout className="flex flex-col" noPadding>
      <TherapistPageHeader
        gradient="from-amber-500 to-orange-600"
        icon={Award}
        subtitle="Suas medalhas e progressos"
        title="Conquistas"
      />
      <TherapistPageContent>
        <AchievementsList />
      </TherapistPageContent>
    </TherapistPageLayout>
  );
}
