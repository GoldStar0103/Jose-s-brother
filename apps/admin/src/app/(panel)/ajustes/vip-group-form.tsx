'use client';

import { useActionState } from 'react';
import { saveVipGroupLink, type VipGroupFormState } from './actions';

interface Props {
  /** Null when nothing is configured (no settings row, and no env var either). */
  currentUrl: string | null;
}

export function VipGroupForm({ currentUrl }: Props) {
  const [state, action, pending] = useActionState<VipGroupFormState, FormData>(saveVipGroupLink, {});

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: 16 }}>Grupo VIP de WhatsApp</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        El enlace que se muestra al cliente cuando su pedido ya se completó. Si WhatsApp invalida
        el enlace actual (se revoca desde dentro del grupo), actualízalo aquí — no hace falta pedir
        un cambio de código. Déjalo vacío para ocultar ese aviso por completo.
      </p>

      {state.saved && <div className="alert ok">Guardado.</div>}

      <form action={action}>
        <label className="field">
          <span>Enlace de invitación</span>
          <input
            name="url"
            type="url"
            placeholder="https://chat.whatsapp.com/…"
            defaultValue={state.saved ? (state.url ?? '') : (currentUrl ?? '')}
          />
        </label>
        {state.error && <div className="alert bad">{state.error}</div>}
        <div className="row">
          <div className="spacer" />
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
