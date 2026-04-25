import { asyncHandler } from '@/shared/utils/async-handler';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req, res) => {
    const userAgent = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? null;
    const result = await this.authService.register(req.body, { userAgent, ip });

    res.status(201).json({
      success: true,
      data: result,
    });
  });
}
