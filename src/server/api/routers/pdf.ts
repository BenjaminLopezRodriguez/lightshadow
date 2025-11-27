import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { pdfDocuments, chatPdfReferences } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const pdfRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.pdfDocuments.findMany({
      where: eq(pdfDocuments.userId, ctx.session.user.id),
      orderBy: (pdfs, { desc }) => [desc(pdfs.createdAt)],
    });
  }),

  getByChatId: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ ctx, input }) => {
      const chatPdfRefs = await ctx.db.query.chatPdfReferences.findMany({
        where: eq(chatPdfReferences.chatId, input.chatId),
      });

      const pdfIds = chatPdfRefs.map(ref => ref.pdfDocumentId);

      if (pdfIds.length === 0) {
        return [];
      }

      // Fetch all user PDFs and filter by IDs
      const allUserPdfs = await ctx.db.query.pdfDocuments.findMany({
        where: eq(pdfDocuments.userId, ctx.session.user.id),
      });

      return allUserPdfs.filter(pdf => pdfIds.includes(pdf.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const pdfDoc = await ctx.db.query.pdfDocuments.findFirst({
        where: and(
          eq(pdfDocuments.id, input.id),
          eq(pdfDocuments.userId, ctx.session.user.id)
        ),
      });

      if (!pdfDoc) {
        throw new Error("PDF document not found or unauthorized");
      }

      await ctx.db.delete(pdfDocuments).where(eq(pdfDocuments.id, input.id));
    }),
});
