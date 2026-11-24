export type RoleName = 'CLIENTE' | 'NUTRICIONISTA' | 'INSTRUCTOR' | 'ADMINISTRADOR';

interface BaseRegisterDTO {
  name: string;
  lastname: string;
  dni: string;
  phoneNumber: string;
  birthdate: string; // Formato 'YYYY-MM-DD'
  email: string;
  password: string;
}

export interface RegisterClientDTO extends BaseRegisterDTO {
  role: 'CLIENTE';
  heightCm?: number;
  mainGoal?: string;
  medicalConditions?: string;
}

export interface RegisterNutritionistDTO extends BaseRegisterDTO {
  role: 'NUTRICIONISTA';
  residentialArea: string;
  professionalTitle: string;
  professionalLicense: string;
  profilePictureUrl?: string;
}

export interface RegisterInstructorDTO extends BaseRegisterDTO {
  role: 'INSTRUCTOR';
  residentialArea: string;
  trainingTitle: string;
  registrationNumber?: string;
  profilePictureUrl?: string;
}

export interface RegisterAdminDTO extends BaseRegisterDTO {
  role: 'ADMINISTRADOR';
}

export type RegisterRequestDTO =
  | RegisterClientDTO
  | RegisterNutritionistDTO
  | RegisterInstructorDTO
  | RegisterAdminDTO;

export interface RegisterResponseDTO {
  userId: number;
  email: string;
  role: RoleName;
  message: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface UserSessionDTO {
  userId: number;
  name: string;
  lastname: string;
  email: string;
  role: RoleName;
}