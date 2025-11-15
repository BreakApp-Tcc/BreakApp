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

  let debounceTimer = null;
  function debounce(fn, delay = 300) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay);
  }

  // --- FUNÇÕES DE LOGS ---
  const allRegistrosContainer = document.getElementById("all-registros");

  // Array global para controle de logs com timestamp
  const registros = [];

  function renderRegistro(item) {
    // Remove registros antigos (mais de 24h)
    const agora = new Date();
    registros.push(item);
    const registrosRecentes = registros.filter(r => (agora - new Date(r.dataHora)) <= 24 * 60 * 60 * 1000);

    // Limpa container
    allRegistrosContainer.innerHTML = "";

    registrosRecentes.forEach(r => {
      const container = document.createElement("div");
      container.className = "alimento-container";

      // Botão do registro
      const btn = document.createElement("button");
      btn.className = "alimento";
      btn.textContent = `${r.descricao} — ${r.quantidade_g || 0}g — ${new Date(r.dataHora).toLocaleDateString()}`;
      btn.dataset.tipo = r.tipo;
      btn.dataset.detalhes = JSON.stringify(r.detalhes || {});
      btn.addEventListener("click", () => abrirPopupDetalhes(r));

      // Section de log detalhado
      const logSection = document.createElement("div");
      logSection.className = "log-section";

      const h3 = document.createElement("h3");
      h3.textContent = "Últimas alterações";

      const logList = document.createElement("div");
      logList.className = "log-list";

      // Conteúdo do log
      const logItem = document.createElement("div");
      logItem.className = "log-item";

      const logTitle = document.createElement("div");
      logTitle.className = "log-title";
      if (r.tipo === "alimento") {
        logTitle.textContent = "Alimento criado";
      } else {
        logTitle.textContent = `Refeição adicionada (${r.categoria_refeicao})`;
      }

      const logDesc = document.createElement("div");
      logDesc.className = "log-description";
      if (r.tipo === "alimento") {
        logDesc.textContent = `Energia: ${r.detalhes.energia || 0} kcal | Proteína: ${r.detalhes.proteina || 0} g | Lipídios: ${r.detalhes.lipidio || 0} g | Carboidrato: ${r.detalhes.carboidrato || 0} g`;
      } else {
        logDesc.textContent = `Alimento: ${r.detalhes.descricao} | Quantidade: ${r.detalhes.quantidade} g | Energia: ${r.detalhes.energia} kcal | Proteína: ${r.detalhes.proteina} g | Lipídio: ${r.detalhes.lipidio} g | Carboidrato: ${r.detalhes.carboidrato} g`;
      }

      const logTime = document.createElement("div");
      logTime.className = "log-time";
      logTime.textContent = new Date(r.dataHora).toLocaleString();

      logItem.appendChild(logTitle);
      logItem.appendChild(logDesc);
      logItem.appendChild(logTime);

      logList.appendChild(logItem);
      logSection.appendChild(h3);
      logSection.appendChild(logList);

      container.appendChild(btn);
      container.appendChild(logSection);
      allRegistrosContainer.appendChild(container);
    });
  }

  // Função de log única
  function adicionarLogAlimentoOuRefeicao(payload, tipo) {
    const item = {
      descricao: tipo === "alimento" ? payload.descricao_do_alimento : payload.alimentos[0].descricao,
      quantidade_g: tipo === "alimento" ? 0 : payload.alimentos[0].quantidade,
      categoria_refeicao: tipo === "refeição" ? payload.nome : "—",
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

    renderRegistro(item);
  }


  if (searchbar && sugestoesLista) {
    on(searchbar, "input", () => debounce(async () => {
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
        console.error("Erro ao buscar sugestões:", err);
      }
    }, 250));
  }

  document.addEventListener("click", (e) => {
    if (!sugestoesLista) return;
    if (e.target === searchbar) return;
    if (!sugestoesLista.contains(e.target)) sugestoesLista.innerHTML = "";
  });

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

    on($("salvar-refeicao-btn"), "click", async () => {
      const categoria = $("categoria-refeicao")?.value || "";
      const quantidade = parseFloat($("quantidade-refeicao")?.value) || 100;
      if (!categoria) {
        alert("Escolha uma categoria da refeição.");
        return;
      }

      const dataHora = new Date().toISOString().slice(0, 19).replace("T", " ");
      const energia = (Number(alimento.Energia_kcal || 0) * quantidade) / 100;
      const proteina = (Number(alimento.Proteina_g || 0) * quantidade) / 100;
      const lipidio = (Number(alimento.Lipidios_totais_g || 0) * quantidade) / 100;
      const carbo = (Number(alimento.Carboi_drato_g || 0) * quantidade) / 100;

      const payload = {
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) {
          console.error("Erro salvar-refeição:", json);
          alert("Erro ao salvar refeição: " + (json.erro || resp.status));
          return;
        }

        mostrarPopupSucesso();
        adicionarLogAlimentoOuRefeicao(payload, "refeição");
        pushSelecionadoLocal(payload);
        fecharPopupVisualizar();
      } catch (err) {
        console.error("Erro ao salvar refeição:", err);
        alert("Erro ao salvar refeição (ver console).");
      }
    });
  }

  function fecharPopupVisualizar() {
    if (!overlayAlimento) return;
    overlayAlimento.classList.remove("open");
    overlayAlimento.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (modalBodyAlimento) modalBodyAlimento.innerHTML = `<h3 id="modal-content-alimento">Conteúdo do alimento...</h3>
      <div class="modal-textalign">... </div>`;
  }

  on(closeBtnAlimento, "click", fecharPopupVisualizar);
  on(cancelBtnAlimento, "click", fecharPopupVisualizar);
  on(overlayAlimento, "click", e => { if (e.target === overlayAlimento) fecharPopupVisualizar(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (overlayAlimento && overlayAlimento.classList.contains("open")) fecharPopupVisualizar();
      if (overlayNovo && overlayNovo.classList.contains("open")) fecharPopupNovo();
    }
  });

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

  on(addAlimentoBtn, "click", (e) => { e?.preventDefault(); abrirPopupNovo(); });
  on(btnCloseNovo, "click", fecharPopupNovo);
  on(btnCancelarNovo, "click", fecharPopupNovo);
  on(overlayNovo, "click", e => { if (e.target === overlayNovo) fecharPopupNovo(); });

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) {
          console.error("Erro ao adicionar alimento:", json);
          alert("Erro ao adicionar alimento: " + (json.erro || resp.status));
          return;
        }
        mostrarPopupAlimentoSucesso();
        adicionarLogAlimentoOuRefeicao(payload, "alimento");
        fecharPopupNovo();
      } catch (err) {
        console.error("Erro na requisição adicionar:", err);
        alert("Erro de comunicação ao adicionar alimento.");
      }
    });
  }

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
      div.innerHTML = `<strong>${it.descricao}</strong> — ${it.quantidade_g}g <em>(${it.categoria_refeicao})</em>
        <div style="font-size:0.9rem;color:#555">${it.energia_total.toFixed(1)} kcal</div>`;
      selecionadosContainer.appendChild(div);
    });
  }

  console.log("script.js pronto.");
});

const allRegistrosContainer = document.getElementById("all-registros");

function renderRegistro(item) {

  const container = document.createElement("div");
  container.className = "alimento-container";

  const btn = document.createElement("button");
  btn.className = "alimento";
  btn.textContent = `${item.descricao} — ${item.quantidade_g}g — ${new Date(item.dataHora).toLocaleDateString()}`;
  btn.dataset.tipo = item.tipo;
  btn.dataset.detalhes = JSON.stringify(item.detalhes || {});
  btn.addEventListener("click", () => abrirPopupDetalhes(item));

  const logSection = document.createElement("div");
  logSection.className = "log-section";
  const h3 = document.createElement("h3");
  h3.textContent = "Últimas alterações";
  const logList = document.createElement("div");
  logList.className = "log-list";
  logSection.appendChild(h3);
  logSection.appendChild(logList);

  container.appendChild(btn);
  container.appendChild(logSection);
  allRegistrosContainer.prepend(container);
}

function abrirPopupDetalhes(item) {
  const overlay = document.getElementById("overlay-alimento");
  const modalBody = overlay.querySelector(".modal-body");

  modalBody.innerHTML = `
        <h3>${item.descricao}</h3>
        <div class="modal-textalign">
            <p><strong>Categoria:</strong> ${item.categoria_refeicao || "—"}</p>
            <p><strong>Quantidade:</strong> ${item.quantidade_g} g</p>
            <p><strong>Data registrada:</strong> ${new Date(item.dataHora).toLocaleString()}</p>
        </div>
        <div class="modal-infos">
            <p><strong>Energia:</strong> ${item.detalhes.energia || "—"} kcal</p>
            <p><strong>Proteína:</strong> ${item.detalhes.proteina || "—"} g</p>
            <p><strong>Lipídios:</strong> ${item.detalhes.lipidio || "—"} g</p>
            <p><strong>Carboidrato:</strong> ${item.detalhes.carboidrato || "—"} g</p>
        </div>
    `;

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
}

function mostrarPopupSucesso() {
  const popup = document.getElementById("popup-sucesso");
  if (!popup) return;
  popup.classList.add("mostrar");
  setTimeout(() => popup.classList.remove("mostrar"), 2500);
}

function mostrarPopupAlimentoSucesso() {
  const popup = document.getElementById("popup-alimento-sucesso");
  if (!popup) return;
  popup.classList.add("mostrar");
  setTimeout(() => popup.classList.remove("mostrar"), 2500);
}
