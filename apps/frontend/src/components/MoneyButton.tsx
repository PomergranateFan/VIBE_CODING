import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { ShinyButton } from "@/components/ui/shiny-button";
import { DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MoneyButton() {
  const { toast } = useToast();
  const [clickCount, setClickCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const playClickTune = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const audioContextCtor =
      window.AudioContext ??
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!audioContextCtor) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new audioContextCtor();
    }

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteDuration = 0.12;
    const startTime = audioContext.currentTime;

    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const noteStart = startTime + index * noteDuration;
      const noteEnd = noteStart + noteDuration;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.24, noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });
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
