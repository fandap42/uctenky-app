"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const fullName = formData.get("fullName") as string
    const honeypot = formData.get("address_honey") as string

    if (password !== confirmPassword) {
      toast.error("Hesla se neshodují")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error("Heslo musí mít alespoň 8 znaků")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, address_honey: honeypot }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Registrace se nezdařila")
      } else {
        toast.success("Registrace úspěšná! Nyní se můžete přihlásit.")
        router.push("/login")
      }
    } catch {
      toast.error("Nastala neočekávaná chyba")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NDk0YTQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aC0ydi00aDJ2LTJoNHYyaDJ2NGgtMnYyaC00di0yem0wLTZoLTR2LTJoMnYtMmg0djJoMnYyaC0ydjJoLTJ2LTJ6bS0xMCAxMGgtMnYyaC00di0yaC0ydi00aDJ2LTJoNHYyaDJ2NHptLTEwLTEwaDJ2NGgtMnYyaC00di0yaC0ydi00aDJ2LTJoNHYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-60"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-card border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Registrace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Celé jméno</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jan Novák"
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            {/* Honeypot field - visually hidden, should not be filled by users */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="address_honey">Address</Label>
              <Input
                id="address_honey"
                name="address_honey"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vas@email.cz"
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Heslo</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Potvrdit heslo</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Registrace...
                </>
              ) : (
                "Registrovat se"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Už máte účet?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
                Přihlaste se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
