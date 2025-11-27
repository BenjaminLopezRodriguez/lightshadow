import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { userProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, ctx.session.user.id),
    });
    return profile;
  }),

  createProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(100),
        avatarUrl: z.string().url().optional(),
        phoneNumber: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if username is already taken
      const existingUsername = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.username, input.username),
      });

      if (existingUsername) {
        throw new Error("Username already taken");
      }

      // Check if profile already exists
      const existingProfile = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.session.user.id),
      });

      if (existingProfile) {
        throw new Error("Profile already exists");
      }

      // Generate unique ID (using nanoid for short, URL-safe IDs)
      const uniqueId = `@${nanoid(8)}`;

      const [profile] = await ctx.db
        .insert(userProfiles)
        .values({
          userId: ctx.session.user.id,
          username: input.username,
          avatarUrl: input.avatarUrl,
          phoneNumber: input.phoneNumber,
          uniqueId: uniqueId,
        })
        .returning();

      return profile;
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(100).optional(),
        avatarUrl: z.string().url().optional(),
        phoneNumber: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingProfile = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.session.user.id),
      });

      if (!existingProfile) {
        throw new Error("Profile not found");
      }

      // Check if username is already taken by another user
      if (input.username && input.username !== existingProfile.username) {
        const existingUsername = await ctx.db.query.userProfiles.findFirst({
          where: eq(userProfiles.username, input.username),
        });

        if (existingUsername) {
          throw new Error("Username already taken");
        }
      }

      const [updatedProfile] = await ctx.db
        .update(userProfiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, ctx.session.user.id))
        .returning();

      return updatedProfile;
    }),

  searchByUsername: protectedProcedure
    .input(z.object({ username: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const profiles = await ctx.db.query.userProfiles.findMany({
        where: (profiles, { like, and, ne }) =>
          and(
            like(profiles.username, `%${input.username}%`),
            ne(profiles.userId, ctx.session.user.id)
          ),
        limit: 10,
      });
      return profiles;
    }),

  searchByUniqueId: protectedProcedure
    .input(z.object({ uniqueId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.query.userProfiles.findFirst({
        where: eq(userProfiles.uniqueId, input.uniqueId),
      });
      return profile;
    }),
});
