import { supabase } from "./supabaseClient.js";
import { requireAdmin } from "./auth.js";

const allPosts = document.getElementById("allPosts");

async function load() {
  const admin = await requireAdmin();
  if (!admin) return;

  allPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published,profiles:author_id(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    allPosts.innerHTML = `<div class="card">Failed.</div>`;
    return;
  }

  allPosts.innerHTML = data.map(p => `
    <div class="card">
      <div class="meta">${p.profiles?.email || "user"} • ${new Date(p.created_at).toLocaleString()}</div>
      <div class="title" style="font-size:18px;">${escapeHtml(p.title)}</div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn" data-toggle="${p.id}">
          ${p.is_published ? "Unpublish" : "Publish"}
        </button>
        <button class="btn" data-del="${p.id}">Delete</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-toggle"));
      const row = data.find(x => x.id === id);
      const { error } = await supabase.from("posts").update({ is_published: !row.is_published }).eq("id", id);
      if (!error) load();
    });
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del"));
      if (!confirm("Delete this post?")) return;
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (!error) load();
    });
  });
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

load();
