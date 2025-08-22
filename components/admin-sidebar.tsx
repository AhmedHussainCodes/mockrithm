"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ListChecks,
  ClipboardList,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Navigation config
const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Interviews", href: "/admin/interviews", icon: ListChecks },
  { name: "Interview Feedback", href: "/admin/interviewfeedback", icon: ClipboardList },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.fromTo(
      ".sidebar-item",
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2,
      }
    );
  }, []);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-black/95 backdrop-blur-sm border-r border-white/10">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Admin Panel
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-item group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-white/5",
                isActive
                  ? "bg-white/10 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-white to-gray-300" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-sm border border-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-black border-white/10"
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
