import type { TechnicianProfile, UserProfile } from '../../auth/services/auth.service';

export function isTechnicianProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const data = profile.technicianProfile;
  if (!data) return false;
  return Boolean(
    profile.fullName?.trim() &&
    profile.mobileNumber?.trim() &&
    data.yearsOfExperience &&
    data.professionalDescription?.trim() &&
    data.specializations.length &&
    data.skills.length &&
    data.languages.length &&
    data.serviceArea.city?.trim() &&
    data.serviceArea.state &&
    data.serviceArea.pincodes?.trim() &&
    data.serviceArea.serviceRadius &&
    data.availability.workingDays.length &&
    data.availability.startTime &&
    data.availability.endTime &&
    data.availability.startTime < data.availability.endTime
  );
}

export function technicianProfileCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;
  const data = profile.technicianProfile;
  if (!data) return 0;
  const areas = [
    Boolean(profile.fullName?.trim() && profile.mobileNumber?.trim()),
    Boolean(data.yearsOfExperience && data.professionalDescription?.trim()),
    data.specializations.length > 0,
    data.skills.length > 0,
    data.languages.length > 0,
    Boolean(data.serviceArea.city && data.serviceArea.state && data.serviceArea.pincodes && data.serviceArea.serviceRadius),
    Boolean(data.availability.workingDays.length && data.availability.startTime && data.availability.endTime && data.availability.startTime < data.availability.endTime),
  ];
  return Math.round((areas.filter(Boolean).length / areas.length) * 100);
}

export function technicianProfileData(profile: UserProfile | null): TechnicianProfile | null {
  return profile?.technicianProfile || null;
}
