import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { contacts, userProfiles } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";

export const contactRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userContacts = await ctx.db.query.contacts.findMany({
      where: eq(contacts.userId, ctx.session.user.id),
    });

    // Get profile information for each contact
    const contactsWithProfiles = await Promise.all(
      userContacts.map(async (contact) => {
        const profile = await ctx.db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, contact.contactId),
        });
        return {
          ...contact,
          profile,
        };
      })
    );

    return contactsWithProfiles.filter((c) => c.profile !== undefined);
  }),

  addContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Don't allow adding yourself
      if (input.contactId === ctx.session.user.id) {
        throw new Error("Cannot add yourself as a contact");
      }

      // Check if contact exists
      const contactProfile = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, input.contactId),
      });

      if (!contactProfile) {
        throw new Error("User not found");
      }

      // Check if contact already exists
      const existingContact = await ctx.db.query.contacts.findFirst({
        where: and(
          eq(contacts.userId, ctx.session.user.id),
          eq(contacts.contactId, input.contactId)
        ),
      });

      if (existingContact) {
        throw new Error("Contact already added");
      }

      const [newContact] = await ctx.db
        .insert(contacts)
        .values({
          userId: ctx.session.user.id,
          contactId: input.contactId,
        })
        .returning();

      return {
        ...newContact,
        profile: contactProfile,
      };
    }),

  removeContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(contacts)
        .where(
          and(
            eq(contacts.userId, ctx.session.user.id),
            eq(contacts.contactId, input.contactId)
          )
        );
    }),
});
