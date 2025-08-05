
let refeicaoAtual = null;
const selecionados = [];
let debounceTimeout;

function selecionarRefeicao(refeicao) {
    refeicaoAtual = refeicao;
    document.getElementById("refeicao-atual").innerText = "Refeição selecionada: " + refeicao;
    selecionados.length = 0
    document.getElementById('mensagem-status').innerText = "";
}

function debounce(func, delay) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(func, delay);
}

document.getElementById('busca').addEventListener('input', () => {
    debounce(sugerirAlimentos, 300);
});

async function sugerirAlimentos() {
    const busca = document.getElementById("busca").value.trim();
    const lista = document.getElementById("sugestoes");
    lista.innerHTML = "";

    if (!busca) return;

    try {
        const response = await fetch(`/api/alimentos?q=${encodeURIComponent(busca)}`);
        const alimentos = await response.json();

        if (!Array.isArray(alimentos)) {
            console.error("Resposta inesperada da API:", alimentos);
            return;
        }

        alimentos.forEach(alimento => {
            const li = document.createElement("li");
            li.textContent = alimento.descricao_do_alimento;
            li.onclick = () => {
                document.getElementById("busca").value = alimento.descricao_do_alimento;
                lista.innerHTML = "";
            };
            lista.appendChild(li);
        });

        if (alimentos.length === 0) {
            lista.innerHTML = "<li>Nenhum alimento encontrado.</li>";
        }
    } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
    }
}

document.getElementById('btn-adicionar-alimento').addEventListener('click', () => {
    const busca = document.getElementById('busca').value.trim();
    const quantidade = parseFloat(document.getElementById('quantidade').value);

    if (!refeicaoAtual) {
        alert("Selecione uma refeição primeiro!");
        return;
    }
    if (!busca) {
        alert("Digite um alimento para adicionar.");
        return;
    }
    if (isNaN(quantidade) || quantidade <= 0) {
        alert("Digite uma quantidade válida.");
        return;
    }

    fetch(`/api/alimentos?q=${encodeURIComponent(busca)}`)
        .then(response => response.json())
        .then(alimentos => {
            if (!Array.isArray(alimentos) || alimentos.length === 0) {
                alert("Alimento não encontrado.");
                return;
            }

            const alimento = alimentos[0];
            adicionarAlimento(alimento, quantidade);

            document.getElementById('busca').value = '';
            document.getElementById('quantidade').value = '';
            document.getElementById('sugestoes').innerHTML = '';
        })
        .catch(err => {
            console.error("Erro ao buscar alimento:", err);
            alert("Erro ao buscar alimento.");
        });
});

function adicionarAlimento(alimento, quantidade) {
    if (!alimento || !alimento.descricao_do_alimento) {
        console.error('Alimento inválido:', alimento);
        return;
    }

    const agora = new Date();
    const dataHora = agora.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const energiaTotal = (alimento.Energia_kcal * quantidade) / 100 || 0;
    const proteinasTotal = (alimento.Proteina_g * quantidade) / 100 || 0;
    const lipideosTotal = (alimento.Lipidios_totais_g * quantidade) / 100 || 0;
    const carboidratosTotal = (alimento.Carboi_drato_g * quantidade) / 100 || 0;

    const selecionado = {
        ...alimento,
        quantidade,
        refeicao: refeicaoAtual,
        dataHora,
        energiaTotal,
        proteinasTotal,
        lipideosTotal,
        carboidratosTotal
    };

    selecionados.push(selecionado);
    atualizarSelecionados();
}


function alterarQuantidade(index, novaQuantidade) {
    novaQuantidade = parseFloat(novaQuantidade);
    if (isNaN(novaQuantidade) || novaQuantidade <= 0) return;
    const itensRefeicao = selecionados.filter(i => i.refeicao === refeicaoAtual);
    const item = itensRefeicao[index];
    if (!item) return;
    item.quantidade = novaQuantidade;
    item.energiaTotal = (item.Energia_kcal * novaQuantidade) / 100 || 0;
    item.proteinasTotal = (item.Proteina_g * novaQuantidade) / 100 || 0;
    item.lipideosTotal = (item.Lipidios_totais_g * novaQuantidade) / 100 || 0;
    item.carboidratosTotal = (item.Carboi_drato_g * novaQuantidade) / 100 || 0;
    atualizarSelecionados();
}

function mostrarInputQuantidade(index) {
    document.getElementById(`editar-${index}`).style.display = 'block';
}

function salvarQuantidade(index) {
    const novaQtd = parseFloat(document.getElementById(`novaQuantidade-${index}`).value);
    if (isNaN(novaQtd) || novaQtd <= 0) return;

    const itensRefeicao = selecionados.filter(i => i.refeicao === refeicaoAtual);
    const item = itensRefeicao[index];
    const pos = selecionados.indexOf(item);

    if (pos !== -1) {
        selecionados[pos].quantidade = novaQtd;
        atualizarSelecionados();
    }
}

function deletarAlimento(index) {
    const itensRefeicao = selecionados.filter(i => i.refeicao === refeicaoAtual);
    const item = itensRefeicao[index];
    const pos = selecionados.indexOf(item);
    if (pos > -1) selecionados.splice(pos, 1);
    atualizarSelecionados();
}

function atualizarSelecionados() {
    const container = document.getElementById("selecionados");
    container.innerHTML = "";
    const itens = selecionados.filter(i => i.refeicao === refeicaoAtual);
    if (itens.length === 0) {
        container.innerHTML = "<p>Nenhum alimento adicionado para esta refeição.</p>";
        return;
    }
    let totKcal = 0, totProt = 0, totLip = 0, totCarb = 0;
    itens.forEach((item, idx) => {
        totKcal += item.energiaTotal;
        totProt += item.proteinasTotal;
        totLip += item.lipideosTotal;
        totCarb += item.carboidratosTotal;

        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
                <span>${item.quantidade}g de <strong>${item.descricao_do_alimento}</strong><br>
                <small>${item.energiaTotal.toFixed(1)} kcal | ${item.proteinasTotal.toFixed(1)}g proteínas |
                ${item.lipideosTotal.toFixed(1)}g lipídios | ${item.carboidratosTotal.toFixed(1)}g carboidratos</small><br>
                <small>Adicionado em: ${item.dataHora}</small></span>
                <div>
                    <input type="number" min="1" value="${item.quantidade}" 
                           onchange="alterarQuantidade(${idx}, this.value)">
                    <button onclick="deletarAlimento(${idx})">x</button>
                </div>`;
        container.appendChild(div);
    });
    const total = document.createElement("div");
    total.innerHTML = `<strong>Total da refeição:</strong><br>
            ${totKcal.toFixed(1)} kcal | ${totProt.toFixed(1)}g proteínas | 
            ${totLip.toFixed(1)}g lipídios | ${totCarb.toFixed(1)}g carboidratos`;
    total.style.marginTop = "12px";
    container.appendChild(total);
}

document.addEventListener("click", function (event) {
    const lista = document.getElementById("sugestoes");
    const buscaInput = document.getElementById("busca");
    if (!lista.contains(event.target) && event.target !== buscaInput) {
        lista.innerHTML = "";
    }
});

document.getElementById("criarRefeicaoBtn").addEventListener("click", async () => {
    if (!refeicaoAtual) {
        alert("Selecione uma refeição antes de salvar.");
        return;
    }

    const alimentos = selecionados.filter(i => i.refeicao === refeicaoAtual);

    if (alimentos.length === 0) {
        alert("Adicione pelo menos um alimento antes de salvar.");
        return;
    }

    const nomeRefeicao = refeicaoAtual;
    const usuario = "usuario123";
    const dataHora = new Date().toISOString().slice(0, 19);

    const alimentosParaEnviar = alimentos.map(item => ({
        descricao: item.descricao_do_alimento,
        quantidade: item.quantidade,
        energia: item.energiaTotal,
        proteina: item.proteinasTotal,
        lipidio: item.lipideosTotal,
        carboidrato: item.carboidratosTotal
    }));

    try {
        const response = await fetch("/api/alimentos/salvar-refeicao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: nomeRefeicao,
                usuario,
                dataHora,
                alimentos: alimentosParaEnviar
            })
        });

        const resultado = await response.json();

        if (response.ok) {
            document.getElementById("mensagem-status").innerText = "Refeição salva com sucesso!";
            selecionados.length = 0;
            atualizarSelecionados();
        } else {
            console.error(resultado.erro);
            document.getElementById("mensagem-status").innerText = "Erro ao salvar refeição.";
        }
    } catch (err) {
        console.error(err);
        document.getElementById("mensagem-status").innerText = "Erro ao salvar refeição.";
    }
});

document.getElementById('formAdicionarAlimento').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const dados = Object.fromEntries(formData.entries());

    try {
        const resposta = await fetch('/api/alimentos/adicionar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();
        document.getElementById('mensagem').innerText = resultado.mensagem || resultado.erro;

    } catch (erro) {
        console.error("Erro na requisição:", erro);
        document.getElementById('mensagem').innerText = "Erro ao adicionar alimento.";
    }
});
