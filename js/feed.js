import { supabase } from "./supabaseClient.js";
import { wireProgressiveImages } from "./progressiveImages.js";

const feed = document.getElementById("feed");
const shareBtn = document.getElementById("shareBtn");

shareBtn?.addEventListener("click", async () => {
  const url = window.location.href;
  const title = "Rathiri Rowdies (RR)";
  const text = "Check out RR blog posts.";

  if (navigator.share) {
    try { await navigator.share({ title, text, url }); } catch(_) {}
  } else {
    await navigator.clipboard.writeText(url);
    alert("Link copied!");
  }
});

async function loadFeed() {
  feed.innerHTML = `<div class="card">Loading…</div>`;

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,created_at,image_thumb_path,image_full_path,font_color,profiles:author_id(display_name)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    feed.innerHTML = `<div class="card">Failed to load posts.</div>`;
    return;
  }

  feed.innerHTML = data.map(p => {
    const author = p.profiles?.display_name || "RR Member";
    const created = new Date(p.created_at).toLocaleString();

    const thumb = p.image_thumb_path ? p.image_thumb_path : "";
    const full  = p.image_full_path ? p.image_full_path : "";

    const imgBlock = (thumb && full)
      ? `<div class="imgwrap" data-thumb="${thumb}" data-full="${full}" data-alt="${p.title}"></div>`
      : "";

    return `
      <div class="card">
        <div class="meta">${author} • ${created}</div>
        <h2 class="title"><a href="/post.html?id=${p.id}">${escapeHtml(p.title)}</a></h2>
        ${imgBlock}
      </div>
    `;
  }).join("");

  wireProgressiveImages();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

loadFeed();
