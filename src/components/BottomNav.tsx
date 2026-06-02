"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, BookOpen, Timer, Plus } from "lucide-react";

const tabs = [
  { href: "/", label: "Projects", icon: Home },
  { href: "/stash", label: "Stash", icon: Package },
  { href: "/patterns", label: "Patterns", icon: BookOpen },
  { href: "/journal", label: "Journal", icon: Timer },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t-2 border-warm-wood-pale bg-white/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab, i) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all ${
                isActive
                  ? "text-sage"
                  : "text-warm-gray hover:text-warm-dark"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB */}
        <Link
          href="/projects/new"
          className="flex items-center justify-center h-12 w-12 -mt-6 rounded-full bg-sage text-white shadow-soft active:scale-95 transition-all hover:bg-sage-deep"
        >
          <Plus size={24} strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}
