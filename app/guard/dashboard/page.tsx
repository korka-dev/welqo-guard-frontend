"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, QrCode, Scan, Activity, Clock, User, Home, CheckCircle, XCircle, Check, X } from "lucide-react";
import Image from "next/image";
import { useGuardAuth } from "@/hooks/use-guard-auth";
import { useToast } from "@/hooks/use-toast";
import { guardApiClient } from "@/lib/guard-api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import QrScanner from "@/components/QrScanner";

interface QRScanData {
  id: string;
  qr_code_data: string;
  guard_id: string;
  form_data_id?: string;
  confirmed?: boolean;
  valid?: boolean;
  scanned_at: string;
  created_at: string;
  updated_at: string;
  visitor_name?: string;
  visitor_phone?: string;
  resident_name?: string;
  resident_phone?: string;
  resident_apartment?: string;
  expires_at?: string;
  status?: string;
}

interface QRValidationData {
  valid: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      phone_number: string;
      appartement: string;
    };
    visitor: {
      name: string;
      phone_number: string;
    };
    created_at: string;
    expires_at: string;
    form_id?: string;
  };
}

export default function GuardDashboardPage() {
  const { guard, logout, isAuthenticated, isLoading } = useGuardAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [guardName, setGuardName] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<QRScanData[]>([]);
  const [selectedScan, setSelectedScan] = useState<QRScanData | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<QRValidationData | null>(null);
  const [pendingQRData, setPendingQRData] = useState<string>("");
  const [stats, setStats] = useState({
    todayScans: 0,
    authorizedAccess: 0,
    deniedAccess: 0,
    totalScans: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("guard_access_token");
      const storedGuardName = localStorage.getItem("guard_name");

      if (!token || (!isLoading && !isAuthenticated)) {
        router.push("/guard/login");
        return;
      }

      if (storedGuardName) {
        setGuardName(storedGuardName);
      } else if (guard?.name) {
        setGuardName(guard.name);
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, guard, router]);

  const fetchScanHistory = async () => {
    try {
      const response = await guardApiClient.getScanHistory();
      if (response.status === 200 && Array.isArray(response.data)) {
        const mappedData: QRScanData[] = response.data.map((scan: any) => ({
          guard_id: scan.guard_id ?? "",
          created_at: scan.created_at ?? "",
          updated_at: scan.updated_at ?? "",
          id: scan.id,
          qr_code_data: scan.qr_code_data,
          form_data_id: scan.form_data_id,
          confirmed: scan.confirmed,
          valid: scan.valid,
          scanned_at: scan.scanned_at,
          visitor_name: scan.visitor_name,
          visitor_phone: scan.visitor_phone,
          resident_name: scan.resident_name,
          resident_phone: scan.resident_phone,
          resident_apartment: scan.resident_apartment,
          expires_at: scan.expires_at,
          status: scan.status,
        }));
        setScanHistory(mappedData);
        calculateStats(mappedData);
      } else {
        setScanHistory([]);
        if (response.error) {
          console.warn("Erreur historique:", response.error);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      setScanHistory([]);
    }
  };

  const calculateStats = (scans: QRScanData[]) => {
    const today = new Date().toDateString();
    const todaysScans = scans.filter(scan => {
      const scanDate = new Date(scan.scanned_at);
      return scanDate.toDateString() === today;
    });

    const authorized = scans.filter(scan =>
      (scan.valid === true || scan.valid === undefined) && scan.confirmed !== false
    );

    const denied = scans.filter(scan =>
      scan.valid === false || scan.confirmed === false
    );

    setStats({
      todayScans: todaysScans.length,
      authorizedAccess: authorized.length,
      deniedAccess: denied.length,
      totalScans: scans.length
    });
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchScanHistory();
    }
  }, [isAuthenticated, isLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Déconnexion gardien réussie", "success");
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      showToast("Erreur lors de la déconnexion", "error");
    }
  };

  const startCamera = () => {
    setScanDialogOpen(true);
  };

  const stopCamera = () => {
    setScanDialogOpen(false);
  };

  const handleScan = async (data: string | null) => {
    if (data) {
      try {
        const response = await guardApiClient.scanQRCode(data);
        if (response.status === 200 && response.data) {
          const validationData = response.data as QRValidationData;
          setPendingScan(validationData);
          setPendingQRData(data);
          setConfirmationDialogOpen(true);
          stopCamera();
        } else {
          const errorMessage = response.error || "Erreur lors de la validation du QR Code";
          showToast(errorMessage, "error");
          stopCamera();
        }
      } catch (error) {
        console.error("Erreur lors de la validation du QR Code:", error);
        showToast("Erreur de connexion au serveur", "error");
        stopCamera();
      }
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    showToast("Erreur lors du scan du QR Code", "error");
  };

  const handleConfirmAccess = async (confirmed: boolean) => {
    if (!pendingScan || !pendingQRData) return;

    try {
      const confirmResponse = await guardApiClient.confirmScan(pendingQRData, confirmed);

      if (confirmResponse.status === 200) {
        if (confirmed && pendingScan.valid) {
          showToast("Accès confirmé et autorisé", "success");
        } else if (!confirmed) {
          showToast("Accès refusé par le gardien", "error");
        } else {
          showToast("QR Code invalide ou expiré", "error");
        }

        setTimeout(() => {
          fetchScanHistory();
        }, 1000);
      } else {
        const errorMessage = confirmResponse.error || "Erreur lors de la confirmation";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      showToast("Erreur de connexion au serveur", "error");
    } finally {
      setConfirmationDialogOpen(false);
      setPendingScan(null);
      setPendingQRData("");
    }
  };

  const openScanDetails = (scan: QRScanData) => {
    setSelectedScan(scan);
    setDetailsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const getScanStatus = (scan: QRScanData) => {
    if (scan.confirmed === false) return { status: "Refusé", color: "bg-red-500/20 text-red-400" };
    if (scan.confirmed === true && (scan.valid === true || scan.valid === undefined)) {
      return { status: "Autorisé", color: "bg-green-500/20 text-green-400" };
    }
    if (scan.valid === false) return { status: "Invalide", color: "bg-red-500/20 text-red-400" };
    return { status: "En attente", color: "bg-yellow-500/20 text-yellow-400" };
  };

  const getScanIcon = (scan: QRScanData) => {
    const { status } = getScanStatus(scan);
    if (status === "Autorisé") return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === "Refusé" || status === "Invalide") return <XCircle className="w-5 h-5 text-red-400" />;
    return <Clock className="w-5 h-5 text-yellow-400" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src="/logo-alt.jpeg"
                alt="Welqo Logo"
                width={40}
                height={40}
                className="rounded-lg w-8 h-8 sm:w-10 sm:h-10"
              />
              <Shield className="w-6 h-6 text-amber-400" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Espace Gardien</h1>
                <p className="text-xs sm:text-sm text-slate-400">Bienvenue, {guardName || "Gardien"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bonjour, {guardName || "Gardien"} 🛡️</h2>
          <p className="text-slate-300">Gérez le contrôle d'accès et validez les codes QR des visiteurs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Scans Aujourd'hui</CardTitle>
              <QrCode className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.todayScans}</div>
              <p className="text-xs text-slate-400">Codes QR scannés</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Accès Autorisés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.authorizedAccess}</div>
              <p className="text-xs text-slate-400">Accès valides</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Accès Refusés</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.deniedAccess}</div>
              <p className="text-xs text-slate-400">Accès refusés</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Statut Service</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">En Service</div>
              <p className="text-xs text-slate-400">Système actif</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Scan className="w-5 h-5 text-amber-400" />
                <span>Scanner QR Code</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Scannez les codes QR des visiteurs pour valider leur accès
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto bg-slate-700 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-400" />
              </div>

              <Button
                onClick={startCamera}
                className="w-full bg-amber-400 text-slate-900 hover:bg-amber-500"
              >
                <Scan className="w-4 h-4 mr-2" />
                Scanner un QR Code
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <span>Activités Récentes</span>
              </CardTitle>
              <CardDescription className="text-slate-400">Historique des derniers codes QR scannés</CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Aucun scan effectué</p>
                  <p className="text-sm text-slate-500 mt-2">Les scans apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.slice(0, 5).map((scan) => {
                    const { status, color } = getScanStatus(scan);
                    return (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700/70 transition-colors"
                        onClick={() => openScanDetails(scan)}
                      >
                        <div className="flex items-center space-x-3">
                          {getScanIcon(scan)}
                          <div>
                            <p className="text-white font-medium">{scan.visitor_name || "Visiteur inconnu"}</p>
                            <p className="text-sm text-slate-400">{scan.visitor_phone || "Téléphone non disponible"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={color}>
                            {status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(scan.scanned_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <QrScanner
        isOpen={scanDialogOpen}
        onClose={stopCamera}
        onScan={handleScan}
        onError={handleError}
      />

      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmation d'Accès</DialogTitle>
            <DialogDescription className="text-slate-400">
              Veuillez confirmer ou refuser l'accès pour ce visiteur
            </DialogDescription>
          </DialogHeader>

          {pendingScan && (
            <div className="space-y-6">
              <div className="text-center">
                {pendingScan.valid ? (
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-2" />
                )}
                <Badge className={pendingScan.valid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                  {pendingScan.valid ? "QR Code Valide" : "QR Code Invalide"}
                </Badge>
                <p className="text-sm text-slate-400 mt-2">
                  {pendingScan.message}
                </p>
              </div>

              {pendingScan.data && (
                <>
                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Visiteur</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nom:</span>
                        <span className="text-white">{pendingScan.data.visitor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Téléphone:</span>
                        <span className="text-white">{pendingScan.data.visitor.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <Home className="w-4 h-4 text-amber-400" />
                      <span>Résident</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nom:</span>
                        <span className="text-white">{pendingScan.data.user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Appartement:</span>
                        <span className="text-white">{pendingScan.data.user.appartement}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Validité</span>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Créé le:</span>
                        <span className="text-white">{formatDate(pendingScan.data.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expire le:</span>
                        <span className="text-white">{formatDate(pendingScan.data.expires_at)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              onClick={() => handleConfirmAccess(false)}
              variant="outline"
              className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-2" />
              Refuser
            </Button>
            <Button
              onClick={() => handleConfirmAccess(true)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!pendingScan?.valid}
            >
              <Check className="w-4 h-4 mr-2" />
              Autoriser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Détails du Scan</DialogTitle>
            <DialogDescription className="text-slate-400">Informations complètes du code QR scanné</DialogDescription>
          </DialogHeader>

          {selectedScan && (
            <div className="space-y-6">
              <div className="text-center">
                {getScanIcon(selectedScan)}
                <Badge className={getScanStatus(selectedScan).color}>
                  {getScanStatus(selectedScan).status}
                </Badge>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Informations Visiteur</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nom:</span>
                    <span className="text-white">{selectedScan.visitor_name || "Non disponible"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Téléphone:</span>
                    <span className="text-white">{selectedScan.visitor_phone || "Non disponible"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>Informations Résident</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nom:</span>
                    <span className="text-white">{selectedScan.resident_name || "Non disponible"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Téléphone:</span>
                    <span className="text-white">{selectedScan.resident_phone || "Non disponible"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Appartement:</span>
                    <span className="text-white">{selectedScan.resident_apartment || "Non disponible"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                <h4 className="text-white font-semibold flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Informations Temporelles</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scanné le:</span>
                    <span className="text-white">{formatDate(selectedScan.scanned_at)}</span>
                  </div>
                  {selectedScan.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expire le:</span>
                      <span className="text-white">{formatDate(selectedScan.expires_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
