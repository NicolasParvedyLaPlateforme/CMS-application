"use client";

import { useCourse } from "@/contexts/CourseContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function ResolveClient() {
  const { course, updateLesson } = useCourse();
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = searchParams.get('type') as 'word' | 'phrase';
  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');

  const [item1, setItem1] = useState<any>(null);
  const [item2, setItem2] = useState<any>(null);
  const [lesson1Id, setLesson1Id] = useState<string>('');
  const [lesson2Id, setLesson2Id] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<1 | 2 | null>(null);

  useEffect(() => {
    if (!id1 || !id2 || !type) return;
    
    let found1 = null, found2 = null;
    let l1 = '', l2 = '';

    for (const l of course.lessons) {
      const list = type === 'word' ? l.words : l.phrases;
      for (const item of list) {
        if (item.id === id1) { found1 = item; l1 = l.id; }
        if (item.id === id2) { found2 = item; l2 = l.id; }
      }
    }

    if (found1 && found2) {
      setItem1(JSON.parse(JSON.stringify(found1)));
      setItem2(JSON.parse(JSON.stringify(found2)));
      setLesson1Id(l1);
      setLesson2Id(l2);
    }
  }, [course, id1, id2, type]);

  if (!item1 || !item2) {
    return <div className="p-8 text-center text-slate-500">Item introuvable ou résolu. <Link href="/" className="text-blue-500 underline">Retourner au tableau de bord</Link></div>;
  }

  const handleUpdate = (itemNum: 1 | 2, field: string, value: any) => {
    if (itemNum === 1) {
      setItem1({ ...item1, [field]: value });
    } else {
      setItem2({ ...item2, [field]: value });
    }
  };

  const doDelete = (itemNum: 1 | 2) => {
    const lessonIdToDelete = itemNum === 1 ? lesson1Id : lesson2Id;
    const itemIdToDelete = itemNum === 1 ? id1 : id2;
    
    const lessonIdToSave = itemNum === 1 ? lesson2Id : lesson1Id;
    const itemToSave = itemNum === 1 ? item2 : item1;

    // First update the item to save
    const lSave = course.lessons.find(lesson => lesson.id === lessonIdToSave);
    if (lSave) {
       const u = { ...lSave };
       if (type === 'word') {
          u.words = u.words.map(w => w.id === itemToSave.id ? itemToSave : w);
       } else {
          u.phrases = u.phrases.map(p => p.id === itemToSave.id ? itemToSave : p);
       }
       
       // If both are in the same lesson, we must also remove the deleted item in the same update
       if (lessonIdToDelete === lessonIdToSave) {
          if (type === 'word') {
             u.words = u.words.filter(w => w.id !== itemIdToDelete);
          } else {
             u.phrases = u.phrases.filter(p => p.id !== itemIdToDelete);
          }
       }
       updateLesson(lSave.id, u);
    }

    // If they are in different lessons, delete the item from its lesson
    if (lessonIdToDelete !== lessonIdToSave) {
       const lDel = course.lessons.find(lesson => lesson.id === lessonIdToDelete);
       if (lDel) {
          const u = { ...lDel };
          if (type === 'word') {
             u.words = u.words.filter(w => w.id !== itemIdToDelete);
          } else {
             u.phrases = u.phrases.filter(p => p.id !== itemIdToDelete);
          }
          updateLesson(lDel.id, u);
       }
    }
    
    router.push('/');
  };

  const saveChanges = () => {
    const l1 = course.lessons.find(l => l.id === lesson1Id);
    if (l1) {
       const u = { ...l1 };
       if (type === 'word') u.words = u.words.map(w => w.id === id1 ? item1 : w);
       else u.phrases = u.phrases.map(p => p.id === id1 ? item1 : p);
       updateLesson(l1.id, u);
    }

    const l2 = course.lessons.find(l => l.id === lesson2Id);
    if (l2 && l1?.id !== l2.id) {
       const u = { ...l2 };
       if (type === 'word') u.words = u.words.map(w => w.id === id2 ? item2 : w);
       else u.phrases = u.phrases.map(p => p.id === id2 ? item2 : p);
       updateLesson(l2.id, u);
    } else if (l2 && l1?.id === l2.id) {
       // already saved in first block if same lesson, wait no:
       // we should apply both if in same lesson
       const lu = course.lessons.find(l => l.id === lesson1Id)!;
       const u = { ...lu };
       if (type === 'word') {
          u.words = u.words.map(w => w.id === id1 ? item1 : w.id === id2 ? item2 : w);
       } else {
          u.phrases = u.phrases.map(p => p.id === id1 ? item1 : p.id === id2 ? item2 : p);
       }
       updateLesson(lu.id, u);
    }
    
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <Link href="/" className="p-2 border border-slate-200 hover:bg-slate-100 rounded-md transition-colors text-slate-500 text-sm font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Résoudre le conflit ({type === 'word' ? 'Mot' : 'Phrase'})</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ITEM 1 */}
        <div className="bg-white border text-left border-red-200 shadow-[0_0_0_1px_rgba(248,113,113,0.3)] rounded-lg p-5 space-y-4">
           <div className="flex justify-between items-center">
             <h2 className="font-bold text-slate-800 text-[14px] m-0">Item 1 <span className="font-normal text-slate-500 text-[12px] ml-2">(Leçon: {lesson1Id})</span></h2>
             
             {confirmDelete === 1 ? (
               <div className="flex items-center gap-2">
                 <span className="text-[12px] text-red-600 font-semibold">Sûr ?</span>
                 <button onClick={() => doDelete(1)} className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Oui</button>
                 <button onClick={() => setConfirmDelete(null)} className="text-[12px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Non</button>
               </div>
             ) : (
               <button onClick={() => setConfirmDelete(1)} className="text-[12px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                  <Trash2 size={12} /> Supprimer
               </button>
             )}
           </div>
           <div className="space-y-3">
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">ID</label>
                 <input value={item1.id} disabled className="w-full border border-slate-300 bg-slate-100 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Français</label>
                 <input value={item1.fr} onChange={e => handleUpdate(1, 'fr', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Anglais</label>
                 <input value={item1.en} onChange={e => handleUpdate(1, 'en', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Thaï</label>
                 <input value={item1.th} onChange={e => handleUpdate(1, 'th', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[18px] text-blue-500 font-semibold" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Phonétique</label>
                 <input value={item1.phonetic} onChange={e => handleUpdate(1, 'phonetic', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
           </div>
        </div>

        {/* ITEM 2 */}
        <div className="bg-white border text-left border-red-200 shadow-[0_0_0_1px_rgba(248,113,113,0.3)] rounded-lg p-5 space-y-4">
           <div className="flex justify-between items-center">
             <h2 className="font-bold text-slate-800 text-[14px] m-0">Item 2 <span className="font-normal text-slate-500 text-[12px] ml-2">(Leçon: {lesson2Id})</span></h2>
             
             {confirmDelete === 2 ? (
               <div className="flex items-center gap-2">
                 <span className="text-[12px] text-red-600 font-semibold">Sûr ?</span>
                 <button onClick={() => doDelete(2)} className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Oui</button>
                 <button onClick={() => setConfirmDelete(null)} className="text-[12px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Non</button>
               </div>
             ) : (
               <button onClick={() => setConfirmDelete(2)} className="text-[12px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                  <Trash2 size={12} /> Supprimer
               </button>
             )}
           </div>
           <div className="space-y-3">
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">ID</label>
                 <input value={item2.id} disabled className="w-full border border-slate-300 bg-slate-100 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Français</label>
                 <input value={item2.fr} onChange={e => handleUpdate(2, 'fr', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Anglais</label>
                 <input value={item2.en} onChange={e => handleUpdate(2, 'en', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Thaï</label>
                 <input value={item2.th} onChange={e => handleUpdate(2, 'th', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[18px] text-blue-500 font-semibold" />
              </div>
              <div className="space-y-1">
                 <label className="text-[11px] font-semibold text-slate-500">Phonétique</label>
                 <input value={item2.phonetic} onChange={e => handleUpdate(2, 'phonetic', e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm" />
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
         <button onClick={saveChanges} className="bg-slate-900 text-white font-semibold flex items-center justify-center px-6 py-2 rounded-md hover:bg-slate-800 transition-colors">
            Sauvegarder
         </button>
      </div>
    </div>
  );
}
