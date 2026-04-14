'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { GraduationCap, BookOpen, Clock, ChevronRight, Target, Layers, Star, PlayCircle, Award, Search } from 'lucide-react'

// FCPS Part 1 Gynae & Obs Course Structure
const COURSES = [
  {
    id: 'obs-basics',
    title: 'Obstetrics - Normal Pregnancy',
    description: 'From conception to delivery — physiology, antenatal care, labour management, and puerperium.',
    icon: '🤰',
    paper: 1,
    color: '#3B82F6',
    difficulty: 'Foundation',
    estimatedHours: 40,
    modules: [
      { name: 'Gamete Formation & Fertilization', topicKeywords: ['fertilization', 'gamete', 'implantation'] },
      { name: 'Placental Development & Function', topicKeywords: ['placenta'] },
      { name: 'Maternal Physiology in Pregnancy', topicKeywords: ['physiology', 'maternal'] },
      { name: 'Antenatal Care & Screening', topicKeywords: ['antenatal', 'prenatal', 'screening'] },
      { name: 'Normal Labour & Delivery', topicKeywords: ['labour', 'labor', 'delivery', 'birth'] },
      { name: 'Puerperium & Postpartum', topicKeywords: ['puerperium', 'postpartum'] },
    ]
  },
  {
    id: 'obs-high-risk',
    title: 'Obstetrics - High Risk Pregnancy',
    description: 'Complications including pre-eclampsia, GDM, preterm labour, antepartum/postpartum hemorrhage.',
    icon: '⚠️',
    paper: 2,
    color: '#EF4444',
    difficulty: 'Advanced',
    estimatedHours: 55,
    modules: [
      { name: 'Hypertensive Disorders', topicKeywords: ['hypertension', 'pre-eclampsia', 'eclampsia'] },
      { name: 'Gestational Diabetes', topicKeywords: ['diabetes', 'GDM'] },
      { name: 'Preterm Labour & PPROM', topicKeywords: ['preterm', 'PPROM'] },
      { name: 'Antepartum Hemorrhage', topicKeywords: ['antepartum', 'haemorrhage', 'hemorrhage', 'placenta previa', 'abruption'] },
      { name: 'Postpartum Hemorrhage', topicKeywords: ['postpartum haemorrhage', 'PPH'] },
      { name: 'Rh Isoimmunization', topicKeywords: ['rh', 'isoimmunization'] },
      { name: 'Multiple Pregnancies', topicKeywords: ['multiple', 'twin'] },
    ]
  },
  {
    id: 'gynae-benign',
    title: 'Gynaecology - Benign Conditions',
    description: 'Menstrual disorders, endometriosis, fibroids, PCOS, and benign ovarian tumors.',
    icon: '🏥',
    paper: 2,
    color: '#8B5CF6',
    difficulty: 'Intermediate',
    estimatedHours: 45,
    modules: [
      { name: 'Menstrual Disorders', topicKeywords: ['menstrual', 'menorrhag', 'amenorrhea', 'dysmenorrhea'] },
      { name: 'Endometriosis & Adenomyosis', topicKeywords: ['endometriosis', 'adenomyosis'] },
      { name: 'Uterine Fibroids', topicKeywords: ['fibroid', 'leiomyoma'] },
      { name: 'PCOS & Ovarian Cysts', topicKeywords: ['pcos', 'polycystic', 'ovarian cyst'] },
      { name: 'Pelvic Infections (PID)', topicKeywords: ['pelvic inflammatory', 'PID'] },
      { name: 'Benign Vulval Conditions', topicKeywords: ['vulval', 'vulvar'] },
    ]
  },
  {
    id: 'gynae-onco',
    title: 'Gynaecological Oncology',
    description: 'Cervical, endometrial, ovarian cancers — staging, management, and screening.',
    icon: '🎯',
    paper: 2,
    color: '#F97316',
    difficulty: 'Advanced',
    estimatedHours: 35,
    modules: [
      { name: 'Cervical Cancer & Screening', topicKeywords: ['cervical cancer', 'pap smear', 'colposcopy'] },
      { name: 'Endometrial Cancer', topicKeywords: ['endometrial cancer', 'uterine cancer'] },
      { name: 'Ovarian Cancer', topicKeywords: ['ovarian cancer', 'ovarian tumor'] },
      { name: 'GTD (Gestational Trophoblastic Disease)', topicKeywords: ['molar', 'trophoblastic', 'GTD', 'choriocarcinoma'] },
      { name: 'Vulval & Vaginal Cancer', topicKeywords: ['vulval cancer', 'vaginal cancer'] },
    ]
  },
  {
    id: 'repro-med',
    title: 'Reproductive Medicine',
    description: 'Infertility workup, assisted reproduction, contraception, and sexual health.',
    icon: '🔬',
    paper: 2,
    color: '#14B8A6',
    difficulty: 'Intermediate',
    estimatedHours: 30,
    modules: [
      { name: 'Infertility - Workup & Causes', topicKeywords: ['infertility', 'subfertility'] },
      { name: 'Assisted Reproduction (IVF, IUI)', topicKeywords: ['IVF', 'IUI', 'assisted reproduction'] },
      { name: 'Contraception', topicKeywords: ['contraception', 'family planning'] },
      { name: 'Menopause & HRT', topicKeywords: ['menopause', 'HRT', 'hormone replacement'] },
      { name: 'Sexual Health & STIs', topicKeywords: ['sexual', 'STI', 'STD'] },
    ]
  },
  {
    id: 'anatomy-embryo',
    title: 'Anatomy & Embryology',
    description: 'Pelvic anatomy, fetal development, and applied surgical anatomy — Paper 1 essentials.',
    icon: '🦴',
    paper: 1,
    color: '#6366F1',
    difficulty: 'Foundation',
    estimatedHours: 25,
    modules: [
      { name: 'Pelvic Anatomy', topicKeywords: ['pelvi', 'pelvic anatomy'] },
      { name: 'Uterine & Ovarian Anatomy', topicKeywords: ['uterus', 'ovary', 'fallopian'] },
      { name: 'Embryology of Reproductive System', topicKeywords: ['embryology', 'development'] },
      { name: 'Applied Surgical Anatomy', topicKeywords: ['surgical anatomy', 'nerve supply'] },
    ]
  },
  {
    id: 'pharma-path',
    title: 'Pharmacology & Pathology',
    description: 'Drug therapy in obstetrics & gynaecology, and histopathological concepts.',
    icon: '💊',
    paper: 1,
    color: '#EC4899',
    difficulty: 'Foundation',
    estimatedHours: 30,
    modules: [
      { name: 'Tocolytics & Uterotonics', topicKeywords: ['tocolytic', 'uterotonic', 'oxytocin', 'misoprostol'] },
      { name: 'Hormonal Therapy', topicKeywords: ['hormone', 'estrogen', 'progesterone'] },
      { name: 'Antibiotics in Obs & Gynae', topicKeywords: ['antibiotic', 'infections'] },
      { name: 'Chemotherapy Basics', topicKeywords: ['chemotherapy', 'cytotoxic'] },
      { name: 'Histopathology', topicKeywords: ['histopathology', 'pathology', 'histolog'] },
    ]
  },
]

export default function CoursesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'paper1', 'paper2'

  const filtered = COURSES.filter(c => {
    if (filter === 'paper1' && c.paper !== 1) return false
    if (filter === 'paper2' && c.paper !== 2) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalHours = COURSES.reduce((s, c) => s + c.estimatedHours, 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" /> Structured Courses
            </h1>
            <p className="text-slate-500">{COURSES.length} courses · {totalHours}+ hours · FCPS Part 1 Gynae & Obs Curriculum</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
            <button onClick={() => setFilter('paper1')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'paper1' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Paper 1</button>
            <button onClick={() => setFilter('paper2')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'paper2' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Paper 2</button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(course => (
          <Link key={course.id} href={`/courses/${course.id}`} className="block group">
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden hover:border-blue-200 hover:-translate-y-1 hover:shadow-lg transition-all h-full flex flex-col">
              <div className="h-2 w-full" style={{ backgroundColor: course.color }}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl mb-2">{course.icon}</div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    course.difficulty === 'Foundation' ? 'bg-blue-100 text-blue-700'
                    : course.difficulty === 'Intermediate' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                    {course.difficulty}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{course.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{course.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> {course.modules.length}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.estimatedHours}h</span>
                  </div>
                  <span className={`font-bold ${course.paper === 1 ? 'text-blue-600' : 'text-teal-600'}`}>Paper {course.paper}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
