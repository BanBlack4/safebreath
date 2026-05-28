import { Router } from 'express';
import { healthProfileController } from '../controllers/health-profile.controller';
import { validate } from '../middlewares/validate';
import { updateHealthProfileSchema } from '../dto/health-profile.dto';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireOwnershipOrRole } from '../middlewares/rbac.middleware';

const router = Router();

// GET /api/health-profile/:userId
// Only the user themselves, admin, or medical staff can view the profile
router.get('/:userId', 
  authenticateToken, 
  requireOwnershipOrRole(), 
  healthProfileController.getProfile
);

// PUT /api/health-profile
// Only the user themselves, admin, or medical staff can update the profile
router.put('/', 
  authenticateToken, 
  requireOwnershipOrRole(),
  validate(updateHealthProfileSchema),
  healthProfileController.updateProfile
);

export default router;
