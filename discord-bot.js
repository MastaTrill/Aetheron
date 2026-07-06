import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { AIAssistant } from './ai-assistant.js';
import { Blockchain } from './blockchain.js';
import 'dotenv/config';

/**
 * Aetheron Discord Bot
 * Integrates the AI Assistant with the Discord community server
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Core Modules
const blockchain = new Blockchain();
const aiAssistant = new AIAssistant(blockchain, null);

client.once('ready', () => {
  console.log('======================================');
  console.log(`🤖 Aetheron Bot connected as ${client.user.tag}`);
  console.log('🚀 AI Assistant is active for Discord');
  console.log('======================================');
});

client.on('messageCreate', async (message) => {
  // Ignore bots or messages without the prefix
  if (message.author.bot) return;
  
  const prefix = '!aeth';
  if (!message.content.startsWith(prefix)) return;

  const userQuery = message.content.slice(prefix.length).trim();
  if (!userQuery) {
    return message.reply('How can I help you with Aetheron? Try asking "!aeth what is my balance?"');
  }

  try {
    // Show "Aetheron is typing..." status
    await message.channel.sendTyping();
    
    const aiResponse = await aiAssistant.query(userQuery);

    const responseEmbed = new EmbedBuilder()
      .setColor(0x0099FF) // Aetheron Blue
      .setTitle('Aetheron AI Assistant')
      .setDescription(aiResponse)
      .setThumbnail('https://aetheron.online/logo.png') // Replace with your actual logo URL
      .setTimestamp()
      .setFooter({ text: 'Aetheron Protocol 2026', iconURL: 'https://aetheron.online/favicon.ico' });

    await message.reply({ embeds: [responseEmbed] });
  } catch (error) {
    console.error('[Discord] Error:', error.message);
    const errorEmbed = new EmbedBuilder().setColor(0xFF0000).setDescription('⚠️ I encountered an error processing that request.');
    await message.reply({ embeds: [errorEmbed] });
  }
});

client.login(process.env.DISCORD_TOKEN);