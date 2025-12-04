import { Logo } from "@/components/Logo";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Droplet, Wind, Flower2 } from "lucide-react";
const Index = () => {
  return <div className="min-h-screen bg-[#0E2A47]">
      {/* Navigation */}
      <nav className="bg-[#1C3B63]/80 backdrop-blur-sm border-b border-[#FF2E92]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo variant="full" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Early Access Badge */}
          <div className="inline-flex items-center gap-2 bg-[#1C3B63] text-[#F7B731] px-5 py-2 rounded-full text-sm font-medium mb-8 border border-[#F7B731]/30">
            <Sparkles className="h-4 w-4" />
            Early Access
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-playfair">
            Your Personal
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E92] to-[#F7B731] mt-2">
              Scent AIssistant
            </span>
          </h1>

          {/* Description - 2 lines */}
          <div className="space-y-3 mb-10">
            <p className="text-xl text-[#B0C4DE] leading-relaxed max-w-2xl mx-auto">
              An intelligent companion for perfume lovers.
            </p>
            <p className="text-xl text-[#B0C4DE] leading-relaxed max-w-2xl mx-auto">
              Organize your collection, discover new scents, and understand fragrances through the lens of AI.
            </p>
          </div>

          {/* Waitlist Form */}
          <WaitlistForm variant="hero" className="mb-6" />

          {/* Small text */}
          <p className="text-sm text-[#B0C4DE]/70">
            Be among the first to explore your personal scent universe
          </p>
        </div>
      </section>

      {/* What Is ScentGenAI Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-playfair">
            What Is ScentGenAI?
          </h2>
          <p className="text-lg text-[#B0C4DE] leading-relaxed mb-4">
            ScentGenAI is an AI-powered platform designed for people who care about fragrance.
          </p>
          <p className="text-lg text-[#B0C4DE] leading-relaxed">It helps you track what you own, learn what you love, 
and discover new perfumes with intelligence and style.</p>
        </div>
      </section>

      {/* What Makes It Different */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-playfair">
            What Makes It Different
          </h2>
          <p className="text-xl text-[#B0C4DE]">Built for curiosity, not commerce</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Personal Collection */}
          <Card className="bg-[#1C3B63] border border-[#F7B731]/20 hover:border-[#F7B731]/50 hover:shadow-2xl transition-all rounded-3xl">
            <CardContent className="p-8">
              <div className="p-3 bg-gradient-to-br from-[#F7B731] to-[#FF2E92] rounded-2xl w-fit mb-6">
                <Droplet className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 font-playfair">
                Personal Collection
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Keep track of your own fragrances, organize by mood or occasion, and never lose sight of your scent wardrobe.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Contextual Discovery */}
          <Card className="bg-[#1C3B63] border border-[#FF2E92]/20 hover:border-[#FF2E92]/50 hover:shadow-2xl transition-all rounded-3xl">
            <CardContent className="p-8">
              <div className="p-3 bg-gradient-to-br from-[#FF2E92] to-[#F7B731] rounded-2xl w-fit mb-6">
                <Wind className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 font-playfair">
                Contextual Discovery
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Find fragrances that fit the moment — weather, emotion, or event.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: AI-Powered Insights */}
          <Card className="bg-[#1C3B63] border border-[#F7B731]/20 hover:border-[#F7B731]/50 hover:shadow-2xl transition-all rounded-3xl">
            <CardContent className="p-8">
              <div className="p-3 bg-gradient-to-br from-[#F7B731] to-[#FF2E92] rounded-2xl w-fit mb-6">
                <Flower2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 font-playfair">
                AI-Powered Insights
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Mood-based matching, note recognition, and scent similarity analysis powered by advanced AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features in Development - Detailed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-playfair">
            Features in Development
          </h2>
          <p className="text-xl text-[#B0C4DE]">What we're building for early access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Feature 1: AI Chat */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-[#FF2E92] to-[#F7B731] rounded-xl">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 font-playfair">
                AI Chat Interface
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Talk to the Perfume Genie. Ask for recommendations, learn about notes, or explore your collection through conversation.
              </p>
            </div>
          </div>

          {/* Feature 2: Smart Organization */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-[#F7B731] to-[#FF2E92] rounded-xl">
                <Droplet className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 font-playfair">
                Smart Organization
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Create custom collections, track your wishlist, and manage your fragrance library with ease.
              </p>
            </div>
          </div>

          {/* Feature 3: Mood-Based Search */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-[#FF2E92] to-[#F7B731] rounded-xl">
                <Wind className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 font-playfair">
                Mood-Based Search
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Filter by mood, occasion, or season. Find fragrances that match the moment, not just the notes.
              </p>
            </div>
          </div>

          {/* Feature 4: Note Recognition */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="p-2 bg-gradient-to-br from-[#F7B731] to-[#FF2E92] rounded-xl">
                <Flower2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2 font-playfair">
                Note Recognition
              </h3>
              <p className="text-[#B0C4DE] leading-relaxed">
                Understand fragrance composition. Learn what makes a scent work and discover similar profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-[#FF2E92] to-[#F7B731] rounded-3xl p-12 md:p-16 text-white shadow-2xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">
              Join the Waitlist
            </h2>
            <p className="text-xl mb-10 text-white/90 leading-relaxed">
              We're opening access to a small group of fragrance enthusiasts first. 
              If you're curious about a smarter way to explore perfume, we'd love to have you.
            </p>
            
            {/* Waitlist Form - CTA variant */}
            <WaitlistForm variant="cta" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C3B63] border-t border-[#F7B731]/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <Logo variant="full" />

            {/* Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <a href="#contact" className="text-[#B0C4DE] hover:text-[#FF2E92] transition-colors">
                Contact
              </a>
              <a href="#privacy" className="text-[#B0C4DE] hover:text-[#FF2E92] transition-colors">
                Privacy Policy
              </a>
              <a href="#about" className="text-[#B0C4DE] hover:text-[#FF2E92] transition-colors">
                About Us
              </a>
            </div>

            {/* Copyright */}
            <p className="text-[#B0C4DE] text-sm">
              © 2025 ScentGenAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;