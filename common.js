(function () {
  const SHOP = "https://alpha-store.clients.site";
  const TG = "https://t.me/ALPHASTORE_RU";
  const BRANDS = { HUAWEI: "Huawei" };
  const BRAND_RE = /^(Apple|Samsung|Google|Xiaomi|HUAWEI|Honor|OnePlus|Nubia|Nothing|Dyson)\s+/;

  const fmt = n => n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₽";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const memLabel = m => m >= 1024 ? (m / 1024) + " ТБ" : m + " ГБ";

  const TR = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"iu",я:"ia" };
  const slug = s => s.toLowerCase().split("").map(c => TR[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const items = window.ALPHA_RAW.trim().split("\n").map(l => {
    const [id, name, price, cat, img, color, w] = l.split("|");
    const mm = name.match(/(\d+)\s*ГБ/);
    const sim = /Только eSIM/i.test(name) ? "Только eSIM" : /2 SIM/.test(name) ? "2 SIM" : /SIM \+ eSIM/.test(name) ? "SIM + eSIM" : "";
    const model = name.replace(/\s*\d+\s*ГБ.*$/, "").replace(/\s*(Только eSIM|SIM \+ eSIM|2 SIM)\s*$/i, "").trim();
    const bw = model.split(" ")[0];
    return { id, name, model, mem: mm ? +mm[1] : null, sim, price: +price, cat, img, color, warranty: +w || 0, brand: BRANDS[bw] || bw };
  });

  const groups = [], byModel = {}, bySlug = {};
  items.forEach((it, i) => {
    let g = byModel[it.model];
    if (!g) { g = byModel[it.model] = { model: it.model, brand: it.brand, cat: it.cat, items: [], order: i, img: "", slug: slug(it.model) }; groups.push(g); bySlug[g.slug] = g; }
    g.items.push(it); if (!g.img && it.img) g.img = it.img;
  });
  groups.forEach(g => {
    g.min = Math.min(...g.items.map(i => i.price));
    g.mems = [...new Set(g.items.map(i => i.mem).filter(Boolean))].sort((a, b) => a - b);
    g.short = g.model.replace(BRAND_RE, "");
  });

  const COLORS = {
    "Silver":"#dfe1e4","Navy":"#2f3b57","Starlight":"#ebe5d9","White":"#f1f1ef","Cosmic Orange":"#e0712f","Black":"#2b2c2f",
    "Black Titanium":"#3b3b3e","Green":"#c4d3bd","Blue":"#a7b9cf","Jetblack":"#1f2023","Obsidian":"#2c2d30","Ultramarine":"#5b6dd6",
    "Moonstone":"#8f98a5","Deep Blue":"#2f3e5e","Sage":"#aab59c","Pink":"#f0cbd2","Teal":"#86b8b0","Gray":"#8b8e93",
    "Lavender":"#cbc2e3","Midnight":"#24272d","Porcelain":"#ece8e0","White Titanium":"#e5e2db","Yellow":"#e3b23c"
  };
  const RU = { "Silver":"серебристый","Navy":"тёмно-синий","Starlight":"сияющая звезда","White":"белый","Cosmic Orange":"оранжевый","Black":"чёрный","Black Titanium":"чёрный титан","Green":"зелёный","Blue":"синий","Jetblack":"чёрный","Obsidian":"обсидиан","Ultramarine":"ультрамарин","Moonstone":"лунный камень","Deep Blue":"тёмно-синий","Sage":"шалфей","Pink":"розовый","Teal":"бирюзовый","Gray":"серый","Lavender":"лавандовый","Midnight":"тёмная ночь","Porcelain":"фарфоровый","White Titanium":"белый титан","Yellow":"жёлтый" };
  const colorHex = c => COLORS[c] || "#4a4d52";

  function shade(hex, a) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a)));
    return "#" + [f(r), f(g), f(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  function layout(model, cat) {
    const m = model.toLowerCase();
    if (cat === "v") return "vac";
    if (/fold|magic v/.test(m)) return "fold";
    if (/pixel/.test(m)) return "bar";
    if (/iphone 17 pro/.test(m)) return "plateau";
    if (/iphone 1[3-6] pro|iphone 11/.test(m)) return /iphone 11/.test(m) ? "sq2" : "sq3";
    if (/iphone 16e/.test(m)) return "one";
    if (/iphone 16|iphone 17/.test(m)) return "pill";
    if (/iphone/.test(m)) return "diag";
    if (/ultra|s2\d|a5\d|fe/.test(m) && /galaxy/.test(m)) return /ultra/.test(m) ? "ultra" : "vert3";
    if (/honor|huawei|xiaomi 15(?! ?t)|xiaomi 15$/.test(m)) return "circle";
    if (/nothing/.test(m)) return "nothing";
    return "sq3";
  }
  let uid = 0;
  function lens(x, y, r, id) {
    return `<circle cx="${x}" cy="${y}" r="${r + 2.5}" fill="url(#rg${id})"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#gl${id})"/><circle cx="${x - r * .32}" cy="${y - r * .36}" r="${r * .2}" fill="rgba(255,255,255,.3)"/>`;
  }
  function device(model, cat, color) {
    const id = ++uid, c = colorHex(color), lt = shade(c, .28), dk = shade(c, -.28), ed = shade(c, -.14);
    const type = layout(model, cat);
    if (type === "vac") {
      return `<svg viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
        <defs><linearGradient id="vb${id}" x1="0" x2="1"><stop offset="0" stop-color="${lt}"/><stop offset="1" stop-color="${dk}"/></linearGradient></defs>
        <rect x="88" y="120" width="14" height="230" rx="5" fill="#9aa0a7"/>
        <rect x="70" y="40" width="70" height="100" rx="26" fill="url(#vb${id})"/>
        <rect x="80" y="54" width="34" height="62" rx="14" fill="rgba(255,255,255,.35)" stroke="${dk}" stroke-width="2"/>
        <path d="M128 60c26 0 32 24 22 46" fill="none" stroke="#3b3e43" stroke-width="10" stroke-linecap="round"/>
        <rect x="46" y="346" width="98" height="26" rx="10" fill="#3b3e43"/><rect x="52" y="352" width="86" height="6" rx="3" fill="${c}"/>
      </svg>`;
    }
    const W = type === "fold" ? 260 : 200, H = 410;
    let cam = "";
    if (type === "plateau") cam = `<rect x="12" y="14" width="${W - 24}" height="104" rx="30" fill="url(#pl${id})"/>${lens(46, 44, 16, id)}${lens(46, 88, 16, id)}${lens(88, 66, 16, id)}<circle cx="${W - 46}" cy="46" r="7" fill="#f3eedf" opacity=".9"/>`;
    else if (type === "sq3") cam = `<rect x="16" y="16" width="100" height="104" rx="26" fill="url(#pl${id})"/>${lens(42, 44, 15, id)}${lens(42, 92, 15, id)}${lens(88, 68, 15, id)}<circle cx="94" cy="34" r="6" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "sq2") cam = `<rect x="16" y="16" width="96" height="96" rx="26" fill="url(#pl${id})"/>${lens(42, 42, 15, id)}${lens(42, 86, 15, id)}<circle cx="86" cy="42" r="6" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "pill") cam = `<rect x="18" y="18" width="52" height="100" rx="26" fill="url(#pl${id})"/>${lens(44, 44, 15, id)}${lens(44, 92, 15, id)}<circle cx="84" cy="44" r="5" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "diag") cam = `<rect x="16" y="16" width="92" height="92" rx="24" fill="url(#pl${id})"/>${lens(40, 40, 14, id)}${lens(84, 84, 14, id)}<circle cx="84" cy="40" r="5" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "one") cam = `${lens(42, 42, 17, id)}<circle cx="74" cy="34" r="5" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "ultra") cam = `${lens(40, 40, 14, id)}${lens(40, 82, 14, id)}${lens(40, 124, 14, id)}${lens(78, 60, 10, id)}${lens(78, 96, 10, id)}`;
    else if (type === "vert3") cam = `${lens(40, 40, 14, id)}${lens(40, 82, 14, id)}${lens(40, 124, 14, id)}<circle cx="70" cy="40" r="5" fill="#f3eedf" opacity=".85"/>`;
    else if (type === "fold") cam = `<line x1="${W / 2}" y1="6" x2="${W / 2}" y2="${H - 6}" stroke="rgba(0,0,0,.18)" stroke-width="2"/><rect x="${W / 2 + 16}" y="18" width="52" height="128" rx="26" fill="url(#pl${id})"/>${lens(W / 2 + 42, 44, 14, id)}${lens(W / 2 + 42, 82, 14, id)}${lens(W / 2 + 42, 120, 14, id)}`;
    else if (type === "bar") cam = `<rect x="6" y="40" width="${W - 12}" height="56" rx="28" fill="url(#pl${id})"/>${lens(50, 68, 15, id)}${lens(90, 68, 15, id)}${lens(130, 68, 13, id)}`;
    else if (type === "circle") cam = `<circle cx="${W / 2}" cy="92" r="64" fill="url(#pl${id})"/>${lens(W / 2 - 24, 70, 16, id)}${lens(W / 2 + 24, 70, 16, id)}${lens(W / 2, 114, 16, id)}`;
    else if (type === "nothing") cam = `<rect x="16" y="16" width="100" height="70" rx="24" fill="url(#pl${id})"/>${lens(46, 50, 14, id)}${lens(86, 50, 14, id)}<path d="M150 40v80M160 220a40 40 0 1 1-80 0" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="bd${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${lt}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${dk}"/></linearGradient>
        <linearGradient id="pl${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${shade(c, .14)}"/><stop offset="1" stop-color="${shade(c, -.2)}"/></linearGradient>
        <radialGradient id="gl${id}" cx=".4" cy=".35"><stop offset="0" stop-color="#3b4157"/><stop offset=".6" stop-color="#12141c"/><stop offset="1" stop-color="#06070a"/></radialGradient>
        <linearGradient id="rg${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${shade(c, .45)}"/><stop offset="1" stop-color="${shade(c, -.4)}"/></linearGradient>
      </defs>
      <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="36" fill="${ed}"/>
      <rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="33" fill="url(#bd${id})"/>
      ${cam}
    </svg>`;
  }

  const photo = (img, size) => `https://avatars.mds.yandex.net/get-sprav-products/${img}/${size || "XXL"}`;
  const productPage = (g, it) => `product.html?m=${g.slug}` + (it ? `&v=${it.id}` : "");
  const shopUrl = it => `${SHOP}/service/${slug(it.name)}/TYCOON_${it.id}`;

  window.AS = { SHOP, TG, fmt, esc, plural, memLabel, slug, items, groups, byModel, bySlug, COLORS, RU, colorHex, device, photo, productPage, shopUrl };
})();
