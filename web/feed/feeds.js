/* feeds.js — single source of truth for categories + feed URLs.
   To add a whole new preset category, just add a key below. */

const PRESET_FEEDS = {
  Technology: [
    {
      name: "Ars Technica",
      url: "https://feeds.arstechnica.com/arstechnica/index",
    },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "Wired", url: "https://www.wired.com/feed/rss" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
    {
      name: "MIT Technology Review",
      url: "https://www.technologyreview.com/feed/",
    },
    { name: "VentureBeat", url: "https://venturebeat.com/feed/" },
    { name: "Hacker News", url: "https://hnrss.org/frontpage" },
    { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
    { name: "Anthropic", url: "https://www.anthropic.com/news/rss.xml" },
    { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
    { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
    { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml" },
    {
      name: "Towards Data Science",
      url: "https://towardsdatascience.com/feed",
    },
    {
      name: "Machine Learning Mastery",
      url: "https://machinelearningmastery.com/feed/",
    },
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
    { name: "Schneier on Security", url: "https://www.schneier.com/feed/" },
    {
      name: "The Hacker News",
      url: "https://feeds.feedburner.com/TheHackersNews",
    },
    { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
    { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
    {
      name: "SANS Internet Storm Center",
      url: "https://isc.sans.edu/rssfeed.xml",
    },
    {
      name: "CISA Alerts",
      url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    },
  ],

  Cybersecurity: [
    { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
    { name: "Schneier on Security", url: "https://www.schneier.com/feed/" },
    {
      name: "The Hacker News",
      url: "https://feeds.feedburner.com/TheHackersNews",
    },
    { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
    { name: "Dark Reading", url: "https://www.darkreading.com/rss.xml" },
    {
      name: "SANS Internet Storm Center",
      url: "https://isc.sans.edu/rssfeed.xml",
    },
    {
      name: "CISA Alerts",
      url: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    },
  ],

  AI: [
    { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
    { name: "Anthropic", url: "https://www.anthropic.com/news/rss.xml" },
    { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
    { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
    { name: "BAIR Blog", url: "https://bair.berkeley.edu/blog/feed.xml" },
    {
      name: "Towards Data Science",
      url: "https://towardsdatascience.com/feed",
    },
    {
      name: "Machine Learning Mastery",
      url: "https://machinelearningmastery.com/feed/",
    },
  ],

  Literature: [
    { name: "Literary Hub", url: "https://lithub.com/feed/" },
    {
      name: "The Paris Review",
      url: "https://www.theparisreview.org/blog/feed/",
    },
    { name: "London Review of Books", url: "https://www.lrb.co.uk/blog/rss" },
    { name: "Poetry Foundation", url: "https://www.poetryfoundation.org/rss" },
    {
      name: "The New Yorker Books",
      url: "https://www.newyorker.com/feed/books",
    },
    { name: "Book Riot", url: "https://bookriot.com/feed/" },
  ],

  Cooking: [
    { name: "Serious Eats", url: "https://www.seriouseats.com/rss" },
    { name: "Food52", url: "https://food52.com/blog/feed" },
    { name: "Smitten Kitchen", url: "https://smittenkitchen.com/feed/" },
    { name: "Simply Recipes", url: "https://www.simplyrecipes.com/feed" },
    {
      name: "King Arthur Baking",
      url: "https://www.kingarthurbaking.com/blog/feed",
    },
    { name: "The Kitchn", url: "https://www.thekitchn.com/rss" },
  ],

  General: [
    {
      name: "Reuters World",
      url: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best",
    },
    {
      name: "Reuters Business",
      url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
    },
    {
      name: "Associated Press",
      url: "https://feeds.apnews.com/rss/apf-topnews",
    },
    { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "NPR News", url: "https://feeds.npr.org/1001/rss.xml" },
    {
      name: "The Economist",
      url: "https://www.economist.com/the-world-this-week/rss.xml",
    },
  ],
};

const LS_KEYS = {
  custom: "rss_customFeeds", // { category: [{name,url}] }
  deletedFeeds: "rss_deletedFeeds", // ["category::url", ...]  (hidden preset feeds)
  deletedCats: "rss_deletedCats", // ["category", ...]        (hidden preset categories)
};

function _read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function _write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* Returns the merged, live view: { category: [{name,url,preset}] } */
function getFeedConfig() {
  const custom = _read(LS_KEYS.custom, {});
  const deletedFeeds = _read(LS_KEYS.deletedFeeds, []);
  const deletedCats = _read(LS_KEYS.deletedCats, []);
  const merged = {};

  Object.keys(PRESET_FEEDS).forEach((cat) => {
    if (deletedCats.includes(cat)) return;
    const feeds = PRESET_FEEDS[cat]
      .filter((f) => !deletedFeeds.includes(cat + "::" + f.url))
      .map((f) => ({ ...f, preset: true }));
    merged[cat] = feeds;
  });

  Object.keys(custom).forEach((cat) => {
    if (!merged[cat]) merged[cat] = [];
    merged[cat] = merged[cat].concat(
      custom[cat].map((f) => ({ ...f, preset: false })),
    );
  });

  return merged;
}

function getCategoryNames() {
  return Object.keys(getFeedConfig());
}

function addCategory(name) {
  name = name.trim();
  if (!name) return;
  const custom = _read(LS_KEYS.custom, {});
  if (!custom[name]) custom[name] = [];
  _write(LS_KEYS.custom, custom);
  // un-delete if it was a removed preset category with the same name
  const deletedCats = _read(LS_KEYS.deletedCats, []).filter((c) => c !== name);
  _write(LS_KEYS.deletedCats, deletedCats);
}

function deleteCategory(name) {
  if (PRESET_FEEDS[name]) {
    const deletedCats = _read(LS_KEYS.deletedCats, []);
    if (!deletedCats.includes(name)) deletedCats.push(name);
    _write(LS_KEYS.deletedCats, deletedCats);
  }
  const custom = _read(LS_KEYS.custom, {});
  delete custom[name];
  _write(LS_KEYS.custom, custom);
}

function addFeed(category, name, url) {
  category = category.trim();
  name = name.trim();
  url = url.trim();
  if (!category || !name || !url) return;
  const custom = _read(LS_KEYS.custom, {});
  if (!custom[category]) custom[category] = [];
  custom[category].push({ name, url });
  _write(LS_KEYS.custom, custom);
  // un-delete category if needed
  const deletedCats = _read(LS_KEYS.deletedCats, []).filter(
    (c) => c !== category,
  );
  _write(LS_KEYS.deletedCats, deletedCats);
}

function deleteFeed(category, url, isPreset) {
  if (isPreset) {
    const deletedFeeds = _read(LS_KEYS.deletedFeeds, []);
    const key = category + "::" + url;
    if (!deletedFeeds.includes(key)) deletedFeeds.push(key);
    _write(LS_KEYS.deletedFeeds, deletedFeeds);
  } else {
    const custom = _read(LS_KEYS.custom, {});
    if (custom[category]) {
      custom[category] = custom[category].filter((f) => f.url !== url);
      _write(LS_KEYS.custom, custom);
    }
  }
}

function resetAll() {
  localStorage.removeItem(LS_KEYS.custom);
  localStorage.removeItem(LS_KEYS.deletedFeeds);
  localStorage.removeItem(LS_KEYS.deletedCats);
}
