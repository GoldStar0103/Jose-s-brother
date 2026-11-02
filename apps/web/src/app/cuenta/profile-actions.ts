'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { changeLinkedPlayerId, setFeaturedBadges, updateAvatar, updateDisplayName } from '@monkei/db';
import { ValidationUnsupportedError } from '@monkei/provider';
import { createCustomerSessionToken } from '../../lib/customer-auth.js';
import { callerIp, getDb, getProvider, validationLimiter } from '../../lib/server.js';
import {
  requireCustomerSession,
  clearCustomerSessionCookie,
  setCustomerSessionCookie,
} from '../../lib/customer-session.js';
import { storeAvatar } from '../../lib/avatar-storage.js';
import { validationProductId } from '../comprar/[combo]/actions.js';

export async function logout(): Promise<void> {
  await clearCustomerSessionCookie();
  redirect('/');
}

export interface DisplayNameFormState {
  error?: string;
  ok?: boolean;
}

export async function saveDisplayName(
  _prev: DisplayNameFormState,
  formData: FormData,
): Promise<DisplayNameFormState> {
  const session = await requireCustomerSession();
  const raw = String(formData.get('displayName') ?? '');

  const result = await updateDisplayName(getDb(), session.playerProfileId, raw);
  if (!result.ok) return { error: result.message };

  revalidatePath('/cuenta');
  revalidatePath('/cuenta/perfil');
  return { ok: true };
}

export interface AvatarFormState {
  error?: string;
  ok?: boolean;
}

export async function saveAvatar(_prev: AvatarFormState, formData: FormData): Promise<AvatarFormState> {
  const session = await requireCustomerSession();
  const file = formData.get('avatar');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecciona una foto.' };
  }

  const stored = await storeAvatar(session.playerProfileId, new Uint8Array(await file.arrayBuffer()));
  if (!stored.ok) return { error: stored.rejection.message };

  await updateAvatar(getDb(), session.playerProfileId, stored.key);
  revalidatePath('/cuenta');
  revalidatePath('/cuenta/perfil');
  return { ok: true };
}

export interface LinkedIdFormState {
  error?: string;
  ok?: boolean;
}

export async function saveLinkedPlayerId(
  _prev: LinkedIdFormState,
  formData: FormData,
): Promise<LinkedIdFormState> {
  const session = await requireCustomerSession();
  const playerId = String(formData.get('playerId') ?? '').trim();

  if (!/^\d{6,15}$/.test(playerId)) {
    return { error: 'El ID de Free Fire debe tener entre 6 y 15 números.' };
  }

  // Same safety check as checkout: confirm it's a real account before it can
  // ever represent someone in the ranking, not just a string of digits.
  const decision = validationLimiter.check(await callerIp());
  if (!decision.allowed) {
    return { error: `Demasiados intentos. Espera ${Math.ceil(decision.retryAfterMs / 1000)} segundos.` };
  }

  const validator = await validationProductId();
  if (!validator) {
    return { error: 'No podemos verificar tu ID en este momento. Intenta más tarde.' };
  }

  try {
    const validation = await getProvider().validatePlayer(validator, playerId);
    if (!validation.found) {
      return { error: 'No encontramos ese ID de Free Fire. Revísalo e intenta de nuevo.' };
    }
  } catch (err) {
    if (err instanceof ValidationUnsupportedError) {
      console.error('[perfil] product does not support validation', err);
      return { error: 'No podemos verificar tu ID en este momento.' };
    }
    console.error('[perfil] provider call failed', err);
    return { error: 'No pudimos contactar al servidor de Free Fire. Intenta en un momento.' };
  }

  const result = await changeLinkedPlayerId(getDb(), session.playerProfileId, playerId);
  if (!result.ok) {
    return {
      error:
        result.reason === 'taken'
          ? 'Ese ID de Free Fire ya está ligado a otra cuenta.'
          : result.reason === 'already_changed'
            ? 'Esta temporada ya cambiaste tu ID. Solo se puede una vez.'
            : 'El ID de Free Fire debe tener entre 6 y 15 números.',
    };
  }

  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (secret && secret.length >= 32) {
    await setCustomerSessionCookie(
      createCustomerSessionToken({ playerProfileId: session.playerProfileId, playerId: result.playerId }, secret),
    );
  }

  revalidatePath('/cuenta');
  revalidatePath('/cuenta/perfil');
  return { ok: true };
}

export async function saveFeaturedBadges(formData: FormData): Promise<void> {
  const session = await requireCustomerSession();
  const ownershipIds = formData.getAll('ownershipId').map(String);

  await setFeaturedBadges(getDb(), session.playerProfileId, ownershipIds);
  revalidatePath('/cuenta');
  revalidatePath('/cuenta/insignias');
}
