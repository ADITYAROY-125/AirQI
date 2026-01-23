import { useEffect, useRef } from 'react';

const ParticleBackground = ({ pm25, isDay }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // 1. Determine particle count based on PM2.5 (More pollution = more dots)
    // PM2.5 of 10 = 50 particles. PM2.5 of 300 = 1500 particles.
    const particleCount = Math.min(Math.max(pm25 * 5, 50), 2000); 
    
    // 2. Color based on Day/Night
    const color = isDay ? 'rgba(50, 50, 50,' : 'rgba(255, 255, 255,';

    let particles = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5, // Random size 0.5px to 2.5px
          speedX: (Math.random() - 0.5) * (pm25 / 50), // Speed increases with pollution
          speedY: (Math.random() - 0.5) * (pm25 / 50),
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.fillStyle = `${color} ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Movement
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    createParticles();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pm25, isDay]); // Re-run if PM2.5 changes

  return <canvas ref={canvasRef} style={{
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    pointerEvents: 'none',
    zIndex: 1 // Sit just above the sky gradient but below the content
  }} />;
};

export default ParticleBackground;