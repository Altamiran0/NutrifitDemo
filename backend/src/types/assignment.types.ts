export type AssignmentStatus = 'COMPLETO' | 'PENDIENTE';

export interface ClientRosterItemDTO {
  clientId: number;
  userId: number;
  name: string;
  lastname: string;
  dni: string;
  email: string;
  nutritionistId: number | null;
  nutritionistName: string | null;
  instructorId: number | null;
  instructorName: string | null;
  status: AssignmentStatus;
}

export interface ProfessionalOptionDTO {
  professionalId: number; // id en tabla nutritionists o instructors
  userId: number;
  name: string;
  lastname: string;
  specialtyOrTitle: string;
}

export interface AssignProfessionalsRequestDTO {
  clientId: number;
  // undefined = mantener actual | null = desvincular | number = asignar/reemplazar
  nutritionistId?: number | null;
  instructorId?: number | null;
}

export interface AssignProfessionalsResponseDTO {
  message: string;
  client: ClientRosterItemDTO;
}