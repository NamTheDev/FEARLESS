import { Message, AttachmentBuilder, Collection, Snowflake, AuditLogEvent, GuildTextBasedChannel } from "discord.js";
import { sendLog } from "@utils/logger";
import { findAuditExecutor } from "@logic/audit";
import { generateTranscript } from "@utils/messages";
import { buildMessageDeleteEmbed, buildMessageEditEmbed, buildBulkDeleteEmbed } from "@utils/logs";
import { addSnipe } from "@logic/snipe";
import { CONFIG } from "@core/config";

export async function handleMessageDeleteLog(message: Message) {
  if (!message.guild || !message.author || message.author.bot) return;

  addSnipe(message);

  const files: AttachmentBuilder[] = [];
  
  if (message.attachments?.size > 0) {
    const attachments = Array.from(message.attachments.values());
    await Promise.all(
      attachments.map(async (a) => {
        try {
          const res = await fetch(a.url);
          if (!res.ok) return;
          const arrayBuffer = await res.arrayBuffer();
          files.push(
            new AttachmentBuilder(Buffer.from(arrayBuffer), { name: a.name }),
          );
        } catch {}
      }),
    );
  }

  const embedUrls = message.embeds
    .map((e) => e.url || e.image?.url || e.thumbnail?.url)
    .filter((url): url is string => !!url);

  const isLong = (message.content?.length || 0) > 1024;
  if (isLong && message.content) {
    files.push(new AttachmentBuilder(Buffer.from(message.content), { name: "deleted-content.md" }));
  }

  const embed = buildMessageDeleteEmbed(message.author.id, message.channelId, message.content, isLong, embedUrls);

  if (files.length > 10) files.length = 10;
  await sendLog(message.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}

export async function handleMessageUpdateLog(oldMsg: Message, newMsg: Message) {
  if (
    !oldMsg.guild ||
    !oldMsg.author ||
    oldMsg.author.bot ||
    oldMsg.content === newMsg.content
  )
    return;

  const files: AttachmentBuilder[] = [];
  const oldContent = oldMsg.content || "";
  const newContent = newMsg.content || "";

  const isLong = oldContent.length > 1024 || newContent.length > 1024;

  if (isLong) {
    files.push(new AttachmentBuilder(Buffer.from(oldContent || "None"), { name: "before.md" }));
    files.push(new AttachmentBuilder(Buffer.from(newContent || "None"), { name: "after.md" }));
  }

  const embed = buildMessageEditEmbed(oldMsg.author.id, oldMsg.channelId, oldContent, newContent, isLong);

  await sendLog(oldMsg.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}

export async function handleMessageBulkDeleteLog(messages: Collection<Snowflake, Message>, channel: GuildTextBasedChannel) {
  if (!channel || !channel.guild) return;

  const executor = await findAuditExecutor(
    channel.guild,
    AuditLogEvent.MessageBulkDelete,
  );

  const transcript = generateTranscript(messages);

  const files: AttachmentBuilder[] = [
    new AttachmentBuilder(Buffer.from(transcript), {
      name: `purge-${Date.now()}.md`,
    }),
  ];

  const embed = buildBulkDeleteEmbed(channel.id, messages.size, executor?.id);

  await sendLog(channel.guild, CONFIG.LOG_CHANNEL_ID, embed, files);
}
