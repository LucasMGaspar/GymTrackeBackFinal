import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login - users should authenticate first
  redirect('/login');
}
