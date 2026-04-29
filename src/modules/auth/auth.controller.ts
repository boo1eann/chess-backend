import { asyncHandler } from '@/shared/utils/async-handler';
import type { AuthService } from './auth.service';
import { extractRequestMeta } from './utils/extract-meta';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = asyncHandler(async (req, res) => {
    const meta = extractRequestMeta(req);
    const result = await this.authService.register(req.body, meta);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  login = asyncHandler(async (req, res) => {
    const meta = extractRequestMeta(req);
    const result = await this.authService.login(req.body, meta);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  refresh = asyncHandler(async (req, res) => {
    const meta = extractRequestMeta(req);
    const result = await this.authService.refresh(req.body.refreshToken, meta);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    await this.authService.logout(refreshToken ?? null);
    res.status(204).send();
  });
}
