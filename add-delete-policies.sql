-- Add DELETE policies for all tables to fix cleanup operations

-- Add DELETE policy for emails table
CREATE POLICY "Enable delete access for all users" ON emails FOR DELETE USING (true);

-- Add DELETE policy for ledger table  
CREATE POLICY "Enable delete access for all users" ON ledger FOR DELETE USING (true);

-- Add DELETE policy for uploaded table
CREATE POLICY "Enable delete access for all users" ON uploaded FOR DELETE USING (true);
