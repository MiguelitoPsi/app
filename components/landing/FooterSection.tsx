"use client";

import Image from "next/image";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 sm:py-14">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <div className="overflow-hidden rounded-lg bg-white p-0.5 shadow-sm">
            <Image
              alt="Logo Nepsis"
              className="rounded-md"
              height={24}
              src="/logo.jpg"
              width={24}
            />
          </div>
          <span className="font-black text-base tracking-tight text-slate-900">
            Nepsis
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link
            href="/privacy"
            className="transition-colors hover:text-slate-700"
          >
            Privacidade
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-slate-700"
          >
            Termos
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Nepsis. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
