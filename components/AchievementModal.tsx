import { Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

type AchievementModalProps = {
  badge: {
    name: string;
    description: string;
    icon: string;
  };
  onClose: () => void;
};

const AchievementModal = ({ badge, onClose }: AchievementModalProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  if (!badge) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Enter" && handleClose()}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm transform transition-all duration-500 ${
          show ? "scale-100 translate-y-0" : "scale-90 translate-y-4"
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-violet-500/30 shadow-2xl shadow-violet-500/20 p-8 text-center">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />

          {/* Icon */}
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-violet-400 to-violet-600 p-4 rounded-full shadow-lg animate-float flex items-center justify-center w-20 h-20 text-4xl">
              {badge.icon}
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-violet-200 animate-bounce" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-white mb-2 animate-scale-up">
            Conquista Desbloqueada!
          </h2>
          <h3 className="text-xl font-bold text-violet-400 mb-4">
            {badge.name}
          </h3>
          <p className="text-slate-300 mb-8 text-sm">
            {badge.description}
          </p>

          {/* Button */}
          <button
            className="w-full py-3 px-6 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transform transition-all hover:scale-105 active:scale-95"
            onClick={handleClose}
            type="button"
          >
            Incrível!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementModal;
