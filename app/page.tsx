"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Shield, Zap, Globe, Users, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <span className="text-2xl font-black text-[#000000]">4</span>
            <span className="text-2xl font-black text-primary">fis</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm font-bold text-foreground hover:text-primary transition-colors">Domů</Link>
            <Link href="#" className="text-sm font-bold text-foreground hover:text-primary transition-colors">Akce</Link>
            <Link href="#" className="text-sm font-bold text-foreground hover:text-primary transition-colors">O nás</Link>
            <Link href="#" className="text-sm font-bold text-foreground hover:text-primary transition-colors">Přidej se</Link>
            <Link href="#" className="text-sm font-bold text-foreground hover:text-primary transition-colors">Kontakt</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-bold">Přihlásit</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 transition-transform hover:scale-105">
                Registrace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter text-foreground">
              Děláme <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-8">studentská léta</span> těmi nejlepšími
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Přednášky, workshopy, akce... u nás se nikdy nenudíš! Poznej nové lidi, získej zkušenosti a posuň svůj studentský život na další level!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:-translate-y-1">
                  Chci na vaši akci!
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-foreground font-black rounded-full px-8 h-14 text-lg hover:bg-foreground hover:text-background transition-all">
                  Správa účtenek <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative Elements matching screenshot style */}
          <div className="relative h-[600px] hidden md:block animate-in fade-in zoom-in duration-1000">
            {/* Grid of rounded boxes like in the screenshot */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#4060ff] rounded-full blur-2xl opacity-20"></div>
            
            <div className="grid grid-cols-2 gap-4 h-full p-4">
              <div className="space-y-4">
                <div className="h-48 bg-primary/20 rounded-t-full rounded-b-full"></div>
                <div className="h-72 bg-secondary rounded-[3rem] p-8 flex flex-col justify-end text-white">
                  <span className="text-4xl font-black italic">30+</span>
                  <span className="text-lg font-bold">akcí za semestr</span>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="h-64 bg-accent rounded-[3rem] p-8 flex flex-col justify-center text-accent-foreground">
                   <span className="text-4xl font-black italic">50+</span>
                   <span className="text-lg font-bold">členů</span>
                </div>
                <div className="h-48 bg-primary rounded-tr-full rounded-bl-full rounded-br-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Financial Admin */}
        <section className="bg-muted/30 py-24 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-foreground">Proč používat 4FIS Finance?</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Moderní nástroj pro správu finančních náhrad studentské organizace.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-[2.5rem] border-2 border-border hover:border-primary transition-colors space-y-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Zap className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold">Rychlost</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Podání žádosti o náhradu trvá méně než minutu. Žádné papírování, vše digitálně.
                </p>
              </div>

              <div className="bg-card p-8 rounded-[2.5rem] border-2 border-border hover:border-secondary transition-colors space-y-6">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <Shield className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold">Bezpečnost</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Vaše data jsou v bezpečí. Přístup mají pouze schválení uživatelé a vedení organizace.
                </p>
              </div>

              <div className="bg-card p-8 rounded-[2.5rem] border-2 border-border hover:border-accent transition-colors space-y-6">
                <div className="w-14 h-14 bg-accent/30 rounded-2xl flex items-center justify-center text-accent-foreground">
                  <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold">Přehlednost</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Vždy víte, v jakém stavu je vaše žádost. Automatické notifikace při schválení.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center">
            <span className="text-2xl font-black text-[#000000]">4</span>
            <span className="text-2xl font-black text-primary">fis</span>
          </div>
          <div className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} 4FIS. Vytvořeno pro studenty, studenty.
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors"><Globe className="w-5 h-5" /></Link>
            <Link href="#" className="hover:text-primary transition-colors"><Users className="w-5 h-5" /></Link>
            <Link href="#" className="hover:text-primary transition-colors"><Heart className="w-5 h-5" /></Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
