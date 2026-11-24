export type RoleName = 'Cliente' | 'Nutricionista' | 'Instructor' | 'Admin';

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
  role: 'Cliente';
  heightCm?: number;
  mainGoal?: string;
  medicalConditions?: string;
}

export interface RegisterNutritionistDTO extends BaseRegisterDTO {
  role: 'Nutricionista';
  residentialArea: string;
  professionalTitle: string;
  professionalLicense: string;
  profilePictureUrl?: string;
}

export interface RegisterInstructorDTO extends BaseRegisterDTO {
  role: 'Instructor';
  residentialArea: string;
  trainingTitle: string;
  registrationNumber?: string;
  profilePictureUrl?: string;
}

export interface RegisterAdminDTO extends BaseRegisterDTO {
  role: 'Admin';
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