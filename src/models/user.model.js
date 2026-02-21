import supabase from "../config/supabase.js";

export const findUserByEmail=async(email)=>{
  const {data, error}=await supabase 
  .from("users")
  .select("*")
  .eq("email", email)
  .single();

  if (error) return null;
  return data;
};

export const CreateUser=async(userData)=>{
  const {data, error}=await supabase 
  .from("users")
  .insert([userData])
  .select()
  .single();

  if (error) throw error;
  return data;
};
