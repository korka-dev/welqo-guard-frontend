// Utilitaire pour décoder les codes QR avec jsQR
// Installez jsQR avec: npm install jsqr @types/jsqr

export interface QRResult {
  data: string
  location?: {
    topLeftCorner: { x: number; y: number }
    topRightCorner: { x: number; y: number }
    bottomLeftCorner: { x: number; y: number }
    bottomRightCorner: { x: number; y: number }
  }
}

// Interface pour les données QR Welqo (format JSON)
export interface WelqoQRData {
  id: string
  type: string
  visitor: {
    name: string
    phone: string
  }
  resident: {
    name: string
    phone: string
    apartment: string
  }
  created_at: string
  expires_at: string
  timestamp: string
}

// Interface pour les données QR Welqo (format texte)
export interface WelqoTextQRData {
  type: "welqo_text_access"
  visitor: {
    name: string
    phone: string
  }
  resident: {
    name: string
    phone: string
    apartment: string
  }
  created_at: string
  expires_at: string
  raw_text: string
}

// Fonction pour décoder un QR code depuis un canvas
export async function decodeQRFromCanvas(canvas: HTMLCanvasElement): Promise<QRResult | null> {
  try {
    // Utilisation de jsQR pour décoder le QR code
    const jsQR = (await import("jsqr")).default
    const context = canvas.getContext("2d")
    if (!context) return null

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      return {
        data: code.data,
        location: code.location,
      }
    }

    return null
  } catch (error) {
    console.error("Erreur lors du décodage QR:", error)
    return null
  }
}

// Fonction pour décoder un QR code depuis un fichier image
export async function decodeQRFromFile(file: File): Promise<QRResult | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    const img = new Image()

    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height
      context?.drawImage(img, 0, 0)

      const result = await decodeQRFromCanvas(canvas)
      resolve(result)
    }

    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

// Ajouter une fonction pour extraire l'ID du QR code Welqo (UUID format)
export function extractQRCodeId(qrContent: string): string | null {
  try {
    console.log("=== EXTRACTION FORM_ID (UUID) ===")
    console.log("Contenu à analyser:", qrContent)

    // Essayer d'abord le format JSON
    try {
      const jsonData = JSON.parse(qrContent)
      if (jsonData.form_id) {
        console.log("Form ID trouvé dans JSON:", jsonData.form_id)
        return jsonData.form_id
      }
      if (jsonData.id) {
        console.log("ID trouvé dans JSON:", jsonData.id)
        return jsonData.id
      }
    } catch (e) {
      console.log("Pas du JSON valide, essai format texte")
    }

    // Patterns spécifiques pour UUID
    const uuidPatterns = [
      /Form ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /Formulaire:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /Code:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      /Référence:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
      // Pattern pour UUID standard (le plus important)
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    ]

    for (const pattern of uuidPatterns) {
      const match = qrContent.match(pattern)
      if (match && match[1]) {
        console.log("UUID trouvé avec pattern:", pattern, "->", match[1])
        return match[1]
      }
    }

    // Chercher dans chaque ligne
    const lines = qrContent.split("\n")
    for (const line of lines) {
      const trimmedLine = line.trim()
      // Vérifier si la ligne est un UUID valide
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(trimmedLine)) {
        console.log("UUID trouvé dans ligne:", trimmedLine)
        return trimmedLine
      }
    }

    console.log("❌ Aucun UUID trouvé dans le QR code")
    return null
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'UUID:", error)
    return null
  }
}

// Fonction pour créer un QR code de test
export function createTestQRCode(): string {
  const testUUID = "550e8400-e29b-41d4-a716-446655440000"
  return JSON.stringify({
    form_id: testUUID,
    type: "welqo_access",
    visitor: {
      name: "Jean Dupont",
      phone: "+33123456789",
    },
    resident: {
      name: "Marie Martin",
      phone: "+33987654321",
      apartment: "A101",
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
}


