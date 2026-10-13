/**
 * LifeQR Kinetic Typography Physics & Motion Engine
 * Directly inspired by the reference PDF Motion-Design specification:
 * - Letters behave as physical components (vertical strokes, curved arcs, horizontal bars, outline duplicates)
 * - Staggered arrival, rapid convergence, distortion, abstract orbiting, and smooth reassembly
 * - Dual-layer depth: bright mint-green luminous foreground + dark emerald ghost/outline layer
 * - Sliding horizontal graphic slit bars for non-wipe continuous transitions
 */

class KineticTypography {
  constructor() {
    this.cachedGlyphs = {};
  }

  // Draw animated physical letter assembly into canvas
  // word: string, x: center X, y: center Y, progress: 0.0 (abstract/scattered) -> 1.0 (assembled), options
  drawAssembledWord(ctx, word, centerX, y, progress, options = {}) {
    ctx.save();
    const fontSize = options.fontSize || 84;
    const fontFamily = options.fontFamily || '"Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    const primaryColor = options.color || '#10B981'; // Mint green from PDF
    const ghostColor = options.ghostColor || 'rgba(16, 185, 129, 0.28)';
    const offsetGhost = options.ghostOffset || 6;
    const isFragmented = progress < 0.98;

    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const totalWidth = ctx.measureText(word).width;
    const startX = centerX - totalWidth / 2;

    // If fully assembled (progress >= 0.98), render with clean kinetic depth
    if (!isFragmented) {
      // 1. Ghost / Outline Layer (shifted slightly behind in depth)
      ctx.strokeStyle = ghostColor;
      ctx.lineWidth = 2.5;
      ctx.strokeText(word, centerX + offsetGhost, y + Math.floor(offsetGhost * 0.7));

      // 2. Primary Mint-Green Surface with restrained soft glow
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = options.glowBlur !== undefined ? options.glowBlur : 12;
      ctx.fillText(word, centerX, y);
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    }

    // Physical letter components animation
    // Each character fragments into staggered physical movements
    const chars = word.split('');
    let runningX = startX;

    chars.forEach((ch, idx) => {
      const charWidth = ctx.measureText(ch).width;
      const targetCharX = runningX + charWidth / 2;

      // Unique deterministic noise for each character
      const seed = (idx + 1) * 17.3;
      const angleScatter = Math.sin(seed) * 0.45 * (1 - progress);
      const scatterX = Math.cos(seed * 2) * 90 * (1 - progress);
      const scatterY = Math.sin(seed * 3) * 75 * (1 - progress);

      // Staggered timing per character (strokes arrive in waves per PDF)
      const charProgress = Math.min(1, Math.max(0, (progress - idx * 0.08) / (1 - chars.length * 0.08)));
      const easedP = charProgress < 0.5 ? 2 * charProgress * charProgress : -1 + (4 - 2 * charProgress) * charProgress;

      const curX = targetCharX + (1 - easedP) * scatterX;
      const curY = y + (1 - easedP) * scatterY;
      const curRot = (1 - easedP) * angleScatter;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(curRot);

      // Ghost outline duplicate arriving slightly delayed
      const ghostP = Math.max(0, easedP - 0.12);
      ctx.strokeStyle = ghostColor;
      ctx.lineWidth = 2;
      ctx.strokeText(ch, offsetGhost * (1 - ghostP), Math.floor(offsetGhost * 0.7));

      // Primary letter component
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 8 * easedP;
      ctx.fillText(ch, 0, 0);
      ctx.shadowBlur = 0;

      // Physical horizontal/vertical stroke accents when letters assemble (from PDF reference)
      if (progress > 0.15 && progress < 0.85) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        const slitW = charWidth * 0.8 * (1 - easedP);
        ctx.fillRect(-slitW / 2, -fontSize * 0.4, slitW, 3);
      }

      ctx.restore();
      runningX += charWidth;
    });

    ctx.restore();
  }

  // Draw abstract central letter component cluster (from PDF reference 0.00-0.10s, 0.38-0.60s, 5.45-6.05s)
  drawAbstractCluster(ctx, centerX, centerY, time, options = {}) {
    ctx.save();
    const radius = options.radius || 110;
    const pieces = 14;

    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.3); // Subtle rotational floating

    for (let i = 0; i < pieces; i++) {
      const angle = (i / pieces) * Math.PI * 2 + Math.sin(time + i) * 0.2;
      const dist = radius * (0.3 + 0.6 * Math.sin(i * 1.5 + time * 0.8));
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + time * 0.5);

      if (i % 3 === 0) {
        // Vertical stroke component
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 6;
        ctx.fillRect(-3, -24, 6, 48);
      } else if (i % 3 === 1) {
        // Curved circular arc component
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 1.2);
        ctx.stroke();
      } else {
        // Dark outline duplicate
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -12, 24, 24);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw thin sliding horizontal graphic bar reveal (from PDF reference 1.65-1.90s)
  drawSlidingGraphicTransition(ctx, width, height, progress, color = '#10B981') {
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    const barCount = 7;
    const bandH = height / barCount;

    for (let i = 0; i < barCount; i++) {
      const stagger = (i / barCount) * 0.4;
      const barProg = Math.min(1, Math.max(0, (progress - stagger) / 0.6));
      const curW = width * (1 - Math.abs(barProg - 0.5) * 2);
      const curX = (width - curW) / 2;

      ctx.fillStyle = i % 2 === 0 ? color : 'rgba(0, 240, 255, 0.8)';
      ctx.fillRect(curX, i * bandH, curW, bandH * 0.6);
    }
    ctx.restore();
  }
}

window.KineticTypography = KineticTypography;
