import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  AttachmentBuilder,
} from "discord.js";
import { SlashCommand } from "@typings/SlashCommand";
import { Responder } from "@utils/responder";
import { formatRolesList } from "@utils/messages";

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
        .setName("roles")
        .setDescription("Manage or export server roles")
        .addSubcommand(sub => 
            sub.setName("export")
               .setDescription("Export role IDs")
        )
        .addSubcommand(sub =>
            sub.setName("grant_accessory")
               .setDescription("Grant Blood-detecting Accessory role")
               .addUserOption(opt => opt.setName("user").setDescription("User to grant").setRequired(true))
        ),
    visible: true,
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!interaction.guild) {
            await Responder.error(interaction, "Only in servers.");
            return;
        }

        const sub = interaction.options.getSubcommand();

        if (sub === "export") {
            const roles = await interaction.guild.roles.fetch();
            const roleList = formatRolesList(roles);
            const attachment = new AttachmentBuilder(Buffer.from(roleList, "utf-8"), { name: "roles.md" });
            await Responder.reply(interaction, { content: "Role list:", files: [attachment] });
        } else if (sub === "grant_accessory") {
            const target = interaction.options.getMember("user") as any;
            const roleId = "1482601000000000000";
            await target.roles.add(roleId);
            await Responder.success(interaction, `Granted Accessory to ${target.user.username}`);
        }
    },
};
