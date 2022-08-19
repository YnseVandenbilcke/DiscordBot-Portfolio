const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaguelookup')
    .setDescription('Lookup a player in the League of Legends database'),
  async execute(interaction){
    const modal = new ModalBuilder()
      .setCustomId('leagueLookup')
      .setTitle('Player lookup');

      const summonerName = new TextInputBuilder()
      .setCustomId('summonerName')
      .setLabel("Summoner name?")
      .setStyle(TextInputStyle.Short);

    const summonerServer = new TextInputBuilder()
      .setCustomId('summonerServer')
      .setLabel("Server? -> EUW/EUNE/NA/KR")
      .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(summonerName);
    const secondActionRow = new ActionRowBuilder().addComponents(summonerServer);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);
  }
}