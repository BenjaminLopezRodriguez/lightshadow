import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { chats, messages, chatParticipants } from "@/server/db/schema";
import { eq, desc, asc, and, inArray, or } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        // Get chats user owns
        const ownedChats = await ctx.db.query.chats.findMany({
            where: eq(chats.userId, ctx.session.user.id),
            orderBy: [desc(chats.updatedAt)],
        });

        // Get chats user participates in (group chats)
        const participantRecords = await ctx.db.query.chatParticipants.findMany({
            where: eq(chatParticipants.userId, ctx.session.user.id),
        });

        const participantChatIds = participantRecords.map((p) => p.chatId);
        const participantChats =
            participantChatIds.length > 0
                ? await ctx.db.query.chats.findMany({
                      where: inArray(chats.id, participantChatIds),
                      orderBy: [desc(chats.updatedAt)],
                  })
                : [];

        // Combine and deduplicate
        const allChatIds = new Set([
            ...ownedChats.map((c) => c.id),
            ...participantChats.map((c) => c.id),
        ]);

        const allChats = [
            ...ownedChats,
            ...participantChats.filter((c) => !ownedChats.some((oc) => oc.id === c.id)),
        ].sort((a, b) => {
            const aTime = a.updatedAt?.getTime() ?? 0;
            const bTime = b.updatedAt?.getTime() ?? 0;
            return bTime - aTime;
        });

        return allChats;
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.id),
            });

            if (!chat) {
                return null;
            }

            // Check if user owns the chat or is a participant
            const isOwner = chat.userId === ctx.session.user.id;
            const isParticipant = await ctx.db.query.chatParticipants.findFirst({
                where: and(
                    eq(chatParticipants.chatId, input.id),
                    eq(chatParticipants.userId, ctx.session.user.id)
                ),
            });

            if (!isOwner && !isParticipant) {
                return null;
            }

            const chatMessages = await ctx.db.query.messages.findMany({
                where: eq(messages.chatId, input.id),
                orderBy: [asc(messages.createdAt)],
            });

            // Get participants for group chats
            const participants =
                chat.isGroupChat
                    ? await ctx.db.query.chatParticipants.findMany({
                          where: eq(chatParticipants.chatId, input.id),
                      })
                    : [];

            return {
                ...chat,
                messages: chatMessages,
                participants,
            };
        }),

    create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            const [chat] = await ctx.db
                .insert(chats)
                .values({
                    name: input.name,
                    userId: ctx.session.user.id,
                })
                .returning();
            return chat;
        }),

    createGroupChat: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                groupName: z.string().min(1).optional(),
                themeColor: z.string().optional(),
                participantIds: z.array(z.string()).min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Create the group chat
            const [chat] = await ctx.db
                .insert(chats)
                .values({
                    name: input.name,
                    userId: ctx.session.user.id,
                    isGroupChat: true,
                    groupName: input.groupName || input.name,
                    themeColor: input.themeColor,
                })
                .returning();

            // Add creator as participant
            await ctx.db.insert(chatParticipants).values({
                chatId: chat.id,
                userId: ctx.session.user.id,
            });

            // Add other participants
            if (input.participantIds.length > 0) {
                await ctx.db.insert(chatParticipants).values(
                    input.participantIds.map((userId) => ({
                        chatId: chat.id,
                        userId: userId,
                    }))
                );
            }

            return chat;
        }),

    convertToGroupChat: protectedProcedure
        .input(
            z.object({
                chatId: z.number(),
                groupName: z.string().min(1),
                themeColor: z.string().optional(),
                participantIds: z.array(z.string()).min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.chatId),
            });

            if (!chat || chat.userId !== ctx.session.user.id) {
                throw new Error("Chat not found or unauthorized");
            }

            if (chat.isGroupChat) {
                throw new Error("Chat is already a group chat");
            }

            // Update chat to group chat
            const [updatedChat] = await ctx.db
                .update(chats)
                .set({
                    isGroupChat: true,
                    groupName: input.groupName,
                    themeColor: input.themeColor,
                })
                .where(eq(chats.id, input.chatId))
                .returning();

            // Add creator as participant if not already
            const existingParticipant = await ctx.db.query.chatParticipants.findFirst({
                where: and(
                    eq(chatParticipants.chatId, input.chatId),
                    eq(chatParticipants.userId, ctx.session.user.id)
                ),
            });

            if (!existingParticipant) {
                await ctx.db.insert(chatParticipants).values({
                    chatId: input.chatId,
                    userId: ctx.session.user.id,
                });
            }

            // Add other participants
            if (input.participantIds.length > 0) {
                // Filter out duplicates
                const existingParticipants = await ctx.db.query.chatParticipants.findMany({
                    where: eq(chatParticipants.chatId, input.chatId),
                });
                const existingUserIds = new Set(existingParticipants.map((p) => p.userId));

                const newParticipants = input.participantIds.filter(
                    (id) => !existingUserIds.has(id) && id !== ctx.session.user.id
                );

                if (newParticipants.length > 0) {
                    await ctx.db.insert(chatParticipants).values(
                        newParticipants.map((userId) => ({
                            chatId: input.chatId,
                            userId: userId,
                        }))
                    );
                }
            }

            return updatedChat;
        }),

    addParticipants: protectedProcedure
        .input(
            z.object({
                chatId: z.number(),
                participantIds: z.array(z.string()).min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.chatId),
            });

            if (!chat || (!chat.isGroupChat && chat.userId !== ctx.session.user.id)) {
                throw new Error("Chat not found or unauthorized");
            }

            // Check if user is participant or owner
            const isOwner = chat.userId === ctx.session.user.id;
            const isParticipant = await ctx.db.query.chatParticipants.findFirst({
                where: and(
                    eq(chatParticipants.chatId, input.chatId),
                    eq(chatParticipants.userId, ctx.session.user.id)
                ),
            });

            if (!isOwner && !isParticipant) {
                throw new Error("Unauthorized");
            }

            // Get existing participants
            const existingParticipants = await ctx.db.query.chatParticipants.findMany({
                where: eq(chatParticipants.chatId, input.chatId),
            });
            const existingUserIds = new Set(existingParticipants.map((p) => p.userId));

            // Filter out duplicates
            const newParticipants = input.participantIds.filter(
                (id) => !existingUserIds.has(id)
            );

            if (newParticipants.length > 0) {
                await ctx.db.insert(chatParticipants).values(
                    newParticipants.map((userId) => ({
                        chatId: input.chatId,
                        userId: userId,
                    }))
                );
            }

            return { added: newParticipants.length };
        }),

    updateGroupSettings: protectedProcedure
        .input(
            z.object({
                chatId: z.number(),
                groupName: z.string().min(1).optional(),
                themeColor: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.chatId),
            });

            if (!chat || !chat.isGroupChat) {
                throw new Error("Chat not found or not a group chat");
            }

            // Check if user is owner or participant
            const isOwner = chat.userId === ctx.session.user.id;
            const isParticipant = await ctx.db.query.chatParticipants.findFirst({
                where: and(
                    eq(chatParticipants.chatId, input.chatId),
                    eq(chatParticipants.userId, ctx.session.user.id)
                ),
            });

            if (!isOwner && !isParticipant) {
                throw new Error("Unauthorized");
            }

            const [updatedChat] = await ctx.db
                .update(chats)
                .set({
                    groupName: input.groupName,
                    themeColor: input.themeColor,
                    updatedAt: new Date(),
                })
                .where(eq(chats.id, input.chatId))
                .returning();

            return updatedChat;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.id),
            });

            if (!chat || chat.userId !== ctx.session.user.id) {
                throw new Error("Chat not found or unauthorized");
            }

            await ctx.db.delete(chats).where(eq(chats.id, input.id));
        }),
});
