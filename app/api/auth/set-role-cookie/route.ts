import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST() {
  try {
    // Obter a sessão atual
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar a role do usuário no banco de dados
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const role = user.role || "patient";

    // Define o cookie de role
    const cookieStore = await cookies();
    cookieStore.set("user-role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias (mesmo tempo da sessão)
      path: "/",
    });

    return NextResponse.json({ role, success: true });
  } catch (error) {
    console.error("Erro ao definir cookie de role:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
