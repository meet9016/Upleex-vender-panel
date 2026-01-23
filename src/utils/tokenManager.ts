// Save token to BOTH localStorage AND cookies
export const saveToken = (token: string) => {
  // Save to localStorage (for client-side access)
  localStorage.setItem('auth_token', token);

  // Save to cookies (for middleware/server-side access)
  const expiryDays = 7;
  const date = new Date();
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;

  document.cookie = `auth_token=${token};${expires};path=/;SameSite=Strict`;
};

// Get token from localStorage
export const getToken = (): string | null => {
  const encrypted = localStorage.getItem('auth_token');
  return encrypted;
};

// Clear token from BOTH localStorage AND cookies
export const clearToken = () => {
  // Remove from localStorage
  localStorage.removeItem('auth_token');

  // Remove from cookies
  document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
};  