/**
 * Redimensiona e comprime uma imagem para ser amigável ao banco de dados.
 * Reduz a dimensão máxima e aplica compressão JPEG.
 * 
 * @param file O arquivo de imagem original
 * @param maxWidth Largura máxima permitida (padrão: 1500px)
 * @param quality Qualidade JPEG (0 a 1, padrão: 0.85)
 * @returns Promise com a string Base64 da imagem processada
 */
export async function compressImage(
  file: File,
  maxWidth = 1500,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const elem = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionar mantendo proporção
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }

        elem.width = width
        elem.height = height

        const ctx = elem.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context failure'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Converter para JPEG com compressão
        const dataUrl = elem.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}
