"use client";

import confetti from "canvas-confetti";
import {
  RiCheckLine as Check,
  RiClockwiseLine as Clock,
  RiDiamondLine as Gem,
  RiRepeatLine as Repeat,
  RiAlertLine as AlertTriangle,
  RiFlagLine as Flag,
  RiDeleteBinLine as Trash2,
  RiArrowDownLine as ChevronDown,
  RiTrophyLine as Trophy,
  RiArchiveLine,
} from "@remixicon/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { XPAnimationContainer } from "@/components/XPAnimation/XPAnimationContainer";
import { useSound } from "@/hooks/useSound";
import { useXPAnimation } from "@/hooks/useXPAnimation";
import { useGame } from "../../../context/GameContext";

const PRIMARY = "#a1c797";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const PRIORITY_COLORS: Record<string, string> = {
  high: "rgb(239, 68, 68)",
  medium: "rgb(249, 115, 22)",
  low: "rgb(59, 130, 246)",
};

export const RoutineView: React.FC = () => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    urgentOverdueTasks,
    dismissUrgentTask,
  } = useGame();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Atenção");

  // Overdue Alert Modal State
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);

  useEffect(() => {
    if (urgentOverdueTasks.length > 0) {
      const timer = setTimeout(() => setShowOverdueAlert(true), 500);
      return () => clearTimeout(timer);
    }
  }, [urgentOverdueTasks.length]);

  // Ripple Animation State
  const [ripples, setRipples] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  // XP Animation
  const { particles, triggerAnimation } = useXPAnimation();

  // Sound effects
  const { playSuccess, playDelete, playError } = useSound();

  // Week strip — Sunday to Saturday of the week containing selectedDate
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const sunday = new Date(selectedDate);
    sunday.setDate(selectedDate.getDate() - selectedDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Month label based on selectedDate
  const monthLabel = useMemo(() => {
    const str = selectedDate.toLocaleDateString("pt-BR", { month: "long" });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedDate]);

  // Filter tasks for selected date only
  const displayTasks = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    let filtered = tasks.filter((t) => {
      const tDate = new Date(t.dueDate);
      return (
        tDate.getTime() >= start.getTime() && tDate.getTime() < end.getTime()
      );
    });

    if (hideCompleted) {
      filtered = filtered.filter((t) => !t.completed);
    }

    // Sort by startTime ascending — tasks without time at the end
    return filtered.sort((a, b) => {
      const aTime = a.startTime || "";
      const bTime = b.startTime || "";
      if (!aTime && !bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      return aTime.localeCompare(bTime);
    });
  }, [tasks, selectedDate, hideCompleted]);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const handleToggleTask = (
    task: {
      id: string;
      dueDate: number;
      completed: boolean;
      priority: "high" | "medium" | "low";
    },
    e?: React.MouseEvent,
  ) => {
    if (!task.completed) {
      const todayCheck = new Date();
      todayCheck.setHours(0, 0, 0, 0);

      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() > todayCheck.getTime()) {
        playError();
        setAlertMessage(
          "Calma lá!\n\nVocê não pode concluir uma tarefa agendada para o futuro. Aguarde o dia correto para realizá-la.",
        );
        setAlertTitle("Tarefa Futura");
        setShowAlert(true);
        return;
      }

      playSuccess();

      if (e) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const { xp, pts } = getRewardValues(task);
        const id = Math.random().toString(36).substr(2, 9);

        setRipples((prev) => [...prev, { id, x: centerX, y: centerY }]);

        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x, y },
          colors: ["#0ea5e9", "#d946ef", "#10b981", "#f59e0b"],
          ticks: 200,
          gravity: 1.2,
          decay: 0.94,
          startVelocity: 30,
          shapes: ["circle"],
          zIndex: 9999,
          disableForReducedMotion: true,
        });

        triggerAnimation(xp, "xp", centerX, centerY);
        setTimeout(() => {
          triggerAnimation(pts, "pts", centerX, centerY);
        }, 200);

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 1000);
      }
    }
    toggleTask(task.id);
  };

  const getPriorityColor = (p: string) =>
    PRIORITY_COLORS[p] || "rgb(148, 163, 184)";

  const getRewardValues = (task: {
    priority: string;
    isFromTherapist?: boolean;
    category?: string;
  }) => {
    if (task.isFromTherapist && task.category === "sessao") {
      return { xp: 40, pts: 40 };
    }
    if (task.priority === "high") return { xp: 30, pts: 30 };
    if (task.priority === "medium") return { xp: 10, pts: 10 };
    return { xp: 5, pts: 5 };
  };

  return (
    <>
      <XPAnimationContainer particles={particles} />
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Week Strip Header */}
        <div className="px-4 pt-6 pb-2">
          {/* Title + Month/Calendar Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight">Rotina</h2>
            <button
              type="button"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: PRIMARY }}
            >
              {monthLabel}
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${calendarOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Week Days Strip */}
          <div className="grid grid-cols-7 gap-1 bg-[#C4A484]/15 rounded-xl px-1 py-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const dayOfWeek = day.getDay();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    const d = new Date(day);
                    d.setHours(0, 0, 0, 0);
                    setSelectedDate(d);
                    setCalendarOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 rounded-xl py-2 transition-all"
                >
                  <span
                    className={`text-xs font-medium ${
                      isSelected
                        ? "text-[#a1c797]"
                        : "text-slate-500 dark:text-slate-500"
                    }`}
                  >
                    {WEEKDAY_LABELS[dayOfWeek]}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isSelected
                        ? "bg-[#a1c797] text-white shadow-md"
                        : isToday
                          ? "bg-[#a1c797]/15 font-bold text-[#a1c797]"
                          : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Expandable Calendar */}
          <AnimatePresence>
            {calendarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex justify-center pb-1 pt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);
                        setSelectedDate(d);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Task List Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Lista de Tarefas
          </h3>
          <div className="flex gap-1 items-center">
            <span
              className="
text-xs font-medium text-slate-400 dark:text-slate-600
            "
            >
              Ocultar Finalizadas
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={hideCompleted}
              aria-label="Ocultar tarefas concluídas"
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                hideCompleted ? "" : "bg-slate-200 dark:bg-slate-700"
              }`}
              style={hideCompleted ? { backgroundColor: PRIMARY } : undefined}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  hideCompleted ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tasks Timeline */}
        <main className="flex-1 px-6 pb-28" id="main-content">
          {displayTasks.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#a1c797]/15">
                <Trophy className="text-[#a1c797]/60" size={28} />
              </div>
              <h4 className="mb-1 text-sm font-bold text-[#a1c797]">
                Nenhuma tarefa encontrada
              </h4>
              <p className="max-w-[200px] text-xs text-[#a1c797]/50">
                Seu dia está livre! Aproveite para adicionar novos objetivos.
              </p>
            </div>
          ) : (
            <div className="relative pl-2">
              {displayTasks.map((task, index) => {
                const isLast = index === displayTasks.length - 1;
                const { xp, pts } = getRewardValues(task);
                const priorityColor = task.completed
                  ? "rgb(203, 213, 225)"
                  : getPriorityColor(task.priority);

                const timeDisplay =
                  task.startTime && task.endTime
                    ? `${task.startTime} - ${task.endTime}`
                    : task.startTime
                      ? task.startTime
                      : null;

                return (
                  <div key={task.id} className="flex items-stretch gap-4">
                    {/* Timeline column */}
                    <div className="flex w-4 shrink-0 flex-col items-center">
                      {/* Dot */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleTask(task, e)}
                        className="relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-all"
                        style={{
                          border: `2.5px solid ${priorityColor}`,
                          backgroundColor: task.completed
                            ? priorityColor
                            : "transparent",
                        }}
                      >
                        {task.completed && (
                          <Check
                            className="text-white"
                            size={7}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                      {/* Dashed line */}
                      {!isLast && (
                        <div
                          className="my-0.5 w-0 flex-1 border-l-2 border-dashed"
                          style={{ borderColor: priorityColor }}
                        />
                      )}
                    </div>

                    {/* Task content */}
                    <div
                      className={`min-w-0 flex-1 pb-6 ${task.completed ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-semibold ${
                              task.completed
                                ? "text-slate-400 line-through dark:text-slate-600"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {task.title}
                          </span>
                          {/* Badges */}
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {task.originalDueDate && !task.completed && (
                              <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <Clock size={10} />
                                Transferida
                              </span>
                            )}
                            {task.frequency && task.frequency !== "once" && (
                              <span className="flex items-center gap-0.5 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                <Repeat size={10} />
                                {task.frequency === "daily"
                                  ? "Diário"
                                  : "Semanal"}
                              </span>
                            )}
                            {!task.completed && (
                              <>
                                <span className="rounded-lg bg-sky-50 px-1.5 py-0.5 text-[10px] font-black text-sky-600 dark:bg-sky-900/20 dark:text-sky-400">
                                  +{xp} XP
                                </span>
                                <span className="flex items-center gap-0.5 rounded-lg bg-emerald-50 px-1.5 py-0.5 dark:bg-emerald-900/20">
                                  <Gem className="text-emerald-500" size={10} />
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                    +{pts}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {timeDisplay && (
                            <span className="whitespace-nowrap text-xs font-medium text-slate-400 dark:text-slate-500">
                              {timeDisplay}
                            </span>
                          )}
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-900/20"
                            onClick={() => {
                              if (task.completed) {
                                playError();
                                setAlertTitle("Ação Bloqueada");
                                setAlertMessage(
                                  "Você não pode excluir uma tarefa concluída.\nDesmarque-a primeiro se precisar excluí-la.",
                                );
                                setShowAlert(true);
                                return;
                              }
                              playDelete();
                              deleteTask(task.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Ripples */}
        {ripples.map((r) => (
          <div
            className="pointer-events-none fixed z-40 h-12 w-12 animate-ping rounded-full border-2 border-sky-500 opacity-75"
            key={r.id}
            style={{
              left: r.x - 24,
              top: r.y - 24,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>
    </>
  );
};
