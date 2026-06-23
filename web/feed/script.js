/* script.js — viewer page logic */

const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

const FETCH_TIMEOUT_MS = 9000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function fetchFeedXML(url) {
  let lastErr;
  for (const buildProxyUrl of PROXIES) {
    try {
      const res = await withTimeout(fetch(buildProxyUrl(url)), FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error("bad status " + res.status);
      const text = await res.text();
      if (!text || text.trim().length < 20) throw new Error("empty body");
      return text;
    } catch (err) {
      lastErr = err;
      continue;
    }
  }
  throw lastErr || new Error("all proxies failed");
}

function firstImageFromHTML(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function textOf(el) {
  return el ? el.textContent.trim() : "";
}

function parseFeed(xmlText, sourceName) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("parse error");

  const items = [];
  const isAtom = doc.querySelector("feed") !== null;

  if (isAtom) {
    doc.querySelectorAll("entry").forEach(entry => {
      const linkEl = entry.querySelector("link[rel='alternate']") || entry.querySelector("link");
      const link = linkEl ? linkEl.getAttribute("href") : "#";
      const summary = textOf(entry.querySelector("summary")) || textOf(entry.querySelector("content"));
      const mediaThumb = entry.querySelector("media\\:thumbnail, thumbnail");
      let image = mediaThumb ? mediaThumb.getAttribute("url") : null;
      if (!image) image = firstImageFromHTML(textOf(entry.querySelector("content")));
      items.push({
        title: textOf(entry.querySelector("title")) || "(untitled)",
        link,
        date: textOf(entry.querySelector("updated")) || textOf(entry.querySelector("published")),
        description: summary.replace(/<[^>]+>/g, " ").trim(),
        image,
        source: sourceName
      });
    });
  } else {
    doc.querySelectorAll("item").forEach(item => {
      const enclosure = item.querySelector("enclosure[type^='image']") || item.querySelector("enclosure");
      const mediaContent = item.querySelector("media\\:content, content");
      const mediaThumb = item.querySelector("media\\:thumbnail, thumbnail");
      let image = null;
      if (enclosure && enclosure.getAttribute("type") && enclosure.getAttribute("type").startsWith("image")) {
        image = enclosure.getAttribute("url");
      } else if (mediaThumb) {
        image = mediaThumb.getAttribute("url");
      } else if (mediaContent && (mediaContent.getAttribute("medium") === "image" || (mediaContent.getAttribute("type") || "").startsWith("image"))) {
        image = mediaContent.getAttribute("url");
      }
      const rawDesc = textOf(item.querySelector("description")) || textOf(item.getElementsByTagName("content:encoded")[0]);
      if (!image) image = firstImageFromHTML(rawDesc);
      items.push({
        title: textOf(item.querySelector("title")) || "(untitled)",
        link: textOf(item.querySelector("link")) || "#",
        date: textOf(item.querySelector("pubDate")) || textOf(item.querySelector("date")),
        description: rawDesc.replace(/<[^>]+>/g, " ").trim(),
        image,
        source: sourceName
      });
    });
  }
  return items;
}

function formatDate(d) {
  if (!d) return "";
  const parsed = new Date(d);
  if (isNaN(parsed)) return d;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHTML(str) {
  return (str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderCard(item) {
  const imgHTML = item.image
    ? `<img class="card-img" src="${escapeHTML(item.image)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=&quot;card-img placeholder&quot;>📰</div>'">`
    : `<div class="card-img placeholder">📰</div>`;
  return `
    <div class="card">
      ${imgHTML}
      <div class="card-body">
        <div class="card-source">${escapeHTML(item.source)}</div>
        <h3 class="card-title"><a href="${escapeHTML(item.link)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
        <p class="card-desc">${escapeHTML(item.description)}</p>
        <div class="card-date">${formatDate(item.date)}</div>
      </div>
    </div>`;
}

let allItemsByCategory = {};
let activeTab = "All";

function renderTabs(categories) {
  const tabs = document.getElementById("tabs");
  const names = ["All", ...categories];
  tabs.innerHTML = names.map(name =>
    `<button class="tab ${name === activeTab ? "active" : ""}" data-cat="${escapeHTML(name)}">${escapeHTML(name)}</button>`
  ).join("");
  tabs.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.cat;
      renderTabs(categories);
      renderContent();
    });
  });
}

function renderContent() {
  const content = document.getElementById("content");
  let items;
  if (activeTab === "All") {
    items = Object.values(allItemsByCategory).flat();
  } else {
    items = allItemsByCategory[activeTab] || [];
  }
  if (items.length === 0) {
    content.innerHTML = `<div class="empty-state">No items yet. Try “Manage feeds” to add a category or feed.</div>`;
    return;
  }
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  content.innerHTML = `<div class="feed-grid">${items.map(renderCard).join("")}</div>`;
}

async function loadAllFeeds() {
  const config = getFeedConfig();
  const categories = Object.keys(config);

  if (categories.length === 0) {
    document.getElementById("content").innerHTML =
      `<div class="empty-state">No feeds configured. Head to “Manage feeds” to add one.</div>`;
    return;
  }

  renderTabs(categories);
  allItemsByCategory = {};
  categories.forEach(c => allItemsByCategory[c] = []);
  renderContent();

  const tasks = [];
  categories.forEach(cat => {
    config[cat].forEach(feed => {
      tasks.push(
        fetchFeedXML(feed.url)
          .then(xml => {
            allItemsByCategory[cat].push(...parseFeed(xml, feed.name));
            renderContent();
          })
          .catch(err => console.warn(`Feed failed: ${feed.name} (${feed.url})`, err.message))
      );
    });
  });

  await Promise.allSettled(tasks);
  renderContent();
}

loadAllFeeds();
