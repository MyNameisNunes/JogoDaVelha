document.addEventListener("DOMContentLoaded", () => {
  const marcasSelect = document.getElementById("marca");
  const modelosSelect = document.getElementById("modelo");
  const anosSelect = document.getElementById("ano");
  const modeloContainer = document.getElementById("modelo-container");
  const anoContainer = document.getElementById("ano-container");
  const consultarButton = document.getElementById("consultar");
  const resultado = document.getElementById("resultado");
  const status = document.getElementById("status");

  if (
    !marcasSelect ||
    !modelosSelect ||
    !anosSelect ||
    !modeloContainer ||
    !anoContainer ||
    !consultarButton ||
    !resultado ||
    !status
  ) {
    return;
  }

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
  };

  const limparSelect = (select, textoPadrao) => {
    select.innerHTML = `<option value="">${textoPadrao}</option>`;
  };

  const parseJson = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      const message = data?.error || "Falha na requisicao.";
      throw new Error(message);
    }

    return data;
  };

  const carregarMarcas = async () => {
    setStatus("Carregando marcas...", "loading");

    try {
      const response = await fetch("/marcas");
      const marcas = await parseJson(response);

      limparSelect(marcasSelect, "Selecione a marca");

      marcas.forEach((marca) => {
        const option = document.createElement("option");
        option.value = marca.codigo;
        option.textContent = marca.nome;
        marcasSelect.appendChild(option);
      });

      setStatus("Marcas carregadas com sucesso.", "ok");
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);
      setStatus("Nao foi possivel carregar as marcas. Tente novamente em instantes.", "error");
      resultado.textContent = "";
    }
  };

  marcasSelect.addEventListener("change", async () => {
    const marcaId = marcasSelect.value;

    limparSelect(modelosSelect, "Selecione o modelo");
    limparSelect(anosSelect, "Selecione o ano");
    modeloContainer.style.display = "none";
    anoContainer.style.display = "none";
    consultarButton.disabled = true;
    resultado.textContent = "";

    if (!marcaId) {
      return;
    }

    setStatus("Carregando modelos...", "loading");

    try {
      const response = await fetch(`/modelos/${encodeURIComponent(marcaId)}`);
      const data = await parseJson(response);

      data.modelos.forEach((modelo) => {
        const option = document.createElement("option");
        option.value = modelo.codigo;
        option.textContent = modelo.nome;
        modelosSelect.appendChild(option);
      });

      modeloContainer.style.display = "block";
      setStatus("Modelos carregados.", "ok");
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      setStatus("Nao foi possivel carregar os modelos.", "error");
    }
  });

  modelosSelect.addEventListener("change", async () => {
    const marcaId = marcasSelect.value;
    const modeloId = modelosSelect.value;

    limparSelect(anosSelect, "Selecione o ano");
    anoContainer.style.display = "none";
    consultarButton.disabled = true;

    if (!marcaId || !modeloId) {
      return;
    }

    setStatus("Carregando anos...", "loading");

    try {
      const response = await fetch(
        `/anos/${encodeURIComponent(marcaId)}/${encodeURIComponent(modeloId)}`
      );
      const anos = await parseJson(response);

      anos.forEach((ano) => {
        const option = document.createElement("option");
        option.value = ano.codigo;
        option.textContent = ano.nome;
        anosSelect.appendChild(option);
      });

      anoContainer.style.display = "block";
      setStatus("Anos carregados.", "ok");
    } catch (error) {
      console.error("Erro ao carregar anos:", error);
      setStatus("Nao foi possivel carregar os anos.", "error");
    }
  });

  anosSelect.addEventListener("change", () => {
    consultarButton.disabled = !anosSelect.value;
  });

  consultarButton.addEventListener("click", async () => {
    const marcaId = marcasSelect.value;
    const modeloId = modelosSelect.value;
    const anoId = anosSelect.value;

    if (!marcaId || !modeloId || !anoId) {
      return;
    }

    setStatus("Consultando preco...", "loading");

    try {
      const response = await fetch(
        `/preco/${encodeURIComponent(marcaId)}/${encodeURIComponent(modeloId)}/${encodeURIComponent(anoId)}`
      );
      const data = await parseJson(response);

      resultado.textContent = `Preco FIPE: ${data.preco}`;
      setStatus("Consulta concluida.", "ok");
    } catch (error) {
      console.error("Erro ao consultar preco:", error);
      resultado.textContent = "";
      setStatus("Nao foi possivel consultar o preco.", "error");
    }
  });

  carregarMarcas();
});
