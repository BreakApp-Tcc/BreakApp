const html = document.documentElement;
const btnDarkMode = document.getElementById('dark-mode');

if (localStorage.getItem('theme') === 'dark') {
  html.classList.add('dark-mode');
  if (btnDarkMode) btnDarkMode.textContent = 'Modo Claro';
}

if (btnDarkMode) {
  btnDarkMode.addEventListener('click', () => {
    html.classList.toggle('dark-mode');

    if (html.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      btnDarkMode.textContent = 'Modo Claro';
    } else {
      localStorage.setItem('theme', 'light');
      btnDarkMode.textContent = 'Modo Escuro';
    }
  });
}