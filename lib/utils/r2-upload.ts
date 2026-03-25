/**
 * Upload para Cloudflare R2 usando presigned URLs
 * Permite upload direto do browser para o R2 sem passar pelo servidor
 */

type PresignUploadResponse = {
  jobId: string
  presignedUrl: string
  r2Key: string
  r2Url: string | null
  bucket: string
  expiresIn: number
}

type ConfirmUploadResponse = {
  success: boolean
  message: string
  uploadJob: {
    id: string
    status: string
    r2Url: string | null
  }
}

type R2UploadOptions = {
  file: File
  patientId: string
  purpose: 'transcription' | 'document'
  onProgress?: (progress: number, speed: string, remaining: string) => void
  signal?: AbortSignal
}

type R2UploadResult = {
  success: boolean
  jobId: string
  r2Key: string
  r2Url: string | null
  filename: string
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

type GetPresignedUploadUrlParams = {
  patientId: string
  filename: string
  contentType: string
  fileSize: number
  purpose: 'transcription' | 'document'
}

/**
 * Obtém URL presigned para upload
 */
async function getPresignedUploadUrl(
  params: GetPresignedUploadUrlParams
): Promise<PresignUploadResponse> {
  const { patientId, filename, contentType, fileSize, purpose } = params
  const response = await fetch('/api/r2/presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId,
      filename,
      contentType,
      fileSize,
      purpose,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao obter URL de upload')
  }

  return response.json()
}

/**
 * Confirma que o upload foi concluído
 */
async function confirmUpload(jobId: string): Promise<ConfirmUploadResponse> {
  const response = await fetch('/api/r2/confirm-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao confirmar upload')
  }

  return response.json()
}

/**
 * Upload direto para R2 usando presigned URL
 */
export async function uploadToR2(options: R2UploadOptions): Promise<R2UploadResult> {
  const { file, patientId, purpose, onProgress, signal } = options

  // 1. Obter presigned URL
  const presign = await getPresignedUploadUrl({
    patientId,
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
    purpose,
  })

  // 2. Upload direto para R2 via XHR (para progresso)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0
    let lastTime = Date.now()

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const now = Date.now()
        const progress = Math.round((event.loaded / event.total) * 100)
        const timeDiff = (now - lastTime) / 1000

        if (timeDiff > 0.5) {
          const bytesDiff = event.loaded - lastLoaded
          const speed = bytesDiff / timeDiff
          const remaining = event.total - event.loaded
          const secondsRemaining = speed > 0 ? remaining / speed : 0

          onProgress(progress, `${formatBytes(speed)}/s`, formatTime(secondsRemaining))

          lastLoaded = event.loaded
          lastTime = now
        } else {
          onProgress(progress, '', '')
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Erro no upload: HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Erro de conexão'))
    xhr.ontimeout = () => reject(new Error('Timeout no upload'))

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Upload cancelado'))
      })
    }

    xhr.open('PUT', presign.presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.timeout = 60 * 60 * 1000 // 1 hora
    xhr.send(file)
  })

  // 3. Confirmar upload no backend
  await confirmUpload(presign.jobId)

  return {
    success: true,
    jobId: presign.jobId,
    r2Key: presign.r2Key,
    r2Url: presign.r2Url,
    filename: file.name,
  }
}

/**
 * Gerenciador de uploads em background para R2
 */
export type R2BackgroundUpload = {
  id: string
  filename: string
  progress: number
  speed: string
  remaining: string
  status: 'uploading' | 'completed' | 'failed' | 'cancelled'
  error?: string
  result?: R2UploadResult
  abort: () => void
}

type R2BackgroundUploadCallbacks = {
  onProgress?: (upload: R2BackgroundUpload) => void
  onComplete?: (upload: R2BackgroundUpload) => void
  onError?: (upload: R2BackgroundUpload) => void
}

const activeR2Uploads = new Map<string, R2BackgroundUpload>()

export function getActiveR2Uploads(): R2BackgroundUpload[] {
  return Array.from(activeR2Uploads.values())
}

export function startR2BackgroundUpload(
  options: Omit<R2UploadOptions, 'onProgress' | 'signal'>,
  callbacks?: R2BackgroundUploadCallbacks
): R2BackgroundUpload {
  const id = `r2-upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const abortController = new AbortController()

  const upload: R2BackgroundUpload = {
    id,
    filename: options.file.name,
    progress: 0,
    speed: '',
    remaining: '',
    status: 'uploading',
    abort: () => {
      abortController.abort()
      upload.status = 'cancelled'
      activeR2Uploads.delete(id)
    },
  }

  activeR2Uploads.set(id, upload)

  uploadToR2({
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
      setTimeout(() => activeR2Uploads.delete(id), 5000)
    })
    .catch((error) => {
      if (upload.status !== 'cancelled') {
        upload.status = 'failed'
        upload.error = error.message
        callbacks?.onError?.(upload)
        setTimeout(() => activeR2Uploads.delete(id), 10_000)
      }
    })

  return upload
}
