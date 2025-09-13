"use client"

import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

export function HomeNavigation() {
  const router = useRouter()

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleGoHome}
      className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border"
    >
      <Home className="w-4 h-4 mr-2" />
      ホーム
    </Button>
  )
}
