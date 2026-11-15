// Turns an uploaded photo into an "old photograph": sepia, lifted blacks, grain, vignette and a few scratches.
// Runs entirely in the browser and returns a small JPEG data URL (about 60 KB) that fits in local storage.
export async function agePhoto(file, max = 520) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('That file is not an image we can read. Try a JPG or PNG.'))
      im.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    const p = data.data
    const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2]
      const sr = 0.393 * r + 0.769 * g + 0.189 * b
      const sg = 0.349 * r + 0.686 * g + 0.168 * b
      const sb = 0.272 * r + 0.534 * g + 0.131 * b
      const px = (i / 4) % w, py = Math.floor(i / 4 / w)
      const dx = px / w - 0.5, dy = py / h - 0.5
      const vignette = 1 - Math.min(0.6, (dx * dx + dy * dy) * 1.35)
      const grain = (Math.random() - 0.5) * 30
      p[i] = clamp((sr * 0.8 + 38 + grain) * vignette)
      p[i + 1] = clamp((sg * 0.78 + 30 + grain) * vignette)
      p[i + 2] = clamp((sb * 0.72 + 20 + grain) * vignette)
    }
    ctx.putImageData(data, 0, 0)
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = '#fff6e0'
    for (let k = 0; k < 6; k++) {
      const x = Math.random() * w
      ctx.lineWidth = 0.6 + Math.random()
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 24, h); ctx.stroke()
    }
    ctx.globalAlpha = 1
    return c.toDataURL('image/jpeg', 0.72)
  } finally {
    URL.revokeObjectURL(url)
  }
}
