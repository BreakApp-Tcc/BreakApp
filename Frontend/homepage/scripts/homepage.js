document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== homepage.js carregado ===");

  // Elementos da interface
  const percentValueEl = document.getElementById("percent-value");
  const progressCircle = document.getElementById("progressCircle");
  const centerKcal = document.getElementById("center-kcal");
  const centerMacros = document.getElementById("center-macros");
  const metaKcalEl = document.getElementById("meta-kcal");

  // Variáveis de controle
  let doughnutChart = null;
  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;

  let tmb = null;
  let pesoAtual = null;
  let metaPeso = parseFloat(localStorage.getItem("metaPeso")) || null;
  let metaCalorias = 2000;
  let usuario = null;

  // =========================
  // CARREGAR USUÁRIO
  // =========================
  async function carregarUsuario() {
    try {
      // Tentar pegar do localStorage primeiro
      const usuarioId = localStorage.getItem("usuarioId");
      const nomeUsuario = localStorage.getItem("nome_usuario");

      console.log("Carregando usuário:", { usuarioId, nomeUsuario });

      if (!nomeUsuario) {
        console.warn("Usuário não encontrado no localStorage");
        return false;
      }

      // Buscar dados do usuário
      const respUser = await fetch(`/api/user?nome=${encodeURIComponent(nomeUsuario)}`);
      
      if (!respUser.ok) {
        console.error("Erro ao buscar usuário. Status:", respUser.status);
        return false;
      }

      usuario = await respUser.json();
      console.log("Usuário carregado:", usuario);

      // Garantir que temos o ID
      if (!usuario.id && usuarioId) {
        usuario.id = parseInt(usuarioId);
      }

      // Salvar ID no localStorage
      if (usuario.id) {
        localStorage.setItem("usuarioId", usuario.id);
      }

      // Extrair dados do usuário
      pesoAtual = usuario.peso ?? null;
      tmb = usuario.tmb ?? null;

      console.log("Dados do usuário:", { 
        id: usuario.id, 
        peso: pesoAtual, 
        tmb: tmb 
      });

      return true;

    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
      return false;
    }
  }

  // =========================
  // CALCULAR META DE CALORIAS
  // =========================
  function calcularMetaKcal() {
    if (!tmb) {
      console.warn("TMB não definido, usando meta padrão");
      return 2000;
    }

    let meta = tmb;

    if (metaPeso && pesoAtual) {
      console.log("Calculando meta com base em:", { 
        pesoAtual, 
        metaPeso, 
        tmb 
      });

      if (metaPeso > pesoAtual) {
        // Ganhar peso: adiciona 15% ao TMB
        meta = tmb * 1.15;
        console.log("Meta para ganhar peso:", meta);
      } else if (metaPeso < pesoAtual) {
        // Perder peso: subtrai 300 kcal
        meta = tmb - 300;
        console.log("Meta para perder peso:", meta);
      } else {
        // Manter peso
        meta = tmb;
        console.log("Meta para manter peso:", meta);
      }
    }

    // Garantir mínimo de 1200 kcal
    if (meta < 1200) {
      console.warn("Meta abaixo de 1200 kcal, ajustando para 1200");
      meta = 1200;
    }

    // Atualizar interface
    if (metaKcalEl) {
      metaKcalEl.textContent = `${meta.toFixed(0)} kcal`;
    }

    console.log("Meta calculada:", meta);
    return meta;
  }

  // =========================
  // CALCULAR TOTAIS
  // =========================
  function calcularTotais(refeicoes) {
    console.log("Calculando totais de", refeicoes.length, "refeições");

    totalCalorias = 0;
    totalProteinas = 0;
    totalCarboidratos = 0;
    totalGorduras = 0;

    refeicoes.forEach((ref, index) => {
      const alimentos = ref.alimentos || [];
      console.log(`Refeição ${index + 1} (${ref.nome}):`, alimentos.length, "alimentos");

      alimentos.forEach(al => {
        const cal = Number(al.energia || al.calorias || 0);
        const prot = Number(al.proteina || 0);
        const carb = Number(al.carboidrato || 0);
        const gord = Number(al.lipidio || 0);

        totalCalorias += cal;
        totalProteinas += prot;
        totalCarboidratos += carb;
        totalGorduras += gord;

        console.log(`  - ${al.descricao}: ${cal} kcal`);
      });
    });

    console.log("Totais calculados:", {
      calorias: totalCalorias,
      proteinas: totalProteinas,
      carboidratos: totalCarboidratos,
      gorduras: totalGorduras
    });
  }

  // =========================
  // ATUALIZAR INTERFACE
  // =========================
  function atualizarInterface() {
    console.log("Atualizando interface...");

    // Atualizar círculo de progresso
    const perc = metaCalorias > 0
      ? Math.min((totalCalorias / metaCalorias) * 100, 100)
      : 0;

    console.log("Percentual de meta:", perc.toFixed(1) + "%");

    const graus = perc * 3.6;
    
    if (progressCircle) {
      progressCircle.style.background = 
        `conic-gradient(#9bca9f ${graus}deg, #e5e7eb ${graus}deg)`;
    }

    if (percentValueEl) {
      percentValueEl.textContent = `${Math.round(perc)}%`;
    }

    // Atualizar centro do gráfico
    if (centerKcal) {
      centerKcal.textContent = `${totalCalorias.toFixed(0)} kcal`;
    }

    if (centerMacros) {
      centerMacros.textContent = 
        `P: ${totalProteinas.toFixed(1)}g | C: ${totalCarboidratos.toFixed(1)}g | G: ${totalGorduras.toFixed(1)}g`;
    }

    // Atualizar gráfico doughnut
    atualizarDoughnut();

    console.log("Interface atualizada!");
  }

  // =========================
  // ATUALIZAR GRÁFICO DOUGHNUT
  // =========================
  function atualizarDoughnut() {
    const ctx = document.getElementById("doughnut");
    
    if (!ctx) {
      console.error("Canvas 'doughnut' não encontrado!");
      return;
    }

    console.log("Atualizando gráfico doughnut...");

    // Destruir gráfico anterior
    if (doughnutChart) {
      doughnutChart.destroy();
    }

    // Verificar se há dados
    const temDados = totalProteinas > 0 || totalCarboidratos > 0 || totalGorduras > 0;

    if (!temDados) {
      console.warn("Sem dados para exibir no gráfico");
      // Mostrar gráfico vazio
      doughnutChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Proteína", "Carboidrato", "Gordura"],
          datasets: [{
            data: [1, 1, 1], // Valores iguais para mostrar vazio
            backgroundColor: ["#e0e0e0", "#e0e0e0", "#e0e0e0"],
            borderWidth: 0
          }]
        },
        options: {
          cutout: "70%",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              display: true, 
              position: "right",
              labels: {
                color: getComputedStyle(document.documentElement)
                  .getPropertyValue('--color-items').trim()
              }
            },
            tooltip: { enabled: false }
          }
        }
      });
      return;
    }

    // Criar gráfico com dados
    doughnutChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Proteína", "Carboidrato", "Gordura"],
        datasets: [{
          data: [totalProteinas, totalCarboidratos, totalGorduras],
          backgroundColor: ["#EF6C00", "#D81B60", "#7E57C2"],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "70%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, 
            position: "right",
            labels: {
              color: getComputedStyle(document.documentElement)
                .getPropertyValue('--color-items').trim(),
              font: {
                size: 12,
                weight: '500'
              },
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value.toFixed(1)}g`;
              }
            }
          }
        }
      }
    });

    console.log("Gráfico doughnut atualizado!");
  }

  // =========================
  // ATUALIZAR DADOS
  // =========================
  async function atualizarDados() {
    try {
      if (!usuario || !usuario.id) {
        console.error("Usuário não definido ao atualizar dados");
        return;
      }

      console.log("Buscando refeições para usuário:", usuario.id);

      // Buscar refeições
      const resp = await fetch(`/api/alimentos/refeicoes?usuarioId=${usuario.id}`);
      
      if (!resp.ok) {
        throw new Error(`Erro HTTP: ${resp.status}`);
      }

      const refeicoes = await resp.json();
      console.log("Refeições recebidas:", refeicoes);

      // Calcular totais e atualizar interface
      calcularTotais(refeicoes);
      atualizarInterface();

    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      
      // Mostrar interface vazia em caso de erro
      totalCalorias = 0;
      totalProteinas = 0;
      totalCarboidratos = 0;
      totalGorduras = 0;
      atualizarInterface();
    }
  }

  // =========================
  // AUTO-REFRESH
  // =========================
  function iniciarAutoRefresh() {
    console.log("Iniciando auto-refresh a cada 30 segundos");
    
    setInterval(async () => {
      console.log("Auto-refresh disparado");
      await atualizarDados();
    }, 30000); // 30 segundos
  }

  // =========================
  // INICIALIZAÇÃO
  // =========================
  async function inicializar() {
    console.log("Iniciando homepage...");

    // 1. Carregar usuário
    const usuarioCarregado = await carregarUsuario();
    
    if (!usuarioCarregado) {
      console.error("Não foi possível carregar o usuário");
      alert("Erro ao carregar dados. Por favor, faça login novamente.");
      return;
    }

    // 2. Calcular meta de calorias
    metaCalorias = calcularMetaKcal();

    // 3. Atualizar dados pela primeira vez
    await atualizarDados();

    // 4. Iniciar refresh automático
    iniciarAutoRefresh();

    console.log("=== Homepage inicializada com sucesso! ===");
  }

  // Executar inicialização
  inicializar();

  // =========================
  // EXPOR FUNÇÃO GLOBAL (opcional)
  // =========================
  // Se você quiser atualizar manualmente de outros scripts:
  window.atualizarHomepage = atualizarDados;
});