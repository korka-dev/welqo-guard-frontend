"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QrCode, Clock, History, Users, AlertTriangle, CheckCircle, LogOut, RefreshCw, User, Building, Phone, Calendar, Menu, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { guardApiClient, type GuardStats, type GuardQRScan } from "@/lib/guard-api"
import { GuardAuthWrapper } from "@/components/guard-auth-wrapper"

function GuardDashboardContent() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [guardName, setGuardName] = useState<string | null>(null)
  const [stats, setStats] = useState<GuardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<GuardQRScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<GuardQRScan | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const storedGuardName = guardApiClient.getStoredGuardName()
    setGuardName(storedGuardName)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      console.log("=== CHARGEMENT DONNÉES DASHBOARD ===")

      const statsResponse = await guardApiClient.getGuardStats()
      console.log("Réponse stats:", statsResponse)

      if (statsResponse.error) {
        throw new Error(statsResponse.error)
      }

      if (statsResponse.data) {
        setStats(statsResponse.data)
        console.log("Stats chargées:", statsResponse.data)
      }

      const activityResponse = await guardApiClient.getScanHistory(5)
      console.log("Réponse activité récente:", activityResponse)

      if (activityResponse.error) {
        console.warn("Erreur lors du chargement de l'activité:", activityResponse.error)
      } else if (activityResponse.data) {
        setRecentActivity(activityResponse.data)
        console.log("Activité récente chargée:", activityResponse.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      setError(error instanceof Error ? error.message : "Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await loadDashboardData()
    setIsRefreshing(false)
  }

  const handleLogout = async () => {
    try {
      await guardApiClient.logoutGuard()
      router.push("/guard/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      if (typeof window !== "undefined") {
        localStorage.removeItem("guard_access_token")
        localStorage.removeItem("guard_name")
      }
      router.push("/guard/login")
    }
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

  const getStatusBadge = (confirmed?: boolean) => {
    if (confirmed === true) {
      return <Badge className="bg-green-500 text-white">Autorisé</Badge>
    } else if (confirmed === false) {
      return <Badge className="bg-red-500 text-white">Refusé</Badge>
    } else {
      return <Badge className="bg-yellow-500 text-white">En attente</Badge>
    }
  }

  const handleActivityClick = (activity: GuardQRScan) => {
    setSelectedActivity(activity)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header responsif amélioré */}
      <header className="bg-slate-800/50 shadow-sm border-b border-slate-700 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header principal */}
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo et titre - version desktop */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  <span className="hidden sm:inline">Dashboard Gardien</span>
                  <span className="sm:hidden">Dashboard</span>
                </h1>
              </div>
              
              {/* Badge gardien - caché sur très petits écrans */}
              {guardName && (
                <div className="hidden md:block flex-shrink-0">
                  <Badge variant="outline" className="text-xs sm:text-sm bg-slate-700 text-white border-slate-600 truncate max-w-32 sm:max-w-none">
                    {guardName}
                  </Badge>
                </div>
              )}
            </div>

            {/* Actions desktop */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <div className="text-xs lg:text-sm text-slate-400 hidden lg:block">
                {currentTime.toLocaleString("fr-FR")}
              </div>
              <div className="text-xs text-slate-400 lg:hidden">
                {currentTime.toLocaleString("fr-FR", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </div>
              <Button 
                onClick={refreshData} 
                variant="outline" 
                size="sm" 
                disabled={isRefreshing} 
                className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600 text-xs lg:text-sm"
              >
                <RefreshCw className={`w-3 h-3 lg:w-4 lg:h-4 ${isRefreshing ? "animate-spin" : ""} lg:mr-2`} />
                <span className="hidden lg:inline">Actualiser</span>
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm" 
                className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600 text-xs lg:text-sm"
              >
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                <span className="hidden lg:inline">Déconnexion</span>
              </Button>
            </div>

            {/* Menu burger mobile */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="text-xs text-slate-400">
                {currentTime.toLocaleString("fr-FR", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </div>
              <Button
                onClick={toggleMobileMenu}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-slate-700 p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 py-3 space-y-3">
              {/* Badge gardien sur mobile */}
              {guardName && (
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-sm bg-slate-700 text-white border-slate-600">
                    Connecté: {guardName}
                  </Badge>
                </div>
              )}
              
              {/* Actions mobile */}
              <div className="flex flex-col space-y-2 px-2">
                <Button 
                  onClick={() => {
                    refreshData()
                    setIsMobileMenuOpen(false)
                  }} 
                  variant="outline" 
                  size="sm" 
                  disabled={isRefreshing} 
                  className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600 w-full justify-start"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  Actualiser les données
                </Button>
                <Button 
                  onClick={() => {
                    handleLogout()
                    setIsMobileMenuOpen(false)
                  }} 
                  variant="outline" 
                  size="sm" 
                  className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600 w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-500 border-red-600 text-white">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={refreshData} variant="outline" size="sm" className="ml-4 bg-slate-700 text-white hover:bg-slate-600">
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Scans Aujourd'hui</CardTitle>
              <QrCode className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.today_scans || 0}</div>
              <p className="text-xs text-slate-400">Total des scans effectués</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Accès Autorisés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats?.today_approved || 0}</div>
              <p className="text-xs text-slate-400">Visiteurs autorisés</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Accès Refusés</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats?.today_denied || 0}</div>
              <p className="text-xs text-slate-400">Accès refusés</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Taux de Réussite</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {stats && stats.today_scans && stats.today_scans > 0
                  ? `${Math.round((stats.today_approved || 0) / stats.today_scans * 100)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-slate-400">Scans validés avec succès</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Link href="/guard/scan-qr">
            <Button className="w-full bg-amber-400 text-slate-900 hover:bg-amber-500">
              Accéder au Scanner
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Activité Récente</CardTitle>
              <CardDescription className="text-slate-400">
                Derniers scans et validations effectués
                {recentActivity.length > 0 && ` (${recentActivity.length} entrées)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité récente</p>
                  <p className="text-sm">Commencez par scanner un code QR</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} onClick={() => handleActivityClick(activity)} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div>
                          <p className="font-medium text-sm text-white">{activity.visitor_name || "Visiteur"}</p>
                          <p className="text-sm text-slate-400">
                            {activity.resident_name && `Visite chez ${activity.resident_name}`}
                            {activity.resident_apartment && ` - Apt ${activity.resident_apartment}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(activity.confirmed)}
                        <span className="text-sm text-slate-400">{formatDate(activity.scanned_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800/90 border-slate-700 backdrop-blur-sm w-full max-w-lg">
              <CardHeader>
                <CardTitle className="text-white">Détails de l'activité</CardTitle>
                <CardDescription className="text-slate-400">
                  Détails complets de l'activité sélectionnée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-sm text-white">Nom du visiteur</p>
                      <p className="text-sm text-slate-400">{selectedActivity.visitor_name || "Visiteur"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-sm text-white">Téléphone du visiteur</p>
                      <p className="text-sm text-slate-400">{selectedActivity.visitor_phone || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-sm text-white">Résident</p>
                      <p className="text-sm text-slate-400">{selectedActivity.resident_name || "Non spécifié"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-sm text-white">Date de scan</p>
                      <p className="text-sm text-slate-400">{formatDate(selectedActivity.scanned_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-medium text-sm text-white">Statut</p>
                      <div className="text-sm text-slate-400">
                        {getStatusBadge(selectedActivity.confirmed)}
                      </div>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setSelectedActivity(null)} className="mt-4 bg-amber-400 text-slate-900 hover:bg-amber-500">
                  Fermer
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GuardDashboard() {
  return (
    <GuardAuthWrapper>
      <GuardDashboardContent />
    </GuardAuthWrapper>
  )
}
