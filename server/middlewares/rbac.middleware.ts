import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user has one of the required roles.
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User role not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware to ensure the user is accessing their own data (Ownership validation).
 * Assumes the URL parameter for user ID is `userId`.
 */
export const requireOwnershipOrRole = (allowedRoles: string[] = ['admin', 'medical_staff']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const requestUserId = req.params.userId || req.body.userId;
    
    // Allow if user is accessing their own data or has a privileged role
    if (req.user.userId === requestUserId || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ success: false, error: 'Forbidden: Not your data' });
  };
};
