// Guest cart identity. A random session id is stored in localStorage and sent
// as X-Session-Id so a not-yet-registered visitor can build a cart. On login the
// id is handed to the API, which merges the guest cart into the user's cart.
const KEY = 'ourscart_session_id';

export function getGuestSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function clearGuestSessionId(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
