import type { Metadata } from 'next';
import { APP_NAME } from '../../lib/brand';

export const metadata: Metadata = {
  title: `เข้าสู่ระบบ | ${APP_NAME}`,
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
