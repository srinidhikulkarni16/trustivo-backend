import supabase from "../config/supabase.js";

/*Get basic user info for dashboard header*/
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single(); 

    if (error || !data) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(data); // returns { name: "User Name" }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/*Get all documents for logged-in user*/
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data); // returns array of documents

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};