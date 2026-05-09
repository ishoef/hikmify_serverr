import { BookingStatus } from "../generated/enums.js";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVarified: boolean;
}

export interface TutorProfile {
  bio?: string;
  subjects: string[];
  experience?: string;
  qualification?: string;
  hourlyRate?: number;
  availability: string[];
  categoryName: string;
}

export interface BookingData {
  tutorId: string;
  categoryId: string;

  bookingDate: Date;
  startTime: Date;
  duration: number;
  status?: BookingStatus;
  notes?: string;
  meetingLink?: string;

  hourlyPrice: number;
  totalPrice: number;
}
