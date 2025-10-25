import { FileText, Scale, Shield, Users, Handshake, Building } from 'lucide-react';

const config = {
  // App information
  app: {
    name: "Legal Document Generator",
    version: "1.0.0",
    description: "AI-powered legal document generation platform"
  },

  // Sample prompt templates
  samplePrompts: [
    {
      icon: FileText,
      title: "Terms of Service",
      prompt: "Create comprehensive Terms of Service for a SaaS platform, including user obligations, service availability, intellectual property rights, limitation of liability, and termination clauses."
    },
    {
      icon: Shield,
      title: "Privacy Policy", 
      prompt: "Generate a GDPR-compliant privacy policy for an e-commerce website, covering data collection, processing purposes, user rights, cookie usage, and third-party integrations."
    },
    {
      icon: Handshake,
      title: "Partnership Agreement",
      prompt: "Draft a comprehensive business partnership agreement for a joint venture, including detailed profit and loss sharing, management responsibilities, decision-making processes, capital contributions, dispute resolution mechanisms, exit strategies, dissolution procedures, and extensive legal protections."
    },
    {
      icon: Users,
      title: "Employment Contract",
      prompt: "Create a comprehensive employment contract for a senior software developer position, including detailed job responsibilities, compensation structure, benefits package, confidentiality obligations, intellectual property rights, non-compete clauses, performance expectations, termination procedures, and all necessary legal protections."
    },
    {
      icon: Scale,
      title: "Memorandum of Understanding",
      prompt: "Generate an MoU between a technology startup and a university for research collaboration, outlining objectives, resources, intellectual property ownership, and publication rights."
    },
    {
      icon: Building,
      title: "Service Agreement",
      prompt: "Draft a professional service agreement for IT consulting services, including scope of work, deliverables, payment terms, performance standards, and data protection obligations."
    }
  ],

  // Page content
  ui: {
    samplePromptsHeader: {
      title: "Get Started with a Template",
      subtitle: "Choose a sample prompt below or write your own to begin generating your document"
    }
  }
};

export default config;