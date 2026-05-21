"use client";

import { useCourse } from "@/contexts/CourseContext";
import { Lesson, Word, Phrase } from "@/types/course";
import {
  Plus,
  Trash2,
  ArrowLeft,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

export default function LessonEditorClient({ id }: { id: string }) {
  const { course, updateLesson, report } = useCourse();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");

  const lesson = useMemo(
    () => course.lessons.find((l) => l.id === id) || null,
    [course, id],
  );

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Lesson not found</h2>
        <Link
          href="/lessons"
          className="text-indigo-600 mt-4 inline-block hover:underline"
        >
          Return to lessons
        </Link>
      </div>
    );
  }

  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return lesson.words;
    const lower = searchTerm.toLowerCase();
    return lesson.words.filter(
      (w) =>
        w.th.toLowerCase().includes(lower) ||
        w.en.toLowerCase().includes(lower) ||
        w.fr.toLowerCase().includes(lower) ||
        w.phonetic.toLowerCase().includes(lower) ||
        w.id.toLowerCase().includes(lower),
    );
  }, [lesson.words, searchTerm]);

  const filteredPhrases = useMemo(() => {
    if (!searchTerm.trim()) return lesson.phrases;
    const lower = searchTerm.toLowerCase();
    return lesson.phrases.filter(
      (p) =>
        p.th.toLowerCase().includes(lower) ||
        p.en.toLowerCase().includes(lower) ||
        p.fr.toLowerCase().includes(lower) ||
        p.phonetic.toLowerCase().includes(lower) ||
        p.id.toLowerCase().includes(lower),
    );
  }, [lesson.phrases, searchTerm]);

  // --- Handlers ---
  const handleUpdateField = <K extends keyof Lesson>(
    field: K,
    value: Lesson[K],
  ) => {
    updateLesson(
      lesson.id,
      { ...lesson, [field]: value },
      `Modification du champ "${field}" de la leçon`,
    );
  };

  const handleWordUpdate = <K extends keyof Word>(
    wordId: string,
    field: K,
    value: Word[K],
  ) => {
    const index = lesson.words.findIndex((w) => w.id === wordId);
    if (index === -1) return;
    const updatedWords = [...lesson.words];
    updatedWords[index] = { ...updatedWords[index], [field]: value };
    updateLesson(
      lesson.id,
      { ...lesson, words: updatedWords },
      `Modification du mot "${wordId}" (${field})`,
      wordId,
    );
  };

  const handleAddWord = () => {
    const newWord: Word = {
      id: `w_${uuidv4().substring(0, 6)}`,
      th: "",
      fr: "",
      en: "",
      phonetic: "",
    };
    updateLesson(
      lesson.id,
      { ...lesson, words: [...lesson.words, newWord] },
      `Ajout d'un nouveau mot dans la leçon`,
      newWord.id,
    );
  };

  const handleRemoveWord = (wordId: string) => {
    const updatedWords = lesson.words.filter((w) => w.id !== wordId);
    updateLesson(
      lesson.id,
      { ...lesson, words: updatedWords },
      `Suppression du mot "${wordId}"`,
    );
  };

  const handlePhraseUpdate = <K extends keyof Phrase>(
    phraseId: string,
    field: K,
    value: Phrase[K],
  ) => {
    const index = lesson.phrases.findIndex((p) => p.id === phraseId);
    if (index === -1) return;
    const updatedPhrases = [...lesson.phrases];
    updatedPhrases[index] = { ...updatedPhrases[index], [field]: value };
    updateLesson(
      lesson.id,
      { ...lesson, phrases: updatedPhrases },
      `Modification de la phrase "${phraseId}" (${String(field)})`,
      phraseId,
    );
  };

  const handlePhraseThaiChange = (phraseId: string, newThai: string) => {
    const index = lesson.phrases.findIndex((p) => p.id === phraseId);
    if (index === -1) return;

    const allWords = course.lessons
      .flatMap((l) => l.words)
      .filter((w) => w.th && w.th.trim().length > 0);
    allWords.sort((a, b) => b.th.length - a.th.length);

    const cleanThai = newThai.replace(/\s+/g, "");
    const components: string[] = [];

    let currentPos = 0;
    while (currentPos < cleanThai.length) {
      let matched = false;
      for (const w of allWords) {
        if (cleanThai.startsWith(w.th, currentPos)) {
          components.push(w.id);
          currentPos += w.th.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        currentPos++;
      }
    }

    const updatedPhrases = [...lesson.phrases];
    updatedPhrases[index] = {
      ...updatedPhrases[index],
      th: newThai,
      components,
    };
    updateLesson(
      lesson.id,
      { ...lesson, phrases: updatedPhrases },
      `Modification de la phrase "${phraseId}" (th)`,
      phraseId,
    );
  };

  const handleAddPhrase = () => {
    const newPhrase: Phrase = {
      id: `p_${uuidv4().substring(0, 6)}`,
      th: "",
      fr: "",
      en: "",
      phonetic: "",
      components: [],
    };
    updateLesson(
      lesson.id,
      { ...lesson, phrases: [...lesson.phrases, newPhrase] },
      `Ajout d'une nouvelle phrase dans la leçon`,
      newPhrase.id,
    );
  };

  const handleRemovePhrase = (phraseId: string) => {
    const updatedPhrases = lesson.phrases.filter((p) => p.id !== phraseId);
    updateLesson(
      lesson.id,
      { ...lesson, phrases: updatedPhrases },
      `Suppression de la phrase "${phraseId}"`,
    );
  };

  // --- Error lookups ---
  const getErrorsForItem = (itemId: string) => {
    return report.errors.filter((e) => e.itemId === itemId);
  };

  const getLessonErrors = () => {
    return report.errors.filter((e) => e.lessonId === lesson.id && !e.itemId);
  };

  const lessonErrors = getLessonErrors();

  return (
    <div className="pb-32 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 md:px-8 py-4 mx-[-1.5rem] md:mx-[-2rem] mt-[-1.5rem] md:mt-[-2rem] mb-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link
            href="/lessons"
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-slate-500 text-sm font-semibold flex items-center gap-2"
          >
            Annuler
          </Link>
          <div className="flex-1">
            <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight m-0">
              {lesson.title}
            </h1>
            <p className="text-[12px] text-slate-500 m-0 leading-tight">
              ID: {lesson.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Editor Main Area inside a Card */}
        <section className="bg-white rounded-lg border border-slate-200 p-6 mb-4 mt-6">
          <h2 className="text-[14px] font-bold text-slate-800 m-0 mb-4 flex items-center gap-2">
            Basic Info
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                ID
              </label>
              <input
                value={lesson.id}
                onChange={(e) => handleUpdateField("id", e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-slate-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Image URL
              </label>
              <input
                value={lesson.imageUrl || ""}
                onChange={(e) => handleUpdateField("imageUrl", e.target.value)}
                className="w-full border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-sm outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Title (FR)
              </label>
              <input
                value={lesson.title}
                onChange={(e) => handleUpdateField("title", e.target.value)}
                className="w-full border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-sm outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Title (EN)
              </label>
              <input
                value={lesson.titleEn || ""}
                onChange={(e) => handleUpdateField("titleEn", e.target.value)}
                className="w-full border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-sm outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Global Search Bar */}
        <section className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mot ou une phrase (thaï, français, anglais, phonétique...)"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-800"
          />
        </section>

        {/* Words Section */}
        <section className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="m-0 text-[14px] font-bold">
              Vocabulaire de la leçon
            </h3>
            <button
              onClick={handleAddWord}
              className="text-blue-500 bg-transparent border-none text-[12px] font-semibold flex items-center cursor-pointer hover:underline"
            >
              + Ajouter un mot
            </button>
          </div>

          <div className="space-y-4">
            {filteredWords.map((word, idx) => {
              const rowErrs = getErrorsForItem(word.id);
              return (
                <div
                  id={word.id}
                  key={idx}
                  className={`border rounded-md overflow-hidden scroll-mt-24 ${rowErrs.length > 0 ? "border-red-400 shadow-[0_0_0_1px_rgba(248,113,113,0.5)]" : "border-slate-200"}`}
                >
                  <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center justify-between">
                    <div className="text-[12px] font-mono text-slate-500">
                      Mot #{idx + 1}
                    </div>
                    <button
                      onClick={() => handleRemoveWord(word.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">
                        ID
                      </label>
                      <input
                        value={word.id}
                        onChange={(e) =>
                          handleWordUpdate(word.id, "id", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-[13px] text-slate-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Thaï
                      </label>
                      <input
                        value={word.th}
                        onChange={(e) =>
                          handleWordUpdate(word.id, "th", e.target.value)
                        }
                        className="w-full border border-slate-300 rounded px-2 py-1 text-[20px] text-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Phonétique
                      </label>
                      <input
                        value={word.phonetic}
                        onChange={(e) =>
                          handleWordUpdate(word.id, "phonetic", e.target.value)
                        }
                        className={`w-full border rounded px-2 py-1 text-[13px] ${!word.phonetic ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Français / Anglais
                      </label>
                      <div className="flex flex-col gap-1">
                        <input
                          value={word.fr}
                          placeholder="FR"
                          onChange={(e) =>
                            handleWordUpdate(word.id, "fr", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded px-2 py-1 text-[13px]"
                        />
                        <input
                          value={word.en}
                          placeholder="EN"
                          onChange={(e) =>
                            handleWordUpdate(word.id, "en", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded px-2 py-1 text-[13px]"
                        />
                      </div>
                      {word.fr &&
                        word.en &&
                        word.fr.trim().toLowerCase() ===
                          word.en.trim().toLowerCase() && (
                          <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={word.allowIdenticalTranslation || false}
                              onChange={(e) =>
                                handleWordUpdate(
                                  word.id,
                                  "allowIdenticalTranslation",
                                  e.target.checked as any,
                                )
                              }
                              className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-slate-500">
                              Autoriser identiques
                            </span>
                          </label>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Phrases Section */}
        <section className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="m-0 text-[14px] font-bold">
              Dernière Phrase ajoutée
            </h3>
            <button
              onClick={handleAddPhrase}
              className="text-blue-500 bg-transparent border-none text-[12px] font-semibold flex items-center cursor-pointer hover:underline"
            >
              + Ajouter une phrase
            </button>
          </div>

          <div className="space-y-4">
            {filteredPhrases.map((phrase, idx) => {
              const rowErrs = getErrorsForItem(phrase.id);
              return (
                <div
                  id={phrase.id}
                  key={idx}
                  className={`bg-slate-50 p-3 rounded border-l-4 scroll-mt-24 ${rowErrs.length > 0 ? "border-l-red-500 shadow-[0_0_0_1px_rgba(248,113,113,0.5)] border-y-red-200 border-r-red-200" : "border-l-blue-500 border border-y-slate-200 border-r-slate-200"}`}
                >
                  <div className="flex justify-between">
                    <input
                      value={phrase.th}
                      placeholder="Thai"
                      onChange={(e) =>
                        handlePhraseThaiChange(phrase.id, e.target.value)
                      }
                      className="bg-transparent border-none outline-none text-[20px] text-blue-500 font-semibold w-full"
                    />
                    <button
                      onClick={() => handleRemovePhrase(phrase.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      value={phrase.phonetic}
                      placeholder="Phonetic"
                      onChange={(e) =>
                        handlePhraseUpdate(
                          phrase.id,
                          "phonetic",
                          e.target.value,
                        )
                      }
                      className="bg-transparent border-b border-slate-300 outline-none text-[12px] text-slate-500 w-1/3"
                    />
                    <span className="text-slate-400 text-xs">•</span>
                    <input
                      value={phrase.fr}
                      placeholder="French"
                      onChange={(e) =>
                        handlePhraseUpdate(phrase.id, "fr", e.target.value)
                      }
                      className="bg-transparent border-b border-slate-300 outline-none text-[12px] text-slate-500 w-1/3"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      value={phrase.id}
                      placeholder="ID"
                      onChange={(e) =>
                        handlePhraseUpdate(phrase.id, "id", e.target.value)
                      }
                      className="bg-slate-200 px-2 py-0.5 rounded text-[10px] w-24 outline-none border-none text-slate-600"
                    />
                    <input
                      value={phrase.components.join(", ")}
                      placeholder="w_hello, w_thanks"
                      onChange={(e) => {
                        const parts = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        handlePhraseUpdate(phrase.id, "components", parts);
                      }}
                      className="bg-slate-200 px-2 py-0.5 rounded text-[10px] w-64 outline-none border-none text-slate-600 font-mono"
                    />
                    <div className="flex-1 ml-4 flex flex-col gap-1">
                      <input
                        value={phrase.en}
                        placeholder="English"
                        onChange={(e) =>
                          handlePhraseUpdate(phrase.id, "en", e.target.value)
                        }
                        className="bg-transparent border-b border-slate-300 outline-none text-[12px] text-slate-500 w-full"
                      />
                      {phrase.fr &&
                        phrase.en &&
                        phrase.fr.trim().toLowerCase() ===
                          phrase.en.trim().toLowerCase() && (
                          <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                phrase.allowIdenticalTranslation || false
                              }
                              onChange={(e) =>
                                handlePhraseUpdate(
                                  phrase.id,
                                  "allowIdenticalTranslation",
                                  e.target.checked as any,
                                )
                              }
                              className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 w-3 h-3"
                            />
                            <span className="text-[10px] text-slate-500">
                              Autoriser identiques
                            </span>
                          </label>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
