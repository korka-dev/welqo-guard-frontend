"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { guardApiClient } from "@/lib/guard-api"

interface GuardAuthWrapperProps {
  children: React.ReactNode
}

export function GuardAuthWrapper({ children }: GuardAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si le gardien est authentifié
        const isAuth = guardApiClient.isAuthenticated()
        console.log("Gardien authentifié:", isAuth)

        if (!isAuth) {
          console.log("Redirection vers la page de connexion")
          router.push("/guard/login")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error)
        router.push("/guard/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null 
  }

  return <>{children}</>
}

