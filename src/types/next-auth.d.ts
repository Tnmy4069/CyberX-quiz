import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'super-admin';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: 'admin' | 'super-admin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'super-admin';
  }
}
