"use client";

import { useCourse } from "@/contexts/CourseContext";
import { Lesson } from "@/types/course";
import { Plus, Trash2, Edit, Search, GripVertical } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function LessonsPage() {
  const { course, addLesson, deleteLesson, reorderLessons } = useCourse();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  function handleAddLesson() {
    const newLesson: Lesson = {
      id: `lesson-${course.lessons.length + 1}-${uuidv4().substring(0, 4)}`,
      title: "New Lesson",
      description: "Description",
      words: [],
      phrases: [],
    };
    addLesson(newLesson);
    router.push(`/lessons/${newLesson.id}`);
  }

  const filteredLessons = useMemo(() => {
     if (!searchTerm.trim()) return course.lessons;
     const term = searchTerm.toLowerCase();
     return course.lessons.filter(l => 
        l.title.toLowerCase().includes(term) || 
        l.id.toLowerCase().includes(term) || 
        l.words.some(w => w.th.toLowerCase().includes(term) || w.fr.toLowerCase().includes(term) || w.en.toLowerCase().includes(term) || w.phonetic.toLowerCase().includes(term)) ||
        l.phrases.some(p => p.th.toLowerCase().includes(term) || p.fr.toLowerCase().includes(term) || p.en.toLowerCase().includes(term) || p.phonetic.toLowerCase().includes(term))
     );
  }, [course.lessons, searchTerm]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    reorderLessons(result.source.index, result.destination.index);
  }

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lessons</h1>
          <p className="text-slate-500 mt-2">Manage the lessons, words, and phrases in your course.</p>
        </div>
        <button 
          onClick={handleAddLesson}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
        >
          <Plus size={16} /> Add Lesson
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
         <Search size={18} className="text-slate-400" />
         <input 
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
           placeholder="Rechercher une leçon, un mot ou une phrase globalement..."
           className="w-full bg-transparent border-none outline-none text-sm text-slate-800"
         />
      </div>

      {course.lessons.length === 0 ? (
        <div className="bg-white border text-center border-slate-200 border-dashed rounded-lg p-12 shadow-sm flex flex-col items-center justify-center">
          <p className="text-slate-500 mb-4 text-[13px]">No lessons loaded.</p>
          <button 
            onClick={handleAddLesson}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
          >
            <Plus size={16} /> Create First Lesson
          </button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white border text-center border-slate-200 border-dashed rounded-lg p-12 shadow-sm flex flex-col items-center justify-center">
          <p className="text-slate-500 mb-4 text-[13px]">Aucune leçon ne correspond à votre recherche.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="lessons-list" isDropDisabled={isSearching}>
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-4"
              >
                {filteredLessons.map((lesson, index) => (
                  <Draggable key={lesson.id} draggableId={lesson.id} index={index} isDragDisabled={isSearching}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex gap-4 flex-col sm:flex-row sm:items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div {...provided.dragHandleProps} className={`text-slate-300 hover:text-slate-500 transition-colors ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <GripVertical size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-[14px] text-slate-900 mb-1">{lesson.title} <span className="text-[12px] font-normal text-slate-400 font-mono ml-2">{lesson.id}</span></h3>
                            <div className="text-[12px] text-slate-500 flex items-center gap-3">
                              <span>{lesson.words.length} words</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 block"></span>
                              <span>{lesson.phrases.length} phrases</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-11 sm:ml-0">
                          <Link 
                            href={`/lessons/${lesson.id}`}
                            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors shrink-0"
                          >
                            <Edit size={14} /> Edit
                          </Link>
                          <button 
                            onClick={() => deleteLesson(lesson.id)}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors shrink-0"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
