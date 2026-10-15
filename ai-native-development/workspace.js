(() => {
  const workspace = window.GaugepointWorkspace;
  if (!workspace) return;
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const helpers = { escape, filterRows: workspace.filterRows };

  document.querySelectorAll('[data-platform]').forEach((root) => {
    const key = root.dataset.platform;
    const mount = workspace.mounts[key];
    if (!mount || !workspace.platforms[key]) return;
    const fallback = root.innerHTML;
    try {
      mount(root, workspace.platforms[key], helpers);
      root.dataset.ready = 'true';
    } catch (error) {
      root.innerHTML = `<p class="workspace-error" role="status">The interactive preview could not load. The platform outline is available below.</p>${fallback}`;
      console.error(`Gaugepoint ${key} preview failed`, error);
    }
  });
})();
