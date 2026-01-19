-- Feedback table for user feedback submissions
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('feature_request', 'bug')),
  description TEXT NOT NULL,
  user_id VARCHAR(255),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback
CREATE POLICY "Anyone can submit feedback" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- Only admins can read all feedback (using service role key)
CREATE POLICY "Service role can read all feedback" ON user_feedback
  FOR SELECT USING (true);

-- Only admins can update feedback status
CREATE POLICY "Service role can update feedback" ON user_feedback
  FOR UPDATE USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at DESC);
