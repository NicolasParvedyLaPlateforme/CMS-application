import { Course, ValidationReport, ValidationErrorItem } from "../types/course";

export function validateCourse(course: Course): ValidationReport {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];

  const globalIds = new Set<string>();
  const globalIdSource = new Map<string, string>(); // item.id -> lesson.id
  const definedWords = new Map<string, { lessonId: string; th: string }>();
  const chronologicalWords = new Map<string, Set<string>>(); // lessonId -> Set of available word IDs
  const usedWords = new Set<string>();

  const wordEnMap = new Map<
    string,
    { id: string; lessonId: string; text: string }
  >();
  const wordFrMap = new Map<
    string,
    { id: string; lessonId: string; text: string }
  >();
  const phraseEnMap = new Map<
    string,
    { id: string; lessonId: string; text: string }
  >();
  const phraseFrMap = new Map<
    string,
    { id: string; lessonId: string; text: string }
  >();

  let accumulativeWords = new Set<string>();

  course.lessons.forEach((lesson) => {
    // Basic Info Validations
    if (!lesson.id || lesson.id.trim() === "") {
      errors.push({
        type: "error",
        message: `L'ID de la leçon est manquant.`,
        lessonId: lesson.id,
      });
    }
    
    if (!lesson.title || lesson.title.trim() === "") {
      errors.push({
        type: "error",
        message: `Le titre de la leçon (FR) est manquant.`,
        lessonId: lesson.id,
      });
    }

    if (!lesson.titleEn || lesson.titleEn.trim() === "") {
      errors.push({
        type: "error",
        message: `Le titre anglais de la leçon (EN) est manquant.`,
        lessonId: lesson.id,
      });
    }

    if (!lesson.description || lesson.description.trim() === "") {
      errors.push({
        type: "error",
        message: `La description de la leçon (FR) est manquante.`,
        lessonId: lesson.id,
      });
    }

    if (!lesson.descriptionEn || lesson.descriptionEn.trim() === "") {
      errors.push({
        type: "error",
        message: `La description anglaise de la leçon (EN) est manquante.`,
        lessonId: lesson.id,
      });
    }
    
    if (!lesson.imageUrl || lesson.imageUrl.trim() === "") {
      errors.push({
        type: "error",
        message: `L'URL de l'image de la leçon est manquante.`,
        lessonId: lesson.id,
      });
    }

    if (globalIds.has(lesson.id)) {
      errors.push({
        type: "error",
        message: `Lesson ID "${lesson.id}" is duplicated.`,
        lessonId: lesson.id,
      });
    }
    globalIds.add(lesson.id);

    // Rule: Max 7 words
    if (lesson.words.length > 7) {
      errors.push({
        type: "error",
        message: `Lesson has ${lesson.words.length} words. Maximum allowed is 7.`,
        lessonId: lesson.id,
      });
    }

    // Rule: Max 7 phrases
    if (lesson.phrases.length > 7) {
      errors.push({
        type: "error",
        message: `Lesson has ${lesson.phrases.length} phrases. Maximum allowed is 7.`,
        lessonId: lesson.id,
      });
    }

    const currentLessonWords = new Set<string>();

    lesson.words.forEach((word) => {
      // Missing Word ID
      if (!word.id || word.id.trim() === "") {
        errors.push({
          type: "error",
          message: `L'ID du mot est manquant.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      } else if (globalIds.has(word.id)) {
        const existingLessonId = globalIdSource.get(word.id);
        errors.push({
          type: "error",
          message: `Word ID "${word.id}" is duplicated.`,
          lessonId: lesson.id,
          itemId: word.id,
          actionUrl: `/resolve?type=word&id1=${word.id}&id2=${word.id}&l1=${existingLessonId}&l2=${lesson.id}`,
        });
      } else {
        globalIdSource.set(word.id, lesson.id);
        globalIds.add(word.id);
      }
      definedWords.set(word.id, { lessonId: lesson.id, th: word.th });
      currentLessonWords.add(word.id);
      accumulativeWords.add(word.id);

      // Rule: imageUrl not empty
      if (!word.imageUrl || word.imageUrl.trim() === "") {
        errors.push({
          type: "error",
          message: `L'Image URL manquante.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      }

      // Rule: Phonetic not empty
      if (!word.phonetic || word.phonetic.trim() === "") {
        errors.push({
          type: "error",
          message: `Phonetic cannot be empty.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      }

      // Rule: Translation not empty
      if (!word.en || word.en.trim() === "") {
        errors.push({
          type: "error",
          message: `La traduction anglaise (en) est manquante.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      }
      if (!word.fr || word.fr.trim() === "") {
        errors.push({
          type: "error",
          message: `La traduction française (fr) est manquante.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      }

      // Rule: EN and FR not identical (unless allowed)
      if (
        !word.allowIdenticalTranslation &&
        word.en &&
        word.fr &&
        word.en.trim().toLowerCase() === word.fr.trim().toLowerCase()
      ) {
        errors.push({
          type: "error",
          message: `English and French translations cannot be identical.`,
          lessonId: lesson.id,
          itemId: word.id,
        });
      }

      // Duplicate EN Word Translation
      if (word.en && word.en.trim() !== "") {
        const cleanEn = word.en.trim().toLowerCase();
        if (wordEnMap.has(cleanEn)) {
          const existing = wordEnMap.get(cleanEn)!;
          if (existing.id !== word.id) {
            errors.push({
              type: "error",
              message: `Duplicate English Word translation "${word.en}" found with word "${existing.id}" (Lesson ${existing.lessonId}).`,
              lessonId: lesson.id,
              itemId: word.id,
              actionUrl: `/resolve?type=word&id1=${existing.id}&id2=${word.id}`,
            });
          }
        } else {
          wordEnMap.set(cleanEn, {
            id: word.id,
            lessonId: lesson.id,
            text: word.en,
          });
        }
      }

      // Duplicate FR Word Translation
      if (word.fr && word.fr.trim() !== "") {
        const cleanFr = word.fr.trim().toLowerCase();
        if (wordFrMap.has(cleanFr)) {
          const existing = wordFrMap.get(cleanFr)!;
          if (existing.id !== word.id) {
            errors.push({
              type: "error",
              message: `Duplicate French Word translation "${word.fr}" found with word "${existing.id}" (Lesson ${existing.lessonId}).`,
              lessonId: lesson.id,
              itemId: word.id,
              actionUrl: `/resolve?type=word&id1=${existing.id}&id2=${word.id}`,
            });
          }
        } else {
          wordFrMap.set(cleanFr, {
            id: word.id,
            lessonId: lesson.id,
            text: word.fr,
          });
        }
      }

      // Rule: Gender markers
      validateGenderMarkers(
        word.fr,
        word.en,
        lesson.id,
        word.id,
        "Word",
        errors,
      );
    });

    chronologicalWords.set(lesson.id, new Set(accumulativeWords));
  });

  // 2nd Pass: Validate phrases and their components
  course.lessons.forEach((lesson) => {
    const availableWords = chronologicalWords.get(lesson.id) || new Set();

    lesson.phrases.forEach((phrase) => {
      // Missing Phrase ID
      if (!phrase.id || phrase.id.trim() === "") {
        errors.push({
          type: "error",
          message: `L'ID de la phrase est manquant.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      } else if (globalIds.has(phrase.id)) {
        const existingLessonId = globalIdSource.get(phrase.id);
        errors.push({
          type: "error",
          message: `Phrase ID "${phrase.id}" is duplicated.`,
          lessonId: lesson.id,
          itemId: phrase.id,
          actionUrl: `/resolve?type=phrase&id1=${phrase.id}&id2=${phrase.id}&l1=${existingLessonId}&l2=${lesson.id}`,
        });
      } else {
        globalIdSource.set(phrase.id, lesson.id);
        globalIds.add(phrase.id);
      }

      // Rule: imageUrl not empty
      if (!phrase.imageUrl || phrase.imageUrl.trim() === "") {
        errors.push({
          type: "error",
          message: `L'Image URL manquante.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      }

      // Rule: Phonetic not empty
      if (!phrase.phonetic || phrase.phonetic.trim() === "") {
        errors.push({
          type: "error",
          message: `Phonetic cannot be empty.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      }

      // Rule: Translation not empty
      if (!phrase.en || phrase.en.trim() === "") {
        errors.push({
          type: "error",
          message: `La traduction anglaise (en) est manquante.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      }
      if (!phrase.fr || phrase.fr.trim() === "") {
        errors.push({
          type: "error",
          message: `La traduction française (fr) est manquante.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      }

      // Rule: EN and FR not identical
      if (
        !phrase.allowIdenticalTranslation &&
        phrase.en &&
        phrase.fr &&
        phrase.en.trim().toLowerCase() === phrase.fr.trim().toLowerCase()
      ) {
        errors.push({
          type: "error",
          message: `English and French translations cannot be identical.`,
          lessonId: lesson.id,
          itemId: phrase.id,
        });
      }

      // Duplicate EN Phrase Translation
      if (phrase.en && phrase.en.trim() !== "") {
        const cleanEn = phrase.en.trim().toLowerCase();
        if (phraseEnMap.has(cleanEn)) {
          const existing = phraseEnMap.get(cleanEn)!;
          if (existing.id !== phrase.id) {
            errors.push({
              type: "error",
              message: `Duplicate English Phrase translation "${phrase.en}" found with phrase "${existing.id}" (Lesson ${existing.lessonId}).`,
              lessonId: lesson.id,
              itemId: phrase.id,
              actionUrl: `/resolve?type=phrase&id1=${existing.id}&id2=${phrase.id}`,
            });
          }
        } else {
          phraseEnMap.set(cleanEn, {
            id: phrase.id,
            lessonId: lesson.id,
            text: phrase.en,
          });
        }
      }

      // Duplicate FR Phrase Translation
      if (phrase.fr && phrase.fr.trim() !== "") {
        const cleanFr = phrase.fr.trim().toLowerCase();
        if (phraseFrMap.has(cleanFr)) {
          const existing = phraseFrMap.get(cleanFr)!;
          if (existing.id !== phrase.id) {
            errors.push({
              type: "error",
              message: `Duplicate French Phrase translation "${phrase.fr}" found with phrase "${existing.id}" (Lesson ${existing.lessonId}).`,
              lessonId: lesson.id,
              itemId: phrase.id,
              actionUrl: `/resolve?type=phrase&id1=${existing.id}&id2=${phrase.id}`,
            });
          }
        } else {
          phraseFrMap.set(cleanFr, {
            id: phrase.id,
            lessonId: lesson.id,
            text: phrase.fr,
          });
        }
      }

      // Rule: Gender markers
      validateGenderMarkers(
        phrase.fr,
        phrase.en,
        lesson.id,
        phrase.id,
        "Phrase",
        errors,
      );

      // Rule: Components
      let constructedTh = "";
      phrase.components.forEach((compId) => {
        usedWords.add(compId);
        if (!availableWords.has(compId)) {
          // Check if it's missing or future
          if (definedWords.has(compId)) {
            const futureLessonId = definedWords.get(compId)?.lessonId;
            errors.push({
              type: "error",
              message: `Component "${compId}" is from a future lesson (${futureLessonId}).`,
              lessonId: lesson.id,
              itemId: phrase.id,
            });
          } else {
            errors.push({
              type: "error",
              message: `Component "${compId}" does not exist.`,
              lessonId: lesson.id,
              itemId: phrase.id,
            });
          }
        } else {
          constructedTh += definedWords.get(compId)?.th || "";
        }
      });

      // Rule: Thai spelling construction
      if (phrase.components.every((compId) => availableWords.has(compId))) {
        // all components available, we can check construction
        const cleanPhraseTh = phrase.th.replace(/\s+/g, "");
        const cleanConstructTh = constructedTh.replace(/\s+/g, "");
        if (cleanPhraseTh !== cleanConstructTh && cleanPhraseTh.length > 0) {
          errors.push({
            type: "error",
            message: `Thai construction mismatch. Expected: "${cleanPhraseTh}", Auto-constructed: "${cleanConstructTh}".`,
            lessonId: lesson.id,
            itemId: phrase.id,
          });
        }
      }
    });
  });

  // 3rd Pass: Ghost words
  definedWords.forEach((val, wordId) => {
    if (!usedWords.has(wordId)) {
      warnings.push({
        type: "warning",
        message: `Ghost word: "${wordId}" is defined but never used in any phrase component.`,
        lessonId: val.lessonId,
        itemId: wordId,
      });
    }
  });

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

function validateGenderMarkers(
  fr: string,
  en: string,
  lessonId: string,
  itemId: string,
  itemType: string,
  errors: ValidationErrorItem[],
) {
  if (!fr || !en) return;
  const lowerFr = fr.toLowerCase();
  const lowerEn = en.toLowerCase();

  const hasHomme = lowerFr.includes("(homme)");
  const hasMan = lowerEn.includes("(man)");
  if (hasHomme && !hasMan) {
    errors.push({
      type: "error",
      message: `Gender marker mismatch: FR has "(homme)" but EN lacks "(man)".`,
      lessonId,
      itemId,
    });
  } else if (!hasHomme && hasMan) {
    errors.push({
      type: "error",
      message: `Gender marker mismatch: EN has "(man)" but FR lacks "(homme)".`,
      lessonId,
      itemId,
    });
  }

  const hasFemme = lowerFr.includes("(femme)");
  const hasWoman = lowerEn.includes("(woman)");
  if (hasFemme && !hasWoman) {
    errors.push({
      type: "error",
      message: `Gender marker mismatch: FR has "(femme)" but EN lacks "(woman)".`,
      lessonId,
      itemId,
    });
  } else if (!hasFemme && hasWoman) {
    errors.push({
      type: "error",
      message: `Gender marker mismatch: EN has "(woman)" but FR lacks "(femme)".`,
      lessonId,
      itemId,
    });
  }
}
