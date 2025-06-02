/**
 * src/main.ts
 *
 * - Roda 100% no navegador, sem upload a servidor externo.
 * - Para PNG: usa @nbfe/upng-js (UPNG.js) para fazer compressão lossless sem alterar cor.
 * - Para JPEG/WebP: usa browser-image-compression para compressão “lossy” via initialQuality.
 */

import imageCompression from "browser-image-compression";
import type { Options } from "browser-image-compression";
import UPNG from "@nbfe/upng-js";

const upload = document.getElementById("upload") as HTMLInputElement;
const result = document.getElementById("result") as HTMLDivElement;
const qualitySlider = document.getElementById("quality") as HTMLInputElement;
const qualityValue = document.getElementById("qualityValue") as HTMLSpanElement;
const formatSelect = document.getElementById("format") as HTMLSelectElement;

// Atualiza o valor numérico ao lado do slider em tempo real
qualitySlider.addEventListener("input", () => {
  qualityValue.textContent = qualitySlider.value;
});

upload.addEventListener("change", async () => {
  if (!upload.files) return;
  // Limpa resultados antigos
  result.innerHTML = "";

  const files = Array.from(upload.files);

  for (const file of files) {
    // 1) Captura valores atuais do slider (1–100) e do dropdown (png, jpeg ou webp)
    const qualityPercent = Number(qualitySlider.value); // 1..100
    const outputFormat = formatSelect.value; // "png" | "jpeg" | "webp"

    // 2) Cria um container (wrapper) para agrupar original + otimizada
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-wrapper");

    // ====== (A) Exibe imagem original ======
    const originalURL = URL.createObjectURL(file);
    const originalImg = document.createElement("img");
    originalImg.src = originalURL;
    const originalInfo = document.createElement("div");
    originalInfo.innerHTML = `
      <p><strong>${file.name}</strong></p>
      <p>Tamanho original: ${(file.size / 1024).toFixed(2)} KB</p>
    `;
    const leftContainer = document.createElement("div");
    leftContainer.classList.add("image-container");
    leftContainer.appendChild(originalImg);
    leftContainer.appendChild(originalInfo);
    wrapper.appendChild(leftContainer);

    // ====== (B) Fluxo de compressão conforme formato escolhido ======
    if (outputFormat === "png") {
      //
      // —––– FLUXO PNG: compressão lossless sem alterar cor via UPNG.js –––—
      //
      try {
        // 3.1) Leia o File como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // 3.2) Decodifica o PNG para obter largura, altura e dados originais
        const imgObj = UPNG.decode(arrayBuffer);
        // imgObj.width, imgObj.height
        // imgObj.data = Uint8Array “compacted” internamente

        // 3.3) Converte para um buffer RGBA8 (24/32 bits) com UPNG.toRGBA8
        //      A função devolve um array de frames; em PNG estático só há um array[0].
        const rgbaFrames = UPNG.toRGBA8(imgObj);
        const rgbaBuffer = rgbaFrames[0]; // ArrayBuffer com (width × height × 4) bytes

        // 3.4) Mapeia qualityPercent (1–100) para level (0–6):
        //      - level 0 = compressão rápida, poucas otimizações
        //      - level 6 = compressão mais pesada, máximo de otimização lossless
        const maxLevel = 6;
        const minLevel = 0;
        const level = Math.round(
          ((qualityPercent - 1) / 99) * (maxLevel - minLevel) + minLevel
        );
        // Ex.: qualityPercent = 70 → level ≈ 4

        // 3.5) Chama UPNG.encode para gerar um PNG lossless “truecolor”
        //      - 32 bits (RGBA) → sem reduzir paleta, sem trocar cor
        //      - { level } controla passes DEFLATE, seleção de filtros, etc.
        const compressedUint8Array: Uint8Array = UPNG.encode(
          [rgbaBuffer],
          imgObj.width,
          imgObj.height,
          32,
          { level }
        );

        // 3.6) Converte o Uint8Array em Blob para exibir / download
        const compressedBlob = new Blob([compressedUint8Array], {
          type: "image/png",
        });
        const compressedURL = URL.createObjectURL(compressedBlob);

        // 3.7) Exibe imagem otimizada + informações + link download
        const optimizedImg = document.createElement("img");
        optimizedImg.src = compressedURL;
        const optimizedInfo = document.createElement("div");
        optimizedInfo.innerHTML = `
          <p><strong>Otimizada (PNG, level ${level})</strong></p>
          <p>Tamanho: ${(compressedBlob.size / 1024).toFixed(2)} KB</p>
          <a href="${compressedURL}" download="optimized-${file.name}">
            Baixar imagem
          </a>
        `;
        const rightContainer = document.createElement("div");
        rightContainer.classList.add("image-container");
        rightContainer.appendChild(optimizedImg);
        rightContainer.appendChild(optimizedInfo);
        wrapper.appendChild(rightContainer);
      } catch (err) {
        console.error("Erro ao comprimir PNG com UPNG.js:", err);
        const errorMsg = document.createElement("p");
        errorMsg.style.color = "red";
        errorMsg.textContent = "❌ Falha ao comprimir PNG localmente.";
        wrapper.appendChild(errorMsg);
      }
    } else {
      //
      // —––– FLUXO JPEG/WebP: compressão “lossy” via browser-image-compression –––—
      //
      try {
        // 3.1) Converte “qualityPercent (1–100)” em “initialQuality” (0.01–1.0)
        const initialQuality = qualityPercent / 100;
        // 3.2) Define o MIME type correto
        const mimeType = outputFormat === "jpeg" ? "image/jpeg" : "image/webp";

        const options: Options = {
          initialQuality,
          useWebWorker: true,
          fileType: mimeType,
        };

        // 3.3) Executa compressão “lossy” → retorna um File otimizado
        const compressedFile = await imageCompression(file, options);
        const compressedURL = URL.createObjectURL(compressedFile);

        // 3.4) Exibe a imagem otimizada + info + link download
        const optimizedImg = document.createElement("img");
        optimizedImg.src = compressedURL;
        const ext = mimeType.toUpperCase().replace("IMAGE/", "");
        const optimizedInfo = document.createElement("div");
        optimizedInfo.innerHTML = `
          <p><strong>Otimizada (${ext})</strong></p>
          <p>Tamanho: ${(compressedFile.size / 1024).toFixed(2)} KB</p>
          <a href="${compressedURL}"
             download="optimized-${file.name.replace(/\.\w+$/, "")}.${ext.toLowerCase()}">
            Baixar imagem
          </a>
        `;
        const rightContainer = document.createElement("div");
        rightContainer.classList.add("image-container");
        rightContainer.appendChild(optimizedImg);
        rightContainer.appendChild(optimizedInfo);
        wrapper.appendChild(rightContainer);
      } catch (err) {
        console.error("Erro ao comprimir JPEG/WebP:", err);
        const errorMsg = document.createElement("p");
        errorMsg.style.color = "red";
        errorMsg.textContent = "❌ Falha ao comprimir JPEG/WebP localmente.";
        wrapper.appendChild(errorMsg);
      }
    }

    // 4) Adiciona o wrapper ao resultado final
    result.appendChild(wrapper);
  }
});
