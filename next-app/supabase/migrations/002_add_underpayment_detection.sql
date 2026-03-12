-- Add underpayment detections table
CREATE TABLE public.underpayment_detections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  claim_id UUID REFERENCES public.claims(id),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  carrier_estimate_path TEXT NOT NULL,
  contractor_estimate_path TEXT,
  policy_path TEXT,
  photo_paths TEXT[],
  detection_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.underpayment_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own detections" 
  ON public.underpayment_detections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own detections" 
  ON public.underpayment_detections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_underpayment_detections_user_id ON public.underpayment_detections(user_id);
CREATE INDEX idx_underpayment_detections_claim_id ON public.underpayment_detections(claim_id);
