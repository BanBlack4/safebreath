import { Request, Response, NextFunction } from 'express';
import { healthProfileService } from '../services/health-profile.service';

export class HealthProfileController {
  
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const profile = await healthProfileService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await healthProfileService.updateProfile(data.userId, data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const healthProfileController = new HealthProfileController();
