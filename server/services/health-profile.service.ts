import { UpdateHealthProfileDto } from '../dto/health-profile.dto';
import { IHealthProfileRepository } from '../repositories/interfaces/health-profile.repository.interface';
// Cambiamos el import:
import { SupabaseHealthProfileRepository } from '../repositories/supabase/health-profile.supabase';

export class HealthProfileService {
  constructor(private readonly healthProfileRepository: IHealthProfileRepository) {}

  async getProfile(userId: string) {
    const profile = await this.healthProfileRepository.getProfile(userId);
    return profile || null;
  }

  async updateProfile(userId: string, data: UpdateHealthProfileDto) {
    if (data.bpmReposo > 120) {
      console.warn('High resting BPM recorded:', data.bpmReposo);
    }

    const updatedProfile = await this.healthProfileRepository.updateProfile(userId, data);

    return {
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedProfile
    };
  }
}

// Cambiamos la instanciación:
const healthProfileRepository = new SupabaseHealthProfileRepository();
export const healthProfileService = new HealthProfileService(healthProfileRepository);