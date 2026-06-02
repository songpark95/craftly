"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Projects" },
  { href: "/stash", label: "Stash" },
  { href: "/patterns", label: "Patterns" },
  { href: "/journal", label: "Journal" },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-warm-wood-pale bg-white">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-semibold">
          craft<span className="text-sage italic">ly</span>
        </Link>

        {/* Desktop Nav Pills */}
        <div className="hidden md:flex gap-1 rounded-xl bg-warm-bg p-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition-colors ${
                  isActive
                    ? "bg-white text-warm-dark shadow-sm"
                    : "text-warm-dark hover:text-warm-dark hover:bg-warm-bg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 rounded-lg bg-sage px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-sage-deep hover:-translate-y-0.5"
          >
            <Plus size={14} />
            New Project
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sun to-craft-purple text-sm font-extrabold text-warm-dark">
            S
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-warm-gray hover:bg-warm-bg"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-warm-wood-pale bg-white px-4 pb-4">
          <div className="flex flex-col gap-1 pt-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-[14px] font-bold transition-colors ${
                    isActive
                      ? "bg-warm-bg text-warm-dark"
                      : "text-warm-dark hover:bg-warm-bg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/projects/new"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-sage px-4 py-3 text-[14px] font-bold text-white transition-all hover:bg-sage-deep"
          >
            <Plus size={16} />
            New Project
          </Link>
        </div>
      )}
    </nav>
  );
}
