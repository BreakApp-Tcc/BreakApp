document.addEventListener("DOMContentLoaded", async () => {
  console.log("dieta-script.js carregado");

  // --- ELEMENTOS GERAIS ---
  const imcElement = document.getElementById("valor-imc");
  const tmbElement = document.getElementById("valor-tmb");
  const totalCaloriasElement = document.getElementById("valor-calorias");
  const comparacaoElement = document.getElementById("comparacao-calorias");

  const nomeElement = document.getElementById("perfil-nome");
  const pesoElement = document.getElementById("perfil-peso");
  const alturaElement = document.getElementById("perfil-altura");

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

  // --- CARREGAR DADOS DO USUÁRIO ---
  async function carregarUsuario() {
    try {
      const nomeUsuario = localStorage.getItem("nome_usuario");
      if (!nomeUsuario) throw new Error("Usuário não definido");

      const response = await fetch(`/api/user?nome=${encodeURIComponent(nomeUsuario)}`);
      if (!response.ok) throw new Error("Erro ao buscar usuário");

      usuario = await response.json();

      if (nomeElement && usuario.nome) nomeElement.textContent = usuario.nome;
      if (pesoElement && usuario.peso) pesoElement.textContent = usuario.peso.toFixed(1);
      if (alturaElement && usuario.altura) alturaElement.textContent = usuario.altura.toFixed(2);
      if (imcElement && usuario.imc) imcElement.textContent = usuario.imc.toFixed(2);
      if (tmbElement && usuario.tmb) tmbElement.textContent = usuario.tmb.toFixed(0);

      await carregarRefeicoes();
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  }

  // --- CARREGAR TODAS AS REFEIÇÕES ---
  async function carregarRefeicoes() {
    try {
      const response = await fetch("/api/alimentos/refeicoes");
      localStorage.setItem("refeicoes_timestamp", Date.now());
      if (!response.ok) throw new Error("Erro ao buscar refeições");
      const refeicoes = await response.json();

      totalCalorias = calcularTotalCalorias(refeicoes);
      exibirTotalCalorias(totalCalorias);
      compararCaloriasComTMB(totalCalorias, usuario?.tmb);
    } catch (err) {
      console.error("Erro ao carregar refeições:", err);
    }
  }

  function calcularTotalCalorias(refeicoes) {
  return refeicoes.reduce((totalDia, refeicao) => {
    const subtotal = refeicao.alimentos?.reduce((soma, al) => {
      const energia = Number(al.energia)
        || Number(al.energiaKcal)
        || Number(al.calorias)
        || Number(al.kcal)
        || 0;
      return soma + energia;
    }, 0);
    return totalDia + subtotal;
  }, 0);
}

  function exibirTotalCalorias(total) {
    if (totalCaloriasElement) totalCaloriasElement.textContent = total.toFixed(0) + " kcal";
  }

  function compararCaloriasComTMB(total, tmb) {
    if (!comparacaoElement || !tmb) return;
    if (total > tmb) {
      comparacaoElement.textContent = "Você ultrapassou seu gasto energético diário!";
      comparacaoElement.style.color = "red";
    } else {
      comparacaoElement.textContent = "Você está dentro do seu limite diário de calorias.";
      comparacaoElement.style.color = "green";
    }
  }

  // --- BOTÕES DE REFEIÇÃO ---
  const botoes = document.querySelectorAll(".btn-refeicao");
  botoes.forEach(btn => {
    btn.addEventListener("click", async () => {
      const tipo = btn.getAttribute("data-tipo");
      console.log(`🍽️ Clicou em ${tipo}`);

      const mapa = {
        cafe: "Café da manhã",
        almoco: "Almoço",
        janta: "Jantar",
      };

      const nomeCategoria = mapa[tipo];
      if (!nomeCategoria) {
        console.error("Tipo de refeição inválido:", tipo);
        return;
      }

      try {
        const response = await fetch(`/api/alimentos/refeicao/${encodeURIComponent(nomeCategoria)}`);
        if (!response.ok) throw new Error("Erro ao buscar dados da refeição");

        const dados = await response.json();
        console.log("Dados recebidos:", dados);

        const alimentos = dados.alimentos || [];
        if (alimentos.length === 0) {
          abrirPopupRefeicao(nomeCategoria, `<p>Nenhum alimento encontrado para ${nomeCategoria}.</p>`);
          return;
        }

        let conteudo = `<ul>`;
        let total = 0;

        alimentos.forEach(item => {
          const isNovo = item.id_banco === undefined || item.id_banco === null;
          const nomeAlimento = item.descricao || item.nome_alimento || item.nome || "Sem nome";
          const energia = Number(item.energia) || Number(item.calorias) || 0;
          const qtd = Number(item.quantidade) || 0;

         
conteudo += `
  <li>
    <strong>${nomeAlimento}</strong><br>
    ${qtd}g — ${energia.toFixed(1)} kcal
  </li>
`;

          total += energia;
        });

        conteudo += `
  </ul>
  <p style="margin-top:10px;">
    <strong>Total da refeição: </strong> ${total.toFixed(1)} kcal
  </p>
`;
        abrirPopupRefeicao(`Detalhes da refeição (${nomeCategoria})`, conteudo);
      } catch (error) {
        console.error("Erro ao carregar detalhes da refeição:", error);
        abrirPopupRefeicao("Erro", `<p>Não foi possível carregar as informações de ${nomeCategoria}.</p>`);
      }
    });
  });

  console.log("Botões de refeição ativados:", botoes.length);

  const searchInputs = document.querySelectorAll(".barra-pesquisa");
  searchInputs.forEach(input => {
    input.setAttribute("autocomplete", "off");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.value = "";
        input.blur();
      }
    });
  });

  await carregarUsuario();
  limparRefeicoesAntigas();
});
const profilePic = document.getElementById("profilePic");
const profileImage = document.getElementById("profileImage");
const profileInput = document.getElementById("profileInput");

profilePic.addEventListener("click", () => {
  profileInput.click();
});

profileInput.addEventListener("change", () => {
  const file = profileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imgData = reader.result;

    profileImage.src = imgData;
    profileImage.style.display = "block";

    localStorage.setItem("foto_perfil", imgData);
  };

  reader.readAsDataURL(file);
});

const fotoSalva = localStorage.getItem("foto_perfil");
if (fotoSalva) {
  profileImage.src = fotoSalva;
  profileImage.style.display = "block";
}

let historicoPeso = JSON.parse(localStorage.getItem("historicoPeso")) || [];
let metaPeso = localStorage.getItem("metaPeso") || null;

const metaInput = document.getElementById("metaPeso");
const metaStatus = document.getElementById("metaStatus");
const salvarMetaBtn = document.getElementById("salvarMetaBtn");

if (metaPeso) {
  metaStatus.textContent = `Meta atual: ${metaPeso} kg`;
  metaInput.value = metaPeso;
}

salvarMetaBtn.addEventListener("click", () => {
  const valor = parseFloat(metaInput.value);
  if (!valor || valor <= 0) return alert("Digite um valor válido.");

  metaPeso = valor;
  localStorage.setItem("metaPeso", metaPeso);

  metaStatus.textContent = `Meta atual: ${metaPeso} kg`;

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
  if (!metaPeso) return;

  const pesoAtual = parseFloat(localStorage.getItem("perfil_peso"));
  const tmb = parseFloat(document.getElementById("valor-tmb").textContent);

  const comparacao = document.getElementById("comparacao-calorias");

  if (!pesoAtual || !tmb) return;

  if (pesoAtual > metaPeso) {
    comparacao.textContent = `Para atingir a meta, sua ingestão deve ser ABAIXO de ${tmb} kcal.`;
    comparacao.style.color = "red";
  } else if (pesoAtual < metaPeso) {
    comparacao.textContent = `Para atingir a meta, sua ingestão deve ser ACIMA de ${tmb} kcal.`;
    comparacao.style.color = "green";
  } else {
    comparacao.textContent = "Você atingiu sua meta!";
    comparacao.style.color = "blue";
  }
}

// ---- GRAFICO ----
let grafico;

function atualizarGrafico() {
  const ctx = document.getElementById("graficoPeso").getContext("2d");

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "line",
    data: {
      labels: historicoPeso.map(item => item.data),
      datasets: [
        {
          label: "Peso Atual",
          data: historicoPeso.map(item => item.peso),
          borderWidth: 3,
          tension: 0.3
        },
        metaPeso
          ? {
            label: "Meta",
            data: historicoPeso.map(() => metaPeso),
            borderWidth: 2,
            borderDash: [5, 5]
          }
          : null
      ].filter(Boolean)
    }
  });
}

atualizarGrafico();
atualizarIngestaoCalorica();


document.getElementById("confirmBtn").addEventListener("click", () => {
  const novoPeso = parseFloat(document.getElementById("input-peso").value);

  if (novoPeso > 0) {
    localStorage.setItem("perfil_peso", novoPeso);
    registrarPesoNovo(novoPeso);
    atualizarIngestaoCalorica();
  }
});
function limparRefeicoesAntigas() {
  const salvo = localStorage.getItem("refeicoes_timestamp");

  if (!salvo) return;

  const ultimoRegistro = Number(salvo);
  const agora = Date.now();

  const diffHoras = (agora - ultimoRegistro) / (1000 * 60 * 60);

  if (diffHoras >= 24) {
    fetch("/api/alimentos/limpar", { method: "DELETE" });
    localStorage.removeItem("refeicoes_timestamp");
  }
}
