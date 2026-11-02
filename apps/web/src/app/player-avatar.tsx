/**
 * Shared player avatar: the uploaded photo when there is one, otherwise a
 * generic person glyph on the site's existing `.avatar` gradient (never
 * initials — a stranger's first name doesn't tell you what they look like).
 */
export function PlayerAvatar({ url, size }: { url: string | null; size: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
    />
  ) : (
    <div className="avatar" aria-hidden="true" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '60%', height: '60%' }}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}
