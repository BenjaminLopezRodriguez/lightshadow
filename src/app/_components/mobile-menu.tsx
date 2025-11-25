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
import { LottieLogo } from "@/app/_components/lottie-logo";

export function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden bg-white/10 border border-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
          <Menu className="w-4 h-4" />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-[#0a0a0a] border-white/10 w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <LottieLogo
              width={32}
              height={32}
              className="rounded-lg"
              playOnHover={false}
            />
            LightShadow
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <SheetClose asChild>
            <Link
              href="#features"
              className="text-base font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <Sparkles className="w-5 h-5" />
              Features
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#technology"
              className="text-base font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <Cpu className="w-5 h-5" />
              Technology
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#enterprise"
              className="text-base font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <Building2 className="w-5 h-5" />
              Enterprise
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="#research"
              className="text-base font-medium text-white/60 hover:text-white transition-colors flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5"
            >
              <BookOpen className="w-5 h-5" />
              Research
            </Link>
          </SheetClose>
          <div className="pt-4 border-t border-white/10 mt-4">
            <div className="flex items-center gap-3 mb-4 px-3">
              <Avatar className="w-10 h-10 bg-white/10 border border-white/10">
                <AvatarFallback className="text-white text-sm font-semibold">A</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white">Account</span>
            </div>
            <Button className="w-full bg-white text-black hover:bg-white/90 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">
              GET STARTED
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

