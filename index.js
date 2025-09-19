// Charge les variables d'environnement depuis le fichier .env
require('dotenv').config();

const {
    Client, GatewayIntentBits, REST, Routes,
    SlashCommandBuilder, EmbedBuilder, WebhookClient
} = require('discord.js');

// --- INITIALISATION DU CLIENT DISCORD ---
// Le client est le "bot" qui va se connecter à Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,        // Pour recevoir les événements liés aux serveurs
        GatewayIntentBits.GuildMessages  // Pour recevoir les messages dans les salons
    ]
});

// --- CONFIGURATION ---
// Récupère les IDs et URL depuis le fichier .env
const guildId = process.env.GUILD_ID;
let confessChannelId = process.env.CONFESS_CHANNEL_ID;

// --- WEBHOOK DE LOG ---
// Pour envoyer des logs dans un salon spécifique via un webhook
const logWebhook = new WebhookClient({ url: process.env.LOG_WEBHOOK_URL });

// --- DESCRIPTION DU BOT ---
// Texte affiché avec la commande /info
const botDescription = "🤖 Ce  bot Discord créé par **vaskoo** pour afficher la description du bot et possibilité d'ajouter une panoplie énorme de commandes";

// --- COMMANDES ---
// Liste des commandes slash du bot
const commands = [
    new SlashCommandBuilder()
        .setName('info')                 // Nom de la commande
        .setDescription('Afficher la description du bot') // Description visible dans Discord
].map(cmd => cmd.toJSON());

// --- DEPLOIEMENT DES COMMANDES ---
// Permet de synchroniser les commandes slash sur le serveur Discord
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    console.log('🎉 Le bot est maintenant en ligne !');
    console.log('💬 Pour toutes demandes, je reste disponible.');
    console.log('👤 Auteur : vaskoo');
    console.log('🟦 Discord : vaskoo');
    console.log('🌐 Mon serveur : https://discord.gg/7PPmx4Uqg6');
    client.user.setActivity('vos commandes', { type: 2 }); // Activité du bot

    try {
        console.log('Déploiement des commandes...');
        // Déploie les commandes sur le serveur spécifique
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
        console.log('✅ Commandes déployées !');
    } catch (error) {
        console.error(error);
    }
});

// --- FONCTION DE LOG VIA WEBHOOK ---
// Envoie un message détaillé dans le salon de logs
async function logCommand(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🛠 Commande exécutée')
        .setColor('#FF5500')
        .addFields(
            { name: 'Utilisateur', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Commande', value: `/${interaction.commandName}`, inline: true },
            { name: 'Options', value: interaction.options._hoistedOptions.length > 0 ? interaction.options._hoistedOptions.map(opt => `${opt.name}: ${opt.value}`).join('\n') : 'Aucune', inline: false },
            { name: 'Salon', value: `${interaction.channel ? interaction.channel.name : 'DM'} (${interaction.channelId})`, inline: true }
        )
        .setTimestamp();

    logWebhook.send({ embeds: [embed] }).catch(console.error);
}

// --- GESTION DES INTERACTIONS ---
// Détecte quand un utilisateur utilise une commande
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return; // Ignore si ce n’est pas une commande slash

    const channel = client.channels.cache.get(confessChannelId);
    if (!channel && ['confess', 'reply'].includes(interaction.commandName)) {
        // Vérifie que le salon de confession existe
        return interaction.reply({ content: 'Salon de confession introuvable.', ephemeral: true });
    }

    // --- LOG COMMANDE ---
    logCommand(interaction);

    // --- /info ---
    if (interaction.commandName === 'info') {
        const embed = new EmbedBuilder()
            .setTitle('*️⃣ À propos du bot')
            .setDescription(botDescription)
            .setColor('#047ec5')
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true }); // Réponse visible uniquement par l’utilisateur
    }
});

// --- LOGIN DU BOT ---
// Connecte le bot à Discord avec le token du fichier .env
client.login(process.env.DISCORD_TOKEN);
