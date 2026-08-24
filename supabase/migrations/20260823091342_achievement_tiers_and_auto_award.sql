-- Add tier and source-milestone tracking to achievements
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL;

-- Prevent duplicate badge awards per user
ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_user_name_unique UNIQUE (user_id, name);

-- Add XP and level tracking to the user's career profile
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner';

-- XP awarded per completed milestone
-- Level thresholds: 0-49 Beginner, 50-149 Learner, 150-299 Achiever, 300-499 Expert, 500+ Master
CREATE OR REPLACE FUNCTION public.xp_to_level(p_xp INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_xp >= 500 THEN RETURN 'Master';
  ELSIF p_xp >= 300 THEN RETURN 'Expert';
  ELSIF p_xp >= 150 THEN RETURN 'Achiever';
  ELSIF p_xp >= 50 THEN RETURN 'Learner';
  ELSE RETURN 'Beginner';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: on milestone completion, award XP, recompute level,
-- and award a tiered achievement badge at completion-count thresholds.
CREATE OR REPLACE FUNCTION public.award_milestone_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_completed_count INTEGER;
  v_new_xp INTEGER;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN

    SELECT user_id INTO v_user_id
    FROM public.roadmaps
    WHERE id = NEW.roadmap_id;

    IF v_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    UPDATE public.user_profiles
    SET xp = xp + 20,
        level = public.xp_to_level(xp + 20)
    WHERE user_id = v_user_id
    RETURNING xp INTO v_new_xp;

    SELECT COUNT(*) INTO v_completed_count
    FROM public.milestones m
    JOIN public.roadmaps r ON r.id = m.roadmap_id
    WHERE r.user_id = v_user_id AND m.status = 'completed';

    IF v_completed_count = 1 THEN
      INSERT INTO public.achievements (user_id, name, description, badge_icon, tier, milestone_id)
      VALUES (v_user_id, 'First Steps', 'Completed your first milestone', 'sparkles', 'bronze', NEW.id)
      ON CONFLICT (user_id, name) DO NOTHING;

    ELSIF v_completed_count = 5 THEN
      INSERT INTO public.achievements (user_id, name, description, badge_icon, tier, milestone_id)
      VALUES (v_user_id, 'Milestone Master', 'Completed 5 milestones', 'award', 'silver', NEW.id)
      ON CONFLICT (user_id, name) DO NOTHING;

    ELSIF v_completed_count = 10 THEN
      INSERT INTO public.achievements (user_id, name, description, badge_icon, tier, milestone_id)
      VALUES (v_user_id, 'Roadmap Champion', 'Completed 10 milestones', 'trophy', 'gold', NEW.id)
      ON CONFLICT (user_id, name) DO NOTHING;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_award_milestone_achievements ON public.milestones;
CREATE TRIGGER trigger_award_milestone_achievements
  AFTER UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.award_milestone_achievements();