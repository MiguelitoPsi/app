/**
 * Utilitários de otimização de upload de mídia (áudio/vídeo).
 * Upload em background com notificações de progresso.
 */

type UploadOptions = {
  file: File
  url: string
  patientId: string
  therapistId: string
  onProgress?: (progress: number, speed: string, remaining: string) => void
  signal?: AbortSignal
}

type UploadResponse = {
  success: boolean
  jobId: string
  message: string
  filename: string
  status: string
}

/**
 * Formata bytes para string legível
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Formata segundos para tempo legível
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ${Math.ceil(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`
}

/**
 * Upload otimizado com XMLHttpRequest
 * - Progresso em tempo real com velocidade e tempo estimado
 * - Suporta cancelamento via AbortSignal
 */
export function uploadWithProgress(options: UploadOptions): Promise<UploadResponse> {
  const { file, url, patientId, therapistId, onProgress, signal } = options

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const startTime = Date.now()
    let lastLoaded = 0
    let lastTime = startTime

    // Progresso com cálculo de velocidade e tempo restante
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const now = Date.now()
        const progress = Math.round((event.loaded / event.total) * 100)

        // Calcular velocidade (bytes/segundo)
        const timeDiff = (now - lastTime) / 1000
        const bytesDiff = event.loaded - lastLoaded

        if (timeDiff > 0.5) {
          // Atualizar a cada 500ms
          const speed = bytesDiff / timeDiff
          const remaining = event.total - event.loaded
          const secondsRemaining = speed > 0 ? remaining / speed : 0

          onProgress?.(progress, `${formatBytes(speed)}/s`, formatTime(secondsRemaining))

          lastLoaded = event.loaded
          lastTime = now
        } else {
          onProgress?.(progress, '', '')
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Resposta inválida do servidor'))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new Error(errorResponse.message || `Erro HTTP ${xhr.status}`))
        } catch {
          reject(new Error(`Erro HTTP ${xhr.status}`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Erro de conexão'))
    xhr.ontimeout = () => reject(new Error('Timeout na requisição'))

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Upload cancelado'))
      })
    }

    const formData = new FormData()
    formData.append('patientId', patientId)
    formData.append('therapistId', therapistId)
    formData.append('file', file)

    xhr.open('POST', url)
    xhr.timeout = 30 * 60 * 1000 // 30 minutos
    xhr.send(formData)
  })
}

/**
 * Gerenciador de uploads em background
 * Permite que o usuário continue usando o app enquanto o upload acontece
 */
type BackgroundUpload = {
  id: string
  filename: string
  progress: number
  speed: string
  remaining: string
  status: 'uploading' | 'completed' | 'failed' | 'cancelled'
  error?: string
  result?: UploadResponse
  abort: () => void
}

type BackgroundUploadCallbacks = {
  onProgress?: (upload: BackgroundUpload) => void
  onComplete?: (upload: BackgroundUpload) => void
  onError?: (upload: BackgroundUpload) => void
}

const activeUploads = new Map<string, BackgroundUpload>()

export function getActiveUploads(): BackgroundUpload[] {
  return Array.from(activeUploads.values())
}

export function startBackgroundUpload(
  options: Omit<UploadOptions, 'onProgress' | 'signal'>,
  callbacks?: BackgroundUploadCallbacks
): BackgroundUpload {
  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const abortController = new AbortController()

  const upload: BackgroundUpload = {
    id,
    filename: options.file.name,
    progress: 0,
    speed: '',
    remaining: '',
    status: 'uploading',
    abort: () => {
      abortController.abort()
      upload.status = 'cancelled'
      activeUploads.delete(id)
    },
  }

  activeUploads.set(id, upload)

  uploadWithProgress({
    ...options,
    signal: abortController.signal,
    onProgress: (progress, speed, remaining) => {
      upload.progress = progress
      upload.speed = speed
      upload.remaining = remaining
      callbacks?.onProgress?.(upload)
    },
  })
    .then((result) => {
      upload.status = 'completed'
      upload.progress = 100
      upload.result = result
      callbacks?.onComplete?.(upload)
      // Manter no mapa por 5 segundos para mostrar sucesso
      setTimeout(() => activeUploads.delete(id), 5000)
    })
    .catch((error) => {
      if (upload.status !== 'cancelled') {
        upload.status = 'failed'
        upload.error = error.message
        callbacks?.onError?.(upload)
        setTimeout(() => activeUploads.delete(id), 10_000)
      }
    })

  return upload
}
