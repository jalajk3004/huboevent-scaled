import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) return false;

    try {
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
        const decoded = jwt.verify(token, secret) as { role: string };
        return decoded.role === 'admin';
    } catch {
        return false;
    }
}
