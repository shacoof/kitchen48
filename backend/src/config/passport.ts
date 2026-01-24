/**
 * Passport.js Configuration
 * OAuth strategies for social login
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../core/database/prisma.js';
import { env } from './env.js';

export function configurePassport() {
  // Only configure Google OAuth if credentials are provided
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;

            if (!email) {
              return done(new Error('No email found in Google profile'), undefined);
            }

            // Check if OAuth account exists
            let oauthAccount = await prisma.oAuthAccount.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: profile.id,
                },
              },
              include: { user: true },
            });

            if (oauthAccount) {
              // Update tokens
              await prisma.oAuthAccount.update({
                where: { id: oauthAccount.id },
                data: {
                  accessToken,
                  refreshToken,
                },
              });
              return done(null, oauthAccount.user);
            }

            // Check if user with email exists
            let user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) {
              // Link OAuth account to existing user
              await prisma.oAuthAccount.create({
                data: {
                  provider: 'google',
                  providerAccountId: profile.id,
                  accessToken,
                  refreshToken,
                  userId: user.id,
                },
              });
            } else {
              // Create new user with OAuth account
              user = await prisma.user.create({
                data: {
                  email,
                  firstName: profile.name?.givenName,
                  lastName: profile.name?.familyName,
                  emailVerified: true, // Google emails are pre-verified
                  oauthAccounts: {
                    create: {
                      provider: 'google',
                      providerAccountId: profile.id,
                      accessToken,
                      refreshToken,
                    },
                  },
                },
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  return passport;
}
