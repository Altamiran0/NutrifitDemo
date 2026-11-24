import { RoleName } from './auth.types';

export const DAYS_OF_WEEK = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface CreateAvailabilityDTO {
  userId: number; // ID del usuario profesional (NUTRICIONISTA o INSTRUCTOR)
  dayOfWeek: string; // Se normaliza en el servicio (acepta "Miércoles", "lunes", etc.)
  startTime: string; // Formato 'HH:MM' (24 hs)
  endTime: string; // Formato 'HH:MM' (24 hs)
}

export interface UpdateAvailabilityDTO {
  availabilityId: number;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}

export interface AvailabilityDTO {
  id: number;
  userId: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
}

export interface AvailabilityResponseDTO {
  availability: AvailabilityDTO;
  message: string;
}

export interface ProfessionalDTO {
  userId: number;
  name: string;
  lastname: string;
  role: RoleName;
}