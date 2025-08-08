const puppeteer = require("puppeteer");
const { spawn } = require("child_process");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 720 },
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto(`file://${__dirname}/index.html`);

  const output = "output.mp4";

  const stream = await page.screenshot({ path: "frame0.png" }); // Gera frame inicial

  console.log("Capturando animação...");

  // Grava múltiplos frames para simular uma animação de 5s a 30fps (150 frames)
  for (let i = 1; i <= 150; i++) {
    await page.waitForTimeout(33); // ~30fps
    await page.screenshot({ path: `frame${i.toString().padStart(3, "0")}.png` });
  }

  await browser.close();

  console.log("Gerando vídeo com ffmpeg...");

  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-framerate", "30",
    "-i", "frame%03d.png",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  ffmpeg.on("exit", (code) => {
    console.log(`✅ Vídeo gerado: ${output}`);
    // Limpa os frames
    for (let i = 0; i <= 150; i++) {
      const frameName = `frame${i.toString().padStart(3, "0")}.png`;
      if (fs.existsSync(frameName)) fs.unlinkSync(frameName);
    }
  });
})();
