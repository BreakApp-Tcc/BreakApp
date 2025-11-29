document.addEventListener("DOMContentLoaded", async () => {
    const bar = document.getElementById("water-bar");
    const barText = document.getElementById("water-bar-text");
    const metaText = document.getElementById("water-goal-text");
    const addInput = document.getElementById("add-water");
    const registrarBtn = document.getElementById("registrar-water");
  
    // Buscar usuário
    const usuarioResp = await fetch("/api/user");
    if (!usuarioResp.ok) return console.warn("Nenhum usuário identificado.");
    const usuario = await usuarioResp.json();
  
    // Limpar localStorage ao logar
    localStorage.removeItem("aguaConsumida");
    localStorage.removeItem("metaAgua");
    localStorage.removeItem("ultimoDia");
  
    let aguaConsumida = 0;
    const metaAgua = Math.round(usuario.peso * 35);
    const ultimoDia = new Date().toISOString().split("T")[0];
  
    metaText.textContent = `Meta diária: ${metaAgua} ml`;
  
    function saveLocal() {
      localStorage.setItem("aguaConsumida", aguaConsumida);
      localStorage.setItem("metaAgua", metaAgua);
      localStorage.setItem("ultimoDia", ultimoDia);
    }
  
    function atualizarBarra() {
        const percent = Math.min((aguaConsumida / metaAgua) * 100, 100);
        bar.style.width = percent + "%";
        barText.textContent = `${aguaConsumida} ml`;
    
        // Cor da barra muda do azul para verde conforme o progresso
        const greenValue = Math.round((percent / 100) * 150) + 100; // verde cresce com o progresso
        const redValue = Math.round(150 - (percent / 100) * 150);   // vermelho diminui
        bar.style.backgroundColor = `rgb(${redValue}, ${greenValue}, 50)`;
    
        saveLocal();
    }
    
  
    registrarBtn.addEventListener("click", () => {
      const qtd = Number(addInput.value);
      if (!qtd || qtd <= 0) {
        alert("Insira uma quantidade válida!");
        return;
      }
  
      aguaConsumida += qtd; // acumula valor
      addInput.value = "";
      atualizarBarra(); // atualiza barra imediatamente
    });
  
    atualizarBarra(); // inicializa barra
  });
  