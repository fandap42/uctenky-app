"use client"

import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MmIiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmg0djJoMnY0aC0ydjJoLTR2LTJ6bTAtNmgtNHYtMmgydi0yaDR2MmgydjJoLTJ2MmgtMnYtMnptLTEwIDEwaC0ydjJoLTR2LTJoLTJ2LTRoMnYtMmg0djJoMnY0em0tMTAtMTBoMnY0aC0ydjJoLTR2LTJoLTJ2LTRoMnYtMmg0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-slate-800/50 backdrop-blur-xl border-slate-700 shadow-2xl shadow-blue-500/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            StudentOrgFinance
          </CardTitle>
          <CardDescription className="text-slate-400">
            Přihlaste se pro správu financí vaší organizace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#3b82f6",
                    brandAccent: "#2563eb",
                    inputBackground: "rgb(30 41 59)",
                    inputText: "white",
                    inputBorder: "rgb(71 85 105)",
                    inputBorderFocus: "#3b82f6",
                    inputBorderHover: "rgb(100 116 139)",
                  },
                },
              },
              className: {
                container: "text-white",
                label: "text-slate-300",
                button: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300",
                anchor: "text-blue-400 hover:text-blue-300",
                divider: "bg-slate-600",
                message: "text-red-400",
              },
            }}
            providers={[]}
            redirectTo={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email",
                  password_label: "Heslo",
                  button_label: "Přihlásit se",
                  loading_button_label: "Přihlašování...",
                  link_text: "Už máte účet? Přihlaste se",
                },
                sign_up: {
                  email_label: "Email",
                  password_label: "Heslo",
                  button_label: "Registrovat se",
                  loading_button_label: "Registrace...",
                  link_text: "Nemáte účet? Registrujte se",
                },
                forgotten_password: {
                  email_label: "Email",
                  button_label: "Odeslat pokyny pro reset",
                  loading_button_label: "Odesílání...",
                  link_text: "Zapomněli jste heslo?",
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
