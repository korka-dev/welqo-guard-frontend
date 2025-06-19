"use client"

import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle, XCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border max-w-md ${
            toast.type === "success"
              ? "bg-green-500/20 border-green-500 text-green-200"
              : toast.type === "error"
                ? "bg-red-500/20 border-red-500 text-red-200"
                : "bg-blue-500/20 border-blue-500 text-blue-200"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
          {toast.type === "error" && <XCircle className="w-5 h-5" />}
          {toast.type === "info" && <Info className="w-5 h-5" />}

          <p className="flex-1 text-sm">{toast.message}</p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeToast(toast.id)}
            className="p-1 h-auto text-current hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
