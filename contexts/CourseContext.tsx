"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Course, Lesson, ValidationReport } from '@/types/course';
import { validateCourse } from '@/lib/validator';

interface CourseContextType {
  course: Course;
  setCourse: (course: Course) => void;
  updateLesson: (lessonId: string, updatedLesson: Lesson) => void;
  addLesson: (lesson: Lesson) => void;
  deleteLesson: (lessonId: string) => void;
  report: ValidationReport;
  exportCourse: () => void;
  resetCourse: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

const defaultCourse: Course = { lessons: [] };

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [course, setCourse] = useState<Course>(defaultCourse);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const report = useMemo(() => validateCourse(course), [course]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('th-course-draft');
    if (saved) {
      try {
        setCourse(JSON.parse(saved));
      } catch(e) {}
    }
    setIsLoaded(true);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem('th-course-draft', JSON.stringify(course));
      setSaveStatus('saved');
      
      // hide saved message after 3 seconds
      const hideTimer = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      return () => clearTimeout(hideTimer);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [course, isLoaded]);

  const updateLesson = (lessonId: string, updatedLesson: Lesson) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(l => l.id === lessonId ? updatedLesson : l)
    }));
  };

  const addLesson = (lesson: Lesson) => {
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, lesson]
    }));
  };

  const deleteLesson = (lessonId: string) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.filter(l => l.id !== lessonId)
    }));
  };

  const exportCourse = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(course, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "course.json");
    dlAnchorElem.click();
  };

  const resetCourse = () => {
    setCourse({ lessons: [] });
    localStorage.removeItem('th-course-draft');
  };

  return (
    <CourseContext.Provider value={{ course, setCourse, updateLesson, addLesson, deleteLesson, report, exportCourse, resetCourse, saveStatus }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) throw new Error('useCourse must be used within CourseProvider');
  return context;
}
