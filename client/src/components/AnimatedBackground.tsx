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
}

export default function AnimatedBackground() {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    const generatedShapes: FloatingShape[] = [];
    for (let i = 0; i < 15; i++) {
      generatedShapes.push({
        id: i,
        size: Math.random() * 100 + 50,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }
    setShapes(generatedShapes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            background: shape.id % 3 === 0 
              ? "hsl(var(--primary))" 
              : shape.id % 3 === 1 
                ? "hsl(var(--accent))" 
                : "hsl(var(--chart-2))",
            opacity: shape.opacity,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30" />
    </div>
  );
}
