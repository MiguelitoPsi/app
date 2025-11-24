import { useGame } from "@/context/GameContext";
import AchievementModal from "./AchievementModal";

const AchievementManager = () => {
  const { newBadges, dismissNewBadge } = useGame();

  if (newBadges.length === 0) return null;

  return (
    <AchievementModal
      badge={newBadges[0]}
      onClose={dismissNewBadge}
    />
  );
};

export default AchievementManager;
