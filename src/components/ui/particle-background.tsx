"use client";

import React, { useRef, useEffect } from 'react';

interface ParticleBackgroundProps {
  mousePosition: { x: number; y: number } | null;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ mousePosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);

  // Using a class for particles for better organization
  class Particle {
    x: number;
    y: number;
    size: number;
    baseX: number;
    baseY: number;
    density: number;
    color: string;
    ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D, color: string, width: number, height: number) {
      this.ctx = ctx;
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.5 + 1;
      this.baseX = this.x;
      this.baseY = this.y;
      this.density = Math.random() * 30 + 10;
      this.color = color;
    }

    draw() {
  this.ctx.fillStyle = this.color;
  this.ctx.beginPath();
  this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  this.ctx.closePath();

  // Agrega brillo
  this.ctx.shadowBlur = 10; // Ajusta la intensidad del brillo
  this.ctx.shadowColor = this.color;

  this.ctx.fill();

  // Resetea para que no afecte otros dibujos
  this.ctx.shadowBlur = 0;
  this.ctx.shadowColor = 'transparent';
}

    update(mouse: { x: number; y: number } | null) {
      const actualMouse = mouse || { x: -10000, y: -10000 };
      const dx = actualMouse.x - this.x;
      const dy = actualMouse.y - this.y;
      const distanceSq = dx * dx + dy * dy;
      const maxDistance = 100;
      const maxDistanceSq = maxDistance * maxDistance;

      if (distanceSq < maxDistanceSq) {
        const distance = Math.sqrt(distanceSq);
        const forceDirectionX = distance > 0 ? dx / distance : 0;
        const forceDirectionY = distance > 0 ? dy / distance : 0;
        
        let force = (maxDistance - distance) / maxDistance;

        const directionX = forceDirectionX * force * this.density * 0.6;
        const directionY = forceDirectionY * force * this.density * 0.6;
        
        this.x -= directionX;
        this.y -= directionY;
      } else {
        if (this.x !== this.baseX) {
          const dxToBase = this.x - this.baseX;
          this.x -= dxToBase / 20;
        }
        if (this.y !== this.baseY) {
          const dyToBase = this.y - this.baseY;
          this.y -= dyToBase / 20;
        }
      }
    }
  }

  // Effect for initialization and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let primaryColor = 'hsl(42, 93%, 54%)';

    const init = () => {
      particlesRef.current = [];
      const computedStyle = getComputedStyle(canvas);
      const primaryHsl = computedStyle.getPropertyValue('--primary').trim();
      if (primaryHsl) {
        primaryColor = `hsl(${primaryHsl})`;
      }
      const particleCount = (canvas.width * canvas.height) / 3000;
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new Particle(ctx, primaryColor, canvas.width, canvas.height));
      }
    };
    
    const resizeHandler = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Effect for animation, dependent on mousePosition
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particlesRef.current) {
        particle.update(mousePosition);
        particle.draw();
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Cancel previous frame and start new one
    cancelAnimationFrame(animationFrameId.current);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};
