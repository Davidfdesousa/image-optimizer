import imageCompression from 'browser-image-compression';

const upload = document.getElementById('upload') as HTMLInputElement;
const result = document.getElementById('result') as HTMLDivElement;
const qualitySlider = document.getElementById('quality') as HTMLInputElement;
const qualityValue = document.getElementById('qualityValue') as HTMLSpanElement;
const formatSelect = document.getElementById('format') as HTMLSelectElement;

qualitySlider.addEventListener('input', () => {
  qualityValue.textContent = qualitySlider.value;
});

upload.addEventListener('change', async () => {
  if (!upload.files) return;

  result.innerHTML = '';
  const files = Array.from(upload.files);

  for (const file of files) {
    const quality = Number(qualitySlider.value) / 100;
    const outputFormat = formatSelect.value;

    const wrapper = document.createElement('div');
    wrapper.style.border = '1px solid #ccc';
    wrapper.style.padding = '10px';
    wrapper.style.margin = '10px 0';
    wrapper.style.display = 'flex';
    wrapper.style.flexWrap = 'wrap';
    wrapper.style.gap = '20px';

    // Imagem original
    const originalURL = URL.createObjectURL(file);
    const originalImg = document.createElement('img');
    originalImg.src = originalURL;
    originalImg.style.maxWidth = '200px';

    const originalInfo = document.createElement('div');
    originalInfo.innerHTML = `
      <p><strong>${file.name}</strong></p>
      <p>Tamanho original: ${(file.size / 1024).toFixed(2)} KB</p>
    `;

    const left = document.createElement('div');
    left.appendChild(originalImg);
    left.appendChild(originalInfo);

    wrapper.appendChild(left);
    result.appendChild(wrapper);

    // Compressão
    const options = {
      maxSizeMB: undefined,
      maxWidthOrHeight: undefined,
      initialQuality: quality,
      useWebWorker: true,
      fileType: outputFormat
    };

    try {
      const compressed = await imageCompression(file, options);
      const compressedURL = URL.createObjectURL(compressed);

      const optimizedImg = document.createElement('img');
      optimizedImg.src = compressedURL;
      optimizedImg.style.maxWidth = '200px';

      const ext = outputFormat.toUpperCase().replace('IMAGE/', '');

      const optimizedInfo = document.createElement('div');
      optimizedInfo.innerHTML = `
        <p><strong>Otimizada (${ext})</strong></p>
        <p>Tamanho: ${(compressed.size / 1024).toFixed(2)} KB</p>
        <a href="${compressedURL}" download="optimized-${file.name.replace(/\.\w+$/, '')}.${ext.toLowerCase()}">
          Baixar imagem
        </a>
      `;

      const right = document.createElement('div');
      right.appendChild(optimizedImg);
      right.appendChild(optimizedInfo);

      wrapper.appendChild(right);
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err);
    }
  }
});
