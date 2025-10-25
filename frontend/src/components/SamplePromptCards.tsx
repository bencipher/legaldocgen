import { motion } from 'framer-motion';
import { FileText, Scale, Shield, Users, Handshake, Building } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface SamplePrompt {
  icon: React.ElementType;
  title: string;
  prompt: string;
}

const samplePrompts: SamplePrompt[] = [
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
];

interface SamplePromptCardsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SamplePromptCards = ({ onSelectPrompt }: SamplePromptCardsProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">
          Get Started with a Template
        </h2>
        <p className="text-muted-foreground">
          Choose a sample prompt below or write your own to begin generating your document
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {samplePrompts.map((sample, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 hover:border-primary/50"
              onClick={() => onSelectPrompt(sample.prompt)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-primary/10">
                    <sample.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{sample.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {sample.prompt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
