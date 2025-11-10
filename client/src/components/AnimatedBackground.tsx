import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingShape {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  colorIndex: number;
}

export default function AnimatedBackground() {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    const generatedShapes: FloatingShape[] = [];
    for (let i = 0; i < 20; i++) {
      generatedShapes.push({
        id: i,
        size: Math.random() * 150 + 80,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.12 + 0.03,
        colorIndex: i % 5,
      });
    }
    setShapes(generatedShapes);
  }, []);

  const getGradient = (colorIndex: number) => {
    const gradients = [
      "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
      "radial-gradient(circle, hsl(var(--chart-2)) 0%, transparent 70%)",
      "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
      "radial-gradient(circle, hsl(var(--chart-3)) 0%, transparent 70%)",
      "radial-gradient(circle, hsl(var(--chart-1)) 0%, transparent 70%)",
    ];
    return gradients[colorIndex];
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Primary gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />

      {/* Mesh gradient shapes */}
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            background: getGradient(shape.colorIndex),
            opacity: shape.opacity,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, Math.random() * 120 - 60, Math.random() * 80 - 40, 0],
            y: [0, Math.random() * 120 - 60, Math.random() * 80 - 40, 0],
            scale: [1, 1.3, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.33, 0.66, 1],
          }}
        />
      ))}

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/50" />

      {/* Radial gradient for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.3)_100%)]" />
    </div>
  );
}
