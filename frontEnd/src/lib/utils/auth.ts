export async function login(email, password) {
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
  
  return response.json();
}

export async function signup(email, password) {
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
  
  return response.json();
}

export async function logout() {
  const response = await fetch('http://localhost:4000/api/logout', {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
}
