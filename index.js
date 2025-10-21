require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const axios = require('axios');

const client = new Client({ checkUpdate: false });

const delay = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function sendLog(content) {
  try {
    const guild = await client.guilds.fetch('1381216724027834408');
    const channel = await guild.channels.fetch('1389639415374151780');
    await channel.send({ content: `\`\`\`\n${content}\n\`\`\`` });
  } catch (e) {
    console.error('[Log Error]', e.message);
  }
}

async function startTypingAndWait(channelId, content) {
  try {
    await axios.post(`https://discord.com/api/v9/channels/${channelId}/typing`, {}, {
      headers: { Authorization: client.token },
    });
    const typingSpeed = rand(4, 6); // karakter per detik
    const durationMs = (content.length / typingSpeed) * 1000;
    await delay(durationMs);
  } catch (e) {
    console.error('[Typing Error]', e.message);
  }
}

async function sendMessage(channelId, content, skipTyping = false) {
  if (!skipTyping) {
    await startTypingAndWait(channelId, content);
    await delay(500);
  }

  return axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, {
    content,
  }, { headers: { Authorization: client.token } });
}

client.on('messageCreate', async (message) => {
  const content = message.content.trim();
  const args = content.split(/\s+/);

  // Hanya tanggapi pesan sendiri
  if (message.author.id !== client.user.id) return;

  // === !voice <channelId> ===
  if (content.startsWith('!voice ') && args[1]) {
    await message.delete().catch(() => null);
    try {
      const guild = client.guilds.cache.get(message.guild.id);
      const vc = await guild.channels.fetch(args[1]);
      joinVoiceChannel({
        channelId: vc.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true,
      });
      await sendLog(`[✅] Join VC: ${vc.name}`);
    } catch (e) {
      await sendLog(`[❌] Gagal join VC: ${e.message}`);
    }
    return;
  }

  // === !cek <messageId> ===
  if (content.startsWith('!cek ') && args[1]) {
    await message.delete().catch(() => null);
    try {
      const target = await message.channel.messages.fetch(args[1]);
      const log = [
        `[✅] Pesan ditemukan di #${message.channel.name}`,
        `Dari: ${target.author.tag} (${target.author.id})`,
        `Isi: ${target.content}`,
        `JSON:\n${JSON.stringify(target.toJSON(), null, 2)}`
      ].join('\n');
      await sendLog(log);
    } catch (e) {
      await sendLog(`[❌] Gagal fetch pesan: ${e.message}`);
    }
    return;
  }

  // === !avatar <userId | mention> ===
  if (content.startsWith('!avatar ') && args[1]) {
    await message.delete().catch(() => null);
    const id = args[1].replace(/[<@!>]/g, '');
    try {
      const user = await client.users.fetch(id);
      await sendMessage(message.channel.id, user.displayAvatarURL({ dynamic: true, size: 4096 }), true);
    } catch (e) {
      await sendMessage(message.channel.id, `❌ Gagal ambil avatar: ${e.message}`, true);
    }
    return;
  }
});

client.on('ready', async () => {
  console.log(`[✅ LOGIN] ${client.user.tag}`);
  await sendLog(`[✅ LOGIN] ${client.user.tag}`);

  // === Perbaikan Presence (Activity) ===
  client.user.setPresence({
    activities: [
      {
        name: 'Roblox️', // teks status
        type: 0, // 0 = Playing
        url: 'https://cdn.discordapp.com/attachments/1397711965937336350/1430236126072934565/CITYPNG.COMHD_New_Roblox_Logo_Icon_PNG_-_800x800.png?ex=68f90ab0&is=68f7b930&hm=ab34f5e5a46164e1babd96b35a90e271127ab03786a2e303bdf1bc3bf54ec428&',
        assets: {
          large_image: 'https://cdn.discordapp.com/attachments/1397711965937336350/1430236126072934565/CITYPNG.COMHD_New_Roblox_Logo_Icon_PNG_-_800x800.png?ex=68f90ab0&is=68f7b930&hm=ab34f5e5a46164e1babd96b35a90e271127ab03786a2e303bdf1bc3bf54ec428&', // contoh gambar ikon
          large_text: 'Playing Roblox'
        }
      }
    ],
    status: 'online', // tampil online
  });
});

client.login(process.env.TOKEN);