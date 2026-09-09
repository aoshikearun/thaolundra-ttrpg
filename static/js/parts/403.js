// 403.js - Animação de fundo para páginas de erro

document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('fogCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    
    const particles = [];
    const particleCount = 60;
    
    class Particle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height;
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.size = Math.random() * 25 + 10;
            this.speed = Math.random() * 0.3 + 0.1;
            this.opacity = Math.random() * 0.2 + 0.05;
            this.drift = Math.random() * 0.3 - 0.15;
        }
        
        update() {
            this.y += this.speed;
            this.x += this.drift;
            
            if (this.y > canvas.height + this.size) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.fillStyle = `rgba(80, 80, 80, ${this.opacity})`;
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', resizeCanvas);
});