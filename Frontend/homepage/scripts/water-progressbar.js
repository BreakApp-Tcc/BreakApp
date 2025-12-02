document.addEventListener("DOMContentLoaded", async () => {
  const bar = document.getElementById("water-bar");
  const barText = document.getElementById("water-bar-text");
  const metaText = document.getElementById("water-goal-text");
  const addInput = document.getElementById("add-water");
  const registrarBtn = document.getElementById("registrar-water");

  // Buscar usuário no backend
  const usuarioResp = await fetch("/api/user");
  if (!usuarioResp.ok) return console.warn("Nenhum usuário identificado.");
  const usuario = await usuarioResp.json();

  // Recuperar valores salvos
  let aguaConsumida = Number(localStorage.getItem("aguaConsumida")) || 0;

  const metaAgua = Math.round(usuario.peso * 35);
  metaText.textContent = `Meta diária: ${metaAgua} ml`;

  function saveLocal() {
    localStorage.setItem("aguaConsumida", aguaConsumida);
  }

  function atualizarBarra() {
    const percent = Math.min((aguaConsumida / metaAgua) * 100, 100);
    bar.style.width = percent + "%";
    barText.textContent = `${aguaConsumida} ml`;

    // Gradiente azul escuro → azul claro (#A3F9FF)
    const start = { r: 0, g: 60, b: 120 };       // azul escuro inicial
    const end   = { r: 163, g: 249, b: 255 };    // azul cristalino final (#A3F9FF)

    const r = Math.round(start.r + (end.r - start.r) * (percent / 100));
    const g = Math.round(start.g + (end.g - start.g) * (percent / 100));
    const b = Math.round(start.b + (end.b - start.b) * (percent / 100));

    bar.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

    saveLocal();
  }

  registrarBtn.addEventListener("click", () => {
    const qtd = Number(addInput.value);
    if (!qtd || qtd <= 0) {
      alert("Insira uma quantidade válida!");
      return;
    }

    aguaConsumida += qtd;
    addInput.value = "";
    atualizarBarra();
  });

  atualizarBarra();
});
