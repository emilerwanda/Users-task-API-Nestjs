// 

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/users.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../user/entities/user.entity'; // Adjust path if needed

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new UnauthorizedException('Google authentication failed');
    }

    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      // Create new user for first-time Google login
      user = await this.usersService.create({
        email: googleUser.email,
        name: googleUser.name,
        role: UserRole.NORMAL, // Default role; adjust as needed
        googleAccessToken: googleUser.accessToken,
        googleRefreshToken: googleUser.refreshToken,
        password: '', // No password for Google users
      });
    } else {
      // Update existing user with Google tokens
      await this.usersService.update(user.id, {
        googleAccessToken: googleUser.accessToken,
        googleRefreshToken: googleUser.refreshToken,
      });
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}