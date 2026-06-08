export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { redirect } from 'next/navigation';
import AdminsControlTable from './AdminsControlTable';

export default async function AdminsManagementPage() {
  await connectToDatabase();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'super-admin') {
    redirect('/login');
  }

  // Fetch all admins
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 }).lean();

  const serializedAdmins = admins.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    status: u.status,
    createdAt: (u as any).createdAt ? (u as any).createdAt.toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Manage Admins</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, edit, toggle account states, or delete system administrators.
        </p>
      </div>

      <AdminsControlTable initialAdmins={serializedAdmins} />
    </div>
  );
}
