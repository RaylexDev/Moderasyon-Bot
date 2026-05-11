import {
  Client, GatewayIntentBits, Partials, Collection,
  REST, Routes, SlashCommandBuilder, PermissionFlagsBits,
  AuditLogEvent, ActivityType, AttachmentBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags, ChannelType,
  time, TimestampStyles,
} from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

// ─── Konfigurasyon ────────────────────────────────────────────────────────────

const TOKEN     = "BURAYA_TOKEN_YAZ";
const CLIENT_ID = "BURAYA_CLIENT_ID_YAZ";
const GUILD_ID  = "BURAYA_GUILD_ID_YAZ"; // Slash komutları için (global için boş bırak)
const FOOTER    = "MarvelCode ❤️ RaylexDev";
const BOT_NAME  = "MarvelCode Mod";
const PREFIX    = ".";

// Log kanalı adları — .kur yazınca otomatik oluşturulur
const LOG_CHANNELS = {
  ban:     "🔨・ban-log",
  kick:    "👟・kick-log",
  mute:    "🔇・mute-log",
  warn:    "⚠️・uyarı-log",
  role:    "🏷️・rol-log",
  channel: "📢・kanal-log",
  member:  "👤・üye-log",
  message: "💬・mesaj-log",
  voice:   "🎙️・ses-log",
  server:  "⚙️・sunucu-log",
  mod:     "🛡️・mod-log",
};

// ─── CV2 Yardımcıları ─────────────────────────────────────────────────────────

const CV2 = MessageFlags.IsComponentsV2;

const COLOR = {
  PRIMARY: 0x5865f2, SUCCESS: 0x2ecc71, ERROR: 0xe74c3c,
  WARN: 0xf1c40f,   INFO: 0x3498db,    OFF: 0x99aab5,
  BAN: 0xff4757,    KICK: 0xe67e22,    MUTE: 0x9b59b6,
  WARN2: 0xf39c12,  ROLE: 0x8e44ad,    CHANNEL: 0x2980b9,
  MEMBER: 0x27ae60, MESSAGE: 0xe74c3c, VOICE: 0x16a085,
  SERVER: 0x2c3e50, MOD: 0xc0392b,     FUN: 0x1abc9c,
};

const E = {
  CHECK:"✅", CROSS:"❌", WARN:"⚠️", INFO:"ℹ️", MOD:"🛡️",
  BAN:"🔨", KICK:"👟", MUTE:"🔇", UNMUTE:"🔊", WARN2:"⚠️",
  UNWARN:"✨", ROLE:"🏷️", CHANNEL:"📢", MEMBER:"👤", MSG:"💬",
  VOICE:"🎙️", SERVER:"⚙️", CLOCK:"⏰", USER:"👤", EDIT:"✏️",
  DELETE:"🗑️", CREATE:"➕", JOIN:"📥", LEAVE:"📤", LOCK:"🔒",
  UNLOCK:"🔓", PIN:"📌", BACKUP:"💾", CHART:"📊", CROWN:"👑",
  SLOW:"🐌", CLEAR:"🧹", TIMEOUT:"⏱️", HISTORY:"📋", FUN:"🎮",
  COIN:"🪙", DICE:"🎲", RPS:"✊", EIGHT:"🎱", LOVE:"❤️",
};

function sep(d=true){
  return new SeparatorBuilder().setDivider(d).setSpacing(SeparatorSpacingSize.Small);
}
function txt(c){return new TextDisplayBuilder().setContent(c);}
function box(color){return new ContainerBuilder().setAccentColor(color);}
function ts(ms=Date.now()){return `<t:${Math.floor(ms/1000)}:F>`;}
function tsR(ms=Date.now()){return `<t:${Math.floor(ms/1000)}:R>`;}

function errReply(t,eph=true){
  const c=box(COLOR.ERROR);
  c.addTextDisplayComponents(txt(`${E.CROSS} ${t}`));
  c.addSeparatorComponents(sep(false));
  c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
  return {flags:CV2|(eph?MessageFlags.Ephemeral:0),components:[c]};
}
function okReply(t){
  const c=box(COLOR.SUCCESS);
  c.addTextDisplayComponents(txt(`${E.CHECK} ${t}`));
  c.addSeparatorComponents(sep(false));
  c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
  return {flags:CV2,components:[c]};
}

// ─── Veritabanı ───────────────────────────────────────────────────────────────

mkdirSync("./data",{recursive:true});
const FILES={
  warns:"./data/warns.json",
  mutes:"./data/mutes.json",
  logch:"./data/logChannels.json",
  notes:"./data/notes.json",
};

function dbLoad(f){
  if(!existsSync(f))return{};
  try{return JSON.parse(readFileSync(f,"utf8"));}catch{return{};}
}
function dbSave(f,d){
  const tmp=f+".tmp";
  writeFileSync(tmp,JSON.stringify(d,null,2),"utf8");
  writeFileSync(f,JSON.stringify(d,null,2),"utf8");
}

// Warns
function warnAdd(gid,uid,entry){
  const d=dbLoad(FILES.warns);
  if(!d[gid])d[gid]={};
  if(!d[gid][uid])d[gid][uid]=[];
  d[gid][uid].unshift(entry);
  dbSave(FILES.warns,d);
  return d[gid][uid].length;
}
function warnGet(gid,uid){return dbLoad(FILES.warns)[gid]?.[uid]??[];}
function warnClear(gid,uid){
  const d=dbLoad(FILES.warns);
  if(d[gid])d[gid][uid]=[];
  dbSave(FILES.warns,d);
}
function warnRemove(gid,uid,idx){
  const d=dbLoad(FILES.warns);
  if(d[gid]?.[uid])d[gid][uid].splice(idx,1);
  dbSave(FILES.warns,d);
}

// Notes
function noteAdd(gid,uid,entry){
  const d=dbLoad(FILES.notes);
  if(!d[gid])d[gid]={};
  if(!d[gid][uid])d[gid][uid]=[];
  d[gid][uid].unshift(entry);
  dbSave(FILES.notes,d);
}
function noteGet(gid,uid){return dbLoad(FILES.notes)[gid]?.[uid]??[];}
function noteClear(gid,uid){
  const d=dbLoad(FILES.notes);
  if(d[gid])d[gid][uid]=[];
  dbSave(FILES.notes,d);
}

// Log channels
function lcGet(gid){return dbLoad(FILES.logch)[gid]??{};}
function lcSet(gid,m){const d=dbLoad(FILES.logch);d[gid]=m;dbSave(FILES.logch,d);}

// ─── Canvas ───────────────────────────────────────────────────────────────────

function rr(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);
  ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}

async function canvasMod({emoji,title,targetTag,targetAvatar,reason,mod,color}){
  const W=800,H=210,cv=createCanvas(W,H),ctx=cv.getContext("2d");
  // BG
  const bg=ctx.createLinearGradient(0,0,W,H);
  const dark=colorDarken(color);
  bg.addColorStop(0,dark);bg.addColorStop(1,"#0a0a0a");
  ctx.fillStyle=bg;rr(ctx,0,0,W,H,18);ctx.fill();
  // Accent bar
  ctx.fillStyle="#"+color.toString(16).padStart(6,"0");
  ctx.fillRect(0,0,6,H);
  // Avatar
  try{
    const url=targetAvatar?.replace(".webp",".png");
    if(url){
      const img=await loadImage(url);
      ctx.save();ctx.beginPath();ctx.arc(104,H/2,56,0,Math.PI*2);ctx.clip();
      ctx.drawImage(img,48,H/2-56,112,112);ctx.restore();
      ctx.strokeStyle="#"+color.toString(16).padStart(6,"0");
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(104,H/2,58,0,Math.PI*2);ctx.stroke();
    }
  }catch(_){}
  // Title
  ctx.font="bold 28px sans-serif";ctx.fillStyle="#ffffff";
  ctx.fillText(`${emoji}  ${title}`,185,62);
  // Target
  ctx.font="17px sans-serif";ctx.fillStyle="#aaaaaa";
  ctx.fillText(`Kullanıcı: ${targetTag}`,185,97);
  // Reason
  const r2=reason?.length>60?reason.slice(0,60)+"...":reason;
  ctx.font="15px sans-serif";ctx.fillStyle="#cccccc";
  ctx.fillText(`Sebep: ${r2??"Belirtilmedi"}`,185,127);
  // Mod
  ctx.font="13px sans-serif";ctx.fillStyle="#777";
  ctx.fillText(`Yetkili: ${mod}`,185,155);
  // Footer
  ctx.font="12px sans-serif";ctx.fillStyle="#444";
  ctx.fillText(FOOTER,W-200,H-14);
  return cv.toBuffer("image/png");
}

function colorDarken(hex){
  const r=Math.floor(((hex>>16)&0xff)*0.15).toString(16).padStart(2,"0");
  const g=Math.floor(((hex>>8)&0xff)*0.15).toString(16).padStart(2,"0");
  const b=Math.floor((hex&0xff)*0.15).toString(16).padStart(2,"0");
  return `#${r}${g}${b}`;
}

async function canvasProfile({tag,avatar,guildName,warns,joinedAt,createdAt}){
  const W=800,H=240,cv=createCanvas(W,H),ctx=cv.getContext("2d");
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#0d0d1a");bg.addColorStop(1,"#0a0a0a");
  ctx.fillStyle=bg;rr(ctx,0,0,W,H,18);ctx.fill();
  ctx.fillStyle="#5865f2";ctx.fillRect(0,0,6,H);
  try{
    const url=avatar?.replace(".webp",".png");
    if(url){
      const img=await loadImage(url);
      ctx.save();ctx.beginPath();ctx.arc(104,H/2,60,0,Math.PI*2);ctx.clip();
      ctx.drawImage(img,44,H/2-60,120,120);ctx.restore();
      ctx.strokeStyle="#5865f2";ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(104,H/2,62,0,Math.PI*2);ctx.stroke();
    }
  }catch(_){}
  ctx.font="bold 26px sans-serif";ctx.fillStyle="#fff";ctx.fillText(tag,190,58);
  ctx.font="16px sans-serif";ctx.fillStyle="#888";ctx.fillText(guildName,190,88);
  ctx.font="bold 15px sans-serif";ctx.fillStyle="#aaa";
  ctx.fillText(`⚠️  Uyarı: ${warns}`,190,124);
  ctx.fillText(`📥  Sunucuya Giriş: ${new Date(joinedAt).toLocaleDateString("tr-TR")}`,190,152);
  ctx.fillText(`📅  Hesap Tarihi: ${new Date(createdAt).toLocaleDateString("tr-TR")}`,190,180);
  ctx.font="12px sans-serif";ctx.fillStyle="#444";ctx.fillText(FOOTER,W-200,H-14);
  return cv.toBuffer("image/png");
}

// ─── Log Kanalı Gönderici ─────────────────────────────────────────────────────

async function getLC(guild,type){
  const map=lcGet(guild.id);
  const id=map[type];
  if(id){const ch=guild.channels.cache.get(id);if(ch)return ch;}
  return null;
}

async function sendLog(guild,type,color,title,fields,avatarUrl=null,reason=null){
  const ch=await getLC(guild,type);
  if(!ch)return;

  let files=[];
  if(avatarUrl){
    try{
      const buf=await canvasMod({
        emoji:title.split(" ")[0],title:title.replace(/^.\S+\s/,""),
        targetTag:fields.find(([k])=>k.includes("Kullanıcı"))?.[1]??"",
        targetAvatar:avatarUrl,reason,
        mod:fields.find(([k])=>k.includes("Yetkili")||k.includes("Yapan"))?.[1]??"",
        color,
      });
      files=[new AttachmentBuilder(buf,{name:"mod-log.png"})];
    }catch(_){}
  }

  const c=box(color);
  c.addTextDisplayComponents(txt(`## ${title}`));
  c.addSeparatorComponents(sep());
  c.addTextDisplayComponents(txt(fields.map(([k,v])=>`${k} ${v}`).join("\n")));
  c.addSeparatorComponents(sep(false));
  c.addTextDisplayComponents(txt(`-# ${FOOTER} • ${ts()}`));
  const payload={flags:CV2,components:[c]};
  if(files.length)payload.files=files;
  await ch.send(payload).catch(()=>{});
}

// ─── .kur Setup ──────────────────────────────────────────────────────────────

async function setupLogChannels(guild){
  const existing=lcGet(guild.id);
  const created={};
  const catName="📋 Mod Logları";

  let cat=guild.channels.cache.find(c=>c.type===ChannelType.GuildCategory&&c.name===catName);
  if(!cat){
    cat=await guild.channels.create({
      name:catName,
      type:ChannelType.GuildCategory,
      permissionOverwrites:[
        {id:guild.id,deny:[PermissionFlagsBits.ViewChannel]},
        {id:guild.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels]},
      ],
    }).catch(()=>null);
  }

  for(const[key,chName]of Object.entries(LOG_CHANNELS)){
    const exId=existing[key];
    if(exId&&guild.channels.cache.has(exId)){created[key]=exId;continue;}
    const old=guild.channels.cache.find(c=>c.name===chName&&c.isTextBased());
    if(old){created[key]=old.id;continue;}
    const nc=await guild.channels.create({
      name:chName,type:ChannelType.GuildText,
      parent:cat?.id??null,
      permissionOverwrites:[
        {id:guild.id,deny:[PermissionFlagsBits.ViewChannel]},
        {id:guild.members.me.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages]},
      ],
    }).catch(()=>null);
    if(nc)created[key]=nc.id;
  }

  lcSet(guild.id,created);
  return created;
}

// ─── Süre Çözümleyici ────────────────────────────────────────────────────────

function parseDuration(str){
  if(!str)return null;
  const match=str.match(/^(\d+)(s|m|h|d|w)$/i);
  if(!match)return null;
  const n=parseInt(match[1]);
  const u=match[2].toLowerCase();
  const map={s:1000,m:60000,h:3600000,d:86400000,w:604800000};
  return n*(map[u]??0);
}

function formatDuration(ms){
  if(ms<60000)return `${Math.floor(ms/1000)} saniye`;
  if(ms<3600000)return `${Math.floor(ms/60000)} dakika`;
  if(ms<86400000)return `${Math.floor(ms/3600000)} saat`;
  return `${Math.floor(ms/86400000)} gün`;
}

// ─── Client ───────────────────────────────────────────────────────────────────

const client=new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.MessageContent,
  ],
  partials:[Partials.GuildMember,Partials.User,Partials.Message,Partials.Channel],
});

client.commands=new Collection();

// ─── Slash Komutları ──────────────────────────────────────────────────────────

const slashCommands=[

  // ── /ban ────────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("ban").setDescription("Kullanıcıyı banlar")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep"))
      .addIntegerOption(o=>o.setName("silme_gun").setDescription("Kaç günlük mesaj silinsin (0-7)").setMinValue(0).setMaxValue(7)),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      const days=i.options.getInteger("silme_gun")??0;
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(!target.bannable)return i.reply(errReply("Bu kullanıcıyı banlayamam! Rolü benden yüksek olabilir."));
      if(target.id===i.user.id)return i.reply(errReply("Kendini banlayamazsın!"));
      await i.deferReply();
      await target.ban({reason:`${i.user.tag}: ${reason}`,deleteMessageSeconds:days*86400});
      let files=[];
      try{const buf=await canvasMod({emoji:"🔨",title:"Kullanıcı Banlandı",targetTag:target.user.tag,targetAvatar:target.user.displayAvatarURL(),reason,mod:i.user.tag,color:COLOR.BAN});files=[new AttachmentBuilder(buf,{name:"ban.png"})];}catch(_){}
      const c=box(COLOR.BAN);
      c.addTextDisplayComponents(txt(`## ${E.BAN} Kullanıcı Banlandı\n${E.USER} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}\n${E.CLOCK} **Tarih:** ${ts()}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.editReply({flags:CV2,components:[c],files});
      await sendLog(i.guild,"ban",COLOR.BAN,`${E.BAN} Kullanıcı Banlandı`,[[`${E.USER} **Kullanıcı:**`,`${target.user} (\`${target.user.tag}\` | \`${target.id}\`)`],[`${E.USER} **Yetkili:**`,`${i.user} (\`${i.user.tag}\`)`],[`${E.INFO} **Sebep:**`,reason],[`${E.CLOCK} **Tarih:**`,ts()]],target.user.displayAvatarURL(),reason);
    }
  },

  // ── /unban ──────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("unban").setDescription("Kullanıcının banını kaldırır")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption(o=>o.setName("id").setDescription("Kullanıcı ID").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const uid=i.options.getString("id");
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      try{
        const ban=await i.guild.bans.fetch(uid);
        await i.guild.bans.remove(uid,`${i.user.tag}: ${reason}`);
        const c=box(COLOR.SUCCESS);
        c.addTextDisplayComponents(txt(`## ${E.UNLOCK} Ban Kaldırıldı\n${E.USER} **Kullanıcı:** \`${ban.user.tag}\`\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}`));
        c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
        await i.reply({flags:CV2,components:[c]});
        await sendLog(i.guild,"ban",COLOR.SUCCESS,`${E.UNLOCK} Ban Kaldırıldı`,[[`${E.USER} **Kullanıcı:**`,`\`${ban.user.tag}\``],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]]);
      }catch{return i.reply(errReply("Bu ID'li bir ban bulunamadı!"));}
    }
  },

  // ── /kick ───────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("kick").setDescription("Kullanıcıyı sunucudan atar")
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(!target.kickable)return i.reply(errReply("Bu kullanıcıyı atamam!"));
      if(target.id===i.user.id)return i.reply(errReply("Kendini atamazsın!"));
      await i.deferReply();
      try{await target.send({flags:CV2,components:[
        (()=>{const c=box(COLOR.KICK);c.addTextDisplayComponents(txt(`## ${E.KICK} Sunucudan Atıldın\n**Sunucu:** ${i.guild.name}\n**Sebep:** ${reason}\n**Yetkili:** ${i.user.tag}`));c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));return c;})()
      ]}).catch(()=>{});}catch(_){}
      await target.kick(`${i.user.tag}: ${reason}`);
      let files=[];
      try{const buf=await canvasMod({emoji:"👟",title:"Kullanıcı Atıldı",targetTag:target.user.tag,targetAvatar:target.user.displayAvatarURL(),reason,mod:i.user.tag,color:COLOR.KICK});files=[new AttachmentBuilder(buf,{name:"kick.png"})];}catch(_){}
      const c=box(COLOR.KICK);
      c.addTextDisplayComponents(txt(`## ${E.KICK} Kullanıcı Atıldı\n${E.USER} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.editReply({flags:CV2,components:[c],files});
      await sendLog(i.guild,"kick",COLOR.KICK,`${E.KICK} Kullanıcı Atıldı`,[[`${E.USER} **Kullanıcı:**`,`${target.user} (\`${target.user.tag}\`)`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]],target.user.displayAvatarURL(),reason);
    }
  },

  // ── /timeout ────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("timeout").setDescription("Kullanıcıya timeout verir")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("sure").setDescription("Süre: 10m, 1h, 1d, 1w").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const sureStr=i.options.getString("sure");
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(!target.moderatable)return i.reply(errReply("Bu kullanıcıya timeout veremem!"));
      const ms=parseDuration(sureStr);
      if(!ms||ms>2419200000)return i.reply(errReply("Geçersiz süre! Örnek: `10m`, `1h`, `7d` (max 28 gün)"));
      await i.deferReply();
      await target.timeout(ms,`${i.user.tag}: ${reason}`);
      let files=[];
      try{const buf=await canvasMod({emoji:"⏱️",title:"Timeout Verildi",targetTag:target.user.tag,targetAvatar:target.user.displayAvatarURL(),reason,mod:i.user.tag,color:COLOR.MUTE});files=[new AttachmentBuilder(buf,{name:"timeout.png"})];}catch(_){}
      const c=box(COLOR.MUTE);
      c.addTextDisplayComponents(txt(`## ${E.TIMEOUT} Timeout Verildi\n${E.USER} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n${E.CLOCK} **Süre:** ${formatDuration(ms)}\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}\n${E.CLOCK} **Bitiş:** ${ts(Date.now()+ms)}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.editReply({flags:CV2,components:[c],files});
      await sendLog(i.guild,"mute",COLOR.MUTE,`${E.TIMEOUT} Timeout Verildi`,[[`${E.USER} **Kullanıcı:**`,`${target.user} (\`${target.user.tag}\`)`],[`${E.CLOCK} **Süre:**`,formatDuration(ms)],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]],target.user.displayAvatarURL(),reason);
    }
  },

  // ── /untimeout ──────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("untimeout").setDescription("Kullanıcının timeout'unu kaldırır")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(!target.isCommunicationDisabled())return i.reply(errReply("Bu kullanıcıda aktif bir timeout yok!"));
      await target.timeout(null,`${i.user.tag}: ${reason}`);
      const c=box(COLOR.SUCCESS);
      c.addTextDisplayComponents(txt(`## ${E.UNMUTE} Timeout Kaldırıldı\n${E.USER} **Kullanıcı:** ${target.user}\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"mute",COLOR.SUCCESS,`${E.UNMUTE} Timeout Kaldırıldı`,[[`${E.USER} **Kullanıcı:**`,`${target.user}`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]]);
    }
  },

  // ── /uyar ───────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("uyar").setDescription("Kullanıcıyı uyarır")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep").setRequired(true)),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const reason=i.options.getString("sebep");
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(target.id===i.user.id)return i.reply(errReply("Kendini uyaramazsın!"));
      const entry={reason,mod:i.user.tag,modId:i.user.id,timestamp:Date.now()};
      const count=warnAdd(i.guild.id,target.id,entry);
      try{await target.send({flags:CV2,components:[
        (()=>{const c=box(COLOR.WARN2);c.addTextDisplayComponents(txt(`## ${E.WARN2} Uyarıldın!\n**Sunucu:** ${i.guild.name}\n**Sebep:** ${reason}\n**Toplam Uyarı:** ${count}`));c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));return c;})()
      ]}).catch(()=>{});}catch(_){}
      let files=[];
      try{const buf=await canvasMod({emoji:"⚠️",title:`Uyarı #${count}`,targetTag:target.user.tag,targetAvatar:target.user.displayAvatarURL(),reason,mod:i.user.tag,color:COLOR.WARN2});files=[new AttachmentBuilder(buf,{name:"warn.png"})];}catch(_){}
      const c=box(COLOR.WARN2);
      c.addTextDisplayComponents(txt(`## ${E.WARN2} Uyarı Verildi — #${count}\n${E.USER} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n${E.INFO} **Sebep:** ${reason}\n${E.CHART} **Toplam Uyarı:** ${count}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c],files});
      await sendLog(i.guild,"warn",COLOR.WARN2,`${E.WARN2} Kullanıcı Uyarıldı`,[[`${E.USER} **Kullanıcı:**`,`${target.user} (\`${target.user.tag}\`)`],[`${E.CHART} **Toplam:**`,`${count}. uyarı`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]],target.user.displayAvatarURL(),reason);
    }
  },

  // ── /uyarilar ───────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("uyarilar").setDescription("Kullanıcının uyarı geçmişini gösterir")
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı (boş bırakılırsa kendin)").setRequired(false)),
    async execute(i){
      const target=i.options.getUser("kullanici")??i.user;
      const warns=warnGet(i.guild.id,target.id);
      const c=box(COLOR.WARN2);
      c.addTextDisplayComponents(txt(`## ${E.HISTORY} Uyarı Geçmişi — ${target.tag}`));
      c.addSeparatorComponents(sep());
      if(!warns.length){
        c.addTextDisplayComponents(txt(`${E.CHECK} Bu kullanıcının hiç uyarısı yok!`));
      } else {
        warns.slice(0,10).forEach((w,idx)=>{
          c.addTextDisplayComponents(txt(`**${idx+1}.** ${E.WARN2} ${w.reason}\n-# ${E.USER} ${w.mod} • ${ts(w.timestamp)}`));
          if(idx<Math.min(warns.length,10)-1)c.addSeparatorComponents(sep(false));
        });
        if(warns.length>10)c.addTextDisplayComponents(txt(`-# ...ve ${warns.length-10} uyarı daha`));
      }
      c.addSeparatorComponents(sep(false));
      c.addTextDisplayComponents(txt(`-# ${FOOTER} • Toplam: **${warns.length}** uyarı`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ── /uyarisil ───────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("uyarisil").setDescription("Uyarı siler")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addIntegerOption(o=>o.setName("numara").setDescription("Uyarı numarası (boş=hepsini sil)").setMinValue(1)),
    async execute(i){
      const target=i.options.getUser("kullanici");
      const num=i.options.getInteger("numara");
      const warns=warnGet(i.guild.id,target.id);
      if(!warns.length)return i.reply(errReply("Bu kullanıcının uyarısı yok!"));
      if(num){
        if(num>warns.length)return i.reply(errReply(`Geçersiz numara! (1-${warns.length})`));
        warnRemove(i.guild.id,target.id,num-1);
        await i.reply(okReply(`${target.tag} kullanıcısının **${num}.** uyarısı silindi.`));
      } else {
        warnClear(i.guild.id,target.id);
        await i.reply(okReply(`${target.tag} kullanıcısının tüm uyarıları (**${warns.length}**) silindi.`));
      }
      await sendLog(i.guild,"warn",COLOR.SUCCESS,`${E.UNWARN} Uyarı Silindi`,[[`${E.USER} **Kullanıcı:**`,`${target.tag}`],[`${E.INFO} **Silinen:**`,num?`${num}. uyarı`:"Tümü"],[`${E.USER} **Yetkili:**`,`${i.user}`]]);
    }
  },

  // ── /temizle ────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("temizle").setDescription("Mesajları toplu siler")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption(o=>o.setName("adet").setDescription("Silinecek mesaj sayısı (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
      .addUserOption(o=>o.setName("kullanici").setDescription("Sadece bu kullanıcının mesajları")),
    async execute(i){
      const adet=i.options.getInteger("adet");
      const target=i.options.getUser("kullanici");
      await i.deferReply({ephemeral:true});
      let messages=await i.channel.messages.fetch({limit:100});
      if(target)messages=messages.filter(m=>m.author.id===target.id);
      messages=messages.first(adet);
      const deleted=await i.channel.bulkDelete(messages,true).catch(()=>new Map());
      await i.editReply({flags:CV2,components:[
        (()=>{const c=box(COLOR.SUCCESS);c.addTextDisplayComponents(txt(`${E.CLEAR} **${deleted.size}** mesaj silindi.`));return c;})()
      ]});
      await sendLog(i.guild,"message",COLOR.WARN,`${E.CLEAR} Toplu Mesaj Silindi`,[[`${E.CHANNEL} **Kanal:**`,`<#${i.channel.id}>`],[`${E.MSG} **Silinen:**`,`${deleted.size} mesaj`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.USER} **Filtre:**`,target?`${target.tag}`:"Hepsi"]]);
    }
  },

  // ── /slowmode ───────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("slowmode").setDescription("Kanal yavaş modunu ayarlar")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addStringOption(o=>o.setName("sure").setDescription("Süre: 0=kapat, 5s, 10m, 1h").setRequired(true))
      .addChannelOption(o=>o.setName("kanal").setDescription("Kanal (boş=bu kanal)")),
    async execute(i){
      const sureStr=i.options.getString("sure");
      const ch=i.options.getChannel("kanal")??i.channel;
      const ms=sureStr==="0"?0:parseDuration(sureStr);
      if(ms===null||ms>21600000)return i.reply(errReply("Geçersiz süre! Örnek: `0`, `5s`, `30m`, `6h`"));
      await ch.setRateLimitPerUser(ms/1000,`${i.user.tag} tarafından ayarlandı`);
      const c=box(COLOR.INFO);
      c.addTextDisplayComponents(txt(`## ${E.SLOW} Yavaş Mod ${ms===0?"Kapatıldı":"Ayarlandı"}\n${E.CHANNEL} **Kanal:** <#${ch.id}>\n${E.CLOCK} **Süre:** ${ms===0?"Kapalı":formatDuration(ms)}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"channel",COLOR.INFO,`${E.SLOW} Yavaş Mod Değiştirildi`,[[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}>`],[`${E.CLOCK} **Süre:**`,ms===0?"Kapalı":formatDuration(ms)],[`${E.USER} **Yetkili:**`,`${i.user}`]]);
    }
  },

  // ── /kilitle / kilittazla ───────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("kilitle").setDescription("Kanalı kilitler (yazma kapatılır)")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption(o=>o.setName("kanal").setDescription("Kanal"))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const ch=i.options.getChannel("kanal")??i.channel;
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      await ch.permissionOverwrites.edit(i.guild.id,{SendMessages:false},{reason:`${i.user.tag}: ${reason}`});
      const c=box(COLOR.MOD);
      c.addTextDisplayComponents(txt(`## ${E.LOCK} Kanal Kilitlendi\n${E.CHANNEL} **Kanal:** <#${ch.id}>\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"channel",COLOR.MOD,`${E.LOCK} Kanal Kilitlendi`,[[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}>`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]]);
    }
  },
  {
    data:new SlashCommandBuilder().setName("kilittazla").setDescription("Kanalın kilidini açar")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addChannelOption(o=>o.setName("kanal").setDescription("Kanal"))
      .addStringOption(o=>o.setName("sebep").setDescription("Sebep")),
    async execute(i){
      const ch=i.options.getChannel("kanal")??i.channel;
      const reason=i.options.getString("sebep")??"Sebep belirtilmedi";
      await ch.permissionOverwrites.edit(i.guild.id,{SendMessages:null},{reason:`${i.user.tag}: ${reason}`});
      const c=box(COLOR.SUCCESS);
      c.addTextDisplayComponents(txt(`## ${E.UNLOCK} Kanal Kilidi Açıldı\n${E.CHANNEL} **Kanal:** <#${ch.id}>\n${E.INFO} **Sebep:** ${reason}\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"channel",COLOR.SUCCESS,`${E.UNLOCK} Kanal Kilidi Açıldı`,[[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}>`],[`${E.USER} **Yetkili:**`,`${i.user}`],[`${E.INFO} **Sebep:**`,reason]]);
    }
  },

  // ── /profil ─────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("profil").setDescription("Kullanıcı moderasyon profilini gösterir")
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı")),
    async execute(i){
      await i.deferReply();
      const target=i.options.getMember("kullanici")??i.member;
      const warns=warnGet(i.guild.id,target.id);
      const notes=noteGet(i.guild.id,target.id);
      let files=[];
      try{
        const buf=await canvasProfile({
          tag:target.user.tag,avatar:target.user.displayAvatarURL(),
          guildName:i.guild.name,warns:warns.length,
          joinedAt:target.joinedTimestamp,createdAt:target.user.createdTimestamp,
        });
        files=[new AttachmentBuilder(buf,{name:"profil.png"})];
      }catch(_){}
      const c=box(COLOR.PRIMARY);
      c.addTextDisplayComponents(txt(`## ${E.USER} Moderasyon Profili — ${target.user.tag}`));
      c.addSeparatorComponents(sep());
      c.addTextDisplayComponents(txt(
        `${E.USER} **ID:** \`${target.id}\`\n`+
        `${E.WARN2} **Uyarı:** ${warns.length}\n`+
        `${E.PIN} **Not:** ${notes.length}\n`+
        `${E.TIMEOUT} **Timeout:** ${target.isCommunicationDisabled()?`Evet — ${ts(target.communicationDisabledUntilTimestamp)}`:"Hayır"}\n`+
        `${E.JOIN} **Giriş:** ${ts(target.joinedTimestamp)}\n`+
        `${E.CLOCK} **Hesap:** ${ts(target.user.createdTimestamp)}\n`+
        `${E.ROLE} **Roller:** ${target.roles.cache.filter(r=>r.id!==i.guild.id).map(r=>`<@&${r.id}>`).join(", ")||"Yok"}`
      ));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.editReply({flags:CV2,components:[c],files});
    }
  },

  // ── /not ────────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("not").setDescription("Kullanıcıya not ekler/görüntüler")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addSubcommand(s=>s.setName("ekle").setDescription("Not ekle")
        .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
        .addStringOption(o=>o.setName("not").setDescription("Not içeriği").setRequired(true)))
      .addSubcommand(s=>s.setName("listele").setDescription("Notları görüntüle")
        .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true)))
      .addSubcommand(s=>s.setName("temizle").setDescription("Tüm notları sil")
        .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))),
    async execute(i){
      const sub=i.options.getSubcommand();
      const target=i.options.getUser("kullanici");
      if(sub==="ekle"){
        const note=i.options.getString("not");
        noteAdd(i.guild.id,target.id,{note,mod:i.user.tag,modId:i.user.id,timestamp:Date.now()});
        await i.reply(okReply(`${target.tag} için not eklendi.`));
      }
      if(sub==="listele"){
        const notes=noteGet(i.guild.id,target.id);
        const c=box(COLOR.INFO);
        c.addTextDisplayComponents(txt(`## ${E.PIN} Notlar — ${target.tag}`));
        c.addSeparatorComponents(sep());
        if(!notes.length)c.addTextDisplayComponents(txt("Bu kullanıcı için not bulunmuyor."));
        else notes.slice(0,8).forEach((n,idx)=>{
          c.addTextDisplayComponents(txt(`**${idx+1}.** ${n.note}\n-# ${E.USER} ${n.mod} • ${ts(n.timestamp)}`));
          if(idx<Math.min(notes.length,8)-1)c.addSeparatorComponents(sep(false));
        });
        c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER} • ${notes.length} not`));
        await i.reply({flags:CV2,components:[c]});
      }
      if(sub==="temizle"){
        noteClear(i.guild.id,target.id);
        await i.reply(okReply(`${target.tag} için tüm notlar temizlendi.`));
      }
    }
  },

  // ── /nick ───────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("nick").setDescription("Kullanıcının nickini değiştirir")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addStringOption(o=>o.setName("nick").setDescription("Yeni nick (boş=sıfırla)")),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const nick=i.options.getString("nick")??null;
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      const old=target.nickname;
      await target.setNickname(nick,`${i.user.tag} tarafından değiştirildi`);
      const c=box(COLOR.INFO);
      c.addTextDisplayComponents(txt(`## ${E.EDIT} Nick Değiştirildi\n${E.USER} **Kullanıcı:** ${target.user}\n${E.EDIT} **Eski:** \`${old??"Yok"}\`\n${E.EDIT} **Yeni:** \`${nick??"Sıfırlandı"}\`\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"mod",COLOR.INFO,`${E.EDIT} Nick Değiştirildi`,[[`${E.USER} **Kullanıcı:**`,`${target.user}`],[`${E.EDIT} **Değişiklik:**`,`\`${old??"Yok"}\` → \`${nick??"Sıfırlandı"}\``],[`${E.USER} **Yetkili:**`,`${i.user}`]]);
    }
  },

  // ── /rol-ver / /rol-al ──────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("rol-ver").setDescription("Kullanıcıya rol verir")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addRoleOption(o=>o.setName("rol").setDescription("Rol").setRequired(true)),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const role=i.options.getRole("rol");
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(role.position>=i.guild.members.me.roles.highest.position)return i.reply(errReply("Bu rolü veremem, rolüm yeterli değil!"));
      if(target.roles.cache.has(role.id))return i.reply(errReply("Bu kullanıcıda bu rol zaten var!"));
      await target.roles.add(role,`${i.user.tag} tarafından verildi`);
      const c=box(COLOR.SUCCESS);
      c.addTextDisplayComponents(txt(`## ${E.ROLE} Rol Verildi\n${E.USER} **Kullanıcı:** ${target.user}\n${E.ROLE} **Rol:** <@&${role.id}>\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"role",COLOR.SUCCESS,`${E.ROLE} Rol Verildi`,[[`${E.USER} **Kullanıcı:**`,`${target.user}`],[`${E.ROLE} **Rol:**`,`<@&${role.id}>`],[`${E.USER} **Yetkili:**`,`${i.user}`]]);
    }
  },
  {
    data:new SlashCommandBuilder().setName("rol-al").setDescription("Kullanıcıdan rol alır")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı").setRequired(true))
      .addRoleOption(o=>o.setName("rol").setDescription("Rol").setRequired(true)),
    async execute(i){
      const target=i.options.getMember("kullanici");
      const role=i.options.getRole("rol");
      if(!target)return i.reply(errReply("Kullanıcı bulunamadı!"));
      if(!target.roles.cache.has(role.id))return i.reply(errReply("Bu kullanıcıda bu rol zaten yok!"));
      await target.roles.remove(role,`${i.user.tag} tarafından alındı`);
      const c=box(COLOR.WARN2);
      c.addTextDisplayComponents(txt(`## ${E.ROLE} Rol Alındı\n${E.USER} **Kullanıcı:** ${target.user}\n${E.ROLE} **Rol:** <@&${role.id}>\n${E.USER} **Yetkili:** ${i.user}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
      await sendLog(i.guild,"role",COLOR.WARN2,`${E.ROLE} Rol Alındı`,[[`${E.USER} **Kullanıcı:**`,`${target.user}`],[`${E.ROLE} **Rol:**`,`<@&${role.id}>`],[`${E.USER} **Yetkili:**`,`${i.user}`]]);
    }
  },

  // ── /sunucu ─────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("sunucu").setDescription("Sunucu istatistiklerini gösterir"),
    async execute(i){
      await i.deferReply();
      const g=i.guild;
      await g.members.fetch();
      const total=g.memberCount;
      const bots=g.members.cache.filter(m=>m.user.bot).size;
      const humans=total-bots;
      const online=g.members.cache.filter(m=>m.presence?.status==="online").size;
      const c=box(COLOR.PRIMARY);
      c.addTextDisplayComponents(txt(`## ${E.SERVER} ${g.name}`));
      c.addSeparatorComponents(sep());
      c.addTextDisplayComponents(txt(
        `${E.CROWN} **Sahip:** <@${g.ownerId}>\n`+
        `${E.MEMBER} **Toplam Üye:** ${total} (${humans} insan, ${bots} bot)\n`+
        `${E.CHANNEL} **Kanallar:** ${g.channels.cache.filter(c=>c.type===ChannelType.GuildText).size} metin • ${g.channels.cache.filter(c=>c.type===ChannelType.GuildVoice).size} ses\n`+
        `${E.ROLE} **Roller:** ${g.roles.cache.size}\n`+
        `${E.CLOCK} **Kuruluş:** ${ts(g.createdTimestamp)}\n`+
        `${E.INFO} **Doğrulama:** Seviye ${g.verificationLevel}`
      ));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.editReply({flags:CV2,components:[c]});
    }
  },

  // ── /kullanici ──────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("kullanici").setDescription("Kullanıcı bilgisini gösterir")
      .addUserOption(o=>o.setName("kullanici").setDescription("Kullanıcı")),
    async execute(i){
      const target=i.options.getMember("kullanici")??i.member;
      const c=box(COLOR.INFO);
      c.addTextDisplayComponents(txt(`## ${E.USER} ${target.user.tag}`));
      c.addSeparatorComponents(sep());
      c.addTextDisplayComponents(txt(
        `${E.INFO} **ID:** \`${target.id}\`\n`+
        `${E.JOIN} **Sunucuya Giriş:** ${ts(target.joinedTimestamp)}\n`+
        `${E.CLOCK} **Hesap Oluşturma:** ${ts(target.user.createdTimestamp)}\n`+
        `${E.ROLE} **Roller:** ${target.roles.cache.filter(r=>r.id!==i.guild.id).map(r=>`<@&${r.id}>`).join(", ")||"Yok"}\n`+
        `${E.TIMEOUT} **Timeout:** ${target.isCommunicationDisabled()?"Evet":"Hayır"}\n`+
        `${E.BOT} **Bot:** ${target.user.bot?"Evet":"Hayır"}`
      ));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ════════════════════════════════════════════════════════════════════════════
  //  EĞLENCE KOMUTLARI
  // ════════════════════════════════════════════════════════════════════════════

  // ── /yazıtura ───────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("yazıtura").setDescription("Yazı mı tura mı?"),
    async execute(i){
      const result=Math.random()<0.5?"🪙 Yazı":"🥇 Tura";
      const c=box(COLOR.FUN);
      c.addTextDisplayComponents(txt(`## ${E.COIN} Yazı mı Tura mı?\n${i.user} tarafından atıldı!\n\n## ${result}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ── /zar ────────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("zar").setDescription("Zar atar")
      .addIntegerOption(o=>o.setName("yüz").setDescription("Kaç yüzlü zar? (varsayılan: 6)").setMinValue(2).setMaxValue(100)),
    async execute(i){
      const yuz=i.options.getInteger("yüz")??6;
      const result=Math.floor(Math.random()*yuz)+1;
      const c=box(COLOR.FUN);
      c.addTextDisplayComponents(txt(`## ${E.DICE} ${yuz} Yüzlü Zar\n${i.user} zar attı!\n\n## 🎲 **${result}**`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ── /taştakağıtmakas ────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("taştakağıtmakas").setDescription("Taş Kağıt Makas oyna!"),
    async execute(i){
      const items=["✊ Taş","📄 Kağıt","✂️ Makas"];
      const row=new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rps_tas").setLabel("✊ Taş").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("rps_kagit").setLabel("📄 Kağıt").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("rps_makas").setLabel("✂️ Makas").setStyle(ButtonStyle.Danger),
      );
      const c=box(COLOR.FUN);
      c.addTextDisplayComponents(txt(`## ${E.RPS} Taş Kağıt Makas!\nSeçimini yap ${i.user}!`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      const msg=await i.reply({flags:CV2,components:[c,row],fetchReply:true});
      const coll=msg.createMessageComponentCollector({filter:btn=>btn.user.id===i.user.id,time:30000});
      coll.on("collect",async btn=>{
        coll.stop();
        const map={rps_tas:0,rps_kagit:1,rps_makas:2};
        const botIdx=Math.floor(Math.random()*3);
        const userIdx=map[btn.customId];
        const wins=[[false,false,true],[true,false,false],[false,true,false]];
        let result;
        if(userIdx===botIdx)result="🤝 **Berabere!**";
        else if(wins[userIdx][botIdx])result=`🎉 **Sen kazandın!**`;
        else result=`😔 **Ben kazandım!**`;
        const c2=box(COLOR.FUN);
        c2.addTextDisplayComponents(txt(`## ${E.RPS} Taş Kağıt Makas!\n${E.USER} **Sen:** ${items[userIdx]}\n${E.BOT} **Bot:** ${items[botIdx]}\n\n${result}`));
        c2.addSeparatorComponents(sep(false));c2.addTextDisplayComponents(txt(`-# ${FOOTER}`));
        await btn.update({flags:CV2,components:[c2]});
      });
      coll.on("end",(_,r)=>{
        if(r==="time"){
          const c2=box(COLOR.OFF);c2.addTextDisplayComponents(txt(`${E.CLOCK} Süre doldu!`));
          i.editReply({flags:CV2,components:[c2]}).catch(()=>{});
        }
      });
    }
  },

  // ── /8top ───────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("8top").setDescription("Sihirli 8-Top'a sor!")
      .addStringOption(o=>o.setName("soru").setDescription("Sorunuz").setRequired(true)),
    async execute(i){
      const soru=i.options.getString("soru");
      const cevaplar=["Kesinlikle evet!","Evet, evet!","Büyük ihtimalle","Evet gibi görünüyor","Olumlu","Söyleyemem, tekrar sor","Şimdi odaklanamıyorum","Daha sonra sor","Buna güvenmemelisin","Belirsiz, tekrar sor","Pek sanmıyorum","Hayır","Kesinlikle hayır","Bence hayır","Çok şüpheliyim"];
      const cevap=cevaplar[Math.floor(Math.random()*cevaplar.length)];
      const c=box(COLOR.FUN);
      c.addTextDisplayComponents(txt(`## ${E.EIGHT} Sihirli 8-Top\n${E.MSG} **Soru:** ${soru}\n\n${E.EIGHT} **Cevap:** ${cevap}`));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ── /seviyölç ───────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("seviyölç").setDescription("İki kullanıcı arasındaki aşk seviyesini ölçer")
      .addUserOption(o=>o.setName("kullanici1").setDescription("Birinci kişi").setRequired(true))
      .addUserOption(o=>o.setName("kullanici2").setDescription("İkinci kişi").setRequired(true)),
    async execute(i){
      const u1=i.options.getUser("kullanici1");
      const u2=i.options.getUser("kullanici2");
      // Deterministic but looks random — based on IDs
      const seed=(BigInt(u1.id)+BigInt(u2.id))%100n;
      const level=Number(seed);
      const bar="█".repeat(Math.floor(level/10))+"░".repeat(10-Math.floor(level/10));
      const emoji=level>80?"💖":level>60?"❤️":level>40?"💛":level>20?"💙":"💔";
      const c=box(COLOR.FUN);
      c.addTextDisplayComponents(txt(
        `## ${E.LOVE} Aşk Ölçer\n`+
        `${u1} ❤️ ${u2}\n\n`+
        `**${bar}** ${level}%\n\n`+
        `${emoji} ${level>80?"Mükemmel bir çift!":level>60?"Çok iyi gidiyor!":level>40?"Fena değil!":level>20?"Biraz çalışmanız lazım...":"Hmm, zor görünüyor."}`
      ));
      c.addSeparatorComponents(sep(false));c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

  // ── /yardim ─────────────────────────────────────────────────────────────────
  {
    data:new SlashCommandBuilder().setName("yardim").setDescription("Tüm komutları listeler"),
    async execute(i){
      const c=box(COLOR.PRIMARY);
      c.addTextDisplayComponents(txt(`## ${E.MOD} ${BOT_NAME} — Komutlar`));
      c.addSeparatorComponents(sep());
      c.addTextDisplayComponents(txt(
        `## 🛡️ Moderasyon\n`+
        `\`/ban\` \`/unban\` \`/kick\`\n`+
        `\`/timeout\` \`/untimeout\`\n`+
        `\`/uyar\` \`/uyarilar\` \`/uyarisil\`\n`+
        `\`/temizle\` \`/slowmode\`\n`+
        `\`/kilitle\` \`/kilittazla\`\n`+
        `\`/rol-ver\` \`/rol-al\` \`/nick\`\n`+
        `\`/profil\` \`/not\``
      ));
      c.addSeparatorComponents(sep(false));
      c.addTextDisplayComponents(txt(
        `## 📊 Bilgi\n`+
        `\`/kullanici\` \`/sunucu\``
      ));
      c.addSeparatorComponents(sep(false));
      c.addTextDisplayComponents(txt(
        `## 🎮 Eğlence\n`+
        `\`/yazıtura\` \`/zar\` \`/taştakağıtmakas\`\n`+
        `\`/8top\` \`/seviyölç\``
      ));
      c.addSeparatorComponents(sep(false));
      c.addTextDisplayComponents(txt(
        `## ⚙️ Kurulum\n`+
        `\`.kur\` — Log kanallarını otomatik oluşturur`
      ));
      c.addSeparatorComponents(sep(false));
      c.addTextDisplayComponents(txt(`-# ${FOOTER}`));
      await i.reply({flags:CV2,components:[c]});
    }
  },

];

for(const cmd of slashCommands)client.commands.set(cmd.data.name,cmd);

// ─── Prefix: .kur ────────────────────────────────────────────────────────────

client.on("messageCreate",async msg=>{
  if(msg.author.bot||!msg.guild)return;
  if(msg.content.trim().toLowerCase()!==".kur")return;
  if(!msg.member.permissions.has(PermissionFlagsBits.Administrator))return;

  const wait=box(COLOR.INFO);
  wait.addTextDisplayComponents(txt("⏳ Log kanalları oluşturuluyor, lütfen bekleyin..."));
  await msg.reply({flags:CV2,components:[wait]}).catch(()=>{});

  const created=await setupLogChannels(msg.guild);

  const c=box(COLOR.SUCCESS);
  c.addTextDisplayComponents(txt(`## ${E.CHECK} Log Kanalları Kuruldu!`));
  c.addSeparatorComponents(sep());
  const lines=Object.entries(LOG_CHANNELS).map(([k,name])=>{
    const id=created[k];
    return id?`${E.CHECK} **${name}:** <#${id}>`:`${E.CROSS} **${name}:** oluşturulamadı`;
  });
  c.addTextDisplayComponents(txt(lines.join("\n")));
  c.addSeparatorComponents(sep(false));
  c.addTextDisplayComponents(txt(`-# ${FOOTER} • \`📋 Mod Logları\` kategorisine bakın`));
  await msg.channel.send({flags:CV2,components:[c]});
});

// ─── Slash Komut Handler ──────────────────────────────────────────────────────

client.on("interactionCreate",async i=>{
  if(!i.isChatInputCommand())return;
  const cmd=client.commands.get(i.commandName);
  if(!cmd)return;
  try{await cmd.execute(i);}catch(e){
    console.error(`[cmd:${i.commandName}]`,e);
    const c=box(COLOR.ERROR);c.addTextDisplayComponents(txt(`${E.CROSS} Komut çalıştırılırken hata oluştu.`));
    const p={flags:CV2,components:[c],ephemeral:true};
    if(i.replied||i.deferred)await i.followUp(p).catch(()=>{});
    else await i.reply(p).catch(()=>{});
  }
});

// ─── Log Events ───────────────────────────────────────────────────────────────

// Üye katıldı
client.on("guildMemberAdd",async member=>{
  if(member.user.bot)return;
  await sendLog(member.guild,"member",COLOR.MEMBER,`${E.JOIN} Üye Katıldı`,
    [[`${E.USER} **Kullanıcı:**`,`${member} (\`${member.user.tag}\`)`],[`${E.INFO} **ID:**`,`\`${member.id}\``],[`${E.CLOCK} **Hesap Yaşı:**`,tsR(member.user.createdTimestamp)]],
    member.user.displayAvatarURL()
  );
});

// Üye ayrıldı
client.on("guildMemberRemove",async member=>{
  if(member.user.bot)return;
  await new Promise(r=>setTimeout(r,1000));
  // kick mi normal mi?
  const kickLog=await member.guild.fetchAuditLogs({type:AuditLogEvent.MemberKick,limit:1}).catch(()=>null);
  const ke=kickLog?.entries.first();
  if(ke&&ke.target.id===member.id&&Date.now()-ke.createdTimestamp<5000){
    // kick log
    await sendLog(member.guild,"kick",COLOR.KICK,`${E.KICK} Üye Atıldı (Kick)`,
      [[`${E.USER} **Kullanıcı:**`,`\`${member.user.tag}\` (\`${member.id}\`)`],[`${E.USER} **Atan:**`,`<@${ke.executor.id}> (\`${ke.executor.tag}\`)`],[`${E.INFO} **Sebep:**`,ke.reason||"Sebep belirtilmedi"]],
      ke.executor.displayAvatarURL(),ke.reason
    );
    return;
  }
  await sendLog(member.guild,"member",COLOR.OFF,`${E.LEAVE} Üye Ayrıldı`,
    [[`${E.USER} **Kullanıcı:**`,`\`${member.user.tag}\``],[`${E.INFO} **ID:**`,`\`${member.id}\``],[`${E.ROLE} **Roller:**`,member.roles.cache.filter(r=>r.id!==member.guild.id).map(r=>`<@&${r.id}>`).join(", ")||"Yok"]]
  );
});

// Ban
client.on("guildBanAdd",async ban=>{
  const logs=await ban.guild.fetchAuditLogs({type:AuditLogEvent.MemberBanAdd,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(ban.guild,"ban",COLOR.BAN,`${E.BAN} Kullanıcı Banlandı`,
    [[`${E.USER} **Kullanıcı:**`,`\`${ban.user?.tag}\` (\`${ban.user?.id}\`)`],[`${E.USER} **Banlayan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"],[`${E.INFO} **Sebep:**`,e?.reason||"Sebep belirtilmedi"]],
    ban.user?.displayAvatarURL?.(),e?.reason
  );
});

// Unban
client.on("guildBanRemove",async ban=>{
  const logs=await ban.guild.fetchAuditLogs({type:AuditLogEvent.MemberBanRemove,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(ban.guild,"ban",COLOR.SUCCESS,`${E.UNLOCK} Ban Kaldırıldı`,
    [[`${E.USER} **Kullanıcı:**`,`\`${ban.user?.tag}\``],[`${E.USER} **Kaldıran:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Üye güncellendi (rol/nick)
client.on("guildMemberUpdate",async(old,nw)=>{
  const changes=[];
  if(old.nickname!==nw.nickname)changes.push(`Nick: \`${old.nickname??"Yok"}\` → \`${nw.nickname??"Yok"}\``);
  const added=nw.roles.cache.filter(r=>!old.roles.cache.has(r.id)&&r.id!==nw.guild.id);
  const removed=old.roles.cache.filter(r=>!nw.roles.cache.has(r.id)&&r.id!==nw.guild.id);
  if(added.size)changes.push(`Verilen rol: ${added.map(r=>`<@&${r.id}>`).join(", ")}`);
  if(removed.size)changes.push(`Alınan rol: ${removed.map(r=>`<@&${r.id}>`).join(", ")}`);
  if(!changes.length)return;
  const logs=await nw.guild.fetchAuditLogs({type:AuditLogEvent.MemberUpdate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(nw.guild,"mod",COLOR.INFO,`${E.EDIT} Üye Güncellendi`,
    [[`${E.USER} **Kullanıcı:**`,`<@${nw.id}>`],[`${E.EDIT} **Değişiklikler:**`,changes.join("\n")],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Rol oluşturuldu
client.on("roleCreate",async role=>{
  const logs=await role.guild.fetchAuditLogs({type:AuditLogEvent.RoleCreate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(role.guild,"role",COLOR.SUCCESS,`${E.CREATE} Rol Oluşturuldu`,
    [[`${E.ROLE} **Rol:**`,`<@&${role.id}> (\`${role.name}\`)`],[`${E.USER} **Oluşturan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Rol silindi
client.on("roleDelete",async role=>{
  const logs=await role.guild.fetchAuditLogs({type:AuditLogEvent.RoleDelete,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(role.guild,"role",COLOR.WARN2,`${E.DELETE} Rol Silindi`,
    [[`${E.ROLE} **Rol Adı:**`,`\`${role.name}\``],[`${E.USER} **Silen:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Rol güncellendi
client.on("roleUpdate",async(old,nw)=>{
  const ch=[];
  if(old.name!==nw.name)ch.push(`Ad: \`${old.name}\` → \`${nw.name}\``);
  if(old.color!==nw.color)ch.push(`Renk: \`#${old.color.toString(16).padStart(6,"0")}\` → \`#${nw.color.toString(16).padStart(6,"0")}\``);
  if(old.hoist!==nw.hoist)ch.push(`Ayrı göster: \`${old.hoist}\` → \`${nw.hoist}\``);
  if(!ch.length)return;
  const logs=await nw.guild.fetchAuditLogs({type:AuditLogEvent.RoleUpdate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(nw.guild,"role",COLOR.INFO,`${E.EDIT} Rol Güncellendi`,
    [[`${E.ROLE} **Rol:**`,`<@&${nw.id}>`],[`${E.EDIT} **Değişiklikler:**`,ch.join("\n")],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Kanal oluşturuldu
client.on("channelCreate",async ch=>{
  if(!ch.guild)return;
  const logs=await ch.guild.fetchAuditLogs({type:AuditLogEvent.ChannelCreate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(ch.guild,"channel",COLOR.SUCCESS,`${E.CREATE} Kanal Oluşturuldu`,
    [[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}> (\`${ch.name}\`)`],[`${E.USER} **Oluşturan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Kanal silindi
client.on("channelDelete",async ch=>{
  if(!ch.guild)return;
  const logs=await ch.guild.fetchAuditLogs({type:AuditLogEvent.ChannelDelete,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(ch.guild,"channel",COLOR.WARN2,`${E.DELETE} Kanal Silindi`,
    [[`${E.CHANNEL} **Kanal Adı:**`,`\`${ch.name}\``],[`${E.USER} **Silen:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Kanal güncellendi
client.on("channelUpdate",async(old,nw)=>{
  if(!nw.guild)return;
  const ch=[];
  if(old.name!==nw.name)ch.push(`Ad: \`${old.name}\` → \`${nw.name}\``);
  if(old.topic!==nw.topic)ch.push(`Konu değişti`);
  if(old.nsfw!==nw.nsfw)ch.push(`NSFW: \`${old.nsfw}\` → \`${nw.nsfw}\``);
  if(!ch.length)return;
  const logs=await nw.guild.fetchAuditLogs({type:AuditLogEvent.ChannelUpdate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(nw.guild,"channel",COLOR.INFO,`${E.EDIT} Kanal Güncellendi`,
    [[`${E.CHANNEL} **Kanal:**`,`<#${nw.id}>`],[`${E.EDIT} **Değişiklikler:**`,ch.join("\n")],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Mesaj silindi
client.on("messageDelete",async msg=>{
  if(!msg.guild||msg.author?.bot)return;
  await sendLog(msg.guild,"message",COLOR.WARN2,`${E.DELETE} Mesaj Silindi`,
    [[`${E.USER} **Gönderen:**`,`${msg.author?`<@${msg.author.id}>`:"Bilinmiyor"}`],[`${E.CHANNEL} **Kanal:**`,`<#${msg.channel.id}>`],[`${E.MSG} **İçerik:**`,msg.content?(msg.content.length>800?msg.content.slice(0,800)+"...":msg.content):"(boş/dosya)"]]
  );
});

// Mesaj düzenlendi
client.on("messageUpdate",async(old,nw)=>{
  if(!nw.guild||nw.author?.bot)return;
  if(old.content===nw.content)return;
  await sendLog(nw.guild,"message",COLOR.INFO,`${E.EDIT} Mesaj Düzenlendi`,
    [[`${E.USER} **Gönderen:**`,`<@${nw.author.id}>`],[`${E.CHANNEL} **Kanal:**`,`<#${nw.channel.id}>`],[`${E.MSG} **Önce:**`,old.content?(old.content.length>400?old.content.slice(0,400)+"...":old.content):"—"],[`${E.MSG} **Sonra:**`,nw.content?(nw.content.length>400?nw.content.slice(0,400)+"...":nw.content):"—"]]
  );
});

// Toplu mesaj silindi
client.on("messageDeleteBulk",async(messages,ch)=>{
  if(!ch.guild)return;
  const logs=await ch.guild.fetchAuditLogs({type:AuditLogEvent.MessageBulkDelete,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(ch.guild,"message",COLOR.MOD,`${E.CLEAR} Toplu Mesaj Silindi`,
    [[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}>`],[`${E.MSG} **Silinen:**`,`${messages.size} mesaj`],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Ses kanalı log
client.on("voiceStateUpdate",async(old,nw)=>{
  const guild=nw.guild??old.guild;
  const member=nw.member??old.member;
  if(!guild||!member||member.user.bot)return;
  if(!old.channelId&&nw.channelId){
    await sendLog(guild,"voice",COLOR.SUCCESS,`${E.VOICE} Ses Kanalına Girdi`,
      [[`${E.USER} **Kullanıcı:**`,`<@${member.id}>`],[`${E.VOICE} **Kanal:**`,`<#${nw.channelId}>`]]
    );
  } else if(old.channelId&&!nw.channelId){
    await sendLog(guild,"voice",COLOR.OFF,`${E.VOICE} Ses Kanalından Çıktı`,
      [[`${E.USER} **Kullanıcı:**`,`<@${member.id}>`],[`${E.VOICE} **Kanal:**`,`<#${old.channelId}>`]]
    );
  } else if(old.channelId&&nw.channelId&&old.channelId!==nw.channelId){
    await sendLog(guild,"voice",COLOR.INFO,`${E.VOICE} Ses Kanalı Değiştirdi`,
      [[`${E.USER} **Kullanıcı:**`,`<@${member.id}>`],[`${E.EDIT} **Değişiklik:**`,`<#${old.channelId}> → <#${nw.channelId}>`]]
    );
  }
});

// Webhook log
client.on("webhookUpdate",async ch=>{
  if(!ch.guild)return;
  const logs=await ch.guild.fetchAuditLogs({type:AuditLogEvent.WebhookCreate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  if(!e||Date.now()-e.createdTimestamp>5000)return;
  await sendLog(ch.guild,"server",COLOR.WARN2,`${E.CROWN} Webhook Oluşturuldu`,
    [[`${E.CHANNEL} **Kanal:**`,`<#${ch.id}>`],[`${E.USER} **Oluşturan:**`,`<@${e.executor.id}>`]]
  );
});

// Sunucu güncellendi
client.on("guildUpdate",async(old,nw)=>{
  const ch=[];
  if(old.name!==nw.name)ch.push(`Ad: \`${old.name}\` → \`${nw.name}\``);
  if(old.verificationLevel!==nw.verificationLevel)ch.push(`Doğrulama: \`${old.verificationLevel}\` → \`${nw.verificationLevel}\``);
  if(!ch.length)return;
  const logs=await nw.fetchAuditLogs({type:AuditLogEvent.GuildUpdate,limit:1}).catch(()=>null);
  const e=logs?.entries.first();
  await sendLog(nw,"server",COLOR.SERVER,`${E.SERVER} Sunucu Güncellendi`,
    [[`${E.EDIT} **Değişiklikler:**`,ch.join("\n")],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
  );
});

// Timeout log
client.on("guildMemberUpdate",async(old,nw)=>{
  if(old.isCommunicationDisabled()===nw.isCommunicationDisabled())return;
  if(nw.isCommunicationDisabled()){
    const logs=await nw.guild.fetchAuditLogs({type:AuditLogEvent.MemberUpdate,limit:1}).catch(()=>null);
    const e=logs?.entries.first();
    await sendLog(nw.guild,"mute",COLOR.MUTE,`${E.TIMEOUT} Timeout Verildi`,
      [[`${E.USER} **Kullanıcı:**`,`<@${nw.id}>`],[`${E.CLOCK} **Bitiş:**`,ts(nw.communicationDisabledUntilTimestamp)],[`${E.USER} **Yapan:**`,e?`<@${e.executor.id}>`:"Bilinmiyor"]]
    );
  } else {
    await sendLog(nw.guild,"mute",COLOR.SUCCESS,`${E.UNMUTE} Timeout Kaldırıldı`,
      [[`${E.USER} **Kullanıcı:**`,`<@${nw.id}>`]]
    );
  }
});

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once("ready",()=>{
  client.user.setPresence({
    activities:[{name:`/yardim • ${BOT_NAME}`,type:ActivityType.Watching}],
    status:"online",
  });
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║   ${FOOTER}`);
  console.log(`║   ${BOT_NAME}`);
  console.log(`║   Bot: ${client.user.tag}`);
  console.log(`║   Sunucular: ${client.guilds.cache.size}`);
  console.log(`╚══════════════════════════════════════╝`);
});

// ─── Slash Kayıt ─────────────────────────────────────────────────────────────

const rest=new REST({version:"10"}).setToken(TOKEN);
try{
  console.log("Slash komutları kaydediliyor...");
  const route=GUILD_ID
    ?Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID)
    :Routes.applicationCommands(CLIENT_ID);
  await rest.put(route,{body:slashCommands.map(c=>c.data.toJSON())});
  console.log(`${slashCommands.length} slash komutu kaydedildi.`);
}catch(e){console.error("[slash]",e);}

await client.login(TOKEN);
