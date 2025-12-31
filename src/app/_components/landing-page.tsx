"use client";

import { ArrowRight, Sparkles, MessageSquare, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { LottieLogo } from "./lottie-logo";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const { isAuthenticated } = useKindeBrowserClient();
  const router = useRouter();

  const handleGoToApp = () => {
    router.push("/app");
  };
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Assistance",
      description: "Get intelligent help with advanced AI models optimized for your needs",
    },
    {
      icon: MessageSquare,
      title: "Smart Conversations",
      description: "Engage in natural, context-aware conversations with your AI assistant",
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Work together with your team in shared group chats and conversations",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security and privacy",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience instant responses with optimized performance",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LottieLogo />
              <h1 className="text-xl font-serif font-semibold text-foreground tracking-tight">
                LightShadow
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button 
                  onClick={handleGoToApp}
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all"
                >
                  Go to App
                </Button>
              ) : (
                <>
                  <LoginLink>
                    <Button variant="ghost" className="rounded-lg hover:bg-accent/50">
                      Sign In
                    </Button>
                  </LoginLink>
                  <RegisterLink>
                    <Button className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all">
                      Get Started
                    </Button>
                  </RegisterLink>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto space-y-10 mb-24">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Sparkles className="w-4 h-4" />
                Enterprise AI Platform
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground tracking-tight leading-[1.1]">
                AI-Powered
                <br />
                <span className="text-primary">Solutions</span>
                <br />
                <span className="text-4xl md:text-5xl lg:text-6xl font-normal">For Enterprise</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
                Cutting-edge diffusion models and AI assistance optimized for your business needs.
                Get intelligent help, collaborate seamlessly, and solve problems faster.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in animation-delay-200">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={handleGoToApp}
                  className="w-full sm:w-auto px-10 py-7 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Go to App
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              ) : (
                <>
                  <RegisterLink className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-10 py-7 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </RegisterLink>
                  <LoginLink className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-7 text-base font-semibold rounded-xl border-2 border-border/50 hover:bg-accent hover:border-border transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </LoginLink>
                </>
              )}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-border hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 100}ms` }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <LottieLogo />
              <p className="text-sm text-muted-foreground font-serif">
                © {new Date().getFullYear()} LightShadow. All rights reserved.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button 
                  onClick={handleGoToApp}
                  size="sm" 
                  className="rounded-lg shadow-sm"
                >
                  Go to App
                </Button>
              ) : (
                <>
                  <LoginLink>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      Sign In
                    </Button>
                  </LoginLink>
                  <RegisterLink>
                    <Button size="sm" className="rounded-lg shadow-sm">
                      Get Started
                    </Button>
                  </RegisterLink>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

