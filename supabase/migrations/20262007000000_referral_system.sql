-- Referral System Migration
-- Created: 2026-02-20
-- Purpose: Track referrals, credits, and commissions

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  credits_earned INTEGER NOT NULL DEFAULT 0,
  referrer_credit INTEGER NOT NULL DEFAULT 10, -- Credits for referrer
  referee_credit INTEGER NOT NULL DEFAULT 10, -- Credits for referee
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referrer_id, referral_code)
);

-- Create referral_credits table for tracking credit usage
CREATE TABLE IF NOT EXISTS referral_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Can be positive (earned) or negative (used)
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_credits_user_id ON referral_credits(user_id);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = code) INTO exists;
    IF NOT EXISTS THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create function to create referral for new user
CREATE OR REPLACE FUNCTION create_referral_if_code_exists()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  existing_user RECORD;
BEGIN
  -- Check if referral code was provided in user metadata
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    -- Find the referral by code
    SELECT * INTO referral_record
    FROM referrals
    WHERE referral_code = (NEW.raw_user_meta_data->>'referral_code')
      AND status = 'pending';

    IF FOUND THEN
      -- Update the referral with the new user
      UPDATE referrals
      SET referee_id = NEW.id,
          status = 'completed',
          completed_at = NOW()
      WHERE id = referral_record.id;

      -- Credit referrer
      INSERT INTO referral_credits (user_id, referral_id, amount, description)
      VALUES (
        referral_record.referrer_id,
        referral_record.id,
        referral_record.referrer_credit,
        'Referral bonus for referring a new user'
      );

      -- Credit referee
      INSERT INTO referral_credits (user_id, referral_id, amount, description)
      VALUES (
        NEW.id,
        referral_record.id,
        referral_record.referee_credit,
        'Referral bonus for signing up with a referral code'
      );

      -- Update credits_earned in referrals
      UPDATE referrals
      SET credits_earned = referral_record.referrer_credit + referral_record.referee_credit
      WHERE id = referral_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
CREATE TRIGGER check_referral_on_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_referral_if_code_exists();

-- Create function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(user_id UUID)
RETURNS TABLE (
  total_referrals INTEGER,
  completed_referrals INTEGER,
  pending_referrals INTEGER,
  total_credits INTEGER,
  available_credits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_id) AS total_referrals,
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_id AND status = 'completed') AS completed_referrals,
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = user_id AND status = 'pending') AS pending_referrals,
    (SELECT COALESCE(SUM(amount), 0) FROM referral_credits WHERE user_id = user_id AND amount > 0) AS total_credits,
    (SELECT COALESCE(SUM(amount), 0) FROM referral_credits WHERE user_id = user_id) AS available_credits;
END;
$$ LANGUAGE plpgsql;

-- Create function to apply credits to subscription
CREATE OR REPLACE FUNCTION apply_referral_credits_to_subscription(user_id UUID, discount_amount NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current credit balance
  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM referral_credits
  WHERE user_id = user_id;

  -- Check if user has enough credits
  IF current_balance >= discount_amount THEN
    -- Deduct credits
    INSERT INTO referral_credits (user_id, amount, description)
    VALUES (
      user_id,
      -discount_amount::INTEGER,
      'Applied $' || discount_amount::TEXT || ' credit to subscription'
    );
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  total_referrals INTEGER,
  completed_referrals INTEGER,
  total_credits INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) AS total_referrals,
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id AND status = 'completed') AS completed_referrals,
    (SELECT COALESCE(SUM(amount), 0) FROM referral_credits WHERE user_id = u.id AND amount > 0) AS total_credits
  FROM users u
  WHERE EXISTS (SELECT 1 FROM referrals WHERE referrer_id = u.id)
  ORDER BY completed_referrals DESC, total_credits DESC
  LIMIT limit;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
ON referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create their own referral code"
ON referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
ON referrals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND subscription_tier = 'enterprise'
  )
);

-- RLS policies for referral_credits
CREATE POLICY "Users can view their own credits"
ON referral_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert credits (for refunds)"
ON referral_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id AND amount < 0);

CREATE POLICY "Admins can manage all credits"
ON referral_credits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND subscription_tier = 'enterprise'
  )
);

-- Add referral_code column to users table (optional: pre-generated code)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Create unique referral codes for existing users
DO $$
DECLARE
  user_record RECORD;
  new_code TEXT;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE referral_code IS NULL LOOP
    new_code := generate_referral_code();
    UPDATE users SET referral_code = new_code WHERE id = user_record.id;
  END LOOP;
END $$;

-- Create unique index on users.referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Add a comment
COMMENT ON TABLE referrals IS 'Tracks user referrals and credit rewards';
COMMENT ON TABLE referral_credits IS 'Tracks credit transactions for referrals';
COMMENT ON FUNCTION generate_referral_code() IS 'Generates unique 8-character referral codes';
COMMENT ON FUNCTION get_referral_stats(user_id UUID) IS 'Returns referral statistics for a user';
COMMENT ON FUNCTION apply_referral_credits_to_subscription(user_id UUID, discount_amount NUMERIC) IS 'Applies referral credits as a discount to subscription';
COMMENT ON FUNCTION get_referral_leaderboard(limit INTEGER) IS 'Returns top referrers for leaderboard display';
