import { writable } from 'svelte/store';

export const userId = writable<string | null>(null);
export const authToken = writable<string | null>(null);

const API_BASE_URL = 'http://localhost:4001/api';

interface AuthCredentials {
  email: string;
  password?: string; // Password might be optional for some flows, but required for login/signup
}

export async function login(credentials: AuthCredentials) {
  const { email, password } = credentials;
  if (!password) {
    throw new Error('Password is required for login.');
  }
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Login failed');
  }

  const data = await response.json();

  if (data.status === 'success' && data.user_id && data.token) {
    userId.set(data.user_id.toString());
    authToken.set(data.token);
    localStorage.setItem('userId', data.user_id.toString());
    localStorage.setItem('authToken', data.token);
    return data;
  }
  throw new Error(data.message || 'Login failed: Invalid response from server.');
}

export async function signup(credentials: AuthCredentials) {
  const { email, password } = credentials;
  if (!password) {
    throw new Error('Password is required for signup.');
  }
  // Correcting the signup URL, assuming http://
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Signup failed with status: ' + response.status }));
    throw new Error(errorData.message || 'Signup failed');
  }

  const data = await response.json();

  if (data.status === 'success' && data.user_id && data.token) {
    userId.set(data.user_id.toString());
    authToken.set(data.token);
    localStorage.setItem('userId', data.user_id.toString());
    localStorage.setItem('authToken', data.token);
    return data;
  }
  throw new Error(data.message || 'Signup failed: Invalid response from server.');
}

export function logout() {
  userId.set(null);
  authToken.set(null);
  localStorage.removeItem('userId');
  localStorage.removeItem('authToken');
}

export function checkAuth() {
  const storedUserId = localStorage.getItem('userId');
  const storedAuthToken = localStorage.getItem('authToken');

  if (storedUserId && storedAuthToken) {
    userId.set(storedUserId);
    authToken.set(storedAuthToken);
  } else {
    // If one is missing, clear both for consistency
    logout();
  }
}
