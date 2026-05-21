export interface Word {
  id: string;
  th: string;
  fr: string;
  phonetic: string;
  en: string;
  imageUrl?: string;
  allowIdenticalTranslation?: boolean;
}

export interface Phrase {
  id: string;
  th: string;
  fr: string;
  phonetic: string;
  components: string[];
  en: string;
  imageUrl?: string;
  allowIdenticalTranslation?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  words: Word[];
  phrases: Phrase[];
  titleEn?: string;
  descriptionEn?: string;
  imageUrl?: string;
}

export interface Course {
  lessons: Lesson[];
}

export type ValidationErrorType = 'error' | 'warning';

export interface ValidationErrorItem {
  type: ValidationErrorType;
  message: string;
  lessonId?: string;
  itemId?: string; // Word or Phrase ID
  actionUrl?: string;
}

export interface ValidationReport {
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  isValid: boolean;
}
