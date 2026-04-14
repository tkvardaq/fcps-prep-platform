'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, BookOpen, PlayCircle, CheckCircle2, Circle, Clock, Target, Layers, Award, Download } from 'lucide-react'

// Must match the COURSES in the parent page — import from a shared module in production
const COURSES = {
  'obs-basics': {
    title: 'Obstetrics - Normal Pregnancy',
    icon: '🤰',
    color: '#3B82F6',
    paper: 1,
    description: 'From conception to delivery — physiology, antenatal care, labour management, and puerperium.',
    referenceBooks: ['Ten Teachers in Obstetrics', "Dewhurst's Textbook", 'High Yield FCPS Past Papers'],
    modules: [
      { name: 'Gamete Formation & Fertilization', topicKeywords: ['fertilization', 'gamete', 'implantation'] },
      { name: 'Placental Development & Function', topicKeywords: ['placenta'] },
      { name: 'Maternal Physiology in Pregnancy', topicKeywords: ['physiology', 'maternal'] },
      { name: 'Antenatal Care & Screening', topicKeywords: ['antenatal', 'prenatal', 'screening'] },
      { name: 'Normal Labour & Delivery', topicKeywords: ['labour', 'labor', 'delivery', 'birth'] },
      { name: 'Puerperium & Postpartum', topicKeywords: ['puerperium', 'postpartum'] },
    ]
  },
  'obs-high-risk': {
    title: 'Obstetrics - High Risk Pregnancy',
    icon: '⚠️',
    color: '#EF4444',
    paper: 2,
    description: 'Complications including pre-eclampsia, GDM, preterm labour, antepartum/postpartum hemorrhage.',
    referenceBooks: ['NICE Guidelines', "Williams Obstetrics", 'High Yield FCPS Past Papers'],
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
  'gynae-benign': {
    title: 'Gynaecology - Benign Conditions',
    icon: '🏥',
    color: '#8B5CF6',
    paper: 2,
    description: 'Menstrual disorders, endometriosis, fibroids, PCOS, and benign ovarian tumors.',
    referenceBooks: ['Jeffcoate\'s Gynaecology', 'Ten Teachers in Gynaecology', 'High Yield FCPS'],
    modules: [
      { name: 'Menstrual Disorders', topicKeywords: ['menstrual', 'menorrhag', 'amenorrhea', 'dysmenorrhea'] },
      { name: 'Endometriosis & Adenomyosis', topicKeywords: ['endometriosis', 'adenomyosis'] },
      { name: 'Uterine Fibroids', topicKeywords: ['fibroid', 'leiomyoma'] },
      { name: 'PCOS & Ovarian Cysts', topicKeywords: ['pcos', 'polycystic', 'ovarian cyst'] },
      { name: 'Pelvic Infections (PID)', topicKeywords: ['pelvic inflammatory', 'PID'] },
      { name: 'Benign Vulval Conditions', topicKeywords: ['vulval', 'vulvar'] },
    ]
  },
  'gynae-onco': {
    title: 'Gynaecological Oncology',
    icon: '🎯',
    color: '#F97316',
    paper: 2,
    description: 'Cervical, endometrial, ovarian cancers — staging, management, and screening.',
    referenceBooks: ['NICE Guidelines', 'Shaw\'s Gynaecology', 'High Yield FCPS'],
    modules: [
      { name: 'Cervical Cancer & Screening', topicKeywords: ['cervical cancer', 'pap smear', 'colposcopy'] },
      { name: 'Endometrial Cancer', topicKeywords: ['endometrial cancer', 'uterine cancer'] },
      { name: 'Ovarian Cancer', topicKeywords: ['ovarian cancer', 'ovarian tumor'] },
      { name: 'GTD (Gestational Trophoblastic Disease)', topicKeywords: ['molar', 'trophoblastic', 'GTD', 'choriocarcinoma'] },
      { name: 'Vulval & Vaginal Cancer', topicKeywords: ['vulval cancer', 'vaginal cancer'] },
    ]
  },
  'repro-med': {
    title: 'Reproductive Medicine',
    icon: '🔬',
    color: '#14B8A6',
    paper: 2,
    description: 'Infertility workup, assisted reproduction, contraception, and sexual health.',
    referenceBooks: ['ESHRE Guidelines', 'Ten Teachers', 'High Yield FCPS'],
    modules: [
      { name: 'Infertility - Workup & Causes', topicKeywords: ['infertility', 'subfertility'] },
      { name: 'Assisted Reproduction (IVF, IUI)', topicKeywords: ['IVF', 'IUI', 'assisted reproduction'] },
      { name: 'Contraception', topicKeywords: ['contraception', 'family planning'] },
      { name: 'Menopause & HRT', topicKeywords: ['menopause', 'HRT', 'hormone replacement'] },
      { name: 'Sexual Health & STIs', topicKeywords: ['sexual', 'STI', 'STD'] },
    ]
  },
  'anatomy-embryo': {
    title: 'Anatomy & Embryology',
    icon: '🦴',
    color: '#6366F1',
    paper: 1,
    description: 'Pelvic anatomy, fetal development, and applied surgical anatomy — Paper 1 essentials.',
    referenceBooks: ['Last\'s Anatomy', 'Langman\'s Embryology', 'High Yield FCPS'],
    modules: [
      { name: 'Pelvic Anatomy', topicKeywords: ['pelvi', 'pelvic anatomy'] },
      { name: 'Uterine & Ovarian Anatomy', topicKeywords: ['uterus', 'ovary', 'fallopian'] },
      { name: 'Embryology of Reproductive System', topicKeywords: ['embryology', 'development'] },
      { name: 'Applied Surgical Anatomy', topicKeywords: ['surgical anatomy', 'nerve supply'] },
    ]
  },
  'pharma-path': {
    title: 'Pharmacology & Pathology',
    icon: '💊',
    color: '#EC4899',
    paper: 1,
    description: 'Drug therapy in obstetrics & gynaecology, and histopathological concepts.',
    referenceBooks: ['BNF', 'Robbins Pathology', 'High Yield FCPS'],
    modules: [
      { name: 'Tocolytics & Uterotonics', topicKeywords: ['tocolytic', 'uterotonic', 'oxytocin', 'misoprostol'] },
      { name: 'Hormonal Therapy', topicKeywords: ['hormone', 'estrogen', 'progesterone'] },
      { name: 'Antibiotics in Obs & Gynae', topicKeywords: ['antibiotic', 'infections'] },
      { name: 'Chemotherapy Basics', topicKeywords: ['chemotherapy', 'cytotoxic'] },
      { name: 'Histopathology', topicKeywords: ['histopathology', 'pathology', 'histolog'] },
    ]
  },
}

export default function CourseDetailPage({ params }) {
  const { id } = use(params)
  const course = COURSES[id]
  const router = useRouter()
  const supabase = createClient()

  const [topics, setTopics] = useState([])
  const [topicProgress, setTopicProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!course) return
    loadCourseData()
  }, [id])

  async function loadCourseData() {
    const { data: { user } } = await supabase.auth.getUser()

    // Match module keywords to actual topics in DB
    const { data: allTopics } = await supabase
      .from('topics')
      .select('*, subjects(name, color_hex)')

    if (allTopics) {
      // Match each module to relevant topics
      const matched = course.modules.map(mod => {
        const matchedTopics = allTopics.filter(t =>
          mod.topicKeywords.some(kw =>
            t.name.toLowerCase().includes(kw.toLowerCase())
          )
        )
        return { ...mod, topics: matchedTopics }
      })
      setTopics(matched)
    }

    // Load progress per topic
    if (user) {
      const { data: attempts } = await supabase
        .from('user_attempts')
        .select('topic_id, is_correct')
        .eq('user_id', user.id)

      if (attempts) {
        const byTopic = {}
        attempts.forEach(a => {
          if (!byTopic[a.topic_id]) byTopic[a.topic_id] = { total: 0, correct: 0 }
          byTopic[a.topic_id].total++
          if (a.is_correct) byTopic[a.topic_id].correct++
        })

        const progMap = {}
        Object.entries(byTopic).forEach(([tid, v]) => {
          progMap[tid] = { accuracy: Math.round((v.correct / v.total) * 100), total: v.total }
        })
        setTopicProgress(progMap)
      }
    }

    setLoading(false)
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h2>
        <Link href="/courses" className="text-blue-600 font-bold hover:underline">← Back to Courses</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Overall completion
  const allMatchedTopics = topics.flatMap(m => m.topics)
  const completedTopics = allMatchedTopics.filter(t => topicProgress[t.id]?.accuracy >= 70)
  const overallProgress = allMatchedTopics.length > 0 ? Math.round((completedTopics.length / allMatchedTopics.length) * 100) : 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Back */}
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </Link>

      {/* Course Header */}
      <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
        <div className="h-2" style={{ backgroundColor: course.color }}></div>
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">{course.icon}</div>
            <span className={`font-bold text-sm px-3 py-1 rounded-full ${course.paper === 1 ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
              Paper {course.paper}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
          <p className="text-slate-500 leading-relaxed mb-6">{course.description}</p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-slate-900">{course.modules.length}</p>
              <p className="text-xs text-slate-500 font-medium">Modules</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-slate-900">{allMatchedTopics.length}</p>
              <p className="text-xs text-slate-500 font-medium">Topics</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-black" style={{ color: course.color }}>{overallProgress}%</p>
              <p className="text-xs text-slate-500 font-medium">Complete</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-slate-900">{course.estimatedHours || '—'}</p>
              <p className="text-xs text-slate-500 font-medium">Est. Hours</p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-slate-600">Course Progress</span>
              <span className="font-bold text-slate-900">{completedTopics.length}/{allMatchedTopics.length} topics mastered</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%`, backgroundColor: course.color }}></div>
            </div>
          </div>

          {/* Reference Books */}
          {course.referenceBooks && (
            <div className="mt-6 flex flex-wrap gap-2">
              {course.referenceBooks.map((book, i) => (
                <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">📚 {book}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {topics.map((module, mIdx) => (
          <div key={mIdx} className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
            <div className="p-6 pb-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: course.color }}>
                    {mIdx + 1}
                  </div>
                  {module.name}
                </h2>
                <span className="text-sm text-slate-500">{module.topics.length} topics</span>
              </div>
            </div>
            
            {module.topics.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {module.topics.map(topic => {
                  const prog = topicProgress[topic.id]
                  const isMastered = prog && prog.accuracy >= 70
                  
                  return (
                    <div key={topic.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isMastered ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className={`font-medium ${isMastered ? 'text-teal-700' : 'text-slate-800'}`}>{topic.name}</p>
                          <p className="text-xs text-slate-400">{topic.subjects?.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {prog && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            prog.accuracy >= 70 ? 'bg-teal-100 text-teal-700' : 
                            prog.accuracy >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {prog.accuracy}% · {prog.total} MCQs
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <Link href={`/study/${topic.id}`} className="text-blue-600 hover:text-blue-700" title="Study Notes">
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link href={`/quiz?topic=${topic.id}`} className="text-purple-600 hover:text-purple-700" title="Practice">
                            <PlayCircle className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">
                No matching topics found in the database yet
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
