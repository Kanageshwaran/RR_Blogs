import { supabase } from "./supabaseClient.js";
import { requireAuth, getMyProfile, signOut } from "./auth.js";

const who = document.getElementById("who");
const myPosts = document.getElementById("myPosts");
const msg = document.getElementById("msg");

document.getElementById("logoutBtn").addEventListener("click", signOut);

async function load() {
  const session = await requireAuth();
  if (!session) return;

  const profile = await getMyProfile();
  who.textContent = profile ? `Signed in as ${profile.email}` : "Signed in";
  if (profile?.role === "admin") document.getElementById("adminLink").style.display = "inline";

  await loadMyPosts(session.user.id);
}

async function loadMyPosts(uid) {
  myPosts.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,is_published")
    .eq("author_id", uid)
    .order("created_at", { ascending: false });

  if (error) {
    myPosts.innerHTML = `<div class="card">Failed.</div>`;
    return;
  }

  myPosts.innerHTML = data.map(p => `
    <div class="card">
      <div class="meta">${new Date(p.created_at).toLocaleString()} • ${p.is_published ? "published" : "draft"}</div>
      <div class="title" style="font-size:18px;">
        <a href="/post.html?id=${p.id}">${escapeHtml(p.title)}</a>
      </div>
    </div>
  `).join("") || `<div class="card">No posts yet.</div>`;
}

document.getElementById("publishBtn").addEventListener("click", async () => {
  msg.textContent = "Publishing…";

  const session = await requireAuth();
  if (!session) return;

  const title = document.getElementById("title").value.trim();
  const body = document.getElementById("body").value.trim();
  const color = document.getElementById("color").value;

  if (!title || !body) {
    msg.textContent = "Title and body required.";
    return;
  }

  const { error } = await supabase.from("posts").insert({
    author_id: session.user.id,
    title,
    body,
    font_color: color,
    font_family: "Raleway",
    is_published: true
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Published.";
  document.getElementById("title").value = "";
  document.getElementById("body").value = "";
  await loadMyPosts(session.user.id);
});

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

load();
