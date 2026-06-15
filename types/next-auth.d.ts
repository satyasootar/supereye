import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'super_admin' | 'user' | 'enterprise_user';
      status: 'active' | 'suspended';
    } & DefaultSession['user'];
  }
}
