require("dotenv").config();
const { Client, GatewayIntentBits, Events, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let total = 0;
let history = []; // array de {id, valor}

// Objetivo fixo
const objetivo = 7000;

// Mapeamento de IDs para nomes
const nomesUsuarios = {
  "373477571565715479": "Rafael",
  "494284491356110848": "Carolina"
};

// Função para formatar valores em BRL
function formatarBRL(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para gerar barra de progresso
function barraProgresso(atual, meta, tamanho = 20) {
  const proporcao = Math.min(atual / meta, 1);
  const preenchido = Math.round(proporcao * tamanho);
  const vazio = tamanho - preenchido;
  return `[${'█'.repeat(preenchido)}${'-'.repeat(vazio)}] ${Math.round(proporcao * 100)}%`;
}

client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  const parts = msg.content.trim().split(" ");

  // Comando Enviar <valor>
  if (parts[0].toLowerCase() === "enviar") {
    if (!parts[1]) return msg.reply("Por favor, envie um valor.");

    const valorStr = parts[1].replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(valorStr);

    if (isNaN(valor)) return msg.reply("Por favor, envie um valor válido.");

    total += valor;
    history.push({ id: msg.author.id, valor });

    const nome = nomesUsuarios[msg.author.id] || msg.author.username;

    msg.reply(`Valor registrado: ${formatarBRL(valor)} **${nome}**\nTotal atual: ${formatarBRL(total)}`);
  }

  // Comando Total
  if (parts[0].toLowerCase() === "total") {
    msg.reply(`Total acumulado: ${formatarBRL(total)}`);
  }

  // Comando History
  if (parts[0].toLowerCase() === "history") {
    if (history.length === 0) return msg.reply("Nenhum valor registrado ainda.");
    msg.reply(
      "Histórico:\n" +
      history.map((entry, i) => {
        const nome = nomesUsuarios[entry.id] || "Desconhecido";
        return `${i + 1}. **${nome}**: ${formatarBRL(entry.valor)}`;
      }).join("\n")
    );
  }

  // Comando Resumo
  if (parts[0].toLowerCase() === "resumo") {
    if (history.length === 0) return msg.reply("Nenhum valor registrado ainda.");

    const resumo = {};

    for (const id in nomesUsuarios) resumo[id] = 0;

    for (const entry of history) {
      if (!resumo[entry.id]) resumo[entry.id] = 0;
      resumo[entry.id] += entry.valor;
    }

    let mensagem = "**Resumo individual:**\n\n";
    for (const id in nomesUsuarios) {
      const nome = nomesUsuarios[id];
      mensagem += `**${nome}**: ${formatarBRL(resumo[id])}\n`;
    }

    msg.reply(mensagem);
  }

  // Comando Objetivo
  if (parts[0].toLowerCase() === "objetivo") {
    const restante = Math.max(objetivo - total, 0);
    msg.reply(
      `**Objetivo:** ${formatarBRL(objetivo)}\n` +
      `Total acumulado: ${formatarBRL(total)}\n` +
      `Faltam: ${formatarBRL(restante)}\n` +
      `Progresso: ${barraProgresso(total, objetivo)}`
    );
  }

  // Comando Limpar
  if (parts[0].toLowerCase() === "limpar") {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return msg.reply("Você não tem permissão para limpar mensagens.");
    }

    const qtd = parseInt(parts[1]) || 50;
    try {
      const mensagens = await msg.channel.bulkDelete(qtd, true);
      const m = await msg.channel.send(`🧹 ${mensagens.size} mensagens apagadas!`);
      setTimeout(() => m.delete(), 3000);
    } catch (err) {
      msg.reply("Não foi possível apagar as mensagens: " + err);
    }
  }

  // Comando Reset
  if (parts[0].toLowerCase() === "reset") {
    total = 0;
    history = [];
    msg.reply("Tudo foi resetado! ✔️");
  }

  // Comando Help / Ajuda
  if (parts[0].toLowerCase() === "help" || parts[0].toLowerCase() === "ajuda") {
    msg.reply(
      "**📘 Lista de Comandos:**\n\n" +
      "**Enviar <valor>** — Registra um novo valor.\n" +
      "**Total** — Mostra o total acumulado.\n" +
      "**History** — Mostra todos os valores registrados.\n" +
      "**Resumo** — Mostra o total enviado por cada pessoa.\n" +
      "**Objetivo** — Mostra quanto já foi enviado e quanto falta, com barra de progresso.\n" +
      "**Limpar <quantidade>** — Apaga mensagens do canal (padrão 50).\n" +
      "**Reset** — Zera tudo.\n" +
      "**Help / ajuda** — Mostra esta tabela."
    );
  }
});

client.login(process.env.TOKEN);


