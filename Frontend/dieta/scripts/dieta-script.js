document.addEventListener("DOMContentLoaded", async () => {
  console.log("dieta-script.js carregado");

  // --- ELEMENTOS GERAIS ---
  const nomeElement = document.getElementById("perfil-nome");
  const pesoElement = document.getElementById("perfil-peso");
  const alturaElement = document.getElementById("perfil-altura");
  const imcElement = document.getElementById("valor-imc");
  const tmbElement = document.getElementById("valor-tmb");
  const totalCaloriasElement = document.getElementById("valor-calorias");
  const comparacaoElement = document.getElementById("comparacao-calorias");

  let usuario = null;
  let totalCalorias = 0;

  // --- ELEMENTOS DO POPUP ---
  const popupRefeicao = document.getElementById("popupRefeicao");
  const closeRefeicaoBtn = document.getElementById("closeRefeicao");
  const tituloRefeicao = document.getElementById("tituloRefeicao");
  const conteudoRefeicao = document.getElementById("conteudoRefeicao");

  function abrirPopupRefeicao(titulo, conteudo) {
    tituloRefeicao.textContent = titulo;
    conteudoRefeicao.innerHTML = conteudo;
    popupRefeicao.classList.add("open");
    popupRefeicao.setAttribute("aria-hidden", "false");
  }

  function fecharPopupRefeicao() {
    popupRefeicao.classList.remove("open");
    popupRefeicao.setAttribute("aria-hidden", "true");
  }

  if (closeRefeicaoBtn) closeRefeicaoBtn.addEventListener("click", fecharPopupRefeicao);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharPopupRefeicao();
  });

  // --- CARREGAR USUÁRIO ---
  async function carregarUsuario() {
    try {
      const usuarioId = localStorage.getItem("usuarioId");
      const nomeUsuario = localStorage.getItem("nome_usuario");
      
      console.log("Carregando usuário:", { usuarioId, nomeUsuario });
      
      if (!nomeUsuario && !usuarioId) {
        throw new Error("Usuário não definido no localStorage");
      }

      // Buscar dados do usuário
      const response = await fetch(`/api/user?nome=${encodeURIComponent(nomeUsuario)}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      usuario = await response.json();
      console.log("Usuário carregado:", usuario);

      // Garantir que temos o ID
      if (!usuario.id && usuarioId) {
        usuario.id = usuarioId;
      }

      // Salvar o ID no localStorage
      localStorage.setItem("usuarioId", usuario.id);

      // Atualizar interface
      if (nomeElement) nomeElement.textContent = usuario.nome || nomeUsuario;
      if (pesoElement) pesoElement.textContent = usuario.peso?.toFixed(1) || "-";
      if (alturaElement) alturaElement.textContent = usuario.altura?.toFixed(2) || "-";
      if (imcElement) imcElement.textContent = usuario.imc?.toFixed(2) || "-";
      if (tmbElement) tmbElement.textContent = usuario.tmb?.toFixed(0) || "-";

      // Carregar refeições
      await carregarRefeicoes();
      
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      alert("Erro ao carregar dados do usuário. Faça login novamente.");
    }
  }

  // --- CARREGAR REFEIÇÕES ---
  async function carregarRefeicoes() {
    try {
      if (!usuario || !usuario.id) {
        console.error("Usuário não definido ao carregar refeições");
        return;
      }

      console.log("Carregando refeições para usuário:", usuario.id);

      const response = await fetch(`/api/alimentos/refeicoes?usuarioId=${usuario.id}`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const refeicoes = await response.json();
      console.log("Refeições carregadas:", refeicoes);

      // Calcular total de calorias
      totalCalorias = calcularTotalCalorias(refeicoes);
      console.log("Total de calorias:", totalCalorias);

      // Atualizar interface
      if (totalCaloriasElement) {
        totalCaloriasElement.textContent = totalCalorias.toFixed(0) + " kcal";
      }

      // Comparar com TMB
      if (comparacaoElement && usuario.tmb) {
        const diferenca = totalCalorias - usuario.tmb;
        
        if (totalCalorias > usuario.tmb) {
          comparacaoElement.textContent = `Você ultrapassou seu gasto energético diário em ${diferenca.toFixed(0)} kcal!`;
          comparacaoElement.style.color = "red";
        } else {
          const falta = usuario.tmb - totalCalorias;
          comparacaoElement.textContent = `Você está dentro do limite. Faltam ${falta.toFixed(0)} kcal para atingir seu TMB.`;
          comparacaoElement.style.color = "green";
        }
      }

      // Atualizar cards de refeições
      atualizarCardsRefeicoes(refeicoes);

    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
    }
  }

  // --- CALCULAR TOTAL DE CALORIAS ---
  function calcularTotalCalorias(refeicoes) {
    return refeicoes.reduce((totalDia, refeicao) => {
      const subtotal = refeicao.alimentos?.reduce((soma, al) => {
        const energia = Number(al.energia) || Number(al.calorias) || 0;
        return soma + energia;
      }, 0) || 0;
      return totalDia + subtotal;
    }, 0);
  }

  // --- ATUALIZAR CARDS DE REFEIÇÕES ---
  function atualizarCardsRefeicoes(refeicoes) {
    // Agrupar por categoria
    const categorias = {
      "Café da manhã": { total: 0, count: 0 },
      "Almoço": { total: 0, count: 0 },
      "Jantar": { total: 0, count: 0 }
    };

    refeicoes.forEach(ref => {
      const categoria = ref.nome;
      if (categorias[categoria]) {
        const calorias = ref.alimentos?.reduce((soma, al) => {
          return soma + (Number(al.energia) || Number(al.calorias) || 0);
        }, 0) || 0;
        
        categorias[categoria].total += calorias;
        categorias[categoria].count += 1;
      }
    });

    // Atualizar elementos na página (adapte os IDs conforme sua página)
    Object.keys(categorias).forEach(nome => {
      const dados = categorias[nome];
      console.log(`${nome}: ${dados.total.toFixed(0)} kcal (${dados.count} refeições)`);
      
      // Exemplo de atualização - ajuste conforme seus elementos HTML
      const elementoCaloria = document.querySelector(`[data-categoria="${nome}"] .calorias`);
      if (elementoCaloria) {
        elementoCaloria.textContent = `${dados.total.toFixed(0)} kcal`;
      }
    });
  }

  // --- ATIVAR BOTÕES DE REFEIÇÃO ---
  function ativarBotoesRefeicao() {
    if (!usuario || !usuario.id) {
      console.error("Usuário não definido ao ativar botões");
      return;
    }

    const botoes = document.querySelectorAll(".btn-refeicao");
    console.log(`Ativando ${botoes.length} botões de refeição`);

    botoes.forEach(btn => {
      btn.addEventListener("click", async () => {
        const tipo = btn.getAttribute("data-tipo");
        const mapa = { 
          cafe: "Café da manhã", 
          almoco: "Almoço", 
          janta: "Jantar" 
        };
        
        const nomeCategoria = mapa[tipo];
        if (!nomeCategoria) {
          console.error("Categoria não encontrada:", tipo);
          return;
        }

        console.log("Buscando refeição:", nomeCategoria);

        try {
          const url = `/api/alimentos/refeicao/${encodeURIComponent(nomeCategoria)}?usuarioId=${usuario.id}`;
          console.log("URL da requisição:", url);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
          }

          const dados = await response.json();
          console.log("Dados da refeição:", dados);
          
          const alimentos = dados.alimentos || [];
          
          if (alimentos.length === 0) {
            abrirPopupRefeicao(
              nomeCategoria, 
              `<p>Nenhum alimento registrado para ${nomeCategoria}.</p>`
            );
            return;
          }

          // Montar conteúdo do popup
          let totalRefeicao = 0;
          const conteudo = alimentos.map(item => {
            const nomeAlimento = item.nome_alimento || item.descricao || "Sem nome";
            const qtd = Number(item.quantidade) || 0;
            const energia = Number(item.energia) || Number(item.calorias) || 0;
            const proteina = Number(item.proteina) || 0;
            const carbo = Number(item.carboidrato) || 0;
            const lipidio = Number(item.lipidio) || 0;
            
            totalRefeicao += energia;
            
            return `
              <div class="alimento-item">
                <h4>${nomeAlimento}</h4>
                <p><b>Quantidade:</b> ${qtd} g</p>
                <p><b>Energia:</b> ${energia.toFixed(1)} kcal</p>
                <p><b>Proteína:</b> ${proteina.toFixed(1)} g | <b>Carbo:</b> ${carbo.toFixed(1)} g | <b>Gordura:</b> ${lipidio.toFixed(1)} g</p>
                <hr>
              </div>
            `;
          }).join("");

          const conteudoCompleto = `
            <div class="resumo-refeicao">
              <p><strong>Total da refeição: ${totalRefeicao.toFixed(0)} kcal</strong></p>
            </div>
            ${conteudo}
          `;

          abrirPopupRefeicao(`Detalhes - ${nomeCategoria}`, conteudoCompleto);
          
        } catch (err) {
          console.error("Erro ao buscar refeição:", err);
          abrirPopupRefeicao(
            "Erro", 
            `<p>Não foi possível carregar ${nomeCategoria}.</p><p>Erro: ${err.message}</p>`
          );
        }
      });
    });
  }

  // --- PESQUISA ---
  document.querySelectorAll(".barra-pesquisa").forEach(input => {
    input.setAttribute("autocomplete", "off");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.value = "";
        input.blur();
      }
    });
  });

  // --- HISTÓRICO DE PESO, META E GRÁFICO ---
  let historicoPeso = JSON.parse(localStorage.getItem("historicoPeso")) || [];
  let metaPeso = localStorage.getItem("metaPeso") || null;

  const metaInput = document.getElementById("metaPeso");
  const metaStatus = document.getElementById("metaStatus");
  const salvarMetaBtn = document.getElementById("salvarMetaBtn");

  if (metaPeso && metaStatus) {
    metaStatus.textContent = `Meta atual: ${metaPeso} kg`;
    if (metaInput) metaInput.value = metaPeso;
  }

  salvarMetaBtn?.addEventListener("click", () => {
    const valor = parseFloat(metaInput.value);
    if (!valor || valor <= 0) {
      alert("Digite um valor válido.");
      return;
    }
    metaPeso = valor;
    localStorage.setItem("metaPeso", metaPeso);
    if (metaStatus) metaStatus.textContent = `Meta atual: ${metaPeso} kg`;
    atualizarIngestaoCalorica();
    atualizarGrafico();
  });

  function registrarPesoNovo(novoPeso) {
    const hoje = new Date().toISOString().split("T")[0];
    historicoPeso.push({ data: hoje, peso: novoPeso });
    localStorage.setItem("historicoPeso", JSON.stringify(historicoPeso));
    atualizarGrafico();
  }

  function atualizarIngestaoCalorica() {
    if (!metaPeso || !usuario?.tmb) return;
    const pesoAtual = parseFloat(localStorage.getItem("perfil_peso")) || usuario.peso;
    if (!pesoAtual) return;

    if (pesoAtual > metaPeso) {
      comparacaoElement.textContent = `Para atingir a meta, sua ingestão deve ser ABAIXO de ${usuario.tmb} kcal.`;
      comparacaoElement.style.color = "red";
    } else if (pesoAtual < metaPeso) {
      comparacaoElement.textContent = `Para atingir a meta, sua ingestão deve ser ACIMA de ${usuario.tmb} kcal.`;
      comparacaoElement.style.color = "green";
    } else {
      comparacaoElement.textContent = "Você atingiu sua meta!";
      comparacaoElement.style.color = "blue";
    }
  }

  let grafico;
  function atualizarGrafico() {
    const ctx = document.getElementById("graficoPeso")?.getContext("2d");
    if (!ctx) return;
    if (grafico) grafico.destroy();

    grafico = new Chart(ctx, {
      type: "line",
      data: {
        labels: historicoPeso.map(item => item.data),
        datasets: [
          { 
            label: "Peso Atual", 
            data: historicoPeso.map(item => item.peso), 
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 3, 
            tension: 0.3 
          },
          metaPeso ? { 
            label: "Meta", 
            data: historicoPeso.map(() => metaPeso), 
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 2, 
            borderDash: [5, 5] 
          } : null
        ].filter(Boolean)
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  document.getElementById("confirmBtn")?.addEventListener("click", () => {
    const novoPeso = parseFloat(document.getElementById("input-peso")?.value);
    if (novoPeso && novoPeso > 0) {
      localStorage.setItem("perfil_peso", novoPeso);
      registrarPesoNovo(novoPeso);
      atualizarIngestaoCalorica();
      if (pesoElement) pesoElement.textContent = novoPeso.toFixed(1);
    }
  });

  // --- LIMPAR REFEIÇÕES ANTIGAS ---
  function limparRefeicoesAntigas() {
    const salvo = localStorage.getItem("refeicoes_timestamp");
    if (!salvo) {
      localStorage.setItem("refeicoes_timestamp", Date.now().toString());
      return;
    }
    
    const diffHoras = (Date.now() - Number(salvo)) / (1000 * 60 * 60);
    if (diffHoras >= 24) {
      fetch("/api/alimentos/limpar", { method: "DELETE" })
        .then(() => {
          console.log("Refeições antigas limpas");
          localStorage.setItem("refeicoes_timestamp", Date.now().toString());
        })
        .catch(err => console.error("Erro ao limpar refeições:", err));
    }
  }

  // --- INICIALIZAÇÃO ---
  console.log("Iniciando carregamento...");
  await carregarUsuario();
  ativarBotoesRefeicao();
  limparRefeicoesAntigas();
  atualizarGrafico();
  console.log("Carregamento concluído!");
});