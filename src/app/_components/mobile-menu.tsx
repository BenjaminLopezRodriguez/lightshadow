"use client";

import Link from "next/link";
import { Menu, Sparkles, Cpu, Building2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden bg-blue-600 hover:bg-blue-700 text-amber-50 px-4 py-2 rounded-lg text-sm font-bold font-serif transition-colors border-2 border-blue-800 flex items-center gap-2">
          <Menu className="w-4 h-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-amber-50 border-amber-200 w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold font-serif text-blue-900 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="LightShadow Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            LightShadow
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <SheetClose asChild>
            <Link
              href="#features"
              className="text-base font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-50"
            >
              <Sparkles className="w-5 h-5" />
              Features
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#technology"
              className="text-base font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-50"
            >
              <Cpu className="w-5 h-5" />
              Technology
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#enterprise"
              className="text-base font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-50"
            >
              <Building2 className="w-5 h-5" />
              Enterprise
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#research"
              className="text-base font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-50"
            >
              <BookOpen className="w-5 h-5" />
              Research
            </Link>
          </SheetClose>
          <div className="pt-4 border-t border-amber-200 mt-4">
            <div className="flex items-center gap-3 mb-4 px-3">
              <Avatar className="w-10 h-10 bg-blue-100 border-2 border-blue-300">
                <AvatarFallback className="text-blue-900 text-sm font-bold font-serif">A</AvatarFallback>
              </Avatar>
              <span className="text-sm font-serif font-semibold text-blue-900">Account</span>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-amber-50 px-5 py-2.5 rounded-lg text-sm font-bold font-serif transition-colors border-2 border-blue-800">
              GET STARTED
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

