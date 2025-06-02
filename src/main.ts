import imageCompression from 'browser-image-compression';

const upload = document.getElementById('upload') as HTMLInputElement;
const result = document.getElementById('result') as HTMLDivElement;

upload.addEventListener('change', async () => {
  if (!upload.files) return;

  result.innerHTML = '';
  const files = Array.from(upload.files);

  for (const file of files) {
    const wrapper = document.createElement('div');
    wrapper.style.border = '1px solid #ccc';
    wrapper.style.padding = '10px';
    wrapper.style.margin = '10px 0';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '20px';

    const originalURL = URL.createObjectURL(file);

    const originalImg = document.createElement('img');
    originalImg.src = originalURL;
    originalImg.style.maxWidth = '200px';

    const progress = document.createElement('progress');
    progress.max = 100;
    progress.value = 0;
    progress.style.width = '200px';
    progress.style.display = 'block';

    const info = document.createElement('div');
    info.innerHTML = `<p><strong>${file.name}</strong></p><p>Tamanho original: ${(file.size / 1024).toFixed(2)} KB</p>`;

    const imgContainer = document.createElement('div');
    imgContainer.appendChild(originalImg);
    imgContainer.appendChild(info);

    wrapper.appendChild(imgContainer);
    wrapper.appendChild(progress);
    result.appendChild(wrapper);

    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      onProgress: (p: number) => {
        progress.value = p;
      }
    };

    try {
      const compressed = await imageCompression(file, options);
      const compressedURL = URL.createObjectURL(compressed);

      const optimizedImg = document.createElement('img');
      optimizedImg.src = compressedURL;
      optimizedImg.style.maxWidth = '200px';

      const optimizedInfo = document.createElement('div');
      optimizedInfo.innerHTML = `
        <p><strong>Otimizada (WebP)</strong></p>
        <p>Tamanho: ${(compressed.size / 1024).toFixed(2)} KB</p>
        <a href="${compressedURL}" download="optimized-${file.name.replace(/\.\w+$/, '')}.webp">Baixar imagem</a>
      `;

      const optimizedContainer = document.createElement('div');
      optimizedContainer.appendChild(optimizedImg);
      optimizedContainer.appendChild(optimizedInfo);

      wrapper.appendChild(optimizedContainer);
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err);
    }
  }
});
