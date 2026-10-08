"use strict";

const {
    downloadMediaMessage
} = require("@whiskeysockets/baileys");

const {
    registerCommand
} = require("../src/messageHandler");

registerCommand(
    "sticker",
    async (ctx) => {
        try {
            const quoted =
                ctx.message?.message?.extendedTextMessage?.contextInfo
                    ?.quotedMessage;

            if (!quoted) {
                await ctx.send(
                    "❌ Reply to an image or a short video with .sticker"
                );
                return;
            }

            const image =
                quoted.imageMessage;

            const video =
                quoted.videoMessage;

            if (!image && !video) {
                await ctx.send(
                    "❌ The replied message must contain an image or video."
                );
                return;
            }

            if (video) {
                const seconds =
                    Number(video.seconds || 0);

                if (seconds > 10) {
                    await ctx.send(
                        "❌ Video must be 10 seconds or less."
                    );
                    return;
                }
            }

            const mediaMessage = {
                key: {
                    remoteJid: ctx.jid,
                    fromMe: false,
                    id: ctx.message?.key?.id
                },
                message: quoted
            };

            const media =
                await downloadMediaMessage(
                    mediaMessage,
                    "buffer",
                    {},
                    {
                        logger: console
                    }
                );

            if (!media) {
                await ctx.send(
                    "❌ Unable to download the media."
                );
                return;
            }

            await ctx.sock.sendMessage(
                ctx.jid,
                {
                    sticker: media
                }
            );

        } catch (error) {
            console.error(
                "[STICKER ERROR]",
                error
            );

            await ctx.send(
                "❌ Failed to create the sticker."
            );
        }
    },
    {
        aliases: ["s"]
    }
);