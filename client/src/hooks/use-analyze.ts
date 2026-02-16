import { useMutation } from "@tanstack/react-query";
import { api, type N8nResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAnalyzeTicker() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ticker: string) => {
      // Small artificial delay to simulate "reeling in" the fish if API is too fast
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await fetch(api.analyze.path, {
        method: api.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Не удалось поймать данные");
      }

      const data = await res.json();
      
      // Ensure the "reeling" animation plays for at least 1.5s
      await minDelay;
      
      return api.analyze.responses[200].parse(data);
    },
    onError: (error) => {
      toast({
        title: "Сорвалось!",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "ЕСТЬ КОНТАКТ!",
        description: "Крупная рыба на крючке! Анализ готов.",
        className: "bg-primary text-primary-foreground border-none font-bold",
      });
    },
  });
}
