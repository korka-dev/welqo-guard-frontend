"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, Loader2 } from "lucide-react"

interface QRCameraScannerProps {
  onScanSuccess: (data: string) => void
  onError: (error: string) => void
  isActive: boolean
  onActiveChange: (active: boolean) => void
}

export function QRCameraScanner({ onScanSuccess, onError, isActive, onActiveChange }: QRCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // Fonction pour décoder le QR code depuis le canvas
  const decodeQRFromCanvas = useCallback(async (canvas: HTMLCanvasElement): Promise<string | null> => {
    try {
      const jsQR = (await import("jsqr")).default
      const context = canvas.getContext("2d")
      if (!context) return null

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      return code ? code.data : null
    } catch (error) {
      console.error("Erreur lors du décodage QR:", error)
      return null
    }
  }, [])

  // Fonction pour scanner le QR code depuis la vidéo
  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dessiner la frame vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Tenter de décoder le QR code
    const qrData = await decodeQRFromCanvas(canvas)
    if (qrData) {
      console.log("🎯 QR Code détecté:", qrData)
      onScanSuccess(qrData)
      stopCamera() // Arrêter après détection
    }
  }, [decodeQRFromCanvas, onScanSuccess])

  // Démarrer la caméra
  const startCamera = useCallback(async () => {
    setIsInitializing(true)

    try {
      console.log("🎥 Démarrage de la caméra...")

      // Vérifier les permissions
      const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName })
      console.log("📋 Statut permission caméra:", permissionStatus.state)

      // Configurations de caméra à essayer
      const constraints = [
        {
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        {
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        { video: true }, // Fallback simple
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      for (const constraint of constraints) {
        try {
          console.log("📷 Tentative avec contrainte:", constraint)
          stream = await navigator.mediaDevices.getUserMedia(constraint)
          console.log("✅ Stream obtenu avec succès")
          break
        } catch (error) {
          console.log("❌ Échec avec contrainte:", error)
          lastError = error as Error
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error("Impossible d'obtenir le stream caméra")
      }

      streamRef.current = stream
      setHasPermission(true)

      // Attacher le stream à la vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Attendre que la vidéo soit prête
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Élément vidéo non disponible"))
            return
          }

          const video = videoRef.current

          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)
            console.log("✅ Métadonnées vidéo chargées")
            resolve()
          }

          const onError = (error: Event) => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)
            reject(new Error("Erreur lors du chargement de la vidéo"))
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.addEventListener("error", onError)

          video.play().catch(reject)
        })

        // Démarrer le scan périodique
        scanIntervalRef.current = setInterval(scanQRCode, 500) // Scan toutes les 500ms
        onActiveChange(true)
        console.log("🎉 Caméra active et scan démarré")
      }
    } catch (error: any) {
      console.error("💥 Erreur caméra:", error)
      setHasPermission(false)
      onError(`Erreur caméra: ${error.message}`)
      stopCamera()
    } finally {
      setIsInitializing(false)
    }
  }, [onError, onActiveChange, scanQRCode])

  // Arrêter la caméra
  const stopCamera = useCallback(() => {
    console.log("🛑 Arrêt de la caméra...")

    // Arrêter le scan
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Arrêter le stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log("🔌 Track arrêté:", track.kind)
      })
      streamRef.current = null
    }

    // Nettoyer la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    onActiveChange(false)
    console.log("✅ Caméra arrêtée")
  }, [onActiveChange])

  // Effet pour gérer l'état actif
  useEffect(() => {
    if (isActive && !streamRef.current) {
      startCamera()
    } else if (!isActive && streamRef.current) {
      stopCamera()
    }
  }, [isActive, startCamera, stopCamera])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          className="mx-auto bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
          style={{
            width: "300px",
            height: "300px",
          }}
        >
          {/* Vidéo */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
            playsInline
            muted
            autoPlay
          />

          {/* Canvas caché pour le traitement */}
          <canvas ref={canvasRef} className="hidden" />

          {/* États d'affichage */}
          {!isActive && !isInitializing && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Caméra inactive</p>
                <p className="text-xs text-gray-400 mt-1">Cliquez sur "Activer la Caméra"</p>
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Initialisation...</p>
                <p className="text-xs text-gray-400 mt-1">Autorisation caméra requise</p>
              </div>
            </div>
          )}
        </div>

        {/* Overlay de scan */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg bg-transparent">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={startCamera} className="flex-1" disabled={isInitializing}>
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initialisation...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Activer la Caméra
              </>
            )}
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="outline" className="flex-1">
            <CameraOff className="w-4 h-4 mr-2" />
            Arrêter
          </Button>
        )}
      </div>

      {/* Indicateur d'état */}
      {isActive && (
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">Caméra active - Pointez vers un QR code</span>
          </div>
        </div>
      )}

      {/* Statut des permissions */}
      {hasPermission === false && (
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-red-700 text-sm text-center">
            <p className="font-medium">Permissions caméra refusées</p>
            <p className="text-xs mt-1">Veuillez autoriser l'accès à la caméra dans votre navigateur</p>
          </div>
        </div>
      )}
    </div>
  )
}


