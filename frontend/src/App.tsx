import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useBackendStatus } from "./hooks/useBackendStatus";

const queryClient = new QueryClient();

const LoadingOverlay = ({ status }: { status: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-lg font-medium">
        {status === 'checking' ? 'Checking service status...' : 
         status === 'waking' ? 'Starting up the service...' : 
         'Connecting to service...'}
      </p>
    </div>
  </div>
);

const App = () => {
  const { status } = useBackendStatus();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {(status === 'checking' || status === 'waking') && <LoadingOverlay status={status} />}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
