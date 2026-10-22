import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Проверяет, что рутина принадлежит текущему пользователю.
 *
 * политики RLS на routine_items и routine_photos сравнивают user_id самой
 * строки, а не владельца рутины, поэтому routine_id из клиентской формы
 * проверяется здесь: иначе запись можно прикрепить к чужой рутине.
 * SELECT по routines виден только владельцу, так что достаточно запроса
 * под тем же anon-клиентом.
 */
export const routineOwnedByCurrentUser = async (
  supabase: SupabaseClient,
  routineId: string,
): Promise<boolean> => {
  const { data } = await supabase
    .from("routines")
    .select("id")
    .eq("id", routineId)
    .maybeSingle();

  return data !== null;
};
