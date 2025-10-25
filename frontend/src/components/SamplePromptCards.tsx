import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import config from '@/config/config';

interface SamplePrompt {
  icon: React.ElementType;
  title: string;
  prompt: string;
}

interface SamplePromptCardsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SamplePromptCards = ({ onSelectPrompt }: SamplePromptCardsProps) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 sm:mb-6"
      >
        <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 sm:mb-2">
          {config.ui.samplePromptsHeader.title}
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground px-2">
          {config.ui.samplePromptsHeader.subtitle}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {config.samplePrompts.map((sample, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-[1.02] hover:border-primary/50 h-full"
              onClick={() => onSelectPrompt(sample.prompt)}
            >
              <CardContent className="p-3 sm:p-4 h-full flex flex-col">
                <div className="flex items-start gap-2 sm:gap-3 flex-1">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-primary/10 flex-shrink-0">
                    <sample.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 truncate">{sample.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
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
