import type { Metadata } from 'next';
import { getLinkedIdState, getMyProfile } from '@monkei/db';
import { requireCustomerSession } from '../../../lib/customer-session.js';
import { getDb } from '../../../lib/server.js';
import { avatarUrl } from '../../../lib/assets.js';
import { AvatarForm, DisplayNameForm, LinkedIdForm } from './perfil-forms';
import { PlayerAvatar } from '../../player-avatar';

export const metadata: Metadata = {
  title: 'Editar perfil',
  alternates: { canonical: '/cuenta/perfil' },
};

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await requireCustomerSession();
  const [profile, linked] = await Promise.all([
    getMyProfile(getDb(), session.playerProfileId),
    getLinkedIdState(getDb(), session.playerProfileId),
  ]);
  const name = profile?.displayName ?? '';
  const avatar = avatarUrl(profile?.avatarAssetUrl);

  return (
    <main className="page narrow">
      <h1 className="page-title">Editar perfil</h1>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <PlayerAvatar url={avatar} size={64} />
        </div>
        <AvatarForm />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <DisplayNameForm initial={name} />
      </div>

      {linked && (
        <div className="card" style={{ marginTop: 16 }}>
          <LinkedIdForm
            playerId={linked.playerId}
            canChange={linked.canChange}
            seasonNumber={linked.seasonNumber}
          />
        </div>
      )}
    </main>
  );
}
