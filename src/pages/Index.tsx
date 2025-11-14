import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Sparkles, Heart, Brain, Users, MessageSquare, TrendingUp, Instagram, Twitter, Mail } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Recommendations",
      description: "Get personalized fragrance suggestions based on your preferences, mood, and occasion."
    },
    {
      icon: Heart,
      title: "Organize Your Collection",
      description: "Keep track of all your perfumes, create wishlists, and rate your favorites."
    },
    {
      icon: MessageSquare,
      title: "Voice Assistant",
      description: "Chat naturally with our AI consultant to discover your perfect scent match."
    },
    {
      icon: Users,
      title: "Community Feed",
      description: "Share your fragrance journey, follow enthusiasts, and discover trending scents."
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Understand your scent preferences with detailed insights and patterns."
    },
    {
      icon: Sparkles,
      title: "Knowledge Base",
      description: "Upload documents and PDFs to enhance the AI's perfume knowledge."
    }
  ];

  const testimonials = [
    {
      name: "Sophie Laurent",
      role: "Perfume Enthusiast",
      content: "ScentGenAI helped me discover fragrances I never would have found on my own. The AI recommendations are incredibly accurate!",
      avatar: "👩"
    },
    {
      name: "Marcus Chen",
      role: "Fragrance Collector",
      content: "Finally, a platform that understands my collection needs. The organization features are game-changing.",
      avatar: "👨"
    },
    {
      name: "Isabella Rodriguez",
      role: "Beauty Blogger",
      content: "The voice assistant feels like having a personal fragrance consultant. It's revolutionizing how I explore scents.",
      avatar: "👱‍♀️"
    }
  ];

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Navigation */}
      <nav className="border-b border-border/30 gradient-card backdrop-blur-xl shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Logo variant="full" />
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost-gold" 
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button 
                variant="premium"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <h1 className="text-6xl lg:text-7xl font-bold font-playfair gradient-primary bg-clip-text text-transparent leading-tight">
            Your Personal Scent AIssistant
          </h1>
          <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Discover, organize, and understand fragrances like never before with AI-powered recommendations and insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="premium"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg animate-glow-pulse"
            >
              <Sparkles className="h-5 w-5" strokeWidth={1.5} />
              Start Your Journey
            </Button>
            <Button 
              variant="hero"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold font-playfair text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to enhance your fragrance journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-elegant transition-smooth cursor-pointer animate-scale-in backdrop-blur-sm bg-card/80"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 rounded-[20px] gradient-accent flex items-center justify-center shadow-gold mx-auto group-hover:scale-110 transition-bounce">
                    <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} />
                  </div>
                  <CardTitle className="text-2xl text-center">{feature.title}</CardTitle>
                  <CardDescription className="text-center text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold font-playfair text-foreground mb-4">
            Loved by Fragrance Enthusiasts
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users discovering their perfect scents
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="gradient-card border-border/50 hover:shadow-elegant transition-smooth animate-scale-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-3xl shadow-glow">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 lg:px-8 py-20">
        <Card className="gradient-card border-primary/30 shadow-elegant animate-fade-in">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-5xl font-bold font-playfair gradient-primary bg-clip-text text-transparent">
              Ready to Discover Your Signature Scent?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join ScentGenAI today and transform your fragrance journey
            </p>
            <Button 
              variant="premium"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg animate-glow-pulse"
            >
              <Sparkles className="h-5 w-5" strokeWidth={1.5} />
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 gradient-card mt-20">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo variant="full" />
              <p className="text-sm text-muted-foreground">
                Your Personal Scent AIssistant
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 font-playfair">Product</h3>
              <ul className="space-y-2">
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">Features</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">Pricing</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 font-playfair">Company</h3>
              <ul className="space-y-2">
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">About</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">Blog</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-accent transition-smooth">Contact</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4 font-playfair">Connect</h3>
              <div className="flex gap-3">
                <button className="w-10 h-10 rounded-full bg-card hover:bg-accent/20 flex items-center justify-center transition-smooth hover:shadow-gold">
                  <Instagram className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </button>
                <button className="w-10 h-10 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center transition-smooth hover:shadow-elegant">
                  <Twitter className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </button>
                <button className="w-10 h-10 rounded-full bg-card hover:bg-accent/20 flex items-center justify-center transition-smooth hover:shadow-gold">
                  <Mail className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 mt-12 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ScentGenAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
