const { Client, GatewayIntentBits, Collection, InteractionType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder, EmbedBuilder, Embed  } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const Canvas = require('@napi-rs/canvas');
const championJsonFile = require('./data_files/champion.json');
const { profile } = require('node:console');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds]});

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

const lolApiKey = process.env.LOL_API_KEY;
const tftApiKey = process.env.TFT_API_KEY;

let playerData;

for(const file of eventFiles){
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if(event.once){
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for(const file of commandFiles){
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Command handling
client.on('interactionCreate', async interaction =>{
  // if(!interaction.isChatInputCommand()) return;
  if(interaction.type === InteractionType.ModalSubmit){
    if(interaction.customId === 'leagueLookup'){
      getPlayerData(interaction.fields.getTextInputValue('summonerName'), interaction.fields.getTextInputValue('summonerServer'))
        .then(async function(data){
          console.log(data);
          if(data.stats.length === 0){
            interaction.reply(`${interaction.fields.getTextInputValue('summonerName')} has no rank.`);
            return
          };
          const canvas = Canvas.createCanvas(700, 250);
          const context = canvas.getContext('2d');

          masteryID = data.mastery.championId;
          let championName;
          let championList = championJsonFile.data;
          for(let champion in championList){
            if(championList[champion].key == masteryID){
              championName = championList[champion].id
              masteryPicture = `${championName}_0.jpg`
            } 
          }

          const background = await Canvas.loadImage(`./images/lolImages/champion/splash/${masteryPicture}`);
          context.drawImage(background, 0, 0, canvas.width, canvas.height);

          context.font = applyText(canvas, data.stats[0].summonerName);
          context.fillStyle = '#ffffff';
          context.fillText(data.stats[0].summonerName, canvas.width / 2.8, canvas.height / 1.8);

          const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png'}) // User most played champion
          const rankedEmblem = new AttachmentBuilder(`./images/lolRankedEmblems/Emblem_${data.stats[0].tier.toLowerCase()[0].toUpperCase() + data.stats[0].tier.substring(1).toLowerCase()}.png`, { name: 'ranked-emblem.png'}) // User profile picture -> Change this to the Rank Emblem

          let queueType;
          if(data.stats[0].queueType === 'RANKED_SOLO_5x5'){
            queueType = 'Solo queue';
          } else {
            queueType = 'Flex queue';
          }

          const playerEmbed = new EmbedBuilder()
            .setColor([40, 247, 47])
            .setTitle(data.stats[0].summonerName)
            .setAuthor({name: 'Laith Bot'})
            .setDescription(`Server: ${interaction.fields.getTextInputValue('summonerServer')}\nQueue: ${queueType}`)
            .setThumbnail('attachment://ranked-emblem.png')
            .addFields(
              { name: 'Rank', value: `${data.stats[0].tier.toLowerCase()[0].toUpperCase() + data.stats[0].tier.substring(1).toLowerCase()} ${data.stats[0].rank} ${data.stats[0].leaguePoints} LP` },
              { name: 'Win', value: `${data.stats[0].wins}`, inline: true },
              { name: 'Loss', value: `${data.stats[0].losses}`, inline: true },
              { name: 'Win%', value: `${((data.stats[0].wins / (data.stats[0].wins + data.stats[0].losses)) * 100).toFixed(0)}%`, inline: true },
            )
            .setImage('attachment://profile-image.png')

          interaction.reply({embeds: [playerEmbed], files: [attachment, rankedEmblem]}) // This sends everything
        })
    }
  };

  const command = client.commands.get(interaction.commandName);

  if(!command) return;
  try {
    await command.execute(interaction);
  } catch (error){
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
  }
})

client.login(process.env.DISCORD_TOKEN);

// Functions
const getPlayerData = async (summonerName, summonerServer) =>{
  
  let serverFormatted = '';
  switch(summonerServer){
    case 'EUW':
      serverFormatted = 'euw1';
      break;
    case 'EUNE':
      serverFormatted = 'eun1';
      break;
    case 'NA':
      serverFormatted = 'na1';
      break;
    case 'KR':
      serverFormatted = 'kr';
      break
  }
  await axios
    .get(`https://${serverFormatted}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${lolApiKey}`)
    .then(function(res){
      playerData = {
        id: res.data.id,
        accountId: res.data.accountId,
        puuid: res.data.puuid,
        profileIconId: res.data.profileIconId,
        summonerLevel: res.data.summonerLevel,
      }
    })
    .catch(error => {
      console.error(error);
    })

  await axios
    .get(`https://${serverFormatted}.api.riotgames.com/lol/league/v4/entries/by-summoner/${playerData.id}?api_key=${lolApiKey}`)
    .then(function(res){
      playerData.stats = res.data;
    })
    .catch(error => {
      console.error(error);
    })

  await axios
    .get(`https://${serverFormatted}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${playerData.id}?api_key=${lolApiKey}`)
    .then(function(res){
      playerData.mastery = res.data[0];
    })
    .catch(error => {
      console.error(error);
    })
  
  return playerData;
}

const applyText = (canvas, text) => {
  const context = canvas.getContext('2d');

  let fontSize = 70;
  do{
    context.font = `${fontSize -= 10}px sans-serif`;
  } while (context.measureText(text).width > canvas.width - 300);

  return context.font;
}