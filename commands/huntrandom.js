const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ActionRow } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('huntrandom')
    .setDescription('Get random weapons for a new loadout in Hunt: Showdown!'),
  async execute(interaction){
    const row = new ActionRowBuilder()
      .addComponents(
        new SelectMenuBuilder()
          .setCustomId('quartermaster')
          .setPlaceholder('Nothing selected')
          .addOptions(
            {
              label: 'Yes',
              description: 'You have the perk ~Quartermaster~.',
              value: 'hasQuartermaster'
            },
            {
              label: 'No',
              description: 'You do NOT have the perk ~Quartermaster~.',
              value: 'noQuartermaster'
            }
          )
      )
      await interaction.reply({content: 'Do you have quartermaster?', components: [row]})
  }
}