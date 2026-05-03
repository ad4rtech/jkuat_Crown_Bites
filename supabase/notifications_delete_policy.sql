-- Fix for deleting individual notifications
-- This policy allows authenticated users to delete notifications from the table.

CREATE POLICY "Allow delete for all" 
ON public.notifications 
FOR DELETE 
USING (true);
