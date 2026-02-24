import supabase from "../config/supabase.js";

export const createDocument = async ({
  ownerId,
  title,
  filePath,
}) => {
  const { data, error } = await supabase
    .from("documents")
    .insert([
      {
        owner_id: ownerId,
        title: title,
        file_path: filePath,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
};