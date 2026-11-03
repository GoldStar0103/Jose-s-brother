'use client';

import type { FormEvent } from 'react';
import { useActionState } from 'react';
import { deleteCombo, type DeleteComboState } from './actions';

interface Props {
  comboKey: string;
  comboName: string;
}

/**
 * A combo, once deleted, is gone — this only removes it from the sale list,
 * past orders keep their record. One case can't be hard-deleted (it's tied to
 * a Vault offer), and `deleteCombo` turns it off instead and says so below
 * the button, rather than leaving the admin staring at a pack that's still
 * live with no idea why "Eliminar" didn't work.
 */
export function DeleteComboButton({ comboKey, comboName }: Props) {
  const [state, action, pending] = useActionState<DeleteComboState, FormData>(deleteCombo, {});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`¿Eliminar "${comboName}"? Esto no se puede deshacer.`)) {
      event.preventDefault();
    }
  };

  return (
    <div>
      <form action={action} onSubmit={onSubmit}>
        <input type="hidden" name="comboKey" value={comboKey} />
        <button className="btn sm danger" type="submit" title="Eliminar combo" disabled={pending}>
          {pending ? 'Eliminando…' : 'Eliminar'}
        </button>
      </form>
      {state.error && (
        <p style={{ color: 'var(--bad)', fontSize: 12, marginTop: 4, maxWidth: 220 }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, maxWidth: 220 }}>
          {state.ok}
        </p>
      )}
    </div>
  );
}
