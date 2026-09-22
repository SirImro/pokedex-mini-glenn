import { useEffect, useRef } from "react";
import { getOfficialArtworkUrl } from "../utils.js";

function SpacemanCanvas({ status, multiplier, crashMultiplier }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Load Rocket Sprite (Rayquaza #384 or Pikachu #25)
    const rocketImg = new Image();
    rocketImg.src = getOfficialArtworkUrl(384);

    let width = (canvas.width = canvas.parentElement.clientWidth || 600);
    let height = (canvas.height = 340);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 340;
      }
    };
    window.addEventListener("resize", handleResize);

    // Initialize Starfield
    const stars = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
    }));

    // Particles array for thrust engine
    let particles = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Deep Space Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#080c16");
      bgGrad.addColorStop(1, "#121929");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animate Starfield
      const speedMult = status === "FLYING" ? Math.min(6, 1 + multiplier * 0.5) : 0.5;
      stars.forEach((star) => {
        star.x -= star.speed * speedMult;
        star.y += star.speed * 0.3 * speedMult;

        if (star.x < 0) star.x = width;
        if (star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Compute Rocket Position along Flight Curve
      const progress = status === "FLYING" ? Math.min(0.85, (multiplier - 1) / 15) : status === "CRASHED" ? 0.85 : 0.05;
      const startX = 60;
      const startY = height - 60;
      const targetX = startX + progress * (width - 120);
      const targetY = startY - Math.pow(progress, 0.7) * (height - 120);

      // 4. Draw Flight Trajectory Line & Glow Arc
      if (status === "FLYING" || status === "CRASHED" || status === "CASHED_OUT") {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + (targetX - startX) * 0.5, startY, targetX, targetY);
        ctx.strokeStyle = status === "CRASHED" ? "rgba(255, 68, 68, 0.8)" : "rgba(0, 200, 81, 0.8)";
        ctx.lineWidth = 4;
        ctx.shadowColor = status === "CRASHED" ? "#ff4444" : "#00c851";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Generate Thrust Particles when flying
      if (status === "FLYING") {
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: targetX - 25,
            y: targetY + 25,
            vx: -Math.random() * 3 - 2,
            vy: Math.random() * 3 + 1,
            size: Math.random() * 6 + 3,
            color: Math.random() > 0.5 ? "#ffbb33" : "#ff4444",
            life: 1,
          });
        }
      }

      // Update & Draw Thrust Particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        p.size *= 0.95;

        if (p.life <= 0) {
          particles.splice(idx, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // 6. Draw Rocket Sprite or Crash Explosion
      if (status !== "CRASHED") {
        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(-Math.PI / 6); // Angled upward takeoff
        if (rocketImg.complete) {
          ctx.drawImage(rocketImg, -40, -40, 80, 80);
        } else {
          // Fallback emoji icon
          ctx.font = "40px sans-serif";
          ctx.fillText("🚀", -20, 15);
        }
        ctx.restore();
      } else {
        // Draw Explosion Flash at Crash position
        ctx.save();
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 40 + Math.random() * 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💥", targetX, targetY + 15);
        ctx.restore();
      }

      // 7. Multiplier Overlay text in Canvas Center
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (status === "COUNTDOWN") {
        ctx.font = "800 32px Outfit, sans-serif";
        ctx.fillStyle = "#ffcb05";
        ctx.fillText("🚀 TAKEOFF DALAM BEBERAPA DETIK…", width / 2, height / 2);
      } else if (status === "FLYING") {
        ctx.font = "900 64px Outfit, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 200, 81, 0.8)";
        ctx.shadowBlur = 20;
        ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2 - 20);
      } else if (status === "CRASHED") {
        ctx.font = "900 56px Outfit, sans-serif";
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "rgba(255, 68, 68, 0.8)";
        ctx.shadowBlur = 25;
        ctx.fillText(`FLEW AWAY @ ${crashMultiplier ? crashMultiplier.toFixed(2) : multiplier.toFixed(2)}x`, width / 2, height / 2 - 20);
      } else if (status === "CASHED_OUT") {
        ctx.font = "900 56px Outfit, sans-serif";
        ctx.fillStyle = "#00c851";
        ctx.shadowColor = "rgba(0, 200, 81, 0.8)";
        ctx.shadowBlur = 25;
        ctx.fillText(`CASHED OUT @ ${multiplier.toFixed(2)}x`, width / 2, height / 2 - 20);
      } else {
        ctx.font = "800 28px Outfit, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText("SIAPKAN TARUHAN & KLIK TAKEOFF!", width / 2, height / 2);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [status, multiplier, crashMultiplier]);

  return (
    <div className="spaceman-canvas-wrapper" style={{ width: "100%", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "340px", borderRadius: "16px", display: "block" }} />
    </div>
  );
}

export default SpacemanCanvas;
