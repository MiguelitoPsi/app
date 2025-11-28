// Utilitário para broadcast de suspensão de usuários
// Usado para notificar outras abas/janelas sobre suspensões em tempo real

const SUSPENSION_CHANNEL = 'nepsis-suspension-channel'

/**
 * Notifica todas as abas/janelas sobre uma suspensão de usuário
 * Isso faz com que o SuspendedAccountModal verifique imediatamente
 */
export function broadcastSuspension(userIds?: string[]) {
  if (typeof window === 'undefined') return

  // Método 1: BroadcastChannel (funciona entre abas do mesmo navegador)
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(SUSPENSION_CHANNEL)
      channel.postMessage({
        type: 'USER_SUSPENDED',
        userIds,
        timestamp: Date.now(),
      })
      channel.close()
    } catch {
      // Silently fail se BroadcastChannel não funcionar
    }
  }

  // Método 2: localStorage (fallback para navegadores sem BroadcastChannel)
  try {
    // Alterar o valor para disparar o evento 'storage' em outras abas
    localStorage.setItem(
      'suspension-event',
      JSON.stringify({
        userIds,
        timestamp: Date.now(),
      })
    )
    // Remover após um breve delay para não poluir localStorage
    setTimeout(() => {
      localStorage.removeItem('suspension-event')
    }, 100)
  } catch {
    // Silently fail se localStorage não estiver disponível
  }
}
