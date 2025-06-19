import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, QrCode, Users, Clock } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-800/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Image
                src="/welqo-logo.png"
                alt="Welqo Logo"
                width={50}
                height={50}
                className="rounded-lg w-10 h-10 sm:w-[50px] sm:h-[50px]"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Welqo</h1>
                <p className="text-xs sm:text-sm text-amber-400">Genetics</p>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-4">
              <Link href="/guard/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 text-xs sm:text-sm sm:px-4"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Espace Gardien
                </Button>
              </Link>
              <Link href="/guard/register">
                <Button size="sm" className="bg-amber-400 text-slate-900 hover:bg-amber-500 text-xs sm:text-sm sm:px-4">
                  Créer compte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 pt-32">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Contrôle d'Accès
            <span className="block text-amber-400">Résidentiel</span>
            <span className="block text-2xl md:text-3xl text-amber-300 font-normal mt-2">avec Welqo</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Système de contrôle d'accès sécurisé pour les gardiens. Validez les codes QR des visiteurs et gérez l'accès
            à votre résidence en toute sécurité.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/guard/register">
              <Button size="lg" className="bg-amber-400 text-slate-900 hover:bg-amber-500 px-8 py-3 text-lg">
                <Shield className="w-5 h-5 mr-2" />
                Créer compte 
              </Button>
            </Link>
            <Link href="/guard/login">
              <Button
                size="lg"
                variant="outline"
                className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 px-8 py-3 text-lg"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <QrCode className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Scanner QR Codes</h3>
              <p className="text-slate-300">Validez les codes QR des visiteurs en temps réel</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Contrôle Temporel</h3>
              <p className="text-slate-300">Vérifiez la validité et l'expiration des accès</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Gestion Visiteurs</h3>
              <p className="text-slate-300">Suivez tous les visiteurs et leurs accès</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Sécurité Maximale</h3>
              <p className="text-slate-300">Interface sécurisée dédiée aux gardiens</p>
            </CardContent>
          </Card>
        </div>

        {/* How it Works for Guards */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-12">Comment ça marche pour les gardiens ?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h4 className="text-xl font-semibold text-white">Créez votre compte</h4>
              <p className="text-slate-300">
                Inscrivez-vous en tant que gardien avec vos informations professionnelles
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h4 className="text-xl font-semibold text-white">Scannez les codes QR</h4>
              <p className="text-slate-300">Utilisez l'interface de scan pour valider les codes des visiteurs</p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h4 className="text-xl font-semibold text-white">Contrôlez l'accès</h4>
              <p className="text-slate-300">Autorisez ou refusez l'accès selon la validité du code QR</p>
            </div>
          </div>
        </div>

        {/* Guard Features */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Fonctionnalités Gardien</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <QrCode className="w-8 h-8 text-amber-400" />
                  <h4 className="text-xl font-semibold text-white">Scanner QR Intégré</h4>
                </div>
                <p className="text-slate-300 mb-4">
                  Interface de scan simple et efficace pour valider rapidement les codes QR des visiteurs.
                </p>
                <ul className="text-slate-400 space-y-2">
                  <li>• Validation en temps réel</li>
                  <li>• Vérification automatique de l'expiration</li>
                  <li>• Feedback visuel immédiat</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Users className="w-8 h-8 text-amber-400" />
                  <h4 className="text-xl font-semibold text-white">Historique Détaillé</h4>
                </div>
                <p className="text-slate-300 mb-4">
                  Consultez l'historique complet de tous les scans effectués avec les détails des visiteurs.
                </p>
                <ul className="text-slate-400 space-y-2">
                  <li>• Informations visiteur et résident</li>
                  <li>• Horodatage précis</li>
                  <li>• Statut d'accès (autorisé/refusé)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image src="/genetics.png" alt="Welqo Logo" width={70} height={50} className="rounded" />
              <div>
                <p className="text-white font-semibold">Genetics</p>
                <p className="text-sm text-amber-400">Transform your business by the digital</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-2">© 2025 Welqo. Tous droits réservés.</p>
              <p className="text-slate-500 text-xs">Système de contrôle d'accès pour gardiens</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
