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

  // --- ELEMENTOS DO MODAL DE ATUALIZAÇÃO ---
  const overlay = document.getElementById("overlay");
  const openModalBtn = document.getElementById("openModal");
  const closeBtn = document.getElementById("closeBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const inputNome = document.getElementById("input-nome");
  const inputPeso = document.getElementById("input-peso");
  const inputAltura = document.getElementById("input-altura");

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
    if (e.key === "Escape") {
      fecharPopupRefeicao();
      fecharModal();
    }
  });

  // --- FUNÇÕES DO MODAL DE ATUALIZAÇÃO ---
  function abrirModal() {
    if (usuario) {
      inputNome.value = usuario.nome || "";
      inputPeso.value = usuario.peso || "";
      inputAltura.value = usuario.altura || "";
    }
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function fecharModal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    // Limpar campos
    inputNome.value = "";
    inputPeso.value = "";
    inputAltura.value = "";
  }

  if (openModalBtn) openModalBtn.addEventListener("click", abrirModal);
  if (closeBtn) closeBtn.addEventListener("click", fecharModal);
  if (cancelBtn) cancelBtn.addEventListener("click", fecharModal);

  // --- CARREGAR USUÁRIO ---
  async function carregarUsuario() {
    try {
      const usuarioId = localStorage.getItem("usuarioId");
      const nomeUsuario = localStorage.getItem("nome_usuario");
      
      console.log("Carregando usuário:", { usuarioId, nomeUsuario });
      
      if (!nomeUsuario && !usuarioId) {
        throw new Error("Usuário não definido no localStorage");
      }

      const response = await fetch(`/api/user?nome=${encodeURIComponent(nomeUsuario)}`);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      usuario = await response.json();
      console.log("Usuário carregado:", usuario);

      if (!usuario.id && usuarioId) {
        usuario.id = usuarioId;
      }

      localStorage.setItem("usuarioId", usuario.id);

      atualizarInterfaceUsuario();
      await carregarRefeicoes();
      
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      alert("Erro ao carregar dados do usuário. Faça login novamente.");
    }
  }

  // --- ATUALIZAR INTERFACE DO USUÁRIO ---
  function atualizarInterfaceUsuario() {
    if (nomeElement) nomeElement.textContent = usuario.nome || "-";
    if (pesoElement) pesoElement.textContent = usuario.peso ? usuario.peso.toFixed(1) : "-";
    if (alturaElement) alturaElement.textContent = usuario.altura ? usuario.altura.toFixed(2) : "-";
    if (imcElement) imcElement.textContent = usuario.imc ? usuario.imc.toFixed(2) : "-";
    if (tmbElement) tmbElement.textContent = usuario.tmb ? usuario.tmb.toFixed(0) : "-";
  }

  // --- ATUALIZAR DADOS DO USUÁRIO ---
 // --- ATUALIZAR DADOS DO USUÁRIO ---
async function atualizarDadosUsuario() {
  const novoNome = inputNome.value.trim();
  const novoPeso = parseFloat(inputPeso.value);
  const novaAltura = parseFloat(inputAltura.value);

  // Validar se pelo menos um campo foi preenchido
  if (!novoNome && !novoPeso && !novaAltura) {
    alert("Preencha pelo menos um campo para atualizar.");
    return;
  }

  // Validar valores numéricos
  if (novoPeso && (novoPeso <= 0 || isNaN(novoPeso))) {
    alert("Digite um peso válido.");
    return;
  }

  if (novaAltura && (novaAltura <= 0 || isNaN(novaAltura))) {
    alert("Digite uma altura válida.");
    return;
  }

  try {
    // Preparar dados para atualização (apenas campos preenchidos)
    const dadosAtualizacao = {};
    
    if (novoNome) dadosAtualizacao.nome_usuario = novoNome;
    if (novoPeso) dadosAtualizacao.peso = novoPeso;
    if (novaAltura) dadosAtualizacao.altura = novaAltura;

    // Adicionar dados necessários para recalcular IMC e TMB
    dadosAtualizacao.idade = usuario.idade;
    dadosAtualizacao.sexo = usuario.sexo;

    // Se está atualizando peso ou altura, usar os novos valores ou os existentes
    const pesoParaCalculo = novoPeso || usuario.peso;
    const alturaParaCalculo = novaAltura || usuario.altura;

    // Recalcular IMC e TMB
    if (pesoParaCalculo && alturaParaCalculo) {
      const imc = pesoParaCalculo / ((alturaParaCalculo / 100) ** 2);
      const tmb = 10 * pesoParaCalculo + 6.25 * alturaParaCalculo - 5 * usuario.idade + 
                  (usuario.sexo === "masculino" ? 5 : -161);
      
      dadosAtualizacao.imc = imc;
      dadosAtualizacao.tmb = tmb;
    }

    // Enviar atualização para o servidor
    const response = await fetch(`/api/user/atualizar/${usuario.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAtualizacao)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar: ${response.status}`);
    }

    const resultado = await response.json();
    console.log("Dados atualizados:", resultado);

    // CORREÇÃO: Atualizar o objeto usuario com TODOS os campos retornados
    // Se o backend retorna nome_usuario mas você usa .nome localmente
    if (resultado.nome_usuario) {
      usuario.nome = resultado.nome_usuario;
      localStorage.setItem("nome_usuario", resultado.nome_usuario);
    }
    
    // Atualizar peso
    if (resultado.peso !== undefined) {
      usuario.peso = resultado.peso;
    }
    
    // Atualizar altura
    if (resultado.altura !== undefined) {
      usuario.altura = resultado.altura;
    }
    
    // Atualizar IMC
    if (resultado.imc !== undefined) {
      usuario.imc = resultado.imc;
    }
    
    // Atualizar TMB
    if (resultado.tmb !== undefined) {
      usuario.tmb = resultado.tmb;
    }

    // Atualiza interface APÓS garantir que usuario está atualizado
    atualizarInterfaceUsuario();

    // Atualiza gráfico e calorias
    if (novoPeso) {
      registrarPesoNovo(novoPeso);
    }

    // Recarregar a comparação de calorias com o novo TMB
    if (totalCalorias > 0) {
      atualizarComparacaoCalorias();
    }

    // Atualizar recomendação de ingestão calórica
    atualizarIngestaoCalorica();

    // Atualizar gráfico com o novo peso
    atualizarGrafico();

    fecharModal();
    alert("Dados atualizados com sucesso!");

  } catch (err) {
    console.error("Erro ao atualizar dados:", err);
    alert("Erro ao atualizar dados. Tente novamente.");
  }
}
  if (confirmBtn) {
    confirmBtn.addEventListener("click", atualizarDadosUsuario);
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

      totalCalorias = calcularTotalCalorias(refeicoes);
      console.log("Total de calorias:", totalCalorias);

      if (totalCaloriasElement) {
        totalCaloriasElement.textContent = totalCalorias.toFixed(0) + " kcal";
      }

      atualizarComparacaoCalorias();
      atualizarCardsRefeicoes(refeicoes);

    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
    }
  }

  // --- ATUALIZAR COMPARAÇÃO DE CALORIAS ---
  function atualizarComparacaoCalorias() {
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

    Object.keys(categorias).forEach(nome => {
      const dados = categorias[nome];
      console.log(`${nome}: ${dados.total.toFixed(0)} kcal (${dados.count} refeições)`);
      
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
    
    // Verificar se já existe registro para hoje
    const indiceHoje = historicoPeso.findIndex(item => item.data === hoje);
    
    if (indiceHoje !== -1) {
      // Atualizar peso de hoje
      historicoPeso[indiceHoje].peso = novoPeso;
    } else {
      // Adicionar novo registro
      historicoPeso.push({ data: hoje, peso: novoPeso });
    }
    
    localStorage.setItem("historicoPeso", JSON.stringify(historicoPeso));
    atualizarGrafico();
  }

  function atualizarIngestaoCalorica() {
    if (!metaPeso || !usuario?.tmb) return;
    const pesoAtual = usuario.peso;
    if (!pesoAtual) return;
  }

  let grafico;
  function atualizarGrafico() {
    const ctx = document.getElementById("graficoPeso")?.getContext("2d");
    if (!ctx) return;
    if (grafico) grafico.destroy();

    const datasets = [
      { 
        label: "Peso Atual", 
        data: historicoPeso.map(item => item.peso), 
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 3, 
        tension: 0.3,
        fill: true
      }
    ];

    if (metaPeso) {
      datasets.push({ 
        label: "Meta", 
        data: historicoPeso.map(() => metaPeso), 
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 2, 
        borderDash: [5, 5],
        fill: false
      });
    }

    grafico = new Chart(ctx, {
      type: "line",
      data: {
        labels: historicoPeso.map(item => {
          const data = new Date(item.data + 'T00:00:00');
          return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' kg';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Peso (kg)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Data'
            }
          }
        }
      }
    });
  }

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
  atualizarIngestaoCalorica();
  console.log("Carregamento concluído!");
});

const profilePic = document.getElementById("profilePic");
const profileInput = document.getElementById("profileInput");
const profileImage = document.getElementById("profileImage");

profilePic.addEventListener("click", () => {
    profileInput.click();
});

profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        profileImage.src = reader.result;
        profileImage.style.display = "block";
    };

    reader.readAsDataURL(file);
});
