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

// Fonction pour parser les données QR Welqo au format JSON
export function parseWelqoJSONData(qrContent: string): WelqoQRData | null {
  try {
    const data = JSON.parse(qrContent)

    // Vérifier si c'est un QR code Welqo JSON
    if (data.type === "welqo_access" && data.id && data.visitor && data.resident) {
      return data as WelqoQRData
    }

    return null
  } catch (error) {
    // Pas du JSON valide
    return null
  }
}

// Fonction pour parser les données QR Welqo au format texte
export function parseWelqoTextData(qrContent: string): WelqoTextQRData | null {
  try {
    console.log("=== PARSING TEXTE WELQO ===")
    console.log("Contenu à parser:", qrContent)

    // Vérifier si c'est un QR code Welqo texte
    if (!qrContent.includes("Créé par (Résident)") || !qrContent.includes("Pour le visiteur")) {
      console.log("Format texte Welqo non reconnu")
      return null
    }

    // Extraire les informations avec des regex
    const residentNameMatch = qrContent.match(/Créé par $$Résident$$:\s*\n\s*Nom:\s*(.+)/i)
    const residentPhoneMatch = qrContent.match(/Tél:\s*(.+)/i)
    const residentApartmentMatch = qrContent.match(/Appartement:\s*(.+)/i)

    const visitorNameMatch = qrContent.match(/Pour le visiteur:\s*\n\s*Nom:\s*(.+)/i)
    const visitorPhoneMatch = qrContent.match(/Pour le visiteur:[\s\S]*?Tél:\s*(.+)/i)

    const createdDateMatch = qrContent.match(/Créé le:\s*(.+)/i)
    const expiresDateMatch = qrContent.match(/Expire le:\s*(.+)/i)

    console.log("Matches trouvés:")
    console.log("Résident nom:", residentNameMatch?.[1])
    console.log("Résident tél:", residentPhoneMatch?.[1])
    console.log("Appartement:", residentApartmentMatch?.[1])
    console.log("Visiteur nom:", visitorNameMatch?.[1])
    console.log("Visiteur tél:", visitorPhoneMatch?.[1])
    console.log("Créé le:", createdDateMatch?.[1])
    console.log("Expire le:", expiresDateMatch?.[1])

    if (!residentNameMatch || !visitorNameMatch || !createdDateMatch || !expiresDateMatch) {
      console.log("Informations manquantes dans le QR code")
      return null
    }

    // Convertir les dates au format ISO
    const createdAt = parseWelqoDate(createdDateMatch[1].trim())
    const expiresAt = parseWelqoDate(expiresDateMatch[1].trim())

    const result: WelqoTextQRData = {
      type: "welqo_text_access",
      visitor: {
        name: visitorNameMatch[1].trim(),
        phone: visitorPhoneMatch?.[1]?.trim() || "",
      },
      resident: {
        name: residentNameMatch[1].trim(),
        phone: residentPhoneMatch?.[1]?.trim() || "",
        apartment: residentApartmentMatch?.[1]?.trim() || "",
      },
      created_at: createdAt,
      expires_at: expiresAt,
      raw_text: qrContent,
    }

    console.log("Résultat du parsing:", result)
    return result
  } catch (error) {
    console.error("Erreur lors du parsing du texte Welqo:", error)
    return null
  }
}

// Fonction pour convertir une date Welqo en format ISO
function parseWelqoDate(dateStr: string): string {
  try {
    console.log("Parsing date:", dateStr)

    // Format attendu: "16 juin 2025 à 18:23"
    const months = {
      janvier: "01",
      février: "02",
      mars: "03",
      avril: "04",
      mai: "05",
      juin: "06",
      juillet: "07",
      août: "08",
      septembre: "09",
      octobre: "10",
      novembre: "11",
      décembre: "12",
    }

    const regex = /(\d{1,2})\s+(\w+)\s+(\d{4})\s+à\s+(\d{1,2}):(\d{2})/i
    const match = dateStr.match(regex)

    if (match) {
      const [, day, monthName, year, hour, minute] = match
      const monthNum = months[monthName.toLowerCase() as keyof typeof months]

      if (monthNum) {
        const isoDate = `${year}-${monthNum}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00.000Z`
        console.log("Date convertie:", isoDate)
        return isoDate
      }
    }

    // Fallback: essayer de parser directement
    const fallbackDate = new Date(dateStr).toISOString()
    console.log("Date fallback:", fallbackDate)
    return fallbackDate
  } catch (error) {
    console.error("Erreur parsing date:", error)
    // Retourner une date par défaut
    return new Date().toISOString()
  }
}

// Fonction principale pour parser les données QR Welqo (JSON ou texte)
export function parseWelqoQRData(qrContent: string): WelqoQRData | WelqoTextQRData | null {
  console.log("=== PARSE WELQO QR DATA ===")
  console.log("Contenu complet:", qrContent)
  console.log("Longueur:", qrContent.length)
  console.log("Type:", typeof qrContent)

  // Essayer d'abord le format JSON
  const jsonData = parseWelqoJSONData(qrContent)
  if (jsonData) {
    console.log("✅ Format JSON détecté et parsé avec succès")
    return jsonData
  }

  // Essayer ensuite le format texte
  const textData = parseWelqoTextData(qrContent)
  if (textData) {
    console.log("✅ Format texte détecté et parsé avec succès")
    return textData
  }

  console.log("❌ Aucun format Welqo reconnu")
  console.log("Contenu ne contient pas les marqueurs Welqo attendus:")
  console.log("- JSON: 'type': 'welqo_access'")
  console.log("- Texte: 'Créé par (Résident)' et 'Pour le visiteur'")

  // Afficher un échantillon du contenu pour debug
  if (qrContent.length > 200) {
    console.log("Début du contenu:", qrContent.substring(0, 100))
    console.log("Fin du contenu:", qrContent.substring(qrContent.length - 100))
  } else {
    console.log("Contenu complet:", qrContent)
  }

  return null
}

// Fonction pour valider si un QR code est expiré
export function isQRCodeExpired(expiresAt: string): boolean {
  try {
    const expirationDate = new Date(expiresAt)
    const now = new Date()
    return now > expirationDate
  } catch (error) {
    return true // En cas d'erreur, considérer comme expiré
  }
}

// Fonction pour convertir les données texte en format JSON pour l'API
export function convertTextDataToAPIFormat(textData: WelqoTextQRData): string {
  const apiData = {
    id: `text-${Date.now()}`, // Générer un ID temporaire
    type: "welqo_access",
    visitor: textData.visitor,
    resident: textData.resident,
    created_at: textData.created_at,
    expires_at: textData.expires_at,
    timestamp: new Date().toISOString(),
  }

  return JSON.stringify(apiData)
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

