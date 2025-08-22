"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminNavbar } from "@/components/admin-navbar"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  useEffect(() => {
    // Page transition animation
    const tl = gsap.timeline()

    tl.fromTo(".page-content", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" })

    return () => {
      tl.kill()
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminNavbar />
        <main className="page-content px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
