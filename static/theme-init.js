try {
  const saved = localStorage.getItem('jesse-theme');
  const theme = saved === 'light' || saved === 'dark' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
} catch { document.documentElement.dataset.theme = 'light'; }
