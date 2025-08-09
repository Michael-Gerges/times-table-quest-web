/** Simple confetti animation. */
export class Confetti {
  constructor(width, height, count = 40) {
    this.width = width;
    this.height = height;
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: -Math.random() * 120,
      r: 4 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 3,
      dy: 2 + Math.random() * 2.5,
      color: ["#fca5a5", "#fde68a", "#bbf7d0", "#bae6fd", "#ddd6fe"][
        Math.floor(Math.random() * 5)
      ],
    }));
    this.alive = true;
  }

  /**
   * Draw one frame. Returns false when animation is complete.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.alive) return false;
    this.particles.forEach((p) => {
      p.x += p.dx;
      p.y += p.dy;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    this.particles = this.particles.filter((p) => p.y < this.height + 20);
    if (this.particles.length === 0) {
      this.alive = false;
      return false;
    }
    return true;
  }
}
