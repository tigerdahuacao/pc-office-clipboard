"use client"

import { useState } from "react"
import { Clipboard, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(password)
    
    if (!success) {
      setError("Incorrect password")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>
      
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Clipboard className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Clipboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter password to access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pl-10 pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-11"
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : "Login"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
