"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Map, User } from "lucide-react";
import { cn } from "../../../lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", icon: Camera, label: "제보" },
  { href: "/map", icon: Map, label: "지도" },
  { href: "/my", icon: User, label: "마이" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="absolute bottom-0 left-0 w-full z-40 h-16 bg-white border-t border-gray-100 flex justify-around items-center pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              isActive ? "text-blue-500" : "text-gray-400"
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
