import supabase from "../config/supabase.js";

export const checkPublicToken = async (req, res, next) => {
  const { token } = req.params;

  const { data, error } = await supabase
    .from("public_sign_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !data) {
    return res.status(404).json({
      message: "Invalid signing link",
    });
  }

  if (new Date() > new Date(data.expires_at)) {
    return res.status(403).json({
      message: "Signing link expired",
    });
  }

  req.signToken = data;
  next();
};