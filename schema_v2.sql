-- FCPS PREP PLATFORM - COMPREHENSIVE SCHEMA V2
-- Author: Antigravity

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES (EXISTING REFINEMENT)
-- user_profiles table is assumed to exist with: id (uuid), full_name, medical_college, exam_date, etc.

-- subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    paper_number INT CHECK (paper_number IN (1, 2)),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- topics table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, name)
);

-- mcqs table
CREATE TABLE IF NOT EXISTS mcqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    reference_book TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_attempts table
CREATE TABLE IF NOT EXISTS user_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mcq_id UUID REFERENCES mcqs(id) ON DELETE CASCADE,
    selected_option CHAR(1),
    is_correct BOOLEAN,
    time_taken INT, -- in seconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- revision_queue (Spaced Repetition)
CREATE TABLE IF NOT EXISTS revision_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mcq_id UUID REFERENCES mcqs(id) ON DELETE CASCADE,
    interval INT DEFAULT 1, -- days
    easiness_factor FLOAT DEFAULT 2.5,
    repetition INT DEFAULT 0,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    last_quality INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mcq_id)
);

-- user_bookmarks
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mcq_id UUID REFERENCES mcqs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(user_id, mcq_id)
);

-- user_profiles (Hardening)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    medical_college TEXT,
    exam_date DATE,
    daily_study_hours INT DEFAULT 4,
    paper_focus TEXT DEFAULT 'Both',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS HARDENING
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public subjects viewable by everyone" ON subjects FOR SELECT USING (true);
CREATE POLICY "Public topics viewable by everyone" ON topics FOR SELECT USING (true);
CREATE POLICY "Public mcqs viewable by everyone" ON mcqs FOR SELECT USING (true);

CREATE POLICY "Users can view their own attempts" ON user_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON user_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own revision queue" ON revision_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own revision queue" ON revision_queue FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. RPC FUNCTIONS (SINGLE ROUND TRIP)

-- RPC: get_dashboard_data
CREATE OR REPLACE FUNCTION get_dashboard_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile JSONB;
    v_stats JSONB;
    v_subject_progress JSONB;
BEGIN
    -- Get Profile
    SELECT jsonb_build_object(
        'full_name', full_name,
        'exam_date', exam_date,
        'daily_study_hours', daily_study_hours,
        'paper_focus', paper_focus
    ) INTO v_profile FROM user_profiles WHERE id = p_user_id;

    -- Get Global Stats
    SELECT jsonb_build_object(
        'total_attempts', COUNT(*),
        'correct_attempts', COUNT(*) FILTER (WHERE is_correct = true),
        'accuracy', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_correct = true))::NUMERIC / COUNT(*) * 100) ELSE 0 END,
        'avg_time', COALESCE(AVG(time_taken), 0),
        'streak', 0 
    ) INTO v_stats FROM user_attempts WHERE user_id = p_user_id;

    -- Get Subject Progress
    SELECT jsonb_agg(sub) INTO v_subject_progress
    FROM (
        SELECT 
            s.name as subject_name,
            COUNT(m.id) as total,
            COUNT(ua.id) as attempted,
            COUNT(ua.id) FILTER (WHERE ua.is_correct = true) as correct
        FROM subjects s
        LEFT JOIN mcqs m ON m.subject_id = s.id
        LEFT JOIN user_attempts ua ON ua.mcq_id = m.id AND ua.user_id = p_user_id
        GROUP BY s.name
    ) sub;

    RETURN jsonb_build_object(
        'profile', v_profile,
        'stats', v_stats,
        'subject_progress', v_subject_progress
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: get_quiz_questions
CREATE OR REPLACE FUNCTION get_quiz_questions(
    p_subject_ids UUID[], 
    p_limit INT DEFAULT 20, 
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    subject_id UUID,
    topic_id UUID,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    reference_book TEXT,
    is_bookmarked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id, m.subject_id, m.topic_id, m.question, 
        m.option_a, m.option_b, m.option_c, m.option_d, 
        m.correct_answer::TEXT, m.explanation, m.difficulty, m.reference_book,
        EXISTS (SELECT 1 FROM user_bookmarks ub WHERE ub.mcq_id = m.id AND ub.user_id = auth.uid())
    FROM mcqs m
    WHERE (p_subject_ids IS NULL OR m.subject_id = ANY(p_subject_ids))
    AND m.is_published = true
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: update_sm2_state
CREATE OR REPLACE FUNCTION update_sm2_state(
    p_user_id UUID,
    p_mcq_id UUID,
    p_quality INT -- 0 to 5
)
RETURNS VOID AS $$
DECLARE
    v_ef FLOAT := 2.5;
    v_interval INT := 1;
    v_repetition INT := 0;
    v_existing_id UUID;
BEGIN
    -- Get existing SR data
    SELECT id, easiness_factor, interval, repetition 
    INTO v_existing_id, v_ef, v_interval, v_repetition
    FROM revision_queue 
    WHERE user_id = p_user_id AND mcq_id = p_mcq_id;

    -- SM-2 Logic
    IF p_quality >= 3 THEN
        IF v_repetition = 0 THEN
            v_interval := 1;
        ELSIF v_repetition = 1 THEN
            v_interval := 6;
        ELSE
            v_interval := ROUND(v_interval * v_ef);
        END IF;
        v_repetition := v_repetition + 1;
    ELSE
        v_repetition := 0;
        v_interval := 1;
    END IF;

    v_ef := v_ef + (0.1 - (5 - p_quality) * (0.08 + (5 - p_quality) * 0.02));
    IF v_ef < 1.3 THEN v_ef := 1.3; END IF;

    -- Upsert
    INSERT INTO revision_queue (user_id, mcq_id, easiness_factor, interval, repetition, next_review, last_quality)
    VALUES (p_user_id, p_mcq_id, v_ef, v_interval, v_repetition, NOW() + (v_interval || ' days')::INTERVAL, p_quality)
    ON CONFLICT (user_id, mcq_id) DO UPDATE SET
        easiness_factor = EXCLUDED.easiness_factor,
        interval = EXCLUDED.interval,
        repetition = EXCLUDED.repetition,
        next_review = EXCLUDED.next_review,
        last_quality = EXCLUDED.last_quality;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
