const usuarioLogado = JSON.parse(localStorage.getItem("usuario"));

document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js inicializando...");

  const $ = id => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // --- ELEMENTOS ---
  const searchbar = $("searchbar");
  const sugestoesLista = $("sugestoes-lista");
  const addAlimentoBtn = $("add-alimento-btn");

  const overlayAlimento = $("overlay-alimento");
  const modalBodyAlimento = overlayAlimento ? overlayAlimento.querySelector(".modal-body") : null;
  const closeBtnAlimento = $("closeBtn-alimento");
  const cancelBtnAlimento = $("cancelBtn-alimento");

  const overlayNovo = $("overlay-novo-alimento");
  const formNovo = $("form-novo-alimento");
  const btnCloseNovo = $("closeBtn-novo-alimento");
  const btnCancelarNovo = $("cancelar-novo-alimento");

  const inputCarboNovo = $("carbo");
  const inputProteinaNovo = $("proteina");
  const inputGorduraNovo = $("gordura");

  const selecionadosContainer = $("selecionados");
  const allRegistrosContainer = $("all-registros");

  // Array para armazenar registros
  const registros = [];

  // =========================
  // BUSCA DE ALIMENTOS
  // =========================

  function debounceFunc(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), delay);
    };
  }

  async function handleSearch() {
    const q = (searchbar.value || "").trim();
    sugestoesLista.innerHTML = "";

    if (q.length < 1) return;

    try {
      const res = await fetch(`/api/alimentos?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`status ${res.status}`);

      const alimentos = await res.json();
      sugestoesLista.innerHTML = "";

      if (!Array.isArray(alimentos) || alimentos.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nenhum alimento encontrado.";
        sugestoesLista.appendChild(li);
        return;
      }

      alimentos.forEach(al => {
        const li = document.createElement("li");
        const nome = al.descricao_do_alimento || "";
        const preparo = al.descricao_da_preparacao || "";
        li.textContent = preparo ? `${nome} — ${preparo}` : nome;
        li.tabIndex = 0;
        li.style.fontWeight = "600";
        li.addEventListener("click", () => abrirPopupVisualizar(al));
        sugestoesLista.appendChild(li);
      });

    } catch (err) {
      console.error("Erro ao buscar alimentos:", err);
      const li = document.createElement("li");
      li.textContent = "Erro ao buscar alimentos.";
      sugestoesLista.appendChild(li);
    }
  }

  if (searchbar && sugestoesLista) {
    const handleSearchDebounced = debounceFunc(handleSearch, 300);
    searchbar.addEventListener("input", handleSearchDebounced);
  }

  // Fechar sugestões ao clicar fora
  document.addEventListener("click", (e) => {
    if (!sugestoesLista) return;
    if (e.target === searchbar) return;
    if (!sugestoesLista.contains(e.target)) sugestoesLista.innerHTML = "";
  });

  // =========================
  // POPUP VISUALIZAR ALIMENTO
  // =========================

  function abrirPopupVisualizar(alimento) {
    if (!overlayAlimento || !modalBodyAlimento) {
      if (searchbar) searchbar.value = alimento.descricao_do_alimento || "";
      return;
    }

    const html = `
      <h3 id="modal-content-alimento">${alimento.descricao_do_alimento || ""}</h3>
      <div class="modal-textalign">
        <div>
          <p><strong>Energia (100g):</strong> ${alimento.Energia_kcal != null ? alimento.Energia_kcal + " kcal" : "—"}</p>
          <p><strong>Proteína (100g):</strong> ${alimento.Proteina_g != null ? alimento.Proteina_g + " g" : "—"}</p>
        </div>
        <div>
          <p><strong>Lipídios (100g):</strong> ${alimento.Lipidios_totais_g != null ? alimento.Lipidios_totais_g + " g" : "—"}</p>
          <p><strong>Carboidrato (100g):</strong> ${alimento.Carboi_drato_g != null ? alimento.Carboi_drato_g + " g" : "—"}</p>
        </div>
      </div>

      <div style="margin-top:12px">
        <label style="display:block;margin-bottom:6px;font-weight:600;">Categoria da refeição</label>
        <select id="categoria-refeicao" style="width:100%;padding:10px;border-radius:8px;margin-bottom:10px;">
          <option value="">-- selecione --</option>
          <option value="Café da manhã">Café da manhã</option>
          <option value="Almoço">Almoço</option>
          <option value="Jantar">Jantar</option>
        </select>

        <label style="display:block;margin-bottom:6px;font-weight:600;">Quantidade (g)</label>
        <input id="quantidade-refeicao" type="number" min="1" value="100" style="width:100%;padding:10px;border-radius:8px;margin-bottom:14px;">

        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="salvar-refeicao-btn" class="btn-primary">Salvar refeição</button>
          <button id="cancelar-visualizar-btn" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    `;

    modalBodyAlimento.innerHTML = html;
    overlayAlimento.classList.add("open");
    overlayAlimento.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    on($("cancelar-visualizar-btn"), "click", fecharPopupVisualizar);
    on($("salvar-refeicao-btn"), "click", () => salvarRefeicao(alimento));
  }

  async function salvarRefeicao(alimento) {
    const categoria = $("categoria-refeicao")?.value || "";
    const quantidade = parseFloat($("quantidade-refeicao")?.value) || 100;

    if (!categoria) {
      alert("Escolha uma categoria da refeição.");
      return;
    }

    if (!usuarioLogado?.id && !usuarioLogado?.codigo) {
      alert("Usuário não encontrado! Faça login novamente.");
      return;
    }

    const dataHora = new Date().toISOString().slice(0, 19).replace("T", " ");
    const energia = (Number(alimento.Energia_kcal || 0) * quantidade) / 100;
    const proteina = (Number(alimento.Proteina_g || 0) * quantidade) / 100;
    const lipidio = (Number(alimento.Lipidios_totais_g || 0) * quantidade) / 100;
    const carbo = (Number(alimento.Carboi_drato_g || 0) * quantidade) / 100;

    const payload = {
      usuarioId: usuarioLogado.id || usuarioLogado.codigo,
      nome: categoria,
      dataHora,
      alimentos: [
        {
          descricao: alimento.descricao_do_alimento,
          quantidade,
          energia: Number(energia.toFixed(2)),
          proteina: Number(proteina.toFixed(2)),
          lipidio: Number(lipidio.toFixed(2)),
          carboidrato: Number(carbo.toFixed(2))
        }
      ]
    };

    try {
      const resp = await fetch("/api/alimentos/salvar-refeicao", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify(payload)
      });

      const json = await resp.json();

      if (!resp.ok) {
        console.error("Erro salvar-refeição:", json);
        alert("Erro ao salvar refeição: " + (json.erro || resp.status));
        return;
      }

      console.log("Refeição salva com sucesso:", json);
      
      // Adicionar ao registro local
      adicionarRegistro(payload, "refeição");
      
      // Adicionar aos selecionados
      pushSelecionadoLocal(payload);
      
      // Mostrar popup de sucesso
      mostrarPopupSucesso();
      
      // Fechar popup
      fecharPopupVisualizar();

      // Atualizar homepage se a função estiver disponível
      if (typeof window.atualizarHomepage === 'function') {
        console.log("Atualizando homepage...");
        await window.atualizarHomepage();
      }

    } catch (err) {
      console.error("Erro ao salvar refeição:", err);
      alert("Erro ao salvar refeição (ver console).");
    }
  }

  function fecharPopupVisualizar() {
    if (!overlayAlimento) return;
    overlayAlimento.classList.remove("open");
    overlayAlimento.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (modalBodyAlimento) {
      modalBodyAlimento.innerHTML = `
        <h3 id="modal-content-alimento">Conteúdo do alimento...</h3>
        <div class="modal-textalign">... </div>
      `;
    }
  }

  on(closeBtnAlimento, "click", fecharPopupVisualizar);
  on(cancelBtnAlimento, "click", fecharPopupVisualizar);
  on(overlayAlimento, "click", e => { 
    if (e.target === overlayAlimento) fecharPopupVisualizar(); 
  });

  // =========================
  // POPUP NOVO ALIMENTO
  // =========================

  function abrirPopupNovo() {
    if (!overlayNovo) return;
    overlayNovo.classList.add("open");
    overlayNovo.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }

  function fecharPopupNovo() {
    if (!overlayNovo) return;
    overlayNovo.classList.remove("open");
    overlayNovo.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    try { formNovo.reset(); } catch (e) { }
  }

  on(addAlimentoBtn, "click", (e) => { 
    e?.preventDefault(); 
    abrirPopupNovo(); 
  });
  
  on(btnCloseNovo, "click", fecharPopupNovo);
  on(btnCancelarNovo, "click", fecharPopupNovo);
  on(overlayNovo, "click", e => { 
    if (e.target === overlayNovo) fecharPopupNovo(); 
  });

  if (formNovo) {
    on(formNovo, "submit", async (ev) => {
      ev.preventDefault();

      const nomeAlimento = $("nome")?.value || "Alimento personalizado";
      const carbo = parseFloat(inputCarboNovo?.value) || 0;
      const prot = parseFloat(inputProteinaNovo?.value) || 0;
      const gord = parseFloat(inputGorduraNovo?.value) || 0;

      const energiaAprox = (carbo * 4) + (prot * 4) + (gord * 9);
      
      const payload = {
        descricao_do_alimento: nomeAlimento,
        Categoria: "Personalizado",
        Energia_kcal: Number(energiaAprox.toFixed(2)),
        Proteina_g: Number(prot.toFixed(2)),
        Lipidios_totais_g: Number(gord.toFixed(2)),
        Carboi_drato_g: Number(carbo.toFixed(2)),
        Fibra_alimentar_total_g: 0
      };

      try {
        const resp = await fetch("/api/alimentos/adicionar", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify(payload)
        });
        
        const json = await resp.json();
        
        if (!resp.ok) {
          console.error("Erro ao adicionar alimento:", json);
          alert("Erro ao adicionar alimento: " + (json.erro || resp.status));
          return;
        }

        console.log("Alimento adicionado com sucesso:", json);
        
        // Adicionar ao registro
        adicionarRegistro(payload, "alimento");
        
        // Mostrar popup de sucesso
        mostrarPopupAlimentoSucesso();
        
        // Fechar popup
        fecharPopupNovo();
        
      } catch (err) {
        console.error("Erro na requisição adicionar:", err);
        alert("Erro de comunicação ao adicionar alimento.");
      }
    });
  }

  // Fechar popups com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (overlayAlimento && overlayAlimento.classList.contains("open")) {
        fecharPopupVisualizar();
      }
      if (overlayNovo && overlayNovo.classList.contains("open")) {
        fecharPopupNovo();
      }
    }
  });

  // =========================
  // REGISTROS (APENAS BOTÕES)
  // =========================

  function adicionarRegistro(payload, tipo) {
    const item = {
      descricao: tipo === "alimento" 
        ? payload.descricao_do_alimento 
        : payload.alimentos[0].descricao,
      quantidade_g: tipo === "alimento" ? 0 : payload.alimentos[0].quantidade,
      categoria_refeicao: tipo === "refeição" ? payload.nome : "Personalizado",
      dataHora: new Date().toISOString(),
      tipo,
      detalhes: tipo === "alimento"
        ? {
            energia: payload.Energia_kcal,
            proteina: payload.Proteina_g,
            lipidio: payload.Lipidios_totais_g,
            carboidrato: payload.Carboi_drato_g
          }
        : {
            descricao: payload.alimentos[0].descricao,
            quantidade: payload.alimentos[0].quantidade,
            energia: payload.alimentos[0].energia,
            proteina: payload.alimentos[0].proteina,
            lipidio: payload.alimentos[0].lipidio,
            carboidrato: payload.alimentos[0].carboidrato
          }
    };

    registros.unshift(item); // Adiciona no início
    renderRegistros();
  }

  function renderRegistros() {
    if (!allRegistrosContainer) return;

    allRegistrosContainer.innerHTML = "";

    if (registros.length === 0) {
      allRegistrosContainer.innerHTML = "<p style='text-align:center;color:#999;padding:20px;'>Nenhum registro ainda.</p>";
      return;
    }

    registros.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "alimento";
      
      if (item.tipo === "alimento") {
        btn.textContent = `${item.descricao} — Alimento criado — ${new Date(item.dataHora).toLocaleDateString()}`;
      } else {
        btn.textContent = `${item.descricao} — ${item.quantidade_g}g (${item.categoria_refeicao}) — ${new Date(item.dataHora).toLocaleDateString()}`;
      }
      
      btn.addEventListener("click", () => abrirPopupDetalhes(item));
      allRegistrosContainer.appendChild(btn);
    });
  }

  function abrirPopupDetalhes(item) {
    if (!overlayAlimento || !modalBodyAlimento) return;

    let html = `<h3>${item.descricao}</h3>`;

    if (item.tipo === "alimento") {
      html += `
        <div class="modal-textalign">
          <p><strong>Tipo:</strong> Alimento Personalizado</p>
          <p><strong>Data:</strong> ${new Date(item.dataHora).toLocaleString()}</p>
        </div>
        <div class="modal-infos">
          <p><strong>Energia (100g):</strong> ${item.detalhes.energia || "—"} kcal</p>
          <p><strong>Proteína (100g):</strong> ${item.detalhes.proteina || "—"} g</p>
          <p><strong>Lipídios (100g):</strong> ${item.detalhes.lipidio || "—"} g</p>
          <p><strong>Carboidrato (100g):</strong> ${item.detalhes.carboidrato || "—"} g</p>
        </div>
      `;
    } else {
      html += `
        <div class="modal-textalign">
          <p><strong>Categoria:</strong> ${item.categoria_refeicao || "—"}</p>
          <p><strong>Quantidade:</strong> ${item.quantidade_g} g</p>
          <p><strong>Data:</strong> ${new Date(item.dataHora).toLocaleString()}</p>
        </div>
        <div class="modal-infos">
          <p><strong>Energia:</strong> ${item.detalhes.energia || "—"} kcal</p>
          <p><strong>Proteína:</strong> ${item.detalhes.proteina || "—"} g</p>
          <p><strong>Lipídios:</strong> ${item.detalhes.lipidio || "—"} g</p>
          <p><strong>Carboidrato:</strong> ${item.detalhes.carboidrato || "—"} g</p>
        </div>
      `;
    }

    html += `
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button id="fechar-detalhes-btn" class="btn-secondary">Fechar</button>
      </div>
    `;

    modalBodyAlimento.innerHTML = html;
    overlayAlimento.classList.add("open");
    overlayAlimento.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    on($("fechar-detalhes-btn"), "click", fecharPopupVisualizar);
  }

  // =========================
  // SELECIONADOS
  // =========================

  const selecionadosLocais = [];

  function pushSelecionadoLocal(payloadRef) {
    const item = {
      descricao: payloadRef.alimentos[0].descricao,
      quantidade_g: payloadRef.alimentos[0].quantidade,
      categoria_refeicao: payloadRef.nome,
      energia_total: payloadRef.alimentos[0].energia
    };
    selecionadosLocais.push(item);
    renderSelecionadosLocais();
  }

  function renderSelecionadosLocais() {
    if (!selecionadosContainer) return;
    
    selecionadosContainer.innerHTML = "";
    
    if (selecionadosLocais.length === 0) {
      selecionadosContainer.innerHTML = "<p>Nenhuma refeição adicionada.</p>";
      return;
    }
    
    selecionadosLocais.forEach(it => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <strong>${it.descricao}</strong> — ${it.quantidade_g}g <em>(${it.categoria_refeicao})</em>
        <div style="font-size:0.9rem;color:#555">${it.energia_total.toFixed(1)} kcal</div>
      `;
      selecionadosContainer.appendChild(div);
    });
  }

  // =========================
  // POPUPS DE SUCESSO
  // =========================

  function mostrarPopupSucesso() {
    const popup = $("popup-sucesso");
    if (!popup) return;
    popup.classList.add("mostrar");
    setTimeout(() => popup.classList.remove("mostrar"), 2500);
  }

  function mostrarPopupAlimentoSucesso() {
    const popup = $("popup-alimento-sucesso");
    if (!popup) return;
    popup.classList.add("mostrar");
    setTimeout(() => popup.classList.remove("mostrar"), 2500);
  }

  console.log("script.js pronto.");
});