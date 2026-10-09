-- Lets a brand-new (still pending) player account see WHICH card it was linked to,
-- so the sign-up screen can say "Linked to your card: Maryem Houij".
-- Returns only that one card's name, number, position, category and club.
-- Run once in the Supabase SQL Editor. Safe to re-run.

CREATE OR REPLACE FUNCTION public.my_linked_card()
RETURNS TABLE (member_id bigint, name text, jersey_number text, card_position text, category text, club text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id, m.name, m.jersey_number::text, m."position"::text, m.category::text, m.club::text
  FROM profiles p JOIN members m ON m.id = p.member_id
  WHERE p.id = auth.uid() AND m.role = 'PLAYERS';
$$;

REVOKE ALL ON FUNCTION public.my_linked_card() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_linked_card() TO authenticated;
