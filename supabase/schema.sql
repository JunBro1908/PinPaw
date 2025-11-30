-- -----------------------------------------------------------------------------
-- 0. Enable required extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Types & Tables Creation
-- -----------------------------------------------------------------------------

-- Create enum type for lost post status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lost_status') THEN
    CREATE TYPE lost_status AS ENUM ('searching', 'found', 'closed');
  END IF;
END$$;

-- Create users table (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sightings table (목격 제보 - Track A: Main Page)
CREATE TABLE IF NOT EXISTS public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  breed TEXT,
  color TEXT,
  features JSONB,
  description TEXT,
  sighted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  embedding vector(512)
);

-- Create lost_posts table (실종 신고 - Track B: After Login)
CREATE TABLE IF NOT EXISTS public.lost_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dog_name TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  features JSONB,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  missing_at TIMESTAMPTZ NOT NULL,
  status lost_status NOT NULL DEFAULT 'searching',
  embedding vector(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sightings_location
  ON public.sightings(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_lost_posts_location
  ON public.lost_posts(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_lost_posts_status
  ON public.lost_posts(status);

CREATE INDEX IF NOT EXISTS idx_lost_posts_user_id
  ON public.lost_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_lost_posts_missing_at
  ON public.lost_posts(missing_at);

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Enablement
-- -----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_posts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 4. Drop Existing Policies (For Idempotency)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

DROP POLICY IF EXISTS "Anyone can insert sightings" ON public.sightings;
DROP POLICY IF EXISTS "Anyone can read sightings" ON public.sightings;
DROP POLICY IF EXISTS "Authenticated users can read sightings" ON public.sightings;

DROP POLICY IF EXISTS "Authenticated users can insert lost posts" ON public.lost_posts;
DROP POLICY IF EXISTS "Anyone can read lost posts" ON public.lost_posts;
DROP POLICY IF EXISTS "Authenticated users can read lost posts" ON public.lost_posts;
DROP POLICY IF EXISTS "Users can update own lost posts" ON public.lost_posts;
DROP POLICY IF EXISTS "Users can delete own lost posts" ON public.lost_posts;

-- -----------------------------------------------------------------------------
-- 5. RLS Policies (Final Logic)
-- -----------------------------------------------------------------------------

-- [Users Table]
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- [Sightings Table - 목격 제보]
-- INSERT: 누구나 가능
CREATE POLICY "Anyone can insert sightings"
  ON public.sightings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- SELECT: 로그인 유저만 가능
CREATE POLICY "Authenticated users can read sightings"
  ON public.sightings FOR SELECT TO authenticated USING (true);

-- [Lost Posts Table - 실종 신고]
-- INSERT: 로그인 유저만 가능
CREATE POLICY "Authenticated users can insert lost posts"
  ON public.lost_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- SELECT: 본인만 가능
CREATE POLICY "Users can read own lost posts"
  ON public.lost_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE: 본인만 가능
CREATE POLICY "Users can update own lost posts"
  ON public.lost_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: 본인만 가능
CREATE POLICY "Users can delete own lost posts"
  ON public.lost_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Functions & Triggers
-- -----------------------------------------------------------------------------

-- Function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lost_posts_updated_at ON public.lost_posts;

CREATE TRIGGER update_lost_posts_updated_at
  BEFORE UPDATE ON public.lost_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Handle New User (Auth -> Public Sync)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_nickname TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  user_nickname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'User'
  );

  BEGIN
    INSERT INTO public.users (id, nickname)
    VALUES (NEW.id, user_nickname);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN NEW;
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7. Storage Bucket & Policies (Fixed)
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public; -- 기존에 false로 되어있다면 true로 강제 업데이트

-- Drop existing storage policies
DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own images" ON storage.objects;

-- SELECT: 로그인 유저 조회 가능 (owner 체크 제거!)
-- 내가 올린 것뿐만 아니라 남이 올린 제보 사진도 지도에서 봐야 하므로 owner 체크를 뺍니다.
CREATE POLICY "Authenticated users can read images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'images');

-- INSERT: 누구나 업로드 (익명/회원)
CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'images');

-- UPDATE: 본인만 
CREATE POLICY "Authenticated users can update own images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'images' AND auth.uid() = owner);

-- DELETE: 본인만 
CREATE POLICY "Authenticated users can delete own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid() = owner);