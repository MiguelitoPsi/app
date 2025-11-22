"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/trpc";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [error, setError] = useState<string | null>(null);

  const {
    data: invite,
    isLoading,
    error: fetchError,
  } = trpc.patient.getInviteByToken.useQuery({ token }, { enabled: !!token });

  useEffect(() => {
    if (fetchError) {
      setError(fetchError.message);
    }
  }, [fetchError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Convite Inválido
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {error || "Não foi possível encontrar este convite."}
            </p>
            <button
              className="mt-6 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => router.push("/auth/signin")}
              type="button"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100">
            <svg
              className="h-10 w-10 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Convite Recebido
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Você foi convidado por{" "}
            <span className="font-semibold">{invite.psychologist.name}</span>{" "}
            para participar do programa de acompanhamento.
          </p>

          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-gray-900">
              Informações do Convite
            </h3>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Nome:</dt>
                <dd className="text-gray-900 font-medium">{invite.name}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Email:</dt>
                <dd className="text-gray-900">{invite.email}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">Psicólogo(a):</dt>
                <dd className="text-gray-900">{invite.psychologist.name}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 space-y-3">
            <button
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              onClick={() => router.push(`/auth/signup?invite=${token}`)}
              type="button"
            >
              Aceitar Convite e Criar Conta
            </button>
            <button
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              onClick={() => router.push("/auth/signin")}
              type="button"
            >
              Já tenho conta - Fazer Login
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Este convite expira em{" "}
            {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
