"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Course, Lesson, ValidationReport } from "@/types/course";
import { validateCourse } from "@/lib/validator";

export type HistoryEntry = {
  course: Course;
  description: string;
  timestamp: number;
  lessonId?: string;
  targetId?: string;
};

interface CourseContextType {
  course: Course;
  setCourse: (course: Course) => void;
  updateLesson: (
    lessonId: string,
    updatedLesson: Lesson,
    description?: string,
    targetId?: string,
  ) => void;
  addLesson: (lesson: Lesson) => void;
  deleteLesson: (lessonId: string) => void;
  reorderLessons: (startIndex: number, endIndex: number) => void;
  report: ValidationReport;
  exportCourse: () => void;
  resetCourse: () => void;
  saveStatus: "idle" | "saving" | "saved";
  history: HistoryEntry[];
  undo: () => void;
  restoreToHistory: (index: number) => void;
}

const defaultCourse: Course = { lessons: [] };

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [courseState, setCourseState] = useState<{
    course: Course;
    history: HistoryEntry[];
  }>({ course: defaultCourse, history: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const course = courseState.course;
  const history = courseState.history;
  const report = useMemo(() => validateCourse(course), [course]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("th-course-draft");
    if (saved) {
      try {
        setCourseState({ course: JSON.parse(saved), history: [] });
      } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("th-course-draft", JSON.stringify(course));
      setSaveStatus("saved");

      // hide saved message after 3 seconds
      const hideTimer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      return () => clearTimeout(hideTimer);
    }, 5000);

    return () => clearTimeout(timer);
  }, [course, isLoaded]);

  const dispatchCourseChange = (
    newCourseOrUpdater: Course | ((prev: Course) => Course),
    description: string,
    lessonId?: string,
    targetId?: string,
  ) => {
    setCourseState((prevState) => {
      const prevCourse = prevState.course;
      const nextCourse =
        typeof newCourseOrUpdater === "function"
          ? newCourseOrUpdater(prevCourse)
          : newCourseOrUpdater;

      if (prevCourse === nextCourse) return prevState;

      const now = Date.now();
      const lastEntry = prevState.history[prevState.history.length - 1];

      // Batch rapid changes with the same description
      if (
        lastEntry &&
        lastEntry.description === description &&
        now - lastEntry.timestamp < 5000
      ) {
        const updatedHistory = [...prevState.history];
        updatedHistory[updatedHistory.length - 1] = {
          ...lastEntry,
          timestamp: now,
        };
        return { course: nextCourse, history: updatedHistory };
      }

      const newHistory = [
        ...prevState.history,
        {
          course: prevCourse,
          description,
          timestamp: now,
          lessonId,
          targetId,
        },
      ].slice(-50);

      return { course: nextCourse, history: newHistory };
    });
  };

  const setCourse = (newCourse: Course) => {
    dispatchCourseChange(newCourse, "Import ou mise à jour globale du cours");
  };

  const updateLesson = (
    lessonId: string,
    updatedLesson: Lesson,
    description?: string,
    targetId?: string,
  ) => {
    dispatchCourseChange(
      (prev) => ({
        ...prev,
        lessons: prev.lessons.map((l) =>
          l.id === lessonId ? updatedLesson : l,
        ),
      }),
      description ||
        `Modification de la leçon "${updatedLesson.title || "Sans titre"}"`,
      lessonId,
      targetId,
    );
  };

  const addLesson = (lesson: Lesson) => {
    dispatchCourseChange(
      (prev) => ({
        ...prev,
        lessons: [...prev.lessons, lesson],
      }),
      `Ajout de la leçon "${lesson.title || "Nouvelle leçon"}"`,
      lesson.id,
    );
  };

  const deleteLesson = (lessonId: string) => {
    dispatchCourseChange(
      (prev) => ({
        ...prev,
        lessons: prev.lessons.filter((l) => l.id !== lessonId),
      }),
      `Suppression d'une leçon`,
      lessonId,
    );
  };

  const reorderLessons = (startIndex: number, endIndex: number) => {
    dispatchCourseChange((prev) => {
      const result = Array.from(prev.lessons);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { ...prev, lessons: result };
    }, "Réorganisation des leçons");
  };

  const exportCourse = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(course, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "course.json");
    dlAnchorElem.click();
  };

  const resetCourse = () => {
    dispatchCourseChange({ lessons: [] }, "Réinitialisation du cours");
    localStorage.removeItem("th-course-draft");
  };

  const undo = () => {
    setCourseState((prevState) => {
      if (prevState.history.length === 0) return prevState;
      const lastState = prevState.history[prevState.history.length - 1];
      const newHistory = prevState.history.slice(0, -1);
      return { course: lastState.course, history: newHistory };
    });
  };

  const restoreToHistory = (index: number) => {
    setCourseState((prevState) => {
      if (index < 0 || index >= prevState.history.length) return prevState;
      const targetState = prevState.history[index];
      const newHistory = prevState.history.slice(0, index);
      return { course: targetState.course, history: newHistory };
    });
  };

  return (
    <CourseContext.Provider
      value={{
        course,
        setCourse,
        updateLesson,
        addLesson,
        deleteLesson,
        reorderLessons,
        report,
        exportCourse,
        resetCourse,
        saveStatus,
        history,
        undo,
        restoreToHistory,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) throw new Error("useCourse must be used within CourseProvider");
  return context;
}
