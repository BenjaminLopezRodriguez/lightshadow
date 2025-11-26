import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { chats, messages } from "@/server/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.query.chats.findMany({
            where: eq(chats.userId, ctx.session.user.id),
            orderBy: [desc(chats.updatedAt)],
        });
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            const chat = await ctx.db.query.chats.findFirst({
                where: eq(chats.id, input.id),
            });

            if (!chat || chat.userId !== ctx.session.user.id) {
                return null;
            }

            const chatMessages = await ctx.db.query.messages.findMany({
                where: eq(messages.chatId, input.id),
                orderBy: [asc(messages.createdAt)],
            });

            return {
                ...chat,
                messages: chatMessages,
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

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(chats).where(eq(chats.id, input.id));
        }),
});
