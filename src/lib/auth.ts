const AUTH_API = 'https://functions.poehali.dev/3e156ab2-adb4-4cba-b90d-d3559f7fa59e';
const AVATAR_API = 'https://functions.poehali.dev/92199666-93b4-497b-b65e-e2bee017ebb7';

export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  team?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  user: User;
  session_token: string;
}

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  team?: string;
}): Promise<AuthResponse> => {
  const response = await fetch(AUTH_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', ...data }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  const result = await response.json();
  localStorage.setItem('session_token', result.session_token);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(AUTH_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const result = await response.json();
  localStorage.setItem('session_token', result.session_token);
  localStorage.setItem('user', JSON.stringify(result.user));
  return result;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('session_token');
  if (!token) return null;
  
  try {
    const response = await fetch(AUTH_API, {
      method: 'GET',
      headers: { 'X-Session-Token': token },
    });
    
    if (!response.ok) {
      logout();
      return null;
    }
    
    const result = await response.json();
    localStorage.setItem('user', JSON.stringify(result.user));
    return result.user;
  } catch {
    logout();
    return null;
  }
};

export const uploadAvatar = async (imageFile: File): Promise<string> => {
  const token = localStorage.getItem('session_token');
  if (!token) throw new Error('Not authenticated');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch(AVATAR_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': token,
          },
          body: JSON.stringify({ image: reader.result }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Avatar upload failed');
        }
        
        const result = await response.json();
        localStorage.setItem('user', JSON.stringify(result.user));
        resolve(result.avatar_url);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
};

export const logout = () => {
  localStorage.removeItem('session_token');
  localStorage.removeItem('user');
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
