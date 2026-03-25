"use client";

import {
  AlertTriangle,
  Banknote,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Flag,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Target,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import AgendaSidebar from "@/components/therapist/AgendaSidebar";
import Calendar from "@/components/therapist/Calendar";
import { trpc } from "@/lib/trpc/client";

type TaskFormData = {
  title: string;
  frequency: "once" | "daily" | "weekly" | "biweekly" | "monthly";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  type?:
    | "feedback"
    | "session"
    | "review_records"
    | "create_plan"
    | "approve_reward"
    | "custom";
  taskCategory?: "geral" | "sessao";
  sessionPatientId?: string | undefined | null;
  weekDays?: number[];
  monthDay?: number;
  monthDays?: number[];
  sessionValue?: number;
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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormData>(defaultTaskForm);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("Atenção");

  const { data: patients } = trpc.patient.getAll.useQuery();
  const { data: myTasks } = trpc.therapistTasks.getAll.useQuery();

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!patientSearchQuery.trim()) return patients;
    const query = patientSearchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query),
    );
  }, [patients, patientSearchQuery]);

  const selectedSessionPatient = useMemo(() => {
    if (!taskForm.sessionPatientId) return null;
    if (!patients) return null;
    return patients.find((p) => p.id === taskForm.sessionPatientId);
  }, [patients, taskForm.sessionPatientId]);

  const utils = trpc.useUtils();

  const createMyTaskMutation = trpc.therapistTasks.create.useMutation({
    onMutate: async (newOne) => {
      await utils.therapistTasks.getAll.cancel();
      const previousMyTasks = utils.therapistTasks.getAll.getData();

      utils.therapistTasks.getAll.setData(undefined, (old) => {
        if (!old) return [];
        const tempId = Math.random().toString();
        const optimisticTask = {
          id: tempId,
          therapistId: "me",
          title: newOne.title,
          description: newOne.description || null,
          type: newOne.type,
          priority: newOne.priority ?? "medium",
          status: "pending",
          dueDate: newOne.dueDate
            ? (() => {
                const [y, m, d] = newOne.dueDate.split("-").map(Number);
                return new Date(y, m - 1, d, 12, 0, 0, 0);
              })()
            : null,
          isRecurring: newOne.isRecurring,
          frequency: newOne.frequency || null,
          xpReward: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
          weekDays: newOne.weekDays || null,
          completedAt: null,
          feedback: null,
          feedbackAt: null,
          monthDay: newOne.monthDay || null,
          monthDays: newOne.monthDays || null,
          isAiGenerated: false,
          isAiSuggested: false,
          metadata: null,
        };
        // biome-ignore lint/suspicious/noExplicitAny: Optimistic update com tipo temporário
        return [...old, optimisticTask as any];
      });

      return { previousMyTasks };
    },
    onSuccess: () => {
      setShowTaskForm(false);
      setTaskForm(defaultTaskForm);
      setPatientSearchQuery("");
      setShowPatientDropdown(false);
      utils.therapistXp.getStats.invalidate();
    },
    onError: (error, _newOne, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks);
      }
      if (error.message.includes("Limite")) {
        setAlertTitle("Limite de Tarefas");
      } else {
        setAlertTitle("Atenção");
      }
      setAlertMessage(error.message);
      setShowAlert(true);
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate();
    },
  });

  const completeMyTaskMutation = trpc.therapistTasks.complete.useMutation({
    onMutate: async (vars) => {
      await utils.therapistTasks.getAll.cancel();
      const previousMyTasks = utils.therapistTasks.getAll.getData();

      utils.therapistTasks.getAll.setData(undefined, (old) => {
        if (!old) return [];
        return old.map((t) => {
          if (t.id === vars.id) {
            const newStatus =
              t.status === "completed" ? "pending" : "completed";
            return { ...t, status: newStatus };
          }
          return t;
        });
      });
      return { previousMyTasks };
    },
    onSuccess: () => {
      utils.therapistXp.getStats.invalidate();
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks);
      }
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate();
    },
  });

  const deleteMyTaskMutation = trpc.therapistTasks.delete.useMutation({
    onMutate: async (vars) => {
      await utils.therapistTasks.getAll.cancel();
      const previousMyTasks = utils.therapistTasks.getAll.getData();

      utils.therapistTasks.getAll.setData(undefined, (old) =>
        old ? old.filter((t) => t.id !== vars.id) : [],
      );
      return { previousMyTasks };
    },
    onError: (err, _, context) => {
      if (context?.previousMyTasks) {
        utils.therapistTasks.getAll.setData(undefined, context.previousMyTasks);
      }
      setAlertTitle("Erro ao excluir");
      setAlertMessage(err.message);
      setShowAlert(true);
    },
    onSettled: () => {
      utils.therapistTasks.getAll.invalidate();
    },
  });

  const changeDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const displayMyTasks = useMemo(() => {
    if (!myTasks) return [];
    return myTasks.filter((task) => {
      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const taskDay = new Date(taskDate);
        taskDay.setHours(0, 0, 0, 0);
        const selectedDay = new Date(selectedDate);
        selectedDay.setHours(0, 0, 0, 0);
        return taskDay.getTime() === selectedDay.getTime();
      }

      return task.isRecurring || !task.dueDate;
    });
  }, [myTasks, selectedDate]);

  const dayProgress = useMemo(() => {
    if (!myTasks || myTasks.length === 0) return 0;
    const completedCount = myTasks.filter(
      (t) => t.status === "completed",
    ).length;
    return Math.round((completedCount / myTasks.length) * 100);
  }, [myTasks]);

  const showProgressBar =
    displayMyTasks && displayMyTasks.length > 0 && dayProgress < 100;

  const handleCreateTask = () => {
    if (taskForm.dueDate && taskForm.taskCategory !== "sessao") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [year, month, day] = taskForm.dueDate.split("-").map(Number);
      const selectedTaskDate = new Date(year, month - 1, day, 12, 0, 0, 0);
      const todayAtMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0,
      );

      if (selectedTaskDate < todayAtMidnight) {
        const dateStr = selectedTaskDate.toLocaleDateString("pt-BR");
        setAlertMessage(
          `Data inválida!\n\nNão é possível criar tarefas para datas que já passaram.\n\nData selecionada: ${dateStr}`,
        );
        setAlertTitle("Data no Passado");
        setShowAlert(true);
        return;
      }
    }

    if (
      taskForm.taskCategory === "sessao" &&
      (taskForm.frequency === "weekly" || taskForm.frequency === "biweekly") &&
      !taskForm.weekDays?.length
    ) {
      setAlertMessage("Por favor, selecione o dia da semana para a sessão.");
      setAlertTitle("Dia da Semana");
      setShowAlert(true);
      return;
    }

    if (
      taskForm.taskCategory === "sessao" &&
      taskForm.frequency === "once" &&
      !taskForm.dueDate
    ) {
      setAlertMessage("Por favor, selecione a data para a sessão.");
      setAlertTitle("Data da Sessão");
      setShowAlert(true);
      return;
    }

    if (!taskForm.taskCategory) return;
    if (taskForm.taskCategory === "sessao" && !taskForm.sessionPatientId)
      return;
    if (taskForm.taskCategory === "geral" && !taskForm.title) return;

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
          : (taskForm.frequency as "daily" | "weekly" | "biweekly"),
      taskCategory: taskForm.taskCategory,
      patientId:
        taskForm.sessionPatientId === null
          ? undefined
          : taskForm.sessionPatientId,
      weekDays: taskForm.weekDays,
      monthDay: taskForm.monthDay,
      sessionValue: taskForm.sessionValue,
    });
  };

  const handleCompleteTask = (task: {
    id: string;
    dueDate?: Date | string | null;
    status: string;
    category?: string;
  }) => {
    if (task.status !== "completed") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (task.dueDate) {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (taskDate.getTime() > today.getTime()) {
          setAlertMessage(
            "Calma lá!\n\nVocê não pode concluir uma tarefa agendada para o futuro. Aguarde o dia correto para realizá-la.",
          );
          setAlertTitle("Tarefa Futura");
          setShowAlert(true);
          return;
        }
      }
    }

    completeMyTaskMutation.mutate({ id: task.id });
  };

  const calendarTasks = (myTasks || []).filter(
    (task) => task.dueDate !== null,
  ) as Array<{
    dueDate: Date | string;
    id?: string;
    type?: string;
    priority?: string;
  }>;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 p-4 pt-safe sm:p-6 lg:p-5 dark:bg-slate-900">
      {/* Desktop Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Minha Rotina
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie suas tarefas
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            className="touch-target group rounded-xl bg-sky-600 p-2.5 text-white shadow-lg shadow-sky-200 transition-all active:scale-95 hover:bg-sky-700 sm:rounded-2xl sm:p-3 lg:flex lg:items-center lg:gap-2 lg:px-5 lg:py-3 sm:hover:scale-105 dark:shadow-none"
            onClick={() => {
              setShowTaskForm(!showTaskForm);
              const today = new Date();
              const yyyy = today.getFullYear();
              const mm = String(today.getMonth() + 1).padStart(2, "0");
              const dd = String(today.getDate()).padStart(2, "0");
              const dateString = `${yyyy}-${mm}-${dd}`;

              setTaskForm({
                ...defaultTaskForm,
                dueDate: dateString,
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
        </div>
      </div>

      {/* MY ROUTINE VIEW */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop Layout: 2 columns - Calendar on left, Agenda on right */}
        <div className="flex flex-col h-full lg:grid lg:grid-cols-12 lg:gap-5 overflow-hidden">
          {/* Left Column - Calendar */}
          <div className="flex flex-col gap-4 overflow-y-auto lg:col-span-4 xl:col-span-4">
            {/* Progress Card */}
            {showProgressBar && (
              <div className="mb-3 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-lg sm:rounded-3xl lg:mb-4 dark:shadow-none">
                <div className="-mr-10 -mt-10 absolute top-0 right-0 h-24 w-24 rounded-full bg-white opacity-10 sm:h-32 sm:w-32" />
                <div className="relative z-10 mb-2 flex items-end justify-between">
                  <div>
                    <p className="mb-1 font-bold text-emerald-100 text-[10px] uppercase tracking-wider sm:text-xs">
                      Progresso do Dia
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

            {/* Calendar Component */}
            <Calendar
              onChange={(date) => setSelectedDate(date)}
              selectedDate={selectedDate}
              tasks={calendarTasks}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 lg:mt-auto">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 text-[10px] dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Pendentes
                  </span>
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {
                    displayMyTasks.filter((t) => t.status !== "completed")
                      .length
                  }
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 text-[10px] dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Concluídas
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  {
                    displayMyTasks.filter((t) => t.status === "completed")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Agenda */}
          <div className="mt-4 flex-1 min-h-0 lg:col-span-8 lg:mt-0 lg:h-full">
            <AgendaSidebar
              onCompleteTask={handleCompleteTask}
              onDateChange={changeDate}
              onDeleteTask={(taskId) =>
                deleteMyTaskMutation.mutate({ id: taskId })
              }
              selectedDate={selectedDate}
              tasks={
                displayMyTasks.filter((t) => t.dueDate !== null) as Array<
                  (typeof displayMyTasks)[number] & { dueDate: Date }
                >
              }
            />
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div
              className={`relative p-6 text-white ${
                taskForm.taskCategory === "sessao"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600"
              }`}
            >
              <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-white/10" />
              <h3 className="font-bold text-xl">Nova Tarefa</h3>
              <p
                className={`text-sm ${
                  taskForm.taskCategory === "sessao"
                    ? "text-sky-100"
                    : "text-emerald-100"
                }`}
              >
                {taskForm.taskCategory === "sessao"
                  ? `Sessão${selectedSessionPatient ? ` com ${selectedSessionPatient.name}` : ""}`
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
                {/* Task Type */}
                <div>
                  <label className="mb-2 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                    <Target className="mb-0.5 inline h-3 w-3" /> Tipo de
                    Tarefa *
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
                          type: "custom",
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
                          ? "border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                      onClick={() =>
                        setTaskForm({
                          ...taskForm,
                          taskCategory: "sessao",
                          priority: "high",
                          type: "session",
                          sessionPatientId: undefined,
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

                {taskForm.taskCategory && (
                  <>
                    {/* Title - Only for Geral */}
                    {taskForm.taskCategory === "geral" && (
                      <div>
                        <label
                          className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                          htmlFor="task-title"
                        >
                          Título *
                        </label>
                        <input
                          autoFocus
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30"
                          id="task-title"
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              title: e.target.value,
                            })
                          }
                          placeholder="Ex: Praticar respiração consciente"
                          required
                          type="text"
                          value={taskForm.title}
                        />
                      </div>
                    )}

                    {/* Patient Search - for sessions */}
                    {taskForm.taskCategory === "sessao" && (
                      <div>
                        <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <User className="mb-0.5 inline h-3 w-3" />{" "}
                          Paciente *
                        </label>
                        <div className="relative">
                          <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-3 pl-10 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30"
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
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 font-semibold text-white text-sm">
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

                    {/* Session Value */}
                    {taskForm.taskCategory === "sessao" && (
                      <div className="mt-2">
                        <label
                          className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                          htmlFor="session-value"
                        >
                          <Banknote className="mb-0.5 inline h-3 w-3" /> Valor
                          da Sessão (R$)
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30"
                          id="session-value"
                          min="0"
                          onChange={(e) =>
                            setTaskForm({
                              ...taskForm,
                              sessionValue: Number(e.target.value),
                            })
                          }
                          placeholder="0.00"
                          value={taskForm.sessionValue}
                        />
                      </div>
                    )}

                    {/* Frequency for sessions */}
                    {taskForm.taskCategory === "sessao" && (
                      <div className="mt-4">
                        <label className="mb-2 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                          <Repeat className="mb-0.5 inline h-3 w-3" />{" "}
                          Frequência
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(["once", "weekly", "biweekly"] as const).map(
                            (freq) => (
                              <button
                                className={`rounded-lg border-2 px-3 py-2 font-bold text-xs transition-all ${
                                  taskForm.frequency === freq
                                    ? "border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                                    : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-700"
                                }`}
                                key={freq}
                                onClick={() =>
                                  setTaskForm({
                                    ...taskForm,
                                    frequency: freq,
                                    weekDays: [],
                                  })
                                }
                                type="button"
                              >
                                {freq === "once"
                                  ? "Única"
                                  : freq === "weekly"
                                    ? "Semanal"
                                    : "Quinzenal"}
                              </button>
                            ),
                          )}
                        </div>

                        {/* Weekday selector for weekly/biweekly session */}
                        {(taskForm.frequency === "weekly" ||
                          taskForm.frequency === "biweekly") && (
                          <div className="mt-3">
                            <p className="mb-2 text-slate-500 text-xs">
                              Selecione o dia da semana:
                            </p>
                            <div className="flex justify-between gap-1">
                              {[
                                { label: "D", value: 0 },
                                { label: "S", value: 1 },
                                { label: "T", value: 2 },
                                { label: "Q", value: 3 },
                                { label: "Q", value: 4 },
                                { label: "S", value: 5 },
                                { label: "S", value: 6 },
                              ].map((day) => {
                                const isSelected =
                                  taskForm.weekDays?.includes(day.value);
                                return (
                                  <button
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 font-bold text-sm transition-all ${
                                      isSelected
                                        ? "border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                                        : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                    }`}
                                    key={day.value}
                                    onClick={() => {
                                      const currentDays =
                                        taskForm.weekDays || [];
                                      const newDays = currentDays.includes(
                                        day.value,
                                      )
                                        ? currentDays.filter(
                                            (d) => d !== day.value,
                                          )
                                        : [...currentDays, day.value];
                                      setTaskForm({
                                        ...taskForm,
                                        weekDays: newDays,
                                      });
                                    }}
                                    type="button"
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Date selector for unique session */}
                        {taskForm.frequency === "once" && (
                          <div className="mt-3">
                            <p className="mb-2 text-slate-500 text-xs">
                              Selecione a data:
                            </p>
                            <input
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-sm text-slate-800 outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-sky-900/30"
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
                      </div>
                    )}

                    {taskForm.taskCategory === "sessao" && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 dark:bg-red-900/20">
                        <Flag
                          className="h-3.5 w-3.5 text-red-500"
                          fill="currentColor"
                        />
                        <span className="font-medium text-red-600 text-[10px] dark:text-red-400">
                          Prioridade Alta
                        </span>
                      </div>
                    )}

                    {/* Date and Priority for general tasks */}
                    {taskForm.taskCategory === "geral" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider"
                            htmlFor="my-task-due-date-geral"
                          >
                            <CalendarIcon className="mb-0.5 inline h-3 w-3" />{" "}
                            Data
                          </label>
                          <input
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 text-sm outline-none transition-colors focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            id="my-task-due-date-geral"
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

                        <div>
                          <label className="mb-1 block font-bold text-slate-400 text-xs uppercase tracking-wider">
                            <Flag className="mb-0.5 inline h-3 w-3" />{" "}
                            Prioridade
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
                    )}

                    {/* Frequency for general tasks */}
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
                              { key: "biweekly", label: "Quinzenal" },
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
                                })
                              }
                              type="button"
                            >
                              {freq.label}
                            </button>
                          ))}
                        </div>

                        {/* Week days selection */}
                        {(taskForm.frequency === "weekly" ||
                          taskForm.frequency === "biweekly") && (
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
                                              (d) => d !== index,
                                            )
                                          : [...currentDays, index].sort(
                                              (a, b) => a - b,
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
                                },
                              )}
                            </div>
                          </div>
                        )}
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
                      ? "bg-sky-600"
                      : "bg-emerald-600"
                  }`}
                  disabled={
                    createMyTaskMutation.isPending ||
                    !taskForm.taskCategory ||
                    (taskForm.taskCategory === "geral" && !taskForm.title) ||
                    (taskForm.taskCategory === "sessao" &&
                      (!taskForm.sessionPatientId ||
                        ((taskForm.frequency === "weekly" ||
                          taskForm.frequency === "biweekly") &&
                          !taskForm.weekDays?.length) ||
                        (taskForm.frequency === "once" && !taskForm.dueDate)))
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
