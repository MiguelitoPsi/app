import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [user] = await db
      .select({
        bannedAt: users.bannedAt,
        deletedAt: users.deletedAt,
        suspendedByTherapistId: users.suspendedByTherapistId,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (user.deletedAt) {
      return NextResponse.json({
        isBlocked: true,
        message: "Sua conta foi removida e não pode mais acessar o sistema.",
      });
    }

    if (user.bannedAt) {
      return NextResponse.json({
        isBlocked: true,
        message: user.suspendedByTherapistId
          ? "Seu acesso está temporariamente bloqueado. Entre em contato com seu psicólogo."
          : "Sua conta está suspensa. Entre em contato com o suporte.",
      });
    }

    return NextResponse.json({ isBlocked: false });
  } catch (error) {
    console.error("Erro ao verificar status da conta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
