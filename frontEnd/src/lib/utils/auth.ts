import { setSession, clearSession } from '../stores/session';

interface User {
  id: string;
  email: string;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch('http://localhost:4000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed');
  }
  
  const user = await response.json();
  setSession(user);
  return user;
}

export async function signup(email: string, password: string): Promise<User> {
  const response = await fetch('http://localhost:4000/api/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Signup failed');
  }
  
  const user = await response.json();
  setSession(user);
  return user;
}

export async function logout(): Promise<void> {
  const response = await fetch('http://localhost:4000/api/logout', {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  clearSession();
}
