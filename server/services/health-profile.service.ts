import { UpdateHealthProfileDto } from '../dto/health-profile.dto';
import { IHealthProfileRepository } from '../repositories/interfaces/health-profile.repository.interface';
import { FirestoreHealthProfileRepository } from '../repositories/firestore/health-profile.firestore';

// In a real scenario, this would use firebase-admin or pg for persistence
export class HealthProfileService {
  constructor(private readonly healthProfileRepository: IHealthProfileRepository) {}

  /**
   * Retrieves a health profile for a specific user.
   */
  async getProfile(userId: string) {
    const profile = await this.healthProfileRepository.getProfile(userId);
    
    if (!profile) {
      // Could throw a NotFoundException here
      return null;
    }
    
    return profile;
  }

  /**
   * Updates or creates the user's health profile.
   */
  async updateProfile(userId: string, data: UpdateHealthProfileDto) {
    // Abstracting validation and business logic here
    if (data.bpmReposo > 120) {
      console.warn('High resting BPM recorded:', data.bpmReposo);
      // Trigger a secondary service or emit an event
    }

    const updatedProfile = await this.healthProfileRepository.updateProfile(userId, data);

    return {
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedProfile
    };
  }
}

// Dependency Injection simulation
const healthProfileRepository = new FirestoreHealthProfileRepository();
export const healthProfileService = new HealthProfileService(healthProfileRepository);
