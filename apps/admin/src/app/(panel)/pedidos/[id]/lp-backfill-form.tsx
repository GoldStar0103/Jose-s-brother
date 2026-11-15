'use client';

import { useActionState, useState } from 'react';
import { backfillLevelPass, type BackfillLpState } from './actions';
import type { LevelPassBackfillPreview } from '@monkei/db';

/**
 * Shown only on a completed order that never earned Level Pass — the guest
 * purchase that linked its matching Free Fire ID only after this order went
 * through. See `backfillLevelPassForOrder`'s own comment for why this is a
 * manual, reviewed action rather than something automatic.
 */
export function LpBackfillForm({
  orderId,
  preview,
}: {
  orderId: string;
  preview: LevelPassBackfillPreview;
}) {
  const [state, action, pending] = useActionState<BackfillLpState, FormData>(backfillLevelPass, {});
  const [open, setOpen] = useState(false);

  const seasonLine = preview.season
    ? `Temporada ${preview.season.seasonNumber} (${preview.season.status === 'active' ? 'en curso' : 'ya cerrada'})`
    : 'Sin temporada registrada para la fecha de este pedido';

  const blockedCopy: Record<NonNullable<LevelPassBackfillPreview['blockedReason']>, string> = {
    not_completed: 'Este pedido no está completado.',
    reward_order: 'Esto es una recompensa del MONKEI Pass, no genera LP.',
    already_credited: 'Este pedido ya tiene LP otorgados.',
    no_season_covers_order: 'No hay ninguna temporada registrada para esa fecha.',
    still_no_linked_account: `El ID ${preview.playerId} todavía no está vinculado a ninguna cuenta.`,
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h2 className="mini-title">Level Points — no otorgados</h2>
      <dl className="kv">
        <dt>ID de jugador</dt>
        <dd className="mono">{preview.playerId}</dd>
        <dt>{preview.season ? 'Temporada de este pedido' : 'Temporada'}</dt>
        <dd>{seasonLine}</dd>
      </dl>

      {!preview.eligible && (
        <p className="hint">
          {preview.blockedReason ? blockedCopy[preview.blockedReason] : 'No se puede acreditar.'}
          {preview.blockedReason === 'still_no_linked_account' &&
            ' Si el cliente ya creó su cuenta y vinculó otro ID distinto, esto es correcto: solo el ID exacto con el que compró cuenta.'}
        </p>
      )}

      {state.ok && <div className="alert ok">{state.ok}</div>}

      {preview.eligible && (
        <>
          <p className="hint">
            Este ID ya está vinculado a una cuenta, pero este pedido se completó antes de que
            existiera o se vinculara — por eso nunca generó LP. Esto lo acredita ahora, en la
            temporada a la que realmente pertenece.
            {preview.season?.status === 'closed' &&
              ' Esa temporada ya cerró: esto suma los LP y diamantes al historial del jugador, pero el podio ya publicado de esa temporada no cambia.'}
          </p>

          {!open ? (
            <button type="button" className="btn sm" onClick={() => setOpen(true)}>
              Acreditar LP de este pedido
            </button>
          ) : (
            <form action={action}>
              <input type="hidden" name="orderId" value={orderId} />
              <label className="field">
                <span>Motivo</span>
                <input name="reason" required minLength={3} maxLength={200} autoFocus />
              </label>
              {state.error && <div className="alert bad">{state.error}</div>}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn sm primary" type="submit" disabled={pending}>
                  {pending ? 'Acreditando…' : 'Confirmar'}
                </button>
                <button type="button" className="btn sm" onClick={() => setOpen(false)} disabled={pending}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
