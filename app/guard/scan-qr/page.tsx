"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, QrCode, CheckCircle, AlertTriangle, RotateCcw, User, Building, Phone, Clock, Loader2, ShieldCheck, ShieldX, X } from "lucide-react"
import Link from "next/link"
import { guardApiClient, type QRScanResponse } from "@/lib/guard-api"
import { extractQRCodeId } from "@/lib/qr-decoder-fixed"
import { QRCameraScanner } from "@/components/qr-camera-scanner"

// Les interfaces restent inchangées
interface ScannedQRData {
  rawData: string
  extractedFormId: string | null
  apiResponse: QRScanResponse | null
  isValid: boolean
  timestamp: string
  status: "new" | "already_approved" | "already_denied" | "expired" | "invalid"
}

interface NotificationData {
  type: "already_approved" | "already_denied" | "expired" | "invalid"
  title: string
  message: string
  icon: React.ReactNode
  bgColor: string
  borderColor: string
  textColor: string
}

export default function ScanQR() {
  // Les états restent inchangés
  const [scannedData, setScannedData] = useState<ScannedQRData | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<{ success: boolean, message: string, action: "approved" | "denied" } | null>(null)
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Les effets et fonctions restent inchangés
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout

    if (notification && countdown > 0) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer)
            window.location.reload()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, [notification, countdown])

  useEffect(() => {
    if (scannedData && scannedData.status === "new" && scannedData.isValid) {
      setIsModalOpen(true)
    }
  }, [scannedData])

  const handleQRError = (error: any, source: string) => {
    console.error(`Erreur ${source}:`, error)
    setError(`Erreur lors du ${source}. ${error.message || "Erreur inconnue"}`)
  }

  const determineQRStatus = (apiResponse: QRScanResponse): ScannedQRData["status"] => {
    if (!apiResponse.valid) {
      const message = apiResponse.message?.toLowerCase() || ""
      if (message.includes("déjà") && message.includes("autorisé")) {
        return "already_approved"
      }
      if (message.includes("déjà") && message.includes("refusé")) {
        return "already_denied"
      }
      if (message.includes("expiré") || message.includes("expire")) {
        return "expired"
      }
      if (message.includes("déjà") && (message.includes("scanné") || message.includes("utilisé"))) {
        if (message.includes("approuvé") || message.includes("autorisé")) {
          return "already_approved"
        }
        if (message.includes("refusé") || message.includes("rejeté")) {
          return "already_denied"
        }
      }
      return "invalid"
    }
    return "new"
  }

  const createNotification = (status: ScannedQRData["status"], apiMessage: string): NotificationData => {
    switch (status) {
      case "already_approved":
        return {
          type: "already_approved",
          title: "✅ Accès Déjà Autorisé",
          message: apiMessage || "Ce QR code a déjà été validé et l'accès a été autorisé par un gardien.",
          icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
        }
      case "already_denied":
        return {
          type: "already_denied",
          title: "❌ Accès Déjà Refusé",
          message: apiMessage || "Ce QR code a déjà été scanné et l'accès a été refusé par un gardien.",
          icon: <ShieldX className="w-6 h-6 text-red-600" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
        }
      case "expired":
        return {
          type: "expired",
          title: "⏰ QR Code Expiré",
          message: apiMessage || "Ce QR code a dépassé sa date d'expiration et n'est plus valide.",
          icon: <Clock className="w-6 h-6 text-orange-600" />,
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
        }
      default:
        return {
          type: "invalid",
          title: "❌ QR Code Invalide",
          message: apiMessage || "Ce QR code n'est pas valide ou ne correspond à aucun formulaire.",
          icon: <AlertTriangle className="w-6 h-6 text-gray-600" />,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
        }
    }
  }

  const processQRCode = async (qrContent: string) => {
    setIsScanning(true)
    setError(null)
    setConfirmationResult(null)
    setNotification(null)

    try {
      console.log("=== TRAITEMENT QR CODE (SYSTÈME UUID) ===")
      console.log("Contenu brut:", qrContent)
      console.log("Longueur:", qrContent.length)

      const extractedFormId = extractQRCodeId(qrContent)
      console.log("Form ID extrait:", extractedFormId)

      if (!extractedFormId) {
        setError("Impossible d'extraire l'UUID du QR code. Vérifiez que c'est un QR code Welqo valide.")
        return
      }

      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
      if (!uuidRegex.test(extractedFormId)) {
        setError("L'ID extrait n'est pas un UUID valide.")
        return
      }

      console.log("=== APPEL API AVEC FORM_ID ===")
      const apiResponse = await guardApiClient.scanQRCode(extractedFormId)
      console.log("Réponse API:", apiResponse)

      if (apiResponse.error) {
        handleQRError(new Error(apiResponse.error), "validation API")
        return
      }

      if (!apiResponse.data) {
        setError("Réponse API invalide. Contactez l'administrateur.")
        return
      }

      const status = determineQRStatus(apiResponse.data)

      const scannedResult: ScannedQRData = {
        rawData: qrContent,
        extractedFormId: extractedFormId,
        apiResponse: apiResponse.data,
        isValid: apiResponse.data?.valid === true,
        timestamp: new Date().toLocaleString("fr-FR"),
        status: status,
      }

      console.log("=== RÉSULTAT FINAL ===")
      console.log("Form ID utilisé:", extractedFormId)
      console.log("API Response valid:", apiResponse.data?.valid)
      console.log("API Response message:", apiResponse.data?.message)
      console.log("Status déterminé:", status)

      if (status === "already_approved" || status === "already_denied" || status === "expired" || status === "invalid") {
        const notificationData = createNotification(status, apiResponse.data.message)
        setNotification(notificationData)
        setCountdown(5)
        console.log(`🔔 Notification affichée pour statut: ${status}`)
        return
      }

      setScannedData(scannedResult)
      console.log("✅ QR Code valide détecté pour:", apiResponse.data.data?.visitor?.name)
    } catch (error) {
      console.error("Erreur lors du traitement du QR:", error)
      handleQRError(error, "traitement du code QR")
    } finally {
      setIsScanning(false)
    }
  }

  const handleConfirmScan = async (confirmed: boolean) => {
    if (!scannedData?.extractedFormId) {
      setError("Aucun Form ID disponible pour la confirmation")
      return
    }

    setIsConfirming(true)
    setError(null)

    try {
      console.log("=== CONFIRMATION SCAN ===")
      console.log("Form ID:", scannedData.extractedFormId)
      console.log("Confirmé:", confirmed)

      const response = await guardApiClient.confirmScan(scannedData.extractedFormId, confirmed)
      console.log("Réponse confirmation:", response)

      if (response.error) {
        setError(`Erreur lors de la confirmation: ${response.error}`)
        return
      }

      if (response.data) {
        setConfirmationResult({
          success: response.data.success,
          message: response.data.message,
          action: confirmed ? "approved" : "denied",
        })
        console.log(`✅ Scan ${confirmed ? "approuvé" : "refusé"} avec succès`)
      }
    } catch (error: any) {
      console.error("Erreur lors de la confirmation:", error)
      setError(`Erreur lors de la confirmation: ${error.message}`)
    } finally {
      setIsConfirming(false)
    }
  }

  const resetScan = () => {
    setScannedData(null)
    setError(null)
    setConfirmationResult(null)
    setNotification(null)
    setCountdown(0)
    setIsModalOpen(false)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const closeNotification = () => {
    setNotification(null)
    setCountdown(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {notification && (
        <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4">
          <div className={`max-w-2xl mx-auto p-3 sm:p-4 rounded-lg border shadow-lg ${notification.bgColor} ${notification.borderColor} animate-in slide-in-from-top duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-full bg-white shadow-sm flex-shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5">{notification.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm sm:text-base font-semibold ${notification.textColor} truncate`}>
                    {notification.title}
                  </h3>
                  <p className={`text-xs sm:text-sm ${notification.textColor} opacity-90 line-clamp-2`}>
                    {notification.message}
                  </p>
                  {countdown > 0 && (
                    <div className="mt-1 sm:mt-2 flex items-center space-x-1 sm:space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current rounded-full animate-spin border-t-transparent flex-shrink-0"></div>
                      <span className={`text-xs sm:text-sm font-medium ${notification.textColor} truncate`}>
                        Rechargement dans {countdown}s...
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={closeNotification} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 flex-shrink-0 ml-2">
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-slate-800/50 shadow-sm border-b border-slate-700 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  <span className="hidden sm:inline">Scanner QR Code Welqo</span>
                  <span className="sm:hidden">Scanner QR</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <Link href="/guard/dashboard" className="flex items-center space-x-1 sm:space-x-2 text-gray-200 hover:text-white">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Retour au Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Scanner QR Code</CardTitle>
              <QrCode className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-6 bg-red-500 border-red-600 text-white">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <QRCameraScanner
                  onScanSuccess={processQRCode}
                  onError={setError}
                  isActive={isCameraActive}
                  onActiveChange={setIsCameraActive}
                />
                <Button onClick={resetScan} variant="outline" className="w-full bg-slate-700 text-white hover:bg-slate-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800/90 border-slate-700 backdrop-blur-sm w-[95vw] max-w-[425px] sm:max-w-[500px] md:max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" />
              <span className="truncate">Informations du Visiteur</span>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-slate-400 mt-1 sm:mt-2">
              Vérifiez les informations et validez ou refusez l'accès
            </DialogDescription>
          </DialogHeader>

          {scannedData?.apiResponse?.data && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="p-2 sm:p-2.5 bg-slate-600 rounded-full flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Visiteur</p>
                      <p className="font-semibold text-sm sm:text-base text-white truncate">
                        {scannedData.apiResponse.data.visitor.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="p-2 sm:p-2.5 bg-slate-600 rounded-full flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Téléphone</p>
                      <p className="font-semibold text-sm sm:text-base text-white truncate">
                        {scannedData.apiResponse.data.visitor.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-600 my-2 sm:my-3"></div>

                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="p-2 sm:p-2.5 bg-slate-600 rounded-full flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Résident</p>
                      <p className="font-semibold text-sm sm:text-base text-white truncate">
                        {scannedData.apiResponse.data.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="p-2 sm:p-2.5 bg-slate-600 rounded-full flex-shrink-0">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Appartement</p>
                      <p className="font-semibold text-sm sm:text-base text-white truncate">
                        {scannedData.apiResponse.data.user.appartement}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="p-2 sm:p-2.5 bg-slate-600 rounded-full flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Expire le</p>
                      <p className="font-semibold text-sm sm:text-base text-white truncate">
                        {formatDate(scannedData.apiResponse.data.expires_at)}
                      </p>
                    </div>
                  </div>

                  {confirmationResult && (
                    <div className={`p-3 sm:p-4 rounded-lg border-2 mt-4 sm:mt-6 ${
                      confirmationResult.success
                        ? confirmationResult.action === "approved"
                          ? "bg-green-50 border-green-200"
                          : "bg-orange-50 border-orange-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {confirmationResult.success ? (
                            confirmationResult.action === "approved" ? (
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                            )
                          ) : (
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-sm sm:text-base ${
                            confirmationResult.success
                              ? confirmationResult.action === "approved"
                                ? "text-green-800"
                                : "text-orange-800"
                              : "text-red-800"
                          }`}>
                            {confirmationResult.action === "approved" ? "Accès Autorisé" : "Accès Refusé"}
                          </p>
                          <p className={`text-xs sm:text-sm mt-1 ${
                            confirmationResult.success
                              ? confirmationResult.action === "approved"
                                ? "text-green-600"
                                : "text-orange-600"
                              : "text-red-600"
                          }`}>
                            {confirmationResult.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-4 sm:p-6 pt-2 sm:pt-4 border-t border-slate-700 bg-slate-800/50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              {!confirmationResult ? (
                <>
                  <Button
                    onClick={() => handleConfirmScan(true)}
                    disabled={isConfirming}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                        <span className="truncate">Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="truncate">Autoriser l'accès</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleConfirmScan(false)}
                    disabled={isConfirming}
                    variant="destructive"
                    className="flex-1 font-medium py-2.5 sm:py-3 text-sm sm:text-base"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                        <span className="truncate">Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="truncate">Refuser l'accès</span>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={resetScan}
                  variant="outline"
                  className="w-full font-medium py-2.5 sm:py-3 text-sm sm:text-base bg-slate-700 text-white hover:bg-slate-600"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Scanner un nouveau QR Code
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
