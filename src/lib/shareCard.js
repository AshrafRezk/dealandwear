const W = 1080;
const H = 1350;
const C = {
  ink: '#15140F',
  ivory: '#F8F5EF',
  sand: '#EAE3D6',
  sage: '#8B9A85',
  emerald: '#0E6E4F',
  stone: '#63645F',
};

async function ensureFonts() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load('400 96px Fraunces'),
    document.fonts.load('italic 700 48px Fraunces'),
    document.fonts.load('500 28px Inter'),
  ]).catch(() => {});
}

function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || '').split(/\s+/);
  let line = '';
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = w;
      if (lines >= maxLines) return lines;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + lines * lineHeight);
    lines += 1;
  }
  return lines;
}

/** Draws a 1080x1350 Style DNA card (Instagram portrait) and resolves with a PNG blob. */
export async function renderDnaCard({ firstName, primary, archetypes = [], axes = [], labels }) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.ivory;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.sand;
  ctx.fillRect(0, 0, W, 560);

  const pad = 90;
  ctx.fillStyle = C.stone;
  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillText((firstName ? `${firstName.toUpperCase()} · ` : '') + labels.heading.toUpperCase(), pad, 140);

  ctx.fillStyle = C.ink;
  ctx.font = '400 104px Fraunces, Georgia, serif';
  const titleLines = wrap(ctx, primary?.label || '', pad, 270, W - pad * 2, 112, 2);

  if (primary?.tagline) {
    ctx.fillStyle = C.emerald;
    ctx.font = 'italic 700 40px Fraunces, Georgia, serif';
    wrap(ctx, primary.tagline, pad, 270 + titleLines * 112 + 10, W - pad * 2, 50, 2);
  }

  let y = 660;
  ctx.font = '500 26px Inter, sans-serif';
  for (const a of archetypes.slice(0, 4)) {
    ctx.fillStyle = C.ink;
    ctx.fillText(a.label, pad, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${a.percent}%`, W - pad, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#DEDACD';
    ctx.fillRect(pad, y + 20, W - pad * 2, 8);
    ctx.fillStyle = C.emerald;
    ctx.fillRect(pad, y + 20, ((W - pad * 2) * Math.min(100, a.percent)) / 100, 8);
    y += 96;
  }

  y += 20;
  ctx.font = '500 24px Inter, sans-serif';
  const chips = axes.slice(0, 6).map((a) => a.bucketLabel);
  let x = pad;
  for (const chip of chips) {
    const w = ctx.measureText(chip).width + 48;
    if (x + w > W - pad) {
      x = pad;
      y += 66;
    }
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, 50);
    ctx.fillStyle = C.ink;
    ctx.fillText(chip, x + 24, y + 33);
    x += w + 14;
  }

  ctx.fillStyle = C.ink;
  ctx.fillRect(0, H - 150, W, 150);
  ctx.fillStyle = C.ivory;
  ctx.font = '400 44px Fraunces, Georgia, serif';
  ctx.fillText('Find Your', pad, H - 62);
  const lead = ctx.measureText('Find Your ').width;
  ctx.fillStyle = '#7FB59F';
  ctx.font = 'italic 700 44px Fraunces, Georgia, serif';
  ctx.fillText('fit', pad + lead, H - 62);
  ctx.fillStyle = C.sand;
  ctx.font = '500 22px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(labels.footer + (labels.url ? ` · ${labels.url}` : ''), W - pad, H - 66);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), 'image/png'));
}
