import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AppSettings } from '@/models/settings';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await AppSettings.findOne({ key: 'app' }).select('logoData logoContentType').lean();

    if (settings?.logoData && settings.logoContentType) {
      const raw = settings.logoData as unknown as { buffer?: ArrayBuffer } | Buffer | Uint8Array;
      const buffer = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from((raw as { buffer?: ArrayBuffer }).buffer ?? (raw as Uint8Array));

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': settings.logoContentType,
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
  } catch {
    // fall through to default file
  }

  try {
    const file = await readFile(path.join(process.cwd(), 'public', 'logo.png'));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
