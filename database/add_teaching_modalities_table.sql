-- Create teaching_modalities table
CREATE TABLE IF NOT EXISTS teaching_modalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and insert policy
ALTER TABLE teaching_modalities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access for authenticated users" ON teaching_modalities;
CREATE POLICY "Full access for authenticated users" ON teaching_modalities FOR ALL USING (auth.role() = 'authenticated');

-- Populate initial data if not already exists
INSERT INTO teaching_modalities (name) VALUES 
('Integral 9h'),
('Integral 7h'),
('Parcial'),
('EJA')
ON CONFLICT (name) DO NOTHING;
