import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { ShinyButton } from "@/components/ui/shiny-button";
import { DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MoneyButton() {
  const { toast } = useToast();
  const [clickCount, setClickCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasShownAudioErrorRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/yanix.mp3");
      audioRef.current.preload = "auto";
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const playClickTune = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;

    try {
      await audio.play();
    } catch {
      if (!hasShownAudioErrorRef.current) {
        hasShownAudioErrorRef.current = true;
        toast({
          title: "Музыка не найдена",
          description: "Добавь трек в apps/frontend/public/yanix.mp3",
          className: "bg-amber-600 text-white border-amber-700 font-bold",
          duration: 3000,
        });
      }
    }
  };

  const handleMakeMoney = () => {
    setClickCount(prev => prev + 1);
    void playClickTune();
    
    // Confetti explosion
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1000,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#FFD700', '#228B22', '#FFFFFF'] // Gold, Green, White
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    // Manly toasts
    const phrases = [
      "Ты мужик! Иди купи лодку с мотором!",
      "Деньги не пахнут, они пахнут рыбой и успехом!",
      "Где твоя яхта, капитан?",
      "Бабло побеждает зло!",
      "Красавчик! Жми еще!"
    ];
    
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    toast({
      title: "БАБЛО!",
      description: randomPhrase,
      className: "bg-green-600 text-white border-green-700 font-bold text-lg",
      duration: 2000,
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <ShinyButton 
        variant="green" 
        onClick={handleMakeMoney}
        className="text-2xl px-12 py-6 shadow-green-500/50 hover:shadow-green-400/60"
      >
        <DollarSign className="w-8 h-8" />
        КНОПКА БАБЛО + МУЗЫКА
        <DollarSign className="w-8 h-8" />
      </ShinyButton>
      
      {clickCount > 0 && (
        <p className="text-green-400 font-mono text-sm animate-pulse">
          НАЖАТО РАЗ: {clickCount}
        </p>
      )}
    </div>
  );
}
