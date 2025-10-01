-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_email ON support_messages(user_email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_support_messages_updated_at 
    BEFORE UPDATE ON support_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust based on your Supabase setup)
-- ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting messages (public access for form submissions)
-- CREATE POLICY "Allow public to insert support messages" ON support_messages
--     FOR INSERT WITH CHECK (true);

-- Create policy for admin access (adjust based on your admin setup)
-- CREATE POLICY "Allow admin to view all support messages" ON support_messages
--     FOR ALL USING (auth.role() = 'admin');
