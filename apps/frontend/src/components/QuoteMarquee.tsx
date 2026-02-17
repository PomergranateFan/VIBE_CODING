import { motion } from "framer-motion";

const QUOTES = [
  "НАСТОЯЩИЙ МУЖИК НЕ СПРАШИВАЕТ ЦЕНУ АКЦИЙ, ОН ИХ ПОКУПАЕТ.",
  "РЫБАЛКА - ЭТО НЕ ХОББИ, ЭТО СОСТОЯНИЕ ДУШИ И БАНКОВСКОГО СЧЕТА.",
  "КТО НЕ РИСКУЕТ, ТОТ НЕ ПЬЕТ ШАМПАНСКОЕ НА СВОЕЙ ЯХТЕ.",
  "ДЕНЬГИ ЛЮБЯТ ТИШИНУ И ХОРОШУЮ НАЖИВКУ.",
  "БИРЖА КАК ОКЕАН: ЛИБО ТЫ АКУЛА, ЛИБО ТЫ КОРМ.",
  "УСПЕХ - ЭТО КОГДА ТВОЯ ЛОДКА БОЛЬШЕ, ЧЕМ У СОСЕДА."
];

export function QuoteMarquee() {
  return (
    <div className="relative w-full overflow-hidden bg-primary/10 border-y border-primary/20 py-3 backdrop-blur-sm">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <motion.div 
        className="flex whitespace-nowrap gap-16"
        animate={{ x: ["0%", "-100%"] }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
      >
        {[...QUOTES, ...QUOTES].map((quote, i) => (
          <span key={i} className="text-primary font-display text-sm md:text-base tracking-widest flex items-center gap-4">
            <span className="text-2xl">⚓</span>
            {quote}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
