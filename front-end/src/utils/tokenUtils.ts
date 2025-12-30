import { jwtDecode } from 'jwt-decode';

// Define the structure of our JWT payload
interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: {
    name: string;
  };
  image: {
    id: number;
    url: string;
  } | null;
  is_active: boolean;
  exp: number;
  iat: number;
}

// Function to decode JWT token and get user info
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Function to get user info from token
export const getUserFromToken = (token: string) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role.name,
    image: decoded.image,
    is_active: decoded.is_active
  };
};

// Function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
