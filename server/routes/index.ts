import { Router } from 'express';
import healthProfileRoutes from './health-profile.routes';
import authRoutes from './auth.routes';
import observabilityRoutes from '../observability/health.routes';
import smsRoutes from './sms.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/ops', observabilityRoutes); // /ops/health, /ops/metrics

// Protected modules will be mounted here
router.use('/health-profile', healthProfileRoutes);
router.use('/sms', smsRoutes);

// router.use('/telemetry', telemetryRoutes);
// router.use('/alerts', alertsRoutes);
// router.use('/users', usersRoutes);
// router.use('/emergency-contacts', emergencyContactsRoutes);

export default router;
