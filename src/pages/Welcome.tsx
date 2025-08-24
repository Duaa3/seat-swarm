import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, MapPin, Calendar, TrendingUp, Shield, Zap, Target } from "lucide-react";
import { Link } from "react-router-dom";

const Welcome = () => {
  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "AI-powered schedule generation based on employee preferences and office capacity",
      color: "bg-gradient-to-br from-primary to-primary-glow"
    },
    {
      icon: MapPin,
      title: "Interactive Seating Maps",
      description: "Visual floor plans with real-time seat assignments and occupancy tracking",
      color: "bg-gradient-to-br from-accent to-accent/80"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Optimize team proximity and ensure co-presence for collaborative work",
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Comprehensive reporting on office utilization and employee satisfaction",
      color: "bg-gradient-to-br from-green-500 to-green-600"
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Secure access control for admins, managers, and employees",
      color: "bg-gradient-to-br from-accent to-primary"
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Live notifications and instant schedule updates across the organization",
      color: "bg-gradient-to-br from-secondary to-accent"
    }
  ];

  const benefits = [
    "Reduce office capacity conflicts by up to 80%",
    "Improve employee satisfaction with preferred work arrangements",
    "Optimize space utilization and reduce real estate costs",
    "Enhance team collaboration through strategic seating",
    "Streamline hybrid work management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10" />
        <div className="relative container mx-auto px-6 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Target className="w-4 h-4 mr-2" />
              Smart Office Management Platform
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Smart Office Seating Planner
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Transform your hybrid workplace with intelligent seating assignments, 
              team collaboration optimization, and comprehensive analytics. 
              Make office planning effortless and employee-centric.
            </p>

            <div className="flex justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of companies already optimizing their hybrid workplace
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-background/60 border border-border/50">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage your hybrid office efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-glow transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Welcome;