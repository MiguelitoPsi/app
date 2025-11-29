"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Flag,
  MessageSquare,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "../lib/trpc/client";

type TaskFormData = {
  title: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "once";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  type?:
    | "feedback"
    | "session"
    | "review_records"
    | "create_plan"
    | "approve_reward"
    | "custom";
  // Nova categoria: 'geral' ou 'sessao'
  taskCategory?: "geral" | "sessao";
  // ID do paciente para tarefas de sessão
  sessionPatientId?: string;
  // Dias da semana para frequência semanal (0-6, onde 0 = Domingo)
  weekDays?: number[];
  // Dias do mês para frequência mensal (1-31)
  monthDays?: number[];
};

const defaultTaskForm: TaskFormData = {
  title: "",
  frequency: "weekly",
  priority: "medium",
  type: "custom",
  taskCategory: undefined,
  sessionPatientId: undefined,
};

export default function TherapistRoutineView() {
  // Main view mode: 'my-routine' for therapist's own tasks, 'patients' for patient tasks
  const [mainView, setMainView] = useState<"my-routine" | "patients">(
    "my-routine"
  );

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [showPatientList, setShowPatientList] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm);
  const [feedbackText, setFeedbackText] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "all">(
    "pending"
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  // Estado para busca de paciente no formulário de sessão
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Alert Modal State
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Atenção");

  // tRPC queries
  const { data: patients } = trpc.patient.getAll.useQuery();
  const { data: patientTasks, refetch: refetchTasks } =
    trpc.task.getPatientTasksFromTherapist.useQuery(
      { patientId: selectedPatientId || "" },
      { enabled: !!selectedPatientId && mainView === "patients" }
    );
  const { data: aiSuggestions } = trpc.task.getAISuggestedTasks.useQuery(
    { patientId: selectedPatientId || "" },
    { enabled: !!selectedPatientId && mainView === "patients" }
  );

  // Therapist's own tasks
  const { data: myTasks, refetch: refetchMyTasks } =
    trpc.therapistTasks.getAll.useQuery(undefined, {
      enabled: mainView === "my-routine",
    });

  // Filtrar pacientes para busca no formulário de sessão
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!patientSearchQuery.trim()) return patients;
    const query = patientSearchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
    );
  }, [patients, patientSearchQuery]);

  // Encontrar paciente selecionado para sessão
  const selectedSessionPatient = useMemo(() => {
    if (!taskForm.sessionPatientId) return null;
    if (!patients) return null;
    return patients.find((p) => p.id === taskForm.sessionPatientId);
  }, [patients, taskForm.sessionPatientId]);

  const utils = trpc.useUtils();

  // Mutations for patient tasks
  const createTaskMutation = trpc.task.createForPatient.useMutation({
    onSuccess: () => {
      setShowTaskForm(false);
      setTaskForm(defaultTaskForm);
      refetchTasks();
      utils.therapistXp.getStats.invalidate();
    },
  });

  const deleteTaskMutation = trpc.task.deletePatientTask.useMutation({
    onSuccess: () => {
      refetchTasks();
    },
  });

  const sendFeedbackMutation = trpc.task.sendTaskFeedback.useMutation({
    onSuccess: () => {
      setShowFeedbackForm(null);
      setFeedbackText("");
      refetchTasks();
      utils.therapistXp.getStats.invalidate();
    },
  });

  // Mutations for therapist's own tasks
  const createMyTaskMutation = trpc.therapistTasks.create.useMutation({
    onSuccess: () => {
      setShowTaskForm(false);
      setTaskForm(defaultTaskForm);
      setPatientSearchQuery("");
      setShowPatientDropdown(false);
      refetchMyTasks();
      // Se criou tarefa de sessão, também recarregar tarefas do paciente
      if (taskForm.taskCategory === "sessao") {
        refetchTasks();
      }
      utils.therapistXp.getStats.invalidate();
    },
  });

  const completeMyTaskMutation = trpc.therapistTasks.complete.useMutation({
    onSuccess: () => {
      refetchMyTasks();
      utils.therapistXp.getStats.invalidate();
    },
  });

  const deleteMyTaskMutation = trpc.therapistTasks.delete.useMutation({
    onSuccess: () => {
      refetchMyTasks();
    },
  });

  const selectedPatient = patients?.find((p) => p.id === selectedPatientId);

  // Helper to format date for display
  const formatDisplayDate = (date: Date) => {
    if (viewMode === "month") {
      const str = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    if (viewMode === "week") {
      const start = new Date(date);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return `${start.getDate()} ${start.toLocaleDateString("pt-BR", {
        month: "short",
      })} - ${end.getDate()} ${end.toLocaleDateString("pt-BR", {
        month: "short",
      })}`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return "Hoje";
    }
    if (checkDate.getTime() === tomorrow.getTime()) {
      return "Amanhã";
    }

    const dateString = date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });
    return dateString.charAt(0).toUpperCase() + dateString.slice(1);
  };

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  };

  // Filter tasks based on view mode and date
  const displayTasks = useMemo(() => {
    if (!patientTasks) return [];

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    let end = new Date(start);

    if (viewMode === "day") {
      end.setDate(start.getDate() + 1);
    } else if (viewMode === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
    } else if (viewMode === "month") {
      start.setDate(1);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
    }

    return patientTasks.filter((task) => {
      // Filter by tab
      if (
        activeTab === "pending" &&
        task.status !== "pending" &&
        task.status !== "accepted"
      )
        return false;
      if (activeTab === "completed" && task.status !== "completed")
        return false;

      // Filter by date if task has dueDate
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getTime() >= start.getTime() &&
          taskDate.getTime() < end.getTime()
        );
      }

      return true;
    });
  }, [patientTasks, selectedDate, viewMode, activeTab]);

  // Filter therapist's own tasks based on view mode and date
  const displayMyTasks = useMemo(() => {
    if (!myTasks) return [];

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    let end = new Date(start);

    if (viewMode === "day") {
      end.setDate(start.getDate() + 1);
    } else if (viewMode === "week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end = new Date(start);
      end.setDate(start.getDate() + 7);
    } else if (viewMode === "month") {
      start.setDate(1);
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
    }

    return myTasks.filter((task) => {
      // Filter by tab
      if (
        activeTab === "pending" &&
        task.status !== "pending" &&
        task.status !== "in_progress"
      )
        return false;
      if (activeTab === "completed" && task.status !== "completed")
        return false;

      // Filter by date if task has dueDate
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getTime() >= start.getTime() &&
          taskDate.getTime() < end.getTime()
        );
      }

      // Include recurring tasks or tasks without specific due date
      return task.isRecurring || !task.dueDate;
    });
  }, [myTasks, selectedDate, viewMode, activeTab]);

  // Calculate Progress for patient tasks
  const dayProgress = useMemo(() => {
    if (!patientTasks || patientTasks.length === 0) return 0;
    const completedCount = patientTasks.filter(
      (t) => t.status === "completed"
    ).length;
    return Math.round((completedCount / patientTasks.length) * 100);
  }, [patientTasks]);

  // Calculate Progress for therapist's own tasks
  const myDayProgress = useMemo(() => {
    if (!displayMyTasks || displayMyTasks.length === 0) return 0;
    const completedCount = displayMyTasks.filter(
      (t) => t.status === "completed"
    ).length;
    return Math.round((completedCount / displayMyTasks.length) * 100);
  }, [displayMyTasks]);

  const showProgressBar =
    mainView === "patients"
      ? patientTasks && patientTasks.length > 0 && dayProgress < 100
      : displayMyTasks && displayMyTasks.length > 0 && myDayProgress < 100;

  const handleCreateTask = () => {
    // Validate date is not in the past
    if (taskForm.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedTaskDate = new Date(taskForm.dueDate);
      selectedTaskDate.setHours(0, 0, 0, 0);

      if (selectedTaskDate < today) {
        const dateStr = selectedTaskDate.toLocaleDateString("pt-BR");
        setAlertMessage(
          `⚠️ Data inválida!\n\nNão é possível criar tarefas para datas que já passaram.\n\nData selecionada: ${dateStr}`
        );
        setAlertTitle("Data no Passado");
        setShowAlert(true);
        return;
      }
    }

    if (mainView === "patients") {
      if (!selectedPatientId) return;
      if (!taskForm.title) return;

      // Para tarefas de pacientes na aba "Pacientes", mapear frequência
      // (biweekly não é suportado no createForPatient, usar weekly como fallback)
      const patientFrequency =
        taskForm.frequency === "biweekly" || taskForm.frequency === "monthly"
          ? "weekly"
          : (taskForm.frequency as "once" | "daily" | "weekly");

      createTaskMutation.mutate({
        patientId: selectedPatientId,
        title: taskForm.title,
        frequency: patientFrequency,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
      });
    } else {
      // Create therapist's own task
      if (!taskForm.taskCategory) return; // Precisa selecionar tipo primeiro

      // Se for sessão, precisa ter paciente selecionado
      if (taskForm.taskCategory === "sessao" && !taskForm.sessionPatientId)
        return;

      // Para tarefas gerais, precisa ter título
      if (taskForm.taskCategory === "geral" && !taskForm.title) return;

      // Gerar título automático para sessões: "Sessão - [Nome do Paciente]"
      const sessionTitle =
        taskForm.taskCategory === "sessao" && selectedSessionPatient
          ? `Sessão - ${selectedSessionPatient.name}`
          : taskForm.title;

      createMyTaskMutation.mutate({
        title: sessionTitle,
        type:
          taskForm.taskCategory === "sessao"
            ? "session"
            : taskForm.type || "custom",
        priority:
          taskForm.taskCategory === "sessao" ? "high" : taskForm.priority,
        dueDate: taskForm.dueDate,
        isRecurring: taskForm.frequency !== "once",
        frequency:
          taskForm.frequency === "once"
            ? undefined
            : (taskForm.frequency as
                | "daily"
                | "weekly"
                | "biweekly"
                | "monthly"),
        taskCategory: taskForm.taskCategory,
        patientId: taskForm.sessionPatientId,
      });
    }
  };

  const handleCompleteTask = (task: {
    id: string;
    dueDate?: Date | string | null;
    status: string;
  }) => {
    if (task.status !== "completed") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate.getTime() > today.getTime()) {
          setAlertMessage(
            "⏳ Calma lá!\n\nVocê não pode concluir uma tarefa agendada para o futuro. Aguarde o dia correto para realizá-la."
          );
          setAlertTitle("Tarefa Futura");
          setShowAlert(true);
          return;
        }
      }
    }
    completeMyTaskMutation.mutate({ id: task.id });
  };

  const handleSendFeedback = (taskId: string) => {
    if (!feedbackText.trim()) return;

    sendFeedbackMutation.mutate({
      taskId,
      feedback: feedbackText,
    });
  };

  const handleUseSuggestion = (
    suggestion: typeof aiSuggestions extends (infer T)[] | undefined ? T : never
  ) => {
    if (!suggestion) return;
    setTaskForm({
      title: suggestion.title,
      frequency: suggestion.frequency as "daily" | "weekly" | "once",
      priority: suggestion.priority as "low" | "medium" | "high",
    });
    setShowTaskForm(true);
  };

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case "high":
        return {
          border: "border-l-red-500",
          text: "text-red-500",
          bg: "bg-red-50 dark:bg-red-900/20",
          icon: "text-red-500",
        };
      case "medium":
        return {
          border: "border-l-orange-500",
          text: "text-orange-500",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          icon: "text-orange-500",
        };
      case "low":
        return {
          border: "border-l-blue-500",
          text: "text-blue-500",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          icon: "text-blue-500",
        };
      default:
        return {
          border: "border-l-slate-300",
          text: "text-slate-500",
          bg: "bg-slate-50",
          icon: "text-slate-400",
        };
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "feedback":
        return "Feedback";
      case "session":
        return "Sessão";
      case "review_records":
        return "Revisão";
      case "create_plan":
        return "Plano";
      case "approve_reward":
        return "Recompensa";
      default:
        return "Tarefa";
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pt-safe py-6 pb-28 sm:px-6 sm:py-8 sm:pb-32 lg:px-8 lg:py-6 lg:pb-8">
      {/* Desktop Header */}
      <div className="mb-6 flex items-end justify-between lg:mb-8">
        <div>
          <h2 className="font-bold text-xl text-slate-800 sm:text-2xl lg:text-3xl dark:text-white">
            {mainView === "my-routine"
              ? "Minha Rotina"
              : "Rotina dos Pacientes"}
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm lg:text-base dark:text-slate-400">
            {mainView === "my-routine"
              ? "Gerencie suas tarefas"
              : "Gerencie as tarefas dos seus pacientes"}
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {(mainView === "my-routine" || selectedPatientId) && (
            <button
              className="touch-target group rounded-xl bg-violet-600 p-2.5 text-white shadow-lg shadow-violet-200 transition-all active:scale-95 hover:bg-violet-700 sm:rounded-2xl sm:p-3 lg:flex lg:items-center lg:gap-2 lg:px-5 lg:py-3 sm:hover:scale-105 dark:shadow-none"
              onClick={() => {
                setShowTaskForm(!showTaskForm);
                const yyyy = selectedDate.getFullYear();
                const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const dd = String(selectedDate.getDate()).padStart(2, "0");
                setTaskForm({
                  ...defaultTaskForm,
                  dueDate: `${yyyy}-${mm}-${dd}`,
                });
              }}
              type="button"
            >
              {showTaskForm ? (
                <X className="lg:hidden" size={20} />
              ) : (
                <Plus className="lg:hidden" size={20} />
              )}
              <span className="hidden lg:inline-flex lg:items-center lg:gap-2">
                {showTaskForm ? <X size={20} /> : <Plus size={20} />}
                {showTaskForm ? "Fechar" : "Nova Tarefa"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Selector - Desktop: side by side buttons with better styling */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 lg:mb-8 lg:flex lg:gap-4">
        <button
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all lg:px-8 lg:py-4 lg:text-lg ${
            mainView === "my-routine"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg lg:shadow-emerald-200/50 dark:lg:shadow-emerald-900/30"
              : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
          onClick={() => setMainView("my-routine")}
          type="button"
        >
          <Target className="h-5 w-5 lg:h-6 lg:w-6" />
          Minha Rotina
        </button>
        <button
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all lg:px-8 lg:py-4 lg:text-lg ${
            mainView === "patients"
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg lg:shadow-violet-200/50 dark:lg:shadow-violet-900/30"
              : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
          onClick={() => setMainView("patients")}
          type="button"
        >
          <Users className="h-5 w-5 lg:h-6 lg:w-6" />
          Pacientes
        </button>
      </div>

      {mainView === "patients" && (
        /* Patient Selector Card */
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <button
            className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 sm:rounded-2xl lg:max-w-md lg:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => setShowPatientList(!showPatientList)}
            type="button"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-semibold text-white lg:h-12 lg:w-12 lg:text-lg">
                {selectedPatient?.name?.charAt(0) || <User size={20} />}
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider lg:text-xs">
                  Paciente
                </p>
                <p className="font-semibold text-slate-800 lg:text-lg dark:text-white">
                  {selectedPatient?.name || "Selecione um paciente"}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform lg:h-6 lg:w-6 ${
                showPatientList ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Patient Dropdown */}
          {showPatientList && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl lg:max-w-md lg:max-h-80 dark:border-slate-800 dark:bg-slate-900">
              {patients?.map((patient) => (
                <button
                  className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 lg:gap-4 lg:p-5 dark:hover:bg-slate-800 ${
                    selectedPatientId === patient.id
                      ? "bg-violet-50 dark:bg-violet-900/20"
                      : ""
                  }`}
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setShowPatientList(false);
                  }}
                  type="button"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-semibold text-white lg:h-12 lg:w-12">
                    {patient.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 lg:text-lg dark:text-slate-200">
                      {patient.name}
                    </p>
                    <p className="text-slate-500 text-sm dark:text-slate-400">
                      {patient.email}
                    </p>
                  </div>
                  {selectedPatientId === patient.id && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-violet-500 lg:h-6 lg:w-6" />
                  )}
                </button>
              ))}

              {(!patients || patients.length === 0) && (
                <div className="p-8 text-center lg:p-12">
                  <User className="mx-auto mb-3 h-12 w-12 text-slate-300 lg:h-16 lg:w-16 dark:text-slate-600" />
                  <p className="text-slate-500 lg:text-lg dark:text-slate-400">
                    Nenhum paciente encontrado
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MY ROUTINE VIEW - Therapist's own tasks */}
      {mainView === "my-routine" && (
        <>
          {/* Desktop Layout: 2 columns */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Column - Calendar & Controls */}
            <div className="lg:col-span-4 xl:col-span-3">
              {/* View Mode Selector - More compact on desktop */}
              <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-3 lg:mb-6">
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "day"
                      ? "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("day")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <CalendarIcon className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Hoje
                    </span>
                  </div>
                </button>
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "week"
                      ? "ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("week")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <Repeat className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Semana
                    </span>
                  </div>
                </button>
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "month"
                      ? "ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("month")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-violet-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <Target className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Mês
                    </span>
                  </div>
                </button>
              </div>

              {/* Date Navigation Card */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:mb-6 sm:rounded-2xl lg:mb-6 lg:p-2 dark:border-slate-800 dark:bg-slate-900">
                <button
                  className="touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-emerald-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  onClick={() => changeDate(-1)}
                  type="button"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs">
                    {viewMode === "day"
                      ? "Dia"
                      : viewMode === "week"
                      ? "Semana"
                      : "Mês"}
                  </span>
                  <div className="flex items-center gap-2 text-center font-bold text-base text-slate-800 sm:text-lg dark:text-white">
                    {formatDisplayDate(selectedDate)}
                  </div>
                </div>
                <button
                  className="touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-emerald-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  onClick={() => changeDate(1)}
                  type="button"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Progress Card */}
              {showProgressBar && (
                <div className="fade-in slide-in-from-top-4 relative mb-6 animate-in overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg shadow-emerald-200 sm:mb-8 sm:rounded-3xl sm:p-5 lg:mb-6 dark:shadow-none">
                  <div className="-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32" />
                  <div className="relative z-10 mb-2 flex items-end justify-between">
                    <div>
                      <p className="mb-1 font-bold text-emerald-100 text-[10px] uppercase tracking-wider sm:text-xs">
                        Progresso do Dia
                      </p>
                      <h3 className="font-bold text-xl sm:text-2xl lg:text-xl">
                        {myDayProgress}% Concluído
                      </h3>
                    </div>
                    <div className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm sm:rounded-xl sm:p-2">
                      <Target className="text-white" size={20} />
                    </div>
                  </div>
                  <div className="relative z-10 h-1.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm sm:h-2">
                    <div
                      className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${myDayProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Desktop: Stats Cards */}
              <div className="hidden lg:block lg:space-y-4 lg:mb-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 text-sm dark:text-slate-400">
                      Pendentes
                    </span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {
                      displayMyTasks.filter((t) => t.status !== "completed")
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 text-sm dark:text-slate-400">
                      Concluídas
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {
                      displayMyTasks.filter((t) => t.status === "completed")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Task List */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Tab Navigation */}
              <div className="mb-4 flex gap-2 lg:mb-6">
                {[
                  { key: "pending", label: "Pendentes", icon: Clock },
                  { key: "completed", label: "Concluídas", icon: CheckCircle2 },
                  { key: "all", label: "Todas", icon: Target },
                ].map((tab) => (
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors lg:flex-none lg:px-6 lg:py-3 ${
                      activeTab === tab.key
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                    key={tab.key}
                    onClick={() =>
                      setActiveTab(tab.key as "pending" | "completed" | "all")
                    }
                    type="button"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* My Tasks List - Grid on desktop */}
              <div className="space-y-2 sm:space-y-3 lg:grid lg:grid-cols-1 xl:grid-cols-2 lg:gap-4 lg:space-y-0">
                {displayMyTasks.length === 0 && (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-6 text-center sm:mt-12 sm:rounded-3xl sm:p-8 lg:col-span-2 lg:mt-0 lg:p-12 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-16 sm:w-16 lg:h-20 lg:w-20 dark:bg-slate-800 dark:text-slate-600">
                      <Trophy size={32} />
                    </div>
                    <h4 className="mb-1 font-bold text-sm text-slate-700 sm:text-base lg:text-lg dark:text-slate-300">
                      {activeTab === "pending"
                        ? "Nenhuma tarefa pendente"
                        : activeTab === "completed"
                        ? "Nenhuma tarefa concluída"
                        : "Nenhuma tarefa encontrada"}
                    </h4>
                    <p className="max-w-[200px] text-slate-400 text-[11px] sm:text-xs lg:max-w-none lg:text-sm dark:text-slate-500">
                      {activeTab === "pending"
                        ? "Crie uma nova tarefa para sua rotina."
                        : "Nenhuma tarefa neste período."}
                    </p>
                  </div>
                )}

                {displayMyTasks.map((task, index) => {
                  const styles = getPriorityStyles(task.priority);
                  const taskDate = task.dueDate ? new Date(task.dueDate) : null;
                  const displayDate =
                    viewMode !== "day" && taskDate
                      ? `${taskDate.getDate()}/${taskDate.getMonth() + 1}`
                      : null;

                  return (
                    <div
                      className={`group slide-in-from-bottom-2 relative flex animate-in flex-col rounded-xl border-t border-r border-b border-l-4 bg-white fill-mode-backwards p-3 transition-all duration-300 sm:rounded-2xl sm:border-l-[6px] sm:p-4 lg:hover:scale-[1.02] dark:bg-slate-800 ${
                        task.status === "completed"
                          ? "border-slate-200 border-l-emerald-500 opacity-60 dark:border-slate-700 dark:border-l-emerald-600"
                          : `${styles.border} border-slate-100 shadow-sm lg:shadow-md lg:hover:shadow-lg dark:border-slate-700`
                      }`}
                      key={task.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-center gap-3 sm:gap-4">
                          <button
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all sm:h-8 sm:w-8 lg:h-9 lg:w-9 ${
                              task.status === "completed"
                                ? "scale-110 border-emerald-500 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 dark:border-slate-600 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20"
                            }`}
                            disabled={completeMyTaskMutation.isPending}
                            onClick={() => handleCompleteTask(task)}
                            type="button"
                          >
                            {task.status === "completed" && (
                              <Check
                                className="stroke-[3] text-white"
                                size={14}
                              />
                            )}
                          </button>

                          <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-bold text-sm sm:text-base lg:text-base ${
                                  task.status === "completed"
                                    ? "text-slate-400 line-through dark:text-slate-600"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {task.title}
                              </span>
                              {displayDate && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                  {displayDate}
                                </span>
                              )}
                              {task.isRecurring && task.frequency && (
                                <span className="flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-[10px] text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <Repeat size={10} />
                                  {task.frequency === "daily"
                                    ? "Diário"
                                    : task.frequency === "weekly"
                                    ? "Semanal"
                                    : task.frequency === "biweekly"
                                    ? "Quinzenal"
                                    : "Mensal"}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="mt-1 text-slate-500 text-xs dark:text-slate-400">
                                {task.description}
                              </p>
                            )}

                            {task.status !== "completed" && (
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`flex items-center gap-1 font-extrabold text-[10px] uppercase tracking-wider ${styles.text}`}
                                >
                                  <Flag fill="currentColor" size={10} />
                                  {task.priority === "high"
                                    ? "Alta"
                                    : task.priority === "medium"
                                    ? "Média"
                                    : "Baixa"}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {getTaskTypeLabel(task.type)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-center">
                          <button
                            className="rounded-lg p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            onClick={() =>
                              deleteMyTaskMutation.mutate({ id: task.id })
                            }
                            title="Excluir tarefa"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* PATIENTS VIEW */}
      {mainView === "patients" && selectedPatientId ? (
        <>
          {/* Desktop Layout: 2 columns */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Column - Calendar & Controls */}
            <div className="lg:col-span-4 xl:col-span-3">
              {/* View Mode Selector */}
              <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-3 lg:mb-6">
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "day"
                      ? "ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("day")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <CalendarIcon className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Hoje
                    </span>
                  </div>
                </button>
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "week"
                      ? "ring-2 ring-rose-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("week")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <Repeat className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Semana
                    </span>
                  </div>
                </button>
                <button
                  className={`group relative aspect-square overflow-hidden rounded-xl p-3 transition-all duration-300 sm:rounded-2xl sm:p-4 lg:aspect-auto lg:py-4 ${
                    viewMode === "month"
                      ? "ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => setViewMode("month")}
                  type="button"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-violet-600" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-1.5 text-white sm:gap-2">
                    <Target className="h-5 w-5 sm:h-7 sm:w-7 lg:h-5 lg:w-5" />
                    <span className="font-semibold text-[9px] sm:text-xs lg:text-sm">
                      Mês
                    </span>
                  </div>
                </button>
              </div>

              {/* Date Navigation Card */}
              <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:mb-6 sm:rounded-2xl lg:mb-6 lg:p-2 dark:border-slate-800 dark:bg-slate-900">
                <button
                  className="touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-violet-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                  onClick={() => changeDate(-1)}
                  type="button"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider sm:text-xs">
                    {viewMode === "day"
                      ? "Dia"
                      : viewMode === "week"
                      ? "Semana"
                      : "Mês"}
                  </span>
                  <div className="flex items-center gap-2 text-center font-bold text-base text-slate-800 sm:text-lg dark:text-white">
                    {formatDisplayDate(selectedDate)}
                  </div>
                </div>
                <button
                  className="touch-target rounded-lg p-2.5 text-slate-400 transition-colors active:scale-95 hover:bg-slate-50 hover:text-violet-600 sm:rounded-xl sm:p-3 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                  onClick={() => changeDate(1)}
                  type="button"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Progress Card */}
              {showProgressBar && (
                <div className="fade-in slide-in-from-top-4 relative mb-6 animate-in overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 p-4 text-white shadow-lg shadow-violet-200 sm:mb-8 sm:rounded-3xl sm:p-5 lg:mb-6 dark:shadow-none">
                  <div className="-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32" />

                  <div className="relative z-10 mb-2 flex items-end justify-between">
                    <div>
                      <p className="mb-1 font-bold text-violet-100 text-[10px] uppercase tracking-wider sm:text-xs">
                        Progresso de {selectedPatient?.name?.split(" ")[0]}
                      </p>
                      <h3 className="font-bold text-xl sm:text-2xl lg:text-xl">
                        {dayProgress}% Concluído
                      </h3>
                    </div>
                    <div className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm sm:rounded-xl sm:p-2">
                      <Target className="text-white" size={20} />
                    </div>
                  </div>

                  <div className="relative z-10 h-1.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm sm:h-2">
                    <div
                      className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${dayProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Desktop: Stats Cards */}
              <div className="hidden lg:block lg:space-y-4 lg:mb-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 text-sm dark:text-slate-400">
                      Pendentes
                    </span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {
                      displayTasks.filter((t) => t.status !== "completed")
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 text-sm dark:text-slate-400">
                      Concluídas
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-violet-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {
                      displayTasks.filter((t) => t.status === "completed")
                        .length
                    }
                  </p>
                </div>
              </div>

              {/* AI Suggestions - Desktop: Show in sidebar */}
              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="mb-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 lg:mb-0 dark:from-purple-900/20 dark:to-indigo-900/20">
                  <button
                    className="flex w-full items-center justify-between"
                    onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-slate-800 text-sm lg:text-base dark:text-slate-200">
                        Sugestões da IA
                      </h3>
                    </div>
                    {showAiSuggestions ? (
                      <ChevronUp className="h-5 w-5 text-slate-500 transition-transform dark:text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500 transition-transform dark:text-slate-400" />
                    )}
                  </button>
                  {showAiSuggestions && (
                    <div className="mt-3 space-y-2">
                      {aiSuggestions.slice(0, 3).map((suggestion, idx) => (
                        <div
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                          key={idx}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm dark:text-slate-200">
                              {suggestion.title}
                            </p>
                            <p className="text-slate-500 text-xs dark:text-slate-400">
                              {suggestion.description}
                            </p>
                          </div>
                          <button
                            className="ml-3 rounded-lg bg-purple-100 p-2 text-purple-600 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
                            onClick={() => handleUseSuggestion(suggestion)}
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Task List */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Tab Navigation */}
              <div className="mb-4 flex gap-2 lg:mb-6">
                {[
                  { key: "pending", label: "Pendentes", icon: Clock },
                  { key: "completed", label: "Concluídas", icon: CheckCircle2 },
                  { key: "all", label: "Todas", icon: Target },
                ].map((tab) => (
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors lg:flex-none lg:px-6 lg:py-3 ${
                      activeTab === tab.key
                        ? "bg-violet-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                    key={tab.key}
                    onClick={() =>
                      setActiveTab(tab.key as "pending" | "completed" | "all")
                    }
                    type="button"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tasks List - Grid on desktop */}
              <div className="space-y-2 sm:space-y-3 lg:grid lg:grid-cols-1 xl:grid-cols-2 lg:gap-4 lg:space-y-0">
                {displayTasks.length === 0 && (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-6 text-center sm:mt-12 sm:rounded-3xl sm:p-8 lg:col-span-2 lg:mt-0 lg:p-12 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300 sm:mb-4 sm:h-16 sm:w-16 lg:h-20 lg:w-20 dark:bg-slate-800 dark:text-slate-600">
                      <Trophy size={32} />
                    </div>
                    <h4 className="mb-1 font-bold text-sm text-slate-700 sm:text-base lg:text-lg dark:text-slate-300">
                      {activeTab === "pending"
                        ? "Nenhuma tarefa pendente"
                        : activeTab === "completed"
                        ? "Nenhuma tarefa concluída"
                        : "Nenhuma tarefa encontrada"}
                    </h4>
                    <p className="max-w-[200px] text-slate-400 text-[11px] sm:text-xs lg:max-w-none lg:text-sm dark:text-slate-500">
                      {activeTab === "pending"
                        ? "Crie uma nova tarefa para o paciente."
                        : "Nenhuma tarefa neste período."}
                    </p>
                  </div>
                )}

                {displayTasks.map((task, index) => {
                  const styles = getPriorityStyles(task.priority);
                  const taskDate = task.dueDate ? new Date(task.dueDate) : null;
                  const displayDate =
                    viewMode !== "day" && taskDate
                      ? `${taskDate.getDate()}/${taskDate.getMonth() + 1}`
                      : null;

                  return (
                    <div
                      className={`group slide-in-from-bottom-2 relative flex animate-in flex-col rounded-xl border-t border-r border-b border-l-4 bg-white fill-mode-backwards p-3 transition-all duration-300 sm:rounded-2xl sm:border-l-[6px] sm:p-4 lg:hover:scale-[1.02] dark:bg-slate-800 ${
                        task.status === "completed"
                          ? "border-slate-200 border-l-slate-300 opacity-60 grayscale-[0.5] dark:border-slate-700 dark:border-l-slate-600"
                          : `${styles.border} border-slate-100 shadow-sm lg:shadow-md lg:hover:shadow-lg dark:border-slate-700`
                      }`}
                      key={task.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-center gap-3 sm:gap-4">
                          <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-bold text-sm sm:text-base lg:text-base ${
                                  task.status === "completed"
                                    ? "text-slate-400 line-through dark:text-slate-600"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {task.title}
                              </span>
                              {displayDate && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                  {displayDate}
                                </span>
                              )}
                              {task.frequency && task.frequency !== "once" && (
                                <span className="flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 font-bold text-[10px] text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                  <Repeat size={10} />
                                  {task.frequency === "daily"
                                    ? "Diário"
                                    : task.frequency === "weekly"
                                    ? "Semanal"
                                    : task.frequency === "biweekly"
                                    ? "Quinzenal"
                                    : "Mensal"}
                                </span>
                              )}
                            </div>

                            {task.description && (
                              <p className="mt-1 text-slate-500 text-xs dark:text-slate-400">
                                {task.description}
                              </p>
                            )}

                            {task.status !== "completed" && (
                              <div className="mt-1 flex items-center gap-2">
                                <span
                                  className={`flex items-center gap-1 font-extrabold text-[10px] uppercase tracking-wider ${styles.text}`}
                                >
                                  <Flag fill="currentColor" size={10} />
                                  {task.priority === "high"
                                    ? "Alta"
                                    : task.priority === "medium"
                                    ? "Média"
                                    : "Baixa"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-center">
                          {task.status === "completed" && !task.feedback && (
                            <button
                              className="rounded-lg bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                              onClick={() => setShowFeedbackForm(task.id)}
                              title="Enviar feedback"
                              type="button"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="rounded-lg p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            onClick={() =>
                              deleteTaskMutation.mutate({ taskId: task.id })
                            }
                            title="Excluir tarefa"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Feedback Form */}
                      {showFeedbackForm === task.id && (
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                          <label
                            className="mb-2 block font-medium text-slate-700 text-sm dark:text-slate-300"
                            htmlFor={`feedback-${task.id}`}
                          >
                            Feedback para o paciente
                          </label>
                          <textarea
                            className="mb-3 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:focus:ring-violet-900/30"
                            id={`feedback-${task.id}`}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Parabéns pelo progresso! Continue assim..."
                            rows={3}
                            value={feedbackText}
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2 font-medium text-white transition-colors hover:bg-violet-700"
                              disabled={sendFeedbackMutation.isPending}
                              onClick={() => handleSendFeedback(task.id)}
                              type="button"
                            >
                              <Send className="h-4 w-4" />
                              Enviar
                            </button>
                            <button
                              className="rounded-xl bg-slate-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200"
                              onClick={() => {
                                setShowFeedbackForm(null);
                                setFeedbackText("");
                              }}
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Existing Feedback */}
                      {task.feedback && (
                        <div className="mt-4 rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20">
                          <p className="mb-1 font-medium text-violet-700 text-xs dark:text-violet-300">
                            Seu feedback:
                          </p>
                          <p className="text-violet-600 text-sm dark:text-violet-400">
                            {task.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : mainView === "patients" ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50/50 p-8 text-center sm:mt-12 sm:rounded-3xl sm:p-12 lg:p-16 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-500 lg:h-20 lg:w-20 dark:bg-violet-900/30">
            <Target size={32} />
          </div>
          <h3 className="mb-2 font-bold text-lg text-slate-700 lg:text-xl dark:text-slate-300">
            Selecione um Paciente
          </h3>
          <p className="max-w-[250px] text-slate-400 text-sm lg:max-w-none lg:text-base dark:text-slate-500">
            Escolha um paciente acima para visualizar e gerenciar suas tarefas
          </p>
        </div>
      ) : null}

      {/* Add Task Form Modal for Patient Tasks */}
      {showTaskForm && mainView === "patients" && selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="zoom-in-95 fade-in animate-in w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="relative bg-gradient-to-r from-violet-500 to-fuchsia-600 p-6 text-white">
              <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10" />
              <h3 className="font-bold text-xl">Nova Tarefa</h3>
              <p className="text-violet-100 text-sm">
                Para {selectedPatient?.name}
              </p>
            </div>

            <form
              className="p-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTask();
              }}
            >
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label
                    className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                    htmlFor="task-title"
                  >
                    Título *
                  </label>
                  <input
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-900/30"
                    id="task-title"
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    placeholder="Ex: Praticar respiração consciente"
                    required
                    type="text"
                    value={taskForm.title}
                  />
                </div>

                {/* Date and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                      htmlFor="task-due-date"
                    >
                      <CalendarIcon className="mb-0.5 inline h-3 w-3" /> Data
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      id="task-due-date"
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      type="date"
                      value={taskForm.dueDate || ""}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                      <Flag className="mb-0.5 inline h-3 w-3" /> Prioridade
                    </label>
                    <div className="flex gap-1">
                      {(["low", "medium", "high"] as const).map((p) => (
                        <button
                          className={`flex-1 rounded-lg border-2 py-2 font-bold text-[10px] uppercase transition-all ${
                            taskForm.priority === p
                              ? p === "high"
                                ? "border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20"
                                : p === "medium"
                                ? "border-orange-500 bg-orange-50 text-orange-500 dark:bg-orange-900/20"
                                : "border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                              : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                          }`}
                          key={p}
                          onClick={() =>
                            setTaskForm({ ...taskForm, priority: p })
                          }
                          type="button"
                        >
                          {p === "low"
                            ? "Baixa"
                            : p === "medium"
                            ? "Média"
                            : "Alta"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                    <Repeat className="mb-0.5 inline h-3 w-3" /> Frequência
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["once", "daily", "weekly"] as const).map((freq) => (
                      <button
                        className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                          taskForm.frequency === freq
                            ? "border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                            : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                        }`}
                        key={freq}
                        onClick={() =>
                          setTaskForm({ ...taskForm, frequency: freq })
                        }
                        type="button"
                      >
                        {freq === "once"
                          ? "Uma vez"
                          : freq === "daily"
                          ? "Diário"
                          : "Semanal"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  <p className="text-amber-700 text-xs dark:text-amber-400">
                    A tarefa será atribuída a{" "}
                    <strong>{selectedPatient?.name}</strong> e aparecerá na
                    rotina dele(a).
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  onClick={() => {
                    setShowTaskForm(false);
                    setTaskForm(defaultTaskForm);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  disabled={createTaskMutation.isPending || !taskForm.title}
                  type="submit"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Criar Tarefa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Form Modal for My Routine */}
      {showTaskForm && mainView === "my-routine" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="zoom-in-95 fade-in animate-in w-full max-w-md max-h-[90vh] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div
              className={`relative p-6 text-white ${
                taskForm.taskCategory === "sessao"
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-600"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600"
              }`}
            >
              <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10" />
              <h3 className="font-bold text-xl">Nova Tarefa</h3>
              <p
                className={`text-sm ${
                  taskForm.taskCategory === "sessao"
                    ? "text-violet-100"
                    : "text-emerald-100"
                }`}
              >
                {taskForm.taskCategory === "sessao"
                  ? `Sessão${
                      selectedSessionPatient
                        ? ` com ${selectedSessionPatient.name}`
                        : ""
                    }`
                  : "Para sua rotina pessoal"}
              </p>
            </div>

            <form
              className="p-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTask();
              }}
            >
              <div className="space-y-4">
                {/* TIPO DE TAREFA - SEMPRE NO TOPO */}
                <div>
                  <label className="mb-2 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                    <Target className="mb-0.5 inline h-3 w-3" /> Tipo de Tarefa
                    *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold transition-all ${
                        taskForm.taskCategory === "geral"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          taskCategory: "geral",
                          sessionPatientId: undefined,
                          priority: "medium",
                        })
                      }
                      type="button"
                    >
                      <Target className="mb-2 h-6 w-6" />
                      <span className="text-sm">Geral</span>
                      <span className="mt-1 font-normal text-[10px] opacity-70">
                        Tarefas pessoais
                      </span>
                    </button>
                    <button
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 font-bold transition-all ${
                        taskForm.taskCategory === "sessao"
                          ? "border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          taskCategory: "sessao",
                          priority: "high", // Sessão sempre alta prioridade
                          type: "session",
                        })
                      }
                      type="button"
                    >
                      <Users className="mb-2 h-6 w-6" />
                      <span className="text-sm">Sessão</span>
                      <span className="mt-1 font-normal text-[10px] opacity-70">
                        Com paciente
                      </span>
                    </button>
                  </div>
                </div>

                {/* CAMPOS APARECEM APENAS APÓS SELECIONAR TIPO */}
                {taskForm.taskCategory && (
                  <>
                    {/* BUSCA DE PACIENTE - APENAS PARA SESSÃO */}
                    {taskForm.taskCategory === "sessao" && (
                      <div>
                        <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <User className="mb-0.5 inline h-3 w-3" /> Paciente *
                        </label>
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-3 pl-10 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-900/30"
                              onChange={(e) => {
                                setPatientSearchQuery(e.target.value);
                                setShowPatientDropdown(true);
                              }}
                              onFocus={() => setShowPatientDropdown(true)}
                              placeholder="Buscar paciente pelo nome..."
                              type="text"
                              value={
                                selectedSessionPatient
                                  ? selectedSessionPatient.name || ""
                                  : patientSearchQuery
                              }
                            />
                            {selectedSessionPatient && (
                              <button
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
                                onClick={() => {
                                  setTaskForm({
                                    ...taskForm,
                                    sessionPatientId: undefined,
                                  });
                                  setPatientSearchQuery("");
                                }}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Dropdown de pacientes */}
                          {showPatientDropdown && !selectedSessionPatient && (
                            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              {filteredPatients.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                  Nenhum paciente encontrado
                                </div>
                              ) : (
                                filteredPatients.map((patient) => (
                                  <button
                                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                                    key={patient.id}
                                    onClick={() => {
                                      setTaskForm({
                                        ...taskForm,
                                        sessionPatientId: patient.id,
                                      });
                                      setPatientSearchQuery("");
                                      setShowPatientDropdown(false);
                                    }}
                                    type="button"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-semibold text-white text-sm">
                                      {patient.name?.charAt(0) || "P"}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-800 text-sm dark:text-slate-200">
                                        {patient.name}
                                      </p>
                                      <p className="text-slate-500 text-xs dark:text-slate-400">
                                        {patient.email}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Title - apenas para tarefas gerais, sessões têm título automático */}
                    {taskForm.taskCategory === "geral" && (
                      <div>
                        <label
                          className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                          htmlFor="my-task-title"
                        >
                          Título *
                        </label>
                        <input
                          autoFocus
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-emerald-900/30"
                          id="my-task-title"
                          onChange={(e) =>
                            setTaskForm({ ...taskForm, title: e.target.value })
                          }
                          placeholder="Ex: Revisar relatórios semanais"
                          required
                          type="text"
                          value={taskForm.title}
                        />
                      </div>
                    )}

                    {/* Date - APENAS PARA SESSÃO */}
                    {taskForm.taskCategory === "sessao" && (
                      <div>
                        <label
                          className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                          htmlFor="my-task-due-date"
                        >
                          <CalendarIcon className="mb-0.5 inline h-3 w-3" />{" "}
                          Data
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                          id="my-task-due-date"
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              dueDate: e.target.value,
                            })
                          }
                          type="date"
                          value={taskForm.dueDate || ""}
                        />
                      </div>
                    )}

                    {/* Priority - APENAS PARA GERAL (sessão é sempre alta) */}
                    {taskForm.taskCategory === "geral" && (
                      <div>
                        <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <Flag className="mb-0.5 inline h-3 w-3" /> Prioridade
                        </label>
                        <div className="flex gap-1">
                          {(["low", "medium", "high"] as const).map((p) => (
                            <button
                              className={`flex-1 rounded-lg border-2 py-2 font-bold text-[10px] uppercase transition-all ${
                                taskForm.priority === p
                                  ? p === "high"
                                    ? "border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20"
                                    : p === "medium"
                                    ? "border-orange-500 bg-orange-50 text-orange-500 dark:bg-orange-900/20"
                                    : "border-blue-500 bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                                  : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                              }`}
                              key={p}
                              onClick={() =>
                                setTaskForm({ ...taskForm, priority: p })
                              }
                              type="button"
                            >
                              {p === "low"
                                ? "Baixa"
                                : p === "medium"
                                ? "Média"
                                : "Alta"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frequency - PARA GERAL */}
                    {taskForm.taskCategory === "geral" && (
                      <div>
                        <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <Repeat className="mb-0.5 inline h-3 w-3" />{" "}
                          Frequência
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              { key: "once", label: "Uma Vez" },
                              { key: "daily", label: "Diário" },
                              { key: "weekly", label: "Semanal" },
                              { key: "monthly", label: "Mensal" },
                            ] as const
                          ).map((freq) => (
                            <button
                              className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                                taskForm.frequency === freq.key
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                              }`}
                              key={freq.key}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  frequency: freq.key,
                                  weekDays: [],
                                  monthDays: [],
                                })
                              }
                              type="button"
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>

                        {/* Seleção de dias da semana para frequência semanal */}
                        {taskForm.frequency === "weekly" && (
                          <div className="mt-3">
                            <p className="mb-2 text-slate-500 text-xs dark:text-slate-400">
                              Selecione os dias da semana:
                            </p>
                            <div className="grid grid-cols-7 gap-1">
                              {["D", "S", "T", "Q", "Q", "S", "S"].map(
                                (day, index) => {
                                  const isSelected =
                                    taskForm.weekDays?.includes(index);
                                  return (
                                    <button
                                      className={`aspect-square rounded-lg border-2 font-bold text-xs transition-all ${
                                        isSelected
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
                                      }`}
                                      key={index}
                                      onClick={() => {
                                        const currentDays =
                                          taskForm.weekDays || [];
                                        const newDays = isSelected
                                          ? currentDays.filter(
                                              (d) => d !== index
                                            )
                                          : [...currentDays, index].sort(
                                              (a, b) => a - b
                                            );
                                        setTaskForm({
                                          ...taskForm,
                                          weekDays: newDays,
                                        });
                                      }}
                                      type="button"
                                    >
                                      {day}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {/* Seleção de dias do mês para frequência mensal */}
                        {taskForm.frequency === "monthly" && (
                          <div className="mt-3">
                            <p className="mb-2 text-slate-500 text-xs dark:text-slate-400">
                              Selecione os dias do mês:
                            </p>
                            <div className="grid grid-cols-7 gap-1">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(
                                (day) => {
                                  const isSelected =
                                    taskForm.monthDays?.includes(day);
                                  return (
                                    <button
                                      className={`aspect-square rounded-lg border-2 font-bold text-xs transition-all ${
                                        isSelected
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
                                      }`}
                                      key={day}
                                      onClick={() => {
                                        const currentDays =
                                          taskForm.monthDays || [];
                                        const newDays = isSelected
                                          ? currentDays.filter((d) => d !== day)
                                          : [...currentDays, day].sort(
                                              (a, b) => a - b
                                            );
                                        setTaskForm({
                                          ...taskForm,
                                          monthDays: newDays,
                                        });
                                      }}
                                      type="button"
                                    >
                                      {day}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sessão mostra que prioridade é alta automaticamente */}
                    {taskForm.taskCategory === "sessao" && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
                        <Flag
                          className="h-4 w-4 text-red-500"
                          fill="currentColor"
                        />
                        <span className="font-medium text-red-600 text-sm dark:text-red-400">
                          Prioridade Alta (automático para sessões)
                        </span>
                      </div>
                    )}

                    {/* Frequency - APENAS PARA SESSÃO */}
                    {taskForm.taskCategory === "sessao" && (
                      <div>
                        <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <Repeat className="mb-0.5 inline h-3 w-3" />{" "}
                          Frequência
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { key: "weekly", label: "Semanal" },
                              { key: "biweekly", label: "Quinzenal" },
                              { key: "monthly", label: "Mensal" },
                            ] as const
                          ).map((freq) => (
                            <button
                              className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                                taskForm.frequency === freq.key
                                  ? "border-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                                  : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                              }`}
                              key={freq.key}
                              onClick={() =>
                                setTaskForm({
                                  ...taskForm,
                                  frequency: freq.key,
                                })
                              }
                              type="button"
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warning para sessão */}
                    {taskForm.taskCategory === "sessao" &&
                      selectedSessionPatient && (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                          <p className="text-amber-700 text-xs dark:text-amber-400">
                            {taskForm.frequency === "weekly"
                              ? "Serão criadas sessões semanais no mês selecionado na rotina de "
                              : taskForm.frequency === "biweekly"
                              ? "Serão criadas sessões quinzenais no mês selecionado na rotina de "
                              : taskForm.frequency === "monthly"
                              ? "Será criada 1 sessão mensal na rotina de "
                              : "A tarefa será adicionada na rotina de "}
                            <strong>{selectedSessionPatient.name}</strong>
                            {taskForm.frequency &&
                            taskForm.frequency !== "once" &&
                            taskForm.frequency !== "monthly"
                              ? " sempre no mesmo dia da semana."
                              : "."}
                          </p>
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 rounded-xl py-3 font-bold text-slate-500 text-sm transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  onClick={() => {
                    setShowTaskForm(false);
                    setTaskForm(defaultTaskForm);
                    setPatientSearchQuery("");
                    setShowPatientDropdown(false);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm text-white shadow-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                    taskForm.taskCategory === "sessao"
                      ? "bg-violet-600"
                      : "bg-emerald-600"
                  }`}
                  disabled={
                    createMyTaskMutation.isPending ||
                    !taskForm.taskCategory ||
                    (taskForm.taskCategory === "geral" && !taskForm.title) ||
                    (taskForm.taskCategory === "sessao" &&
                      !taskForm.sessionPatientId)
                  }
                  type="submit"
                >
                  {createMyTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Criar Tarefa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="mb-4 flex items-center gap-3 text-amber-500">
              <AlertTriangle size={28} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {alertTitle}
              </h3>
            </div>
            <p className="mb-6 whitespace-pre-line text-slate-600 dark:text-slate-300">
              {alertMessage}
            </p>
            <button
              className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900"
              onClick={() => setShowAlert(false)}
              type="button"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
