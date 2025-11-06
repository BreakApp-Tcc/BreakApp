const html = document.documentElement;
const btn = document.getElementById('dark-mode');

if (localStorage.getItem('theme') === 'dark') {
  html.classList.add('dark-mode');
  btn.textContent = 'Modo Claro'; 
}

btn.addEventListener('click', () => {
  html.classList.toggle('dark-mode');

  if (html.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    btn.textContent = 'Modo Claro';
  } else {
    localStorage.setItem('theme', 'light');
    btn.textContent = 'Modo Escuro';
  }
});