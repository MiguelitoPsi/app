export type UserRole = "admin" | "psychologist" | "patient";

/**
 * Configuração de rotas por role
 * Define quais rotas cada role pode acessar e para onde redirecionar
 */
export const ROLE_CONFIG = {
  admin: {
    homeRoute: "/admin",
    allowedPaths: ["/admin", "/dashboard"],
    blockedPaths: [
      "/home",
      "/journal",
      "/meditation",
      "/profile",
      "/rewards",
      "/routine",
      "/therapist",
    ],
  },
  psychologist: {
    homeRoute: "/dashboard",
    allowedPaths: ["/dashboard"],
    blockedPaths: [
      "/home",
      "/journal",
      "/meditation",
      "/profile",
      "/rewards",
      "/routine",
      "/therapist",
      "/admin",
    ],
  },
  patient: {
    homeRoute: "/home",
    allowedPaths: [
      "/home",
      "/journal",
      "/meditation",
      "/profile",
      "/rewards",
      "/routine",
      "/therapist",
    ],
    blockedPaths: ["/admin", "/dashboard"],
  },
} as const;

/**
 * Obtém a rota inicial baseada na role do usuário
 */
export function getHomeRouteForRole(role: UserRole): string {
  return ROLE_CONFIG[role]?.homeRoute ?? "/home";
}

/**
 * Verifica se um path é permitido para uma role específica
 */
export function isPathAllowedForRole(path: string, role: UserRole): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;

  // Verifica se o path está na lista de bloqueados
  for (const blockedPath of config.blockedPaths) {
    if (path.startsWith(blockedPath)) {
      return false;
    }
  }

  // Verifica se o path está na lista de permitidos
  for (const allowedPath of config.allowedPaths) {
    if (path.startsWith(allowedPath)) {
      return true;
    }
  }

  // Se não está explicitamente permitido ou bloqueado, permite (para rotas públicas)
  return true;
}

/**
 * Obtém a rota de redirecionamento quando o usuário tenta acessar uma rota não permitida
 */
export function getRedirectRouteForRole(
  role: UserRole,
  attemptedPath: string
): string {
  const config = ROLE_CONFIG[role];
  if (!config) return "/auth/signin";

  // Se tentou acessar uma rota bloqueada, redireciona para home da role
  for (const blockedPath of config.blockedPaths) {
    if (attemptedPath.startsWith(blockedPath)) {
      return config.homeRoute;
    }
  }

  return config.homeRoute;
}
