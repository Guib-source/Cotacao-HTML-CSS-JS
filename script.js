// Templates de cotação com ida e volta
const modeloTextoCompleto = `✈️ Segue sua cotação especial para a sua próxima viagem:

{{origem}} ➡️ {{destino}}
📅 IDA: {{data_ida}}
➡ Saída: {{saida_ida}}h | {{paradas_ida}}
➡ Chegada: {{chegada_ida}}h em {{destino}}

{{destino}} ➡️ {{origem}}
📅 VOLTA: {{data_volta}} 
➡ Saída: {{saida_volta}}h | {{paradas_volta}}
➡ Chegada: {{chegada_volta}}h em {{origem}}

💰 Valor: R$ {{valor}} (ida e volta)
🧳 Bagagem: {{bagagem}}

Valores sujeitos à disponibilidade e alteração sem aviso prévio.
`;

// Template simplificado para somente ida
const modeloTextoSomenteIda = `✈️ Segue sua cotação especial para a sua próxima viagem:

{{origem}} ➡️ {{destino}}
📅 IDA: {{data_ida}}
➡ Saída: {{saida_ida}} | {{paradas_ida}}
➡ Chegada: {{chegada_ida}} em {{destino}}

💰 Valor: R$ {{valor}} (somente ida)
🧳 Bagagem: {{bagagem}}

Valores sujeitos à disponibilidade e alteração sem aviso prévio.
`;

let aeroportos = []; // Lista de aeroportos carregada do JSON

// Converte data ISO (aaaa-mm-dd) para formato brasileiro (dd/mm/aaaa)
const formatarDataBR = (dataISO) => {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
};

// Captura o envio do formulário e gera o texto final da cotação
document.getElementById("cotacaoForm").addEventListener("submit", (e) => {
  e.preventDefault(); // Evita o recarregamento da página

  const campos = document.querySelectorAll("[data-campo]");
  const dados = {};

  // Coleta os dados do formulário
  campos.forEach((campo) => {
    dados[campo.dataset.campo] =
      campo.type === "date" ? formatarDataBR(campo.value) : campo.value;
  });

  // Define se inclui bagagem despachada
  dados["bagagem"] = document.getElementById("bagagemDespachada").checked
    ? "Inclui bagagem de mão e bagagem despachada"
    : "Inclui somente bagagem de mão (sem bagagem despachada)";

  // Escolhe modelo (ida e volta ou somente ida)
  const modelo = document.getElementById("somenteIda").checked
    ? modeloTextoSomenteIda
    : modeloTextoCompleto;

  // Substitui os placeholders (ex: {{origem}}) pelos valores do formulário
  const textoFinal = Object.keys(dados).reduce(
    (texto, chave) =>
      texto.replace(new RegExp(`{{${chave}}}`, "g"), dados[chave]),
    modelo
  );

  // Mostra o texto final na área de resultado
  document.getElementById("textoCotacao").innerText = textoFinal;
});

// Copia o texto gerado para a área de transferência
function copiarTexto() {
  const texto = document.getElementById("textoCotacao").innerText;
  navigator.clipboard
    .writeText(texto)
    .then(() => alert("Texto copiado com sucesso!"));
}

// Configura autocomplete para os campos de texto (origem e destino)
function configurarAutocomplete(idCampo) {
  const input = document.getElementById(idCampo);
  const sugestaoBox = document.createElement("div");
  sugestaoBox.classList.add("autocomplete-box");
  input.parentNode.appendChild(sugestaoBox);

  // Escuta a digitação no input
  input.addEventListener("input", () => {
    const termo = input.value.toLowerCase();
    sugestaoBox.innerHTML = "";

    if (!termo) return;

    // Filtra até 5 aeroportos que contenham o termo (por cidade ou IATA)
    aeroportos
      .filter(
        (a) =>
          a.Cidade.toLowerCase().includes(termo) ||
          a.IATA.toLowerCase().includes(termo)
      )
      .slice(0, 5)
      .forEach((a) => {
        const item = document.createElement("div");
        item.textContent = `${a.Cidade} (${a.IATA})`;
        item.classList.add("autocomplete-item");

        // Ao clicar, preenche o input e fecha sugestões
        item.addEventListener("click", () => {
          input.value = `${a.Cidade} (${a.IATA})`;
          sugestaoBox.innerHTML = "";
        });

        sugestaoBox.appendChild(item);
      });
  });

  // Fecha a sugestão ao clicar fora
  document.addEventListener("click", (e) => {
    if (!sugestaoBox.contains(e.target) && e.target !== input) {
      sugestaoBox.innerHTML = "";
    }
  });
}

// Carrega o JSON de aeroportos e inicia os autocompletes
fetch("aeroportos.json")
  .then((res) => res.json())
  .then((data) => {
    aeroportos = data;
    configurarAutocomplete("origem");
    configurarAutocomplete("destino");
  })
  .catch((err) => console.error("Erro ao carregar aeroportos:", err));

// Função para adicionar aeroportos a lista
function adicionarAeroporto() {
  const cidade = document.getElementById("novaCidade").value.trim();
  const iata = document.getElementById("novoIATA").value.trim().toUpperCase();

  if (!cidade || !iata || iata.length !== 3) {
    alert("Informe uma cidade e um código IATA de 3 letras.");
    return;
  }

  // Verifica se já existe
  if (aeroportos.some((a) => a.IATA === iata)) {
    alert("Este código IATA já existe na lista.");
    return;
  }

  // Adiciona à lista local
  aeroportos.push({ Cidade: cidade, IATA: iata });
  alert(`Aeroporto ${cidade} (${iata}) adicionado com sucesso!`);

  // Limpa campos
  document.getElementById("novaCidade").value = "";
  document.getElementById("novoIATA").value = "";

  // Força atualização do autocomplete (simula digitação)
  ["origem", "destino"].forEach((id) => {
    const input = document.getElementById(id);
    const valorAtual = input.value;
    input.value = ""; // limpa temporariamente
    input.value = valorAtual; // redefine, disparando o autocomplete
    input.dispatchEvent(new Event("input"));
  });
}
