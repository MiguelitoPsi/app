import { useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { trpc } from "@/lib/trpc/client";
import LevelUpModal from "./LevelUpModal";

const LevelUpManager = () => {
  const { stats } = useGame();
  const { isLoading } = trpc.user.getProfile.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  // Initialize with current level once loaded to avoid initial trigger
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = stats.level;
      return;
    }

    if (stats.level > previousLevelRef.current) {
      setNewLevel(stats.level);
      setShowModal(true);
      previousLevelRef.current = stats.level;
    }
  }, [stats.level, isLoading]);

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal) return null;

  return <LevelUpModal newLevel={newLevel} onClose={handleClose} />;
};

export default LevelUpManager;
