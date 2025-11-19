document.addEventListener("DOMContentLoaded", async () => {
  console.log("homepage.js carregado");

  // --- ELEMENTOS ---
  const centerKcal = document.getElementById("center-kcal");
  const centerMacros = document.getElementById("center-macros");

  const progressCircle = document.querySelector(".progressCircle"); // círculo principal
  const proteinaCircle = document.getElementById("circle-proteina");
  const carboCircle = document.getElementById("circle-carbo");
  const gorduraCircle = document.getElementById("circle-gordura");

  let usuario = null;
  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;

  // --- METAS (exemplo) ---
  let metaCalorias = 2000; // pode vir do TMB ou meta personalizada
  const metaProteina = 150; 
  const metaCarboidrato = 250;
  const metaGordura = 70;

  // --- CARREGAR DADOS DO USUÁRIO ---
  async function carregarUsuario() {
    try {
      const nomeUsuario = localStorage.getItem("nome_usuario");
      if (!nomeUsuario) throw new Error("Usuário não definido");

      const response = await fetch(`/api/user?nome=${encodeURIComponent(nomeUsuario)}`);
      if (!response.ok) throw new Error("Erro ao buscar usuário");

      usuario = await response.json();
      if (usuario?.tmb) metaCalorias = usuario.tmb; // usar TMB como meta calorias
      await carregarRefeicoes();
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  }

  // --- CARREGAR TODAS AS REFEIÇÕES ---
  async function carregarRefeicoes() {
    try {
      const response = await fetch("/api/alimentos/refeicoes");
      if (!response.ok) throw new Error("Erro ao buscar refeições");

      const refeicoes = await response.json();
      calcularTotais(refeicoes);
      exibirTotais();
      atualizarCirculos();
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
    }
  }

  // --- CALCULAR TOTAL DE CALORIAS E MACROS ---
  function calcularTotais(refeicoes) {
    totalCalorias = 0;
    totalProteinas = 0;
    totalCarboidratos = 0;
    totalGorduras = 0;

    refeicoes.forEach(refeicao => {
      refeicao.alimentos?.forEach(al => {
        totalCalorias += Number(al.energia || al.energiaKcal || al.calorias || al.kcal || 0);
        totalProteinas += Number(al.proteina || al.proteinas || 0);
        totalCarboidratos += Number(al.carboidrato || al.carboidratos || 0);
        totalGorduras += Number(al.gordura || al.gorduras || 0);
      });
    });
  }

  // --- EXIBIR TOTAL DE CALORIAS E MACROS ---
  function exibirTotais() {
    if (centerKcal) centerKcal.textContent = `${totalCalorias.toFixed(0)} kcal`;
    if (centerMacros)
      centerMacros.textContent = `P: ${totalProteinas.toFixed(1)}g | C: ${totalCarboidratos.toFixed(1)}g | G: ${totalGorduras.toFixed(1)}g`;
  }

  // --- ATUALIZAR CÍRCULOS ---
  function atualizarCirculos() {
    // Círculo principal (calorias)
    const percCalorias = Math.min((totalCalorias / metaCalorias) * 100, 100);
    if (progressCircle) progressCircle.style.background = `conic-gradient(#4caf50 ${percCalorias * 3.6}deg, #ddd 0deg)`;

    // Círculos de macronutrientes
    if (proteinaCircle) proteinaCircle.style.background = `conic-gradient(#2196f3 ${Math.min((totalProteinas / metaProteina) * 100, 100) * 3.6}deg, #ddd 0deg)`;
    if (carboCircle) carboCircle.style.background = `conic-gradient(#ff9800 ${Math.min((totalCarboidratos / metaCarboidrato) * 100, 100) * 3.6}deg, #ddd 0deg)`;
    if (gorduraCircle) gorduraCircle.style.background = `conic-gradient(#f44336 ${Math.min((totalGorduras / metaGordura) * 100, 100) * 3.6}deg, #ddd 0deg)`;
  }

  await carregarUsuario();
});
