import { motion } from "framer-motion";
import { type N8nResponse } from "@fishmoney/shared/schema";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Anchor,
  Newspaper,
  DollarSign,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  data: N8nResponse;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function AnalysisResult({ data, isFavorite, onToggleFavorite }: Props) {
  const isBullish = data.sentiment === "Bullish";
  const isBearish = data.sentiment === "Bearish";
  
  const sentimentColor = isBullish ? "text-green-500" : isBearish ? "text-red-500" : "text-yellow-500";
  const SentimentIcon = isBullish ? TrendingUp : isBearish ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Main Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card/80 backdrop-blur-md border-primary/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Anchor className="w-48 h-48 text-primary" />
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-display text-primary tracking-wider">{data.ticker}</h2>
                <p className="text-muted-foreground font-medium text-lg">{data.company_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`px-4 py-1 text-lg font-display ${sentimentColor} border-current`}>
                  {data.sentiment.toUpperCase()}
                </Badge>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={onToggleFavorite}
                  aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                  className="h-10 w-10 rounded-full border-primary/50 bg-background/30 text-primary hover:bg-primary/20"
                >
                  <Star className={isFavorite ? "fill-current" : ""} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4 mt-4">
              <span className="text-6xl font-display text-foreground">
                {data.currency === "USD" ? "$" : ""}{data.current_price}
              </span>
              <span className={`text-xl font-bold flex items-center gap-1 ${data.price_change_percent.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                <SentimentIcon className="w-5 h-5" />
                {data.price_change_percent}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 flex flex-col justify-center items-center text-center p-6 shadow-lg shadow-primary/10">
          <DollarSign className="w-16 h-16 text-primary mb-4" />
          <h3 className="text-xl font-display text-foreground mb-2">ВЕРДИКТ</h3>
          <p className="text-sm text-muted-foreground mb-4">Что делать настоящему мужику?</p>
          <div className="font-display text-2xl text-primary">
            {isBullish ? "ПОКУПАТЬ!" : isBearish ? "ПРОДАВАТЬ!" : "ЖДАТЬ!"}
          </div>
        </Card>
      </div>

      {/* Summary Section */}
      <Card className="bg-card/90 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <Anchor className="w-6 h-6" />
            АНАЛИЗ СИТУАЦИИ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-foreground/90 font-medium">
            {data.analysis_summary}
          </p>
        </CardContent>
      </Card>

      {/* News Section */}
      <div className="grid gap-4">
        <h3 className="text-2xl font-display text-primary flex items-center gap-3">
          <Newspaper className="w-6 h-6" />
          НОВОСТИ С ПОЛЕЙ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.key_news_headlines.map((news, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl bg-muted/50 border border-white/5 hover:border-primary/50 transition-colors cursor-default"
            >
              <p className="font-medium text-foreground/80">
                "{news}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
