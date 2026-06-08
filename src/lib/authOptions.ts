import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        // 1. Check if the user is logging in as Super Admin
        const superAdminEmail = 'superadmin@platform.com';
        if (
          credentials.email.toLowerCase() === superAdminEmail &&
          credentials.password === process.env.SUPER_ADMIN_PASSWORD
        ) {
          return {
            id: 'super-admin-id',
            name: 'Super Admin',
            email: superAdminEmail,
            role: 'super-admin',
          };
        }

        // 2. Regular Admin Auth
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user) {
          throw new Error('No admin user found with this email');
        }

        if (user.status === 'disabled') {
          throw new Error('Your account is disabled. Please contact the Super Admin.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          throw new Error('Incorrect password');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // 'admin'
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
