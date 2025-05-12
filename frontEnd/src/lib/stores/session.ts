import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
  id: string;
  email: string;
}

const getInitialUser = () => {
  if (!browser) return null;
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) as User : null;
};

export const session = writable<{ user: User | null }>({
  user: getInitialUser()
});

export function setSession(user: User) {
  if (browser) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_id', user.id);
  }
  session.set({ user });
}

export function clearSession() {
  if (browser) {
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
  }
  session.set({ user: null });
}
