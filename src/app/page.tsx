import Link from "next/link";
import Image from "next/image";
import { Play, Cpu, Building2, DollarSign, BookOpen, Brain, Zap, Layers, TrendingUp, Gauge, Clock, HardDrive, Heart, Rocket, FlaskConical, Code, FileText, ArrowRight, Sparkles, Shield, Users, Globe, CheckCircle2, Star, Github, Twitter, Linkedin, Mail } from "lucide-react";

import { api, HydrateClient } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MobileMenu } from "@/app/_components/mobile-menu";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="bg-linear-to-b from-blue-500 via-blue-600 to-blue-700 min-h-screen relative scroll-smooth">
        {/* Navigation */}
        <header className="sticky top-0 z-50 bg-amber-50/98 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 border-b-2 border-amber-200/80 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="LightShadow Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <h1 className="text-xl md:text-2xl font-bold font-serif text-blue-900">LightShadow</h1>
            </Link>
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <Link href="#features" className="text-sm font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Features
              </Link>
              <Link href="#technology" className="text-sm font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                Technology
              </Link>
              <Link href="#enterprise" className="text-sm font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Enterprise
              </Link>
              <Link href="#research" className="text-sm font-serif font-semibold text-blue-800 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Research
              </Link>
              <Avatar className="w-9 h-9 bg-blue-100 border-2 border-blue-300 ml-4">
                <AvatarFallback className="text-blue-900 text-sm font-bold font-serif">A</AvatarFallback>
              </Avatar>
              <Button className="bg-blue-600 hover:bg-blue-700 text-amber-50 px-5 py-2.5 rounded-lg text-sm font-bold font-serif transition-colors border-2 border-blue-800 ml-2">
                GET STARTED
              </Button>
            </nav>
            <MobileMenu />
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-serif text-white/90 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-200" />
                <span>SOC 2 Certified</span>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-3xl overflow-hidden border-2 border-amber-200/80 bg-linear-to-br from-amber-50 to-amber-100 flex items-center justify-center shadow-2xl ring-4 ring-amber-200/20">
                <Image
                  src="/logo.png"
                  alt="LightShadow Logo"
                  width={224}
                  height={224}
                  className="object-contain p-4"
                  priority
                />
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-serif text-white leading-[1.1] tracking-tight">
                Enterprise AI diffusion models,<br className="hidden sm:block" /> built for scale
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-serif text-white/95 max-w-3xl mx-auto leading-relaxed">
                LightShadow delivers production-ready diffusion models with enterprise-grade security, reliability, and performance.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto pt-8">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white drop-shadow-lg">500+</div>
                <div className="text-xs sm:text-sm font-serif text-white/90 mt-2 font-medium">Enterprise Clients</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white drop-shadow-lg">99.9%</div>
                <div className="text-xs sm:text-sm font-serif text-white/90 mt-2 font-medium">Uptime SLA</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white drop-shadow-lg">&lt;300ms</div>
                <div className="text-xs sm:text-sm font-serif text-white/90 mt-2 font-medium">Avg Latency</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-amber-50 px-8 py-4 rounded-xl font-bold font-serif text-base sm:text-lg transition-all duration-300 border-2 border-blue-800/50 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5">
                <Play className="w-5 h-5" />
                Start Free Trial
              </Button>
              <Button className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 text-blue-900 px-8 py-4 rounded-xl font-bold font-serif text-base sm:text-lg transition-all duration-300 border-2 border-amber-300/80 shadow-lg hover:shadow-xl flex items-center gap-2 hover:-translate-y-0.5">
                <Code className="w-5 h-5" />
                View API Docs
              </Button>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="relative z-10 bg-linear-to-b from-blue-500 via-blue-500 to-blue-600">
          {/* Features Section */}
          <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-12 md:mb-16">
              <Badge className="bg-amber-100 text-blue-900 border-blue-200 px-4 py-1.5 text-sm font-bold font-serif">
                Why LightShadow
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight">
                Built for modern enterprises
              </h2>
              <p className="text-lg sm:text-xl font-serif text-white/90 max-w-3xl mx-auto leading-relaxed">
                Everything you need to deploy AI diffusion models at scale
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-300">
                <CardHeader className="px-0 pb-0">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-md ring-2 ring-blue-200/50">
                    <Shield className="w-6 h-6 text-blue-700" />
                  </div>
                  <CardTitle className="text-lg font-bold font-serif text-blue-900">Enterprise Security</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-4">
                  <p className="text-sm font-serif text-gray-700 leading-relaxed">
                    SOC 2 Type II certified with end-to-end encryption and comprehensive audit logs.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-300">
                <CardHeader className="px-0 pb-0">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-md ring-2 ring-blue-200/50">
                    <Zap className="w-6 h-6 text-blue-700" />
                  </div>
                  <CardTitle className="text-lg font-bold font-serif text-blue-900">High Performance</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-4">
                  <p className="text-sm font-serif text-gray-700 leading-relaxed">
                    Sub-300ms latency with 99.9% uptime SLA. Auto-scaling infrastructure handles any load.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-300">
                <CardHeader className="px-0 pb-0">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-md ring-2 ring-blue-200/50">
                    <Users className="w-6 h-6 text-blue-700" />
                  </div>
                  <CardTitle className="text-lg font-bold font-serif text-blue-900">Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-4">
                  <p className="text-sm font-serif text-gray-700 leading-relaxed">
                    Built-in version control, team management, and role-based access controls.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-300">
                <CardHeader className="px-0 pb-0">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 shadow-md ring-2 ring-blue-200/50">
                    <Globe className="w-6 h-6 text-blue-700" />
                  </div>
                  <CardTitle className="text-lg font-bold font-serif text-blue-900">Global Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-4">
                  <p className="text-sm font-serif text-gray-700 leading-relaxed">
                    Deploy in multiple regions with edge caching for optimal performance worldwide.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Technology Section */}
          <section id="technology" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-12 md:mb-16">
              <Badge className="bg-amber-100 text-blue-900 border-blue-200 px-4 py-1.5 text-sm font-bold font-serif">
                Technology
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight">
                State-of-the-art models
              </h2>
              <p className="text-lg sm:text-xl font-serif text-white/90 max-w-3xl mx-auto leading-relaxed">
                Powered by cutting-edge research and optimized for production workloads
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative w-full h-52 sm:h-56 md:h-64 mb-6 rounded-xl overflow-hidden border-2 border-blue-200/80 shadow-lg group">
                  <div className="absolute inset-0 bg-linear-to-t from-blue-900/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop"
                    alt="Chemical Molecular Structure"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardHeader className="px-0 pb-0">
                  <CardTitle className="text-xl sm:text-2xl font-bold font-serif text-blue-900">Model Architecture</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-6">
                  <div className="space-y-3">
                    <div className="bg-linear-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-300 transition-colors">
                        <Brain className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-bold font-serif text-blue-900 text-base">Stable Diffusion XL 1.0</div>
                        <div className="text-sm font-serif text-gray-700 mt-1.5 leading-relaxed">State-of-the-art foundation model</div>
                      </div>
                    </div>
                    <div className="bg-linear-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-300 transition-colors">
                        <Zap className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-bold font-serif text-blue-900 text-base">2.5B+ Parameters</div>
                        <div className="text-sm font-serif text-gray-700 mt-1.5 leading-relaxed">Optimized for inference efficiency</div>
                      </div>
                    </div>
                    <div className="bg-linear-to-r from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-start gap-3 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-300 transition-colors">
                        <Layers className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-bold font-serif text-blue-900 text-base">Multi-modal Support</div>
                        <div className="text-sm font-serif text-gray-700 mt-1.5 leading-relaxed">Text, image, and data inputs</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative w-full h-52 sm:h-56 md:h-64 mb-6 rounded-xl overflow-hidden border-2 border-blue-200/80 shadow-lg group">
                  <div className="absolute inset-0 bg-linear-to-t from-blue-900/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
                    alt="Laboratory Equipment and Research"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardHeader className="px-0 pb-0">
                  <CardTitle className="text-xl sm:text-2xl font-bold font-serif text-blue-900">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl border-2 border-blue-200/80 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-300 transition-colors">
                        <TrendingUp className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">5.2</div>
                      <div className="text-xs sm:text-sm font-serif text-gray-700 mt-2 font-medium">FID Score</div>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl border-2 border-blue-200/80 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-300 transition-colors">
                        <Gauge className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">32.1</div>
                      <div className="text-xs sm:text-sm font-serif text-gray-700 mt-2 font-medium">CLIP Score</div>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl border-2 border-blue-200/80 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-300 transition-colors">
                        <Clock className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">0.3s</div>
                      <div className="text-xs sm:text-sm font-serif text-gray-700 mt-2 font-medium">Inference</div>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-5 rounded-xl border-2 border-blue-200/80 text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-300 transition-colors">
                        <HardDrive className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold font-serif text-blue-900">8GB</div>
                      <div className="text-xs sm:text-sm font-serif text-gray-700 mt-2 font-medium">GPU Memory</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-white leading-tight">
                Trusted by industry leaders
              </h2>
              <p className="text-base sm:text-lg font-serif text-white/80">
                Join 500+ enterprises using LightShadow in production
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm font-serif text-gray-700 mb-4 leading-relaxed">
                    "LightShadow has transformed our AI capabilities. The performance and reliability are unmatched."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-blue-100 border-2 border-blue-300">
                      <AvatarFallback className="text-blue-900 text-xs font-bold font-serif">JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold font-serif text-blue-900">Jane Doe</div>
                      <div className="text-xs font-serif text-gray-600">CTO, TechCorp</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <p className="text-sm font-serif text-gray-700 mb-4 leading-relaxed">
                    "The API is incredibly well-designed. We were up and running in minutes, not days."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-blue-100 border-2 border-blue-300 shadow-md">
                      <AvatarFallback className="text-blue-900 text-xs font-bold font-serif">SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold font-serif text-blue-900">Sarah Miller</div>
                      <div className="text-xs font-serif text-gray-600">Lead Engineer, InnovateLab</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <p className="text-sm font-serif text-gray-700 mb-4 leading-relaxed">
                    "Enterprise-grade security and performance. Exactly what we needed for our scale."
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 bg-blue-100 border-2 border-blue-300 shadow-md">
                      <AvatarFallback className="text-blue-900 text-xs font-bold font-serif">RW</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold font-serif text-blue-900">Robert Wang</div>
                      <div className="text-xs font-serif text-gray-600">VP Engineering, DataFlow</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Enterprise Section */}
          <section id="enterprise" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-12 md:mb-16">
              <Badge className="bg-amber-100 text-blue-900 border-blue-200 px-4 py-1.5 text-sm font-bold font-serif">
                Use Cases
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight">
                Powering innovation across industries
              </h2>
              <p className="text-lg sm:text-xl font-serif text-white/90 max-w-3xl mx-auto leading-relaxed">
                From healthcare to research, LightShadow enables breakthrough applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative w-full h-48 sm:h-52 mb-5 rounded-xl overflow-hidden border-2 border-blue-200/80 shadow-lg group">
                  <div className="absolute inset-0 bg-linear-to-t from-blue-900/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop"
                    alt="Chemical Research Laboratory"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="px-0 pb-0">
                  <CardTitle className="text-lg sm:text-xl font-bold font-serif text-blue-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-600" />
                    Healthcare Innovation
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-3">
                  <p className="font-serif text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                    Revolutionizing medical imaging with AI-assisted diagnostics and synthetic data generation.
                  </p>
                  <Badge className="bg-blue-100 text-blue-900 border-2 border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold font-serif shadow-sm">
                    90% faster diagnosis
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative w-full h-48 sm:h-52 mb-5 rounded-xl overflow-hidden border-2 border-blue-200/80 shadow-lg group">
                  <div className="absolute inset-0 bg-linear-to-t from-blue-900/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop"
                    alt="Nature Research and Discovery"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="px-0 pb-0">
                  <CardTitle className="text-lg sm:text-xl font-bold font-serif text-blue-900 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-600" />
                    Enterprise Productivity
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-3">
                  <p className="font-serif text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                    Streamlining design workflows and product development cycles with AI-powered tools.
                  </p>
                  <Badge className="bg-blue-100 text-blue-900 border-2 border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold font-serif shadow-sm">
                    3x faster prototyping
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative w-full h-48 sm:h-52 mb-5 rounded-xl overflow-hidden border-2 border-blue-200/80 shadow-lg group">
                  <div className="absolute inset-0 bg-linear-to-t from-blue-900/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1532619675605-1ede6c9ed2d4?w=600&h=400&fit=crop"
                    alt="Scientific Research Laboratory"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="px-0 pb-0">
                  <CardTitle className="text-lg sm:text-xl font-bold font-serif text-blue-900 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                    Scientific Discovery
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pt-3">
                  <p className="font-serif text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                    Accelerating research breakthroughs with advanced visualization and data analysis.
                  </p>
                  <Badge className="bg-blue-100 text-blue-900 border-2 border-blue-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold font-serif shadow-sm">
                    500+ published papers
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* API Section */}
          <section id="research" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-10 md:mb-12">
              <Badge className="bg-amber-100 text-blue-900 border-blue-200 px-4 py-1.5 text-sm font-bold font-serif">
                Developer Experience
              </Badge>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Code className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200" />
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight">
                  Developer-friendly API
                </h2>
                <Code className="w-8 h-8 sm:w-10 sm:h-10 text-amber-200" />
              </div>
              <p className="text-lg sm:text-xl font-serif text-white/90 max-w-2xl mx-auto leading-relaxed">
                Simple, powerful, and scalable integration. Get started in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10 items-center">
              <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 rounded-xl overflow-hidden border-2 border-amber-200/80 shadow-2xl order-2 lg:order-1 group">
                <div className="absolute inset-0 bg-linear-to-t from-blue-900/20 to-transparent z-10"></div>
                <Image
                  src="https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=800&h=600&fit=crop"
                  alt="Nature and Chemical Research"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-6 sm:p-8 rounded-2xl shadow-xl order-1 lg:order-2">
                <CardContent className="px-0">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100/50 p-5 sm:p-6 rounded-xl border-2 border-blue-200/80 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner">
                    <div className="text-blue-900 mb-4 font-bold text-sm">// Generate high-quality images</div>
                    <div className="space-y-1.5 sm:space-y-2 text-gray-800 leading-relaxed">
                      <div><span className="text-purple-600">const</span> response = <span className="text-yellow-600">await</span> fetch(<span className="text-green-600">'/api/generate'</span>, &#123;</div>
                      <div className="ml-3 sm:ml-4">method: <span className="text-green-600">'POST'</span>,</div>
                      <div className="ml-3 sm:ml-4">headers: &#123; <span className="text-green-600">'Content-Type'</span>: <span className="text-green-600">'application/json'</span> &#125;,</div>
                      <div className="ml-3 sm:ml-4">body: JSON.stringify(&#123;</div>
                      <div className="ml-6 sm:ml-8">prompt: <span className="text-green-600">"A futuristic cityscape"</span>,</div>
                      <div className="ml-6 sm:ml-8">width: <span className="text-blue-600">1024</span>,</div>
                      <div className="ml-6 sm:ml-8">height: <span className="text-blue-600">768</span></div>
                      <div className="ml-3 sm:ml-4">&#125;)</div>
                      <div>&#125;);</div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1 border-2 border-blue-200/80 text-blue-900 hover:bg-blue-50 hover:border-blue-300 font-serif shadow-sm hover:shadow-md transition-all duration-200">
                      <Github className="w-4 h-4 mr-2" />
                      View SDK
                    </Button>
                    <Button variant="outline" className="flex-1 border-2 border-blue-200/80 text-blue-900 hover:bg-blue-50 hover:border-blue-300 font-serif shadow-sm hover:shadow-md transition-all duration-200">
                      <FileText className="w-4 h-4 mr-2" />
                      Full Docs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Research Publications */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
            <div className="text-center space-y-4 mb-10 md:mb-12">
              <Badge className="bg-amber-100 text-blue-900 border-blue-200 px-4 py-1.5 text-sm font-bold font-serif">
                Research
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight">
                Published Research
              </h2>
              <p className="text-base sm:text-lg font-serif text-white/90">
                Featured in top-tier conferences and journals
              </p>
            </div>

            <div className="space-y-4 md:space-y-5 max-w-4xl mx-auto">
              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-5 sm:p-6 md:p-7 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-start space-x-4 sm:space-x-5">
                    <Badge className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-xl! flex items-center justify-center border-2 border-blue-300 p-0">
                      <span className="font-bold font-serif text-blue-900 text-xs sm:text-sm">ICML</span>
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg md:text-xl font-bold font-serif text-blue-900 mb-2 leading-tight flex items-start gap-2">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        Efficient Diffusion Models for Enterprise Applications
                      </h4>
                      <p className="font-serif text-gray-700 mb-1.5 text-sm sm:text-base ml-7">International Conference on Machine Learning 2024</p>
                      <p className="text-xs sm:text-sm font-serif text-gray-600 leading-relaxed ml-7">Optimizing inference speed while maintaining quality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-5 sm:p-6 md:p-7 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-start space-x-4 sm:space-x-5">
                    <Badge className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl! flex items-center justify-center border-2 border-blue-300/80 p-0 shadow-md">
                      <span className="font-bold font-serif text-blue-900 text-xs sm:text-sm">NeurIPS</span>
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg md:text-xl font-bold font-serif text-blue-900 mb-2 leading-tight flex items-start gap-2">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        Privacy-Preserving Generative Models
                      </h4>
                      <p className="font-serif text-gray-700 mb-1.5 text-sm sm:text-base ml-7">Neural Information Processing Systems 2023</p>
                      <p className="text-xs sm:text-sm font-serif text-gray-600 leading-relaxed ml-7">Differential privacy in diffusion models</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200/80 p-5 sm:p-6 md:p-7 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="px-0">
                  <div className="flex items-start space-x-4 sm:space-x-5">
                    <Badge className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-br from-blue-100 to-blue-200 rounded-xl! flex items-center justify-center border-2 border-blue-300/80 p-0 shadow-md">
                      <span className="font-bold font-serif text-blue-900 text-xs sm:text-sm">Nature</span>
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg md:text-xl font-bold font-serif text-blue-900 mb-2 leading-tight flex items-start gap-2">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        Multi-Modal Diffusion for Scientific Discovery
                      </h4>
                      <p className="font-serif text-gray-700 mb-1.5 text-sm sm:text-base ml-7">Nature Machine Intelligence 2023</p>
                      <p className="text-xs sm:text-sm font-serif text-gray-600 leading-relaxed ml-7">Cross-domain applications in research</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 md:pb-32">
            <Card className="bg-linear-to-br from-amber-50 via-amber-100/80 to-amber-50 border-2 border-amber-200/80 rounded-3xl p-8 sm:p-10 md:p-12 lg:p-14 text-center shadow-2xl ring-4 ring-amber-200/20">
              <CardContent className="px-0">
                <div className="max-w-3xl mx-auto space-y-6">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-blue-900 leading-tight">
                    Ready to get started?
                  </h3>
                  <p className="text-lg sm:text-xl md:text-2xl font-serif text-gray-700 max-w-2xl mx-auto leading-relaxed">
                    Join leading enterprises building with AI diffusion models. Start your free trial today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Button className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-amber-50 px-8 py-4 rounded-xl font-bold font-serif text-base sm:text-lg transition-all duration-300 border-2 border-blue-800/50 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-0.5 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Start Free Trial
                    </Button>
                    <Button className="w-full sm:w-auto bg-linear-to-r from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-blue-900 px-8 py-4 rounded-xl font-bold font-serif text-base sm:text-lg transition-all duration-300 border-2 border-amber-300/80 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5" />
                      Schedule Demo
                    </Button>
                  </div>
                  <div className="mt-6 pt-4">
                    <Separator className="bg-amber-200 mb-4" />
                    <p className="text-xs sm:text-sm font-serif text-gray-600">
                      No credit card required • 14-day free trial • Enterprise support included • SOC 2 certified
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-blue-600 border-t border-blue-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src="/logo.png"
                    alt="LightShadow Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                  <h3 className="text-xl font-bold font-serif text-white">LightShadow</h3>
                </div>
                <p className="text-sm font-serif text-white/80 max-w-md leading-relaxed">
                  Enterprise AI diffusion models built for scale. Trusted by 500+ companies worldwide.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold font-serif text-white mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><Link href="#features" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#technology" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Technology</Link></li>
                  <li><Link href="#research" className="text-sm font-serif text-white/80 hover:text-white transition-colors">API</Link></li>
                  <li><Link href="#research" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Research</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold font-serif text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-sm font-serif text-white/80 hover:text-white transition-colors">About</Link></li>
                  <li><Link href="#" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="#" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="#" className="text-sm font-serif text-white/80 hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
            <Separator className="bg-blue-400 mb-8" />
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs font-serif text-white/60">
                © {new Date().getFullYear()} LightShadow. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <Link href="#" className="text-white/60 hover:text-white transition-colors" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-white/60 hover:text-white transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-white/60 hover:text-white transition-colors" aria-label="Email">
                  <Mail className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}
