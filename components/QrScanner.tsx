"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { QrReader } from "react-qr-reader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, CameraOff, Upload, Image as ImageIcon } from "lucide-react"
import jsQR from "jsqr"

interface QrScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (data: string | null) => void
  onError: (error: any) => void
}

const QrScanner: React.FC<QrScannerProps> = ({ isOpen, onClose, onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  // Démarrer le scan automatiquement quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true)
      // Vérifier les permissions de la caméra
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false))
    } else {
      setIsScanning(false)
    }
  }, [isOpen])

  const handleScan = (result: any, error: any) => {
    if (result) {
      // Gérer différents types de résultats
      let scannedData: string

      if (typeof result === "string") {
        scannedData = result
      } else if (result?.text) {
        scannedData = result.text
      } else if (result?.getText) {
        scannedData = result.getText()
      } else {
        scannedData = String(result)
      }

      if (scannedData && scannedData.trim()) {
        onScan(scannedData.trim())
        setIsScanning(false)
      }
    }

    if (error && error.name !== "NotFoundException") {
      console.error("QR Scanner Error:", error)
      onError(error)
    }
  }

  const handleClose = () => {
    setIsScanning(false)
    onClose()
  }

  const toggleScanning = () => {
    setIsScanning(!isScanning)
  }

  // Fonction pour traiter l'image téléchargée
  const processImageFile = async (file: File) => {
    setIsProcessingImage(true)
    
    try {
      // Créer une URL pour l'image
      const imageUrl = URL.createObjectURL(file)
      
      // Créer un élément image
      const img = new Image()
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Créer un canvas pour traiter l'image
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              reject(new Error('Impossible de créer le contexte canvas'))
              return
            }
            
            // Définir la taille du canvas
            canvas.width = img.width
            canvas.height = img.height
            
            // Dessiner l'image sur le canvas
            ctx.drawImage(img, 0, 0)
            
            // Obtenir les données d'image
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            // Utiliser jsQR pour décoder le QR code
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height)
            
            if (qrCode && qrCode.data) {
              onScan(qrCode.data)
              handleClose()
              resolve()
            } else {
              onError(new Error('Aucun code QR détecté dans cette image'))
              reject(new Error('Aucun code QR détecté'))
            }
          } catch (error) {
            onError(error)
            reject(error)
          } finally {
            // Nettoyer l'URL de l'objet
            URL.revokeObjectURL(imageUrl)
          }
        }
        
        img.onerror = () => {
          const error = new Error('Impossible de charger l\'image')
          onError(error)
          reject(error)
          URL.revokeObjectURL(imageUrl)
        }
        
        img.src = imageUrl
      })
    } catch (error) {
      onError(error)
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier que c'est bien une image
      if (!file.type.startsWith('image/')) {
        onError(new Error('Veuillez sélectionner un fichier image'))
        return
      }
      
      await processImageFile(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Scanner QR Code</DialogTitle>
          <DialogDescription className="text-slate-400">
            Utilisez la caméra ou téléchargez une image contenant un code QR
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone de scan caméra */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
            {hasPermission === false ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <CameraOff className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    Permission caméra refusée. Vous pouvez toujours télécharger une image ci-dessous.
                  </p>
                </div>
              </div>
            ) : isScanning ? (
              <QrReader
                onResult={handleScan}
                constraints={{
                  facingMode: "environment",
                  aspectRatio: 1,
                }}
                videoStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                ViewFinder={() => (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-amber-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Caméra en pause</p>
                </div>
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">ou</span>
            </div>
          </div>

          {/* Upload d'image pour les QR codes PNG */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Télécharger une image QR Code
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="qr-image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isProcessingImage ? (
                    <>
                      <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mb-2"></div>
                      <p className="text-sm text-slate-400">Traitement en cours...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold">Cliquez pour télécharger</span>
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG, JPEG jusqu'à 10MB</p>
                    </>
                  )}
                </div>
                <input
                  id="qr-image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessingImage}
                />
              </label>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex space-x-2">
            {hasPermission !== false && (
              <Button
                onClick={toggleScanning}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                disabled={isProcessingImage}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Reprendre
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isProcessingImage}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QrScanner

