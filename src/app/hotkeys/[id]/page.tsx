'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { HotkeyDashboard } from '@/components/hotkey/HotkeyDashboard';

function HotkeyDetailContent() {
  const params = useParams<{ id: string }>();

  return <HotkeyDashboard hotkeyId={params.id} variant="full" backHref="/hotkeys" />;
}

export default function HotkeyDetailPage() {
  return (
    <AuthGuard>
      <HotkeyDetailContent />
    </AuthGuard>
  );
}
