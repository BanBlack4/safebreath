import jwt from 'jsonwebtoken';
import { LoginDto } from '../dto/auth.dto';

// In a real application, this would use a UserRepository and bcrypt
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-dev';

export class AuthService {
  async login(data: LoginDto) {
    // Mock user authentication
    if (data.email === 'admin@safebreath.com') {
      return this.generateTokens('admin123', 'admin');
    }
    if (data.email === 'medic@safebreath.com') {
      return this.generateTokens('medic123', 'medical_staff');
    }
    
    // Default user login
    return this.generateTokens('user123', 'user');
  }

  async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, JWT_REFRESH_SECRET);
      return this.generateTokens(decoded.userId, decoded.role);
    } catch (error) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }
  }

  private generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId, role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return {
      user: { userId, role },
      accessToken,
      refreshToken
    };
  }
}

export const authService = new AuthService();
