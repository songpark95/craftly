"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/stash", label: "Stash" },
  { href: "/patterns", label: "Patterns" },
  { href: "/journal", label: "Journal" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-white px-6 py-3 border-b-2 border-warm-wood-pale">
      {/* Logo */}
      <Link href="/" className="font-serif text-2xl font-semibold">
        craft<span className="text-sage italic">ly</span>
      </Link>

      {/* Nav Pills */}
      <div className="flex gap-1 rounded-xl bg-warm-bg p-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-1.5 text-[13px] font-bold transition-colors ${
                isActive
                  ? "bg-white text-warm-dark shadow-sm"
                  : "text-warm-gray hover:text-warm-dark"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-lg bg-sage px-4 py-1.5 text-[13px] font-bold text-white transition-all hover:bg-sage-deep hover:-translate-y-0.5"
        >
          <Plus size={14} />
          New Project
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sun to-craft-purple text-sm font-extrabold text-white">
          S
        </div>
      </div>
    </nav>
  );
}
