(() => {
  const container = document.querySelector('.parallax');
  if (!container) return;
  const layers = Array.from(container.querySelectorAll('.layer'));
  const zStep = 120;

  function updateLayers(xRatio, yRatio) {
    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0);
      const speed = Number(layer.dataset.speed || 0);
      const translateX = xRatio * speed * 40;
      const translateY = yRatio * speed * 25;
      const z = -depth * zStep;
      const scale = 1 + depth * 0.05;
      layer.style.transform = 'translate3d(' +
        translateX + 'px, ' +
        translateY + 'px, ' +
        z + 'px) scale(' +
        scale + ')';
    });
  }

  function handlePointer(event) {
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    updateLayers(x * -1, y * -1);
  }

  function handleScroll() {
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const offset = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
    updateLayers(offset, offset * 0.6);
  }

  container.addEventListener('pointermove', handlePointer);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
})();
