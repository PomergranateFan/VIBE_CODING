import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Fish, Anchor, Star, X } from "lucide-react";

import { useAnalyzeTicker } from "@/hooks/use-analyze";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { MoneyButton } from "@/components/MoneyButton";
import { QuoteMarquee } from "@/components/QuoteMarquee";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Input } from "@/components/ui/input";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const searchSchema = z.object({
  ticker: z.string().min(1, "Введите тикер!"),
});

export default function Home() {
  const { toast } = useToast();
  const { mutate: analyze, data, isPending, error } = useAnalyzeTicker();
  const { favorites, isFavorite, removeFavorite, toggleFavorite } = useFavorites();

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { ticker: "" },
  });

  const runTickerAnalysis = (ticker: string) => {
    const normalized = ticker.trim().toUpperCase();
    if (!normalized) {
      return;
    }

    form.setValue("ticker", normalized, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    analyze(normalized);
  };

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    runTickerAnalysis(values.ticker);
  };

  const onToggleFavorite = () => {
    if (!data) {
      return;
    }

    const action = toggleFavorite(data.ticker, data.company_name);
    toast({
      title: action === "added" ? "В ИЗБРАННОМ" : "УБРАЛИ ИЗ ИЗБРАННОГО",
      description:
        action === "added"
          ? `${data.ticker} сохранен для быстрого доступа.`
          : `${data.ticker} удален из избранного.`,
      className: "bg-card text-foreground border-primary/40",
    });
  };

  const onRemoveFavorite = (ticker: string) => {
    const removed = removeFavorite(ticker);
    if (!removed) {
      return;
    }

    toast({
      title: "УДАЛЕНО ИЗ ИЗБРАННОГО",
      description: `${ticker} убран из сохраненных тикеров.`,
      className: "bg-card text-foreground border-primary/40",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-fixed bg-center relative">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="py-6 border-b border-white/10 bg-background/50 backdrop-blur-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg text-background">
                <Fish className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-display text-primary leading-none">FISH & MONEY</h1>
                <p className="text-xs text-muted-foreground font-bold tracking-widest">ФИНАНСОВАЯ АНАЛИТИКА</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-primary font-bold">
              <Anchor className="w-5 h-5" />
              <span>ЛОВИ УСПЕХ</span>
            </div>
          </div>
        </header>

        <QuoteMarquee />

        <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center gap-12">
          
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto space-y-6"
          >
            <h2 className="text-5xl md:text-7xl font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-2xl">
              БИРЖЕВАЯ АКУЛА
            </h2>
            <p className="text-xl md:text-2xl text-primary/90 font-medium">
              Аналитика для тех, кто не боится замочить руки
            </p>
          </motion.div>

          {/* Search Section */}
          <Card className="w-full max-w-xl p-2 bg-card/50 border-white/10 backdrop-blur-xl shadow-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                <FormField
                  control={form.control}
                  name="ticker"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="ВВЕДИ ТИКЕР (e.g. AAPL)" 
                            {...field} 
                            className="h-14 text-lg font-bold bg-background/50 border-white/10 focus:border-primary/50 pl-4 uppercase placeholder:normal-case placeholder:font-normal"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <ShinyButton 
                  type="submit" 
                  disabled={isPending}
                  className="h-14 px-8 min-w-[140px]"
                >
                  {isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Search className="w-6 h-6" />
                  )}
                </ShinyButton>
              </form>
            </Form>
          </Card>

          {favorites.length > 0 && (
            <Card className="w-full max-w-4xl bg-card/60 border-primary/20 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <h3 className="text-lg font-display text-primary flex items-center gap-2">
                  <Star className="w-5 h-5 fill-current" />
                  ИЗБРАННЫЕ ТИКЕРЫ
                </h3>
                <span className="text-xs text-muted-foreground tracking-widest">{favorites.length} ШТ.</span>
              </div>
              <div className="p-4 grid gap-2">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.ticker}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/30 p-1.5"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 flex-1 justify-start gap-3 px-3"
                      disabled={isPending}
                      onClick={() => runTickerAnalysis(favorite.ticker)}
                    >
                      <span className="font-display text-primary">{favorite.ticker}</span>
                      <span className="truncate text-left text-sm text-muted-foreground">
                        {favorite.companyName}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => onRemoveFavorite(favorite.ticker)}
                      aria-label={`Убрать ${favorite.ticker} из избранного`}
                      className="h-10 w-10 border-white/20 bg-background/40 hover:bg-destructive/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Loading State - Fishing Animation */}
          <AnimatePresence mode="wait">
            {isPending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4 py-12"
              >
                <div className="relative w-32 h-32">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  />
                  <div className="absolute inset-4 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Fish className="w-12 h-12 text-primary animate-bounce" />
                  </div>
                </div>
                <h3 className="text-2xl font-display text-primary animate-pulse">
                  ПОДСЕКАЕМ ДАННЫЕ...
                </h3>
                <p className="text-muted-foreground">Держи удилище крепче!</p>
              </motion.div>
            )}

            {/* Error State */}
            {error && !isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-destructive/10 border border-destructive/50 rounded-xl text-center max-w-md"
              >
                <h3 className="text-xl font-bold text-destructive mb-2">РЫБА СОРВАЛАСЬ!</h3>
                <p className="text-destructive-foreground">{error.message}</p>
              </motion.div>
            )}

            {/* Result State */}
            {data && !isPending && (
              <div className="w-full">
                <AnalysisResult
                  data={data}
                  isFavorite={isFavorite(data.ticker)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Fun Section */}
          <div className="mt-12 w-full border-t border-white/5 pt-12">
            <MoneyButton />
          </div>

        </main>

        <footer className="py-8 text-center text-muted-foreground text-sm bg-background/80 backdrop-blur-md border-t border-white/5">
          <p>© 2024 FISH & MONEY ANALYTICS. ДЛЯ НАСТОЯЩИХ МУЖИКОВ.</p>
        </footer>
      </div>
    </div>
  );
}
