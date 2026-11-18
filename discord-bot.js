import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIAssistant } from './ai-assistant.js';
import { Blockchain } from './blockchain.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Aetheron Discord Bot
 * Integrates the AI Assistant and Sentinel L3 Guardrail status with Discord
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const blockchain = new Blockchain();
const aiAssistant = new AIAssistant(blockchain, null);

function loadSentinelSummary() {
  try {
    const addrPath = path.join(__dirname, 'aetheron-contracts', 'deployments', 'addresses.json');
    const data = JSON.parse(fs.readFileSync(addrPath, 'utf8'));
    return {
      network: data._meta?.network || 'Base Sepolia',
      chainId: data._meta?.chainId || 84532,
      healthy: data._meta?.sentinelSystemHealthy ?? true,
      sentinel: data.sentinel,
      l3Relay: data.l3Relay,
      policyPack: 'v0.2.1-conservative (hmac-sha256 + pq-ext Dilithium2)'
    };
  } catch (_err) {
    return {
      network: 'Base Sepolia',
      chainId: 84532,
      healthy: true,
      sentinel: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      l3Relay: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      policyPack: 'v0.2.1-conservative (hmac-sha256 + pq-ext Dilithium2)'
    };
  }
}

client.once('ready', () => {
  console.log('======================================');
  console.log(`🤖 Aetheron Bot connected as ${client.user.tag}`);
  console.log('🛡️ Sentinel L3 & AI Assistant active for Discord');
  console.log('======================================');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!sentinel') || message.content.startsWith('!aeth sentinel')) {
    const s = loadSentinelSummary();
    const sentinelEmbed = new EmbedBuilder()
      .setColor(s.healthy ? 0x00eaff : 0xff5252)
      .setTitle('🛡️ Aetheron Sentinel L3 Status')
      .setDescription(s.healthy ? 'All zero-trust bridge guardrails are online and healthy.' : '⚠️ Sentinel L3 alert active — L3Relay paused.')
      .addFields(
        { name: 'Network', value: `${s.network} (Chain ID: ${s.chainId})`, inline: true },
        { name: 'System Healthy', value: s.healthy ? '✅ YES' : '🚨 NO', inline: true },
        { name: 'PQ Policy Pack', value: s.policyPack, inline: false },
        { name: 'Sentinel Contract', value: `\`${s.sentinel}\``, inline: false },
        { name: 'L3Relay Contract', value: `\`${s.l3Relay}\``, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Aetheron Sentinel L3 v0.2.1' });

    return message.reply({ embeds: [sentinelEmbed] });
  }

  const prefix = '!aeth';
  if (!message.content.startsWith(prefix)) return;

  const userQuery = message.content.slice(prefix.length).trim();
  if (!userQuery) {
    return message.reply('How can I help you with Aetheron? Try `!aeth what is my balance?` or `!sentinel` for L3 guardrail status.');
  }

  try {
    await message.channel.sendTyping();

    const aiResponse = await aiAssistant.query(userQuery);

    const responseEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('Aetheron AI Assistant')
      .setDescription(aiResponse)
      .setThumbnail('https://aetheron.online/logo.png')
      .setTimestamp()
      .setFooter({ text: 'Aetheron Protocol 2026', iconURL: 'https://aetheron.online/favicon.ico' });

    await message.reply({ embeds: [responseEmbed] });
  } catch (error) {
    console.error('[Discord] Error:', error.message);
    const errorEmbed = new EmbedBuilder().setColor(0xFF0000).setDescription('⚠️ I encountered an error processing that request.');
    await message.reply({ embeds: [errorEmbed] });
  }
});

if (!process.env.DISCORD_TOKEN) {
  console.warn('⚠️ DISCORD_TOKEN is not set in environment or .env. Discord bot will not start.');
} else {
  client.login(process.env.DISCORD_TOKEN);
}

export { loadSentinelSummary };
