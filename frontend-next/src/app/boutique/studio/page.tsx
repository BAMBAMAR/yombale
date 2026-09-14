// frontend-next/src/app/boutique/studio/page.tsx
import { redirect } from 'next/navigation';

export default function StudioRedirectPage() {
  redirect('/boutique?tab=studio');
}
