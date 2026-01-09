import { Timestamp } from "firebase/firestore";

export enum LS {
    ATTENDED, // Represents topics the student has already attended.
    MISSED, // Represents topics the student missed.
    CURRENT, // Represents the topic being taught this week.
    UPCOMING, // Represents topics scheduled for upcoming weeks or months.
    COMPLETED, // Represents topics the instructor has already covered. TODO ovaj completed maknit
  }

export enum TestType {
  MEDICAL,
  PSYCHOLOGICAL,
  REGULATIONS,
  FIRST_AID,
  DRIVING,
}



export enum ScreenType {
  MEDICAL_EXAM,
  PSYCHOLOGICAL_EXAM,
  PLAN,
  REGULATIONS_LECTURES,
  REGULATIONS_EXAM,
  FIRST_AID_LECTURES,
  FIRST_AID_EXAM,
  DRIVING_LECTURES,
  DRIVING_EXAM,
  LICENSE,
}

export { Timestamp };
