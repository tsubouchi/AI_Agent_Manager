"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Simple SVG icon component to replace lucide-react
const Home = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
)

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
