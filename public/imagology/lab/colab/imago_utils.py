# -*- coding: utf-8 -*-
"""
imago_utils — библиотека блокнотов Colab курса «Имагология».

Те же словари и тот же алгоритм, что в стендах лаборатории (lab.js):
народы × признаки (цифровая Völkertafel), мотивы, места и маршруты, ключевые слова.
Словари скачиваются с сайта курса (data/lexicon.json, places.json, presets.json).

Блокноты скачивают этот файл в первой ячейке, поэтому исправления доходят до всех блокнотов после деплоя.
"""
import io
import json
import math
import re
import unicodedata
from collections import Counter, defaultdict

import requests

SITE = "https://pavelaleks.github.io/samarkand_lectures/imagology/lab/"
UA = {"User-Agent": "ImagologyCourse/1.0 (educational; samarkand_lectures)"}
LANG_NAMES = {"ru": "русский", "en": "английский", "fr": "французский", "de": "немецкий"}

_DATA = {}


def _data(name):
    if name not in _DATA:
        r = requests.get(SITE + "data/" + name + ".json", timeout=60, headers=UA)
        r.raise_for_status()
        _DATA[name] = r.json()
    return _DATA[name]


def use_local_data(lexicon=None, places=None, presets=None):
    """Для проверки без интернета: подставить словари из словарей Python."""
    if lexicon is not None:
        _DATA["lexicon"] = lexicon
    if places is not None:
        _DATA["places"] = places
    if presets is not None:
        _DATA["presets"] = presets


def setup(quiet=False):
    import pandas as pd
    import matplotlib
    matplotlib.rcParams["figure.dpi"] = 110
    pd.set_option("display.max_colwidth", 160)
    lx, pl, pr = _data("lexicon"), _data("places"), _data("presets")
    if not quiet:
        print(f"✓ Словари: {len(lx['groups'])} народов, {len(lx['traits'])} признаков, {len(lx['motifs'])} мотивов; "
              f"{len(pl['places'])} мест, {len(pl['routes'])} маршрутов; {len(pr['texts'])} текстов, {len(pr['pairs'])} пар.")
        print("  Готовые тексты: list_texts()   Готовые пары: list_pairs()")


# ───────────────────────── нормализация ─────────────────────────
_MAP = str.maketrans({"ё": "е", "ѣ": "е", "і": "и", "ї": "и", "ѵ": "и", "ѳ": "ф"})


def norm(s):
    s = str(s).lower().translate(_MAP)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not (unicodedata.combining(ch) and ch != "̆"))
    s = unicodedata.normalize("NFC", s)
    if len(s) > 1 and s.endswith("ъ"):
        s = s[:-1]
    return s


_WORD = re.compile(r"[^\W\d_][\w'’-]*", re.UNICODE)


def tokens(sentence):
    out = []
    for m in _WORD.finditer(sentence):
        raw = re.sub(r"[-'’]+$", "", m.group(0))
        if not raw or raw[0].isdigit():
            continue
        out.append({"raw": raw, "n": norm(raw.replace("’", "'")), "cap": raw[0].isupper(), "i": m.start()})
    return out


def detect_lang(text):
    sample = text[:60000]
    cyr = len(re.findall(r"[Ѐ-ӿ]", sample))
    lat = len(re.findall(r"[a-zA-ZÀ-ſ]", sample))
    if cyr > lat:
        return "ru"
    words = re.findall(r"\w+", sample.lower())
    S = {"en": {"the", "and", "of", "to", "which", "with", "was", "his"},
         "fr": {"le", "la", "les", "et", "des", "une", "que", "est", "dans"},
         "de": {"der", "die", "und", "das", "nicht", "ein", "ist", "mit", "sich"}}
    score = {k: sum(1 for w in words if w in v) for k, v in S.items()}
    return max(score, key=score.get)


_SPLIT = re.compile(r"(?<=[.!?…»\"])\s+(?=[A-ZА-ЯЁÀ-ÖØ-Þ«\"„—–-])|\n\s*\n+")


def split_sentences(text):
    clean = re.sub(r"[ \t ]+", " ", text.replace("\r", ""))
    out = []
    for p in _SPLIT.split(clean):
        p = (p or "").strip()
        if not p:
            continue
        if len(p) > 700:
            out.extend(l.strip() for l in p.split("\n") if l.strip())
        else:
            out.append(re.sub(r"\s*\n\s*", " / ", p))
    return out


# ───────────────────────── словари ─────────────────────────
def _matcher(items, lang):
    exact, prefixes = {}, []
    for it in items:
        f = it["forms"].get(lang)
        if not f:
            continue
        for x in f["x"]:
            exact[x] = it["id"]
        for p in f["p"]:
            prefixes.append((p, it["id"], f["no"]))
    prefixes.sort(key=lambda e: -len(e[0]))
    cache = {}

    def m(n):
        if n in cache:
            return cache[n]
        res = exact.get(n)
        if not res:
            for p, iid, no in prefixes:
                if n.startswith(p) and not any(n.startswith(x) for x in no):
                    res = iid
                    break
        cache[n] = res
        return res
    return m


def _place_matcher(places):
    exact, prefixes = {}, []
    for pl in places:
        for x in pl["x"]:
            exact[x] = pl["id"]
        for p in pl["p"]:
            prefixes.append((p, pl["id"]))
    prefixes.sort(key=lambda e: -len(e[0]))

    def m(n):
        if n in exact:
            return exact[n]
        for p, pid in prefixes:
            if n.startswith(p):
                return pid
        return None
    return m


def labels(kind):
    lx = _data("lexicon")
    return {it["id"]: it["label"] for it in lx[kind]}


# ───────────────────────── загрузка текстов ─────────────────────────
_STRIP = [".ws-noexport", ".noprint", "#headertemplate", ".headertemplate", ".header_template", "table.header", ".mw-editsection",
          ".reference", ".references", ".reflist", "style", "script", ".navbox", ".metadata", ".ws-summary", "#ws-data",
          ".mw-references-wrap", ".pagenum", ".ws-pagenum", ".licenseContainer", ".licence", ".sisitem", ".interproject", "div.PDFlink"]
_NS = re.compile(r"^(Special|Служебная|Файл|File|Категория|Category|Обсуждение|Talk|Участник|User|Шаблон|Template|Автор|Author|Auteur|"
                 r"Portal|Портал|Wikisource|Викитека|Help|Справка|Index|Индекс|Page|Страница|Livre|Fichier|Catégorie|Kategorie|Datei|Seite|Spezial|Spécial):", re.I)


def _ws_api(lang):
    return f"https://{lang}.wikisource.org/w/api.php"


def wikisource_search(lang, query, limit=8):
    r = requests.get(_ws_api(lang), params={"action": "query", "list": "search", "srnamespace": 0, "srlimit": limit,
                                            "format": "json", "srsearch": query}, headers=UA, timeout=60)
    r.raise_for_status()
    return [x["title"] for x in r.json().get("query", {}).get("search", [])]


def _ws_text(html, title):
    from bs4 import BeautifulSoup
    from urllib.parse import unquote
    soup = BeautifulSoup(html, "html.parser")
    for sel in _STRIP:
        for n in soup.select(sel):
            n.decompose()
    base = title.replace(" ", "_")
    subs, seen = [], set()
    for a in soup.select("a[href]"):
        m = re.match(r"^/wiki/([^#?]+)", a.get("href", ""))
        if not m:
            continue
        t = unquote(m.group(1))
        if _NS.match(t) or t == base or t in seen:
            continue
        txt = a.get_text(" ", strip=True)
        if not txt:
            continue
        if t.startswith(base + "/") or re.search(r"\((ДО|ВТ|СО)\)|редакци|версия|издани", t + " " + txt, re.I):
            seen.add(t)
            subs.append(t.replace("_", " "))
    for br in soup.find_all("br"):
        br.replace_with("\n")
    blocks = []
    for el in soup.find_all(["p", "h2", "h3", "h4", "li", "dd", "blockquote", "pre"]):
        if el.find_parent(["p", "li", "dd", "blockquote"]):
            continue
        t = re.sub(r"[ \t ]+", " ", el.get_text()).strip()
        if t:
            blocks.append(t)
    for el in soup.select(".poem"):
        t = el.get_text().strip()
        if t and t not in blocks:
            blocks.append(t)
    text = "\n\n".join(blocks)
    if len(text) < 200:
        text = soup.get_text(" ").strip()
    text = re.sub(r"\[\d+\]", "", text)
    return text, subs


def wikisource_page(lang, title):
    r = requests.get(_ws_api(lang), params={"action": "parse", "prop": "text", "redirects": 1, "format": "json",
                                            "formatversion": 2, "page": title}, headers=UA, timeout=90)
    r.raise_for_status()
    j = r.json()
    if "error" in j:
        raise LookupError(j["error"].get("info", "страница не найдена"))
    real = j["parse"]["title"]
    text, subs = _ws_text(j["parse"]["text"], real)
    return {"title": real, "lang": lang, "text": text, "subpages": subs,
            "url": f"https://{lang}.wikisource.org/wiki/" + real.replace(" ", "_")}


def load_wikisource(lang, title=None, query=None, parts=40, author="", label=None, side=""):
    """Текст из Викитеки. Если страница — оглавление или список редакций, загружаются главы (до parts)."""
    page = None
    if title:
        try:
            page = wikisource_page(lang, title)
        except LookupError:
            page = None
    if page is None:
        hits = wikisource_search(lang, query or title)
        if not hits:
            raise LookupError(f"В Викитеке ({lang}) не найдено: {query or title}")
        page = wikisource_page(lang, hits[0])
        print("  найдено:", hits[0], "| другие варианты:", "; ".join(hits[1:5]))
    words = len(re.findall(r"\w+", page["text"]))
    if words < 120 and page["subpages"]:
        print(f"  «{page['title']}» — оглавление: загружаю {min(parts, len(page['subpages']))} частей…")
        texts = []
        for t in page["subpages"][:parts]:
            try:
                texts.append(wikisource_page(lang, t)["text"])
            except Exception as e:  # noqa: BLE001
                print("   пропущено:", t, e)
        page["text"] = "\n\n".join(texts)
    return {"author": author, "title": label or page["title"], "lang": lang, "side": side, "text": page["text"], "url": page["url"]}


def strip_gutenberg(text):
    s = re.search(r"\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n", text, re.I)
    if s:
        text = text[s.end():]
    e = re.search(r"\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG", text, re.I)
    if e:
        text = text[:e.start()]
    return text


def load_url(url, author="", title="", side=""):
    r = requests.get(url, headers=UA, timeout=120)
    r.raise_for_status()
    r.encoding = r.encoding if r.encoding and r.encoding.lower() != "iso-8859-1" else "utf-8"
    text = strip_gutenberg(r.text)
    return {"author": author, "title": title or url.rsplit("/", 1)[-1], "lang": detect_lang(text), "side": side, "text": text, "url": url}


def list_texts():
    pr = _data("presets")
    for k, t in pr["texts"].items():
        src = "Gutenberg" if t.get("src", {}).get("type") == "gutenberg" else "Викитека"
        tr = "  + перевод: " + k + "@ru" if t.get("tr") else ""
        print(f"{k:22s} {t['side']:7s} {t['lang']}  {t['author']}. {t['title']} ({t['year']}) · {src}{tr}")


def list_pairs():
    pr = _data("presets")
    for p in pr["pairs"]:
        print(f"{p['id']:12s} лекц. {', '.join(map(str, p['lectures'])):10s} {p['title']}")


def load_preset(key, parts=40):
    """Готовый текст по ключу; «ключ@ru» — русский перевод западного текста с Викитеки (если есть)."""
    pr = _data("presets")
    if key.endswith("@ru"):
        base = pr["texts"][key[:-3]]
        if "tr" not in base:
            raise KeyError(f"для {key[:-3]} перевод не задан")
        s = base["tr"]
        print(f"→ {base['author']}. {base['title']} — русский перевод (Викитека, поиск: {s.get('query')})")
        d = load_wikisource("ru", s.get("title"), s.get("query"), parts=parts, author=base["author"],
                            label=base["title"] + " — русский перевод", side=base["side"])
        d["lang"], d["id"] = "ru", key
        print("  проверьте, тот ли это текст:", d["url"])
        return d
    t = pr["texts"][key]
    print(f"→ {t['author']}. {t['title']}")
    if t.get("gutenberg") and (t.get("src", {}).get("type") == "gutenberg"):
        d = load_url(t["gutenberg"], t["author"], t["title"], t["side"])
    else:
        s = t["src"]
        d = load_wikisource(s["lang"], s.get("title"), s.get("query"), parts=parts, author=t["author"], label=t["title"], side=t["side"])
    d["lang"] = t["lang"]
    d["id"] = key
    n = len(re.findall(r"\w+", d["text"]))
    print(f"  {n:,} слов".replace(",", " "))
    return d


def load_my_files(side=""):
    """Загрузить свои .txt или .docx (в Colab появится кнопка выбора файлов)."""
    from google.colab import files  # type: ignore
    up = files.upload()
    docs = []
    for name, data in up.items():
        if name.lower().endswith(".docx"):
            import docx  # type: ignore
            text = "\n".join(p.text for p in docx.Document(io.BytesIO(data)).paragraphs)
        else:
            for enc in ("utf-8-sig", "cp1251", "latin-1"):
                try:
                    text = data.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
        text = strip_gutenberg(text)
        docs.append({"author": "", "title": name.rsplit(".", 1)[0], "lang": detect_lang(text), "side": side, "text": text, "url": ""})
        print(f"✓ {name}: {LANG_NAMES.get(docs[-1]['lang'])}, {len(text):,} знаков".replace(",", " "))
    return docs


def load_spec(spec, side=""):
    """spec: ключ готового текста, URL (.txt) или 'ws:lang:Название'. Несколько — через ';'."""
    docs = []
    for part in [x.strip() for x in str(spec).split(";") if x.strip()]:
        if part == "МОИ ФАЙЛЫ":
            docs += load_my_files(side)
        elif part.startswith("ws:"):
            _, lang, title = part.split(":", 2)
            docs.append(load_wikisource(lang, title, title, side=side))
        elif part.startswith("http"):
            docs.append(load_url(part, side=side))
        else:
            docs.append(load_preset(part))
    return docs


# ───────────────────────── разбор ─────────────────────────
def analyze(doc):
    lx, geo = _data("lexicon"), _data("places")
    lang = doc.get("lang") or detect_lang(doc["text"])
    mg, mt, mm = _matcher(lx["groups"], lang), _matcher(lx["traits"], lang), _matcher(lx["motifs"], lang)
    mp = _place_matcher(geo["places"])
    stop = set(lx["stop"].get(lang, []))
    freq = Counter()
    rows = []
    n_words = 0
    label = f"{doc.get('author') + '. ' if doc.get('author') else ''}{doc.get('title', '')}"
    for i, s in enumerate(split_sentences(doc["text"])):
        toks = tokens(s)
        n_words += len(toks)
        rec = {"text": label, "side": doc.get("side", ""), "i": i, "sentence": s,
               "groups": defaultdict(list), "traits": defaultdict(list), "motifs": defaultdict(list), "places": defaultdict(list), "propers": []}
        for k, t in enumerate(toks):
            if t["n"] not in stop and len(t["n"]) > 1:
                freq[t["n"]] += 1
            g = mg(t["n"])
            if g:
                rec["groups"][g].append(t["raw"])
            tr = mt(t["n"])
            if tr:
                rec["traits"][tr].append(t["raw"])
            mo = mm(t["n"])
            if mo:
                rec["motifs"][mo].append(t["raw"])
            if t["cap"] and len(t["n"]) > 2:
                p = mp(t["n"])
                if p:
                    rec["places"][p].append(t["raw"])
                elif k > 0 and not g and "/" not in s[max(0, t["i"] - 3):t["i"]]:
                    rec["propers"].append(t["raw"])
        rows.append(rec)
    return {"doc": doc, "lang": lang, "label": label, "sentences": rows, "n_words": n_words, "freq": freq}


def analyze_all(docs):
    return [analyze(d) for d in docs]


# ───────────────────────── Völkertafel ─────────────────────────
def volkertafel(corpus_a, corpus_b=None, groups=None, metric="pct", min_total=1):
    """Таблица «признак × народ». corpus_* — списки результатов analyze(). metric: 'pct' или 'n'.
    Возвращает DataFrame с колонками-народами (для двух корпусов — пары 'A'/'B')."""
    import pandas as pd
    lx = _data("lexicon")
    glab, tlab = labels("groups"), labels("traits")
    rub = {t["id"]: next(r["label"] for r in lx["rubrics"] if r["id"] == t["rubric"]) for t in lx["traits"]}

    def mat(corpus):
        tot, cnt = Counter(), Counter()
        for an in corpus or []:
            for s in an["sentences"]:
                for g in s["groups"]:
                    tot[g] += 1
                    for t in s["traits"]:
                        cnt[(g, t)] += 1
        return tot, cnt

    ta, ca = mat(corpus_a)
    tb, cb = mat(corpus_b)
    if groups is None:
        allg = ta + tb
        groups = [g for g, n in allg.most_common(8) if n >= min_total]
    data = {}
    for g in groups:
        for side, tot, cnt in (("A", ta, ca), ("B", tb, cb)):
            if side == "B" and corpus_b is None:
                continue
            col = []
            for t in lx["traits"]:
                n = cnt[(g, t["id"])]
                col.append(n if metric == "n" else (round(100 * n / tot[g], 1) if tot[g] else 0.0))
            data[(glab[g], side)] = col
    idx = pd.MultiIndex.from_tuples([(rub[t["id"]], tlab[t["id"]]) for t in lx["traits"]], names=["рубрика", "признак"])
    df = pd.DataFrame(data, index=idx)
    df.columns = pd.MultiIndex.from_tuples(df.columns, names=["народ", "корпус"])
    totals = {glab[g]: (ta[g], tb[g]) for g in groups}
    df.attrs["totals"] = totals
    return df


def plot_volkertafel(df, title="Цифровая Völkertafel"):
    import matplotlib.pyplot as plt
    import numpy as np
    vals = df.values.astype(float)
    fig, ax = plt.subplots(figsize=(max(6, 0.55 * df.shape[1] + 4), 0.38 * df.shape[0] + 2))
    im = ax.imshow(vals, aspect="auto", cmap="YlOrBr")
    ax.set_yticks(range(df.shape[0]))
    ax.set_yticklabels([t for _, t in df.index], fontsize=9)
    ax.set_xticks(range(df.shape[1]))
    ax.set_xticklabels([f"{g} · {c}" for g, c in df.columns], rotation=60, ha="right", fontsize=9)
    for i in range(vals.shape[0]):
        for j in range(vals.shape[1]):
            if vals[i, j]:
                ax.text(j, i, f"{vals[i, j]:g}", ha="center", va="center", fontsize=7, color="black" if vals[i, j] < np.nanmax(vals) * .6 else "white")
    ax.set_title(title)
    fig.colorbar(im, ax=ax, shrink=.6, label="% предложений о народе" if vals.max() <= 100 else "предложений")
    fig.tight_layout()
    return fig


def contexts(corpus, group=None, trait=None, motif=None, limit=None):
    """Предложения, где есть народ и/или признак и/или мотив. Возвращает DataFrame."""
    import pandas as pd
    rows = []
    for an in corpus:
        for s in an["sentences"]:
            if group and group not in s["groups"]:
                continue
            if trait and trait not in s["traits"]:
                continue
            if motif and motif not in s["motifs"]:
                continue
            words = (s["groups"].get(group, []) if group else []) + (s["traits"].get(trait, []) if trait else []) + (s["motifs"].get(motif, []) if motif else [])
            rows.append({"текст": s["text"], "сторона": s["side"], "№": s["i"], "слова": ", ".join(dict.fromkeys(words)), "предложение": s["sentence"],
                         "проверка (верно/ложно/спорно)": ""})
    df = pd.DataFrame(rows)
    return df.head(limit) if limit else df


def find_id(kind, text):
    """Найти id народа/признака/мотива по части названия: find_id('groups', 'черкес') → 'gortsy'."""
    t = norm(text)
    for it in _data("lexicon")[kind]:
        if t in norm(it["label"]) or t == it["id"]:
            return it["id"]
    raise KeyError(f"нет в словаре {kind}: {text}")


# ───────────────────────── профили и ключевые слова ─────────────────────────
def profile(corpus, kind="motifs"):
    """Упоминаний на 10 000 слов для каждой строки словаря (мотивы, признаки, народы)."""
    import pandas as pd
    lab = labels(kind)
    n_words = sum(a["n_words"] for a in corpus) or 1
    cnt = Counter()
    for an in corpus:
        for s in an["sentences"]:
            for k, words in s[kind].items():
                cnt[k] += len(words)
    return pd.Series({lab[k]: round(10000 * v / n_words, 2) for k, v in cnt.items()}, name="на 10 тыс. слов").sort_values(ascending=False)


def compare_profiles(corpus_a, corpus_b, kind="motifs", names=("A", "B")):
    import pandas as pd
    df = pd.concat([profile(corpus_a, kind).rename(names[0]), profile(corpus_b, kind).rename(names[1])], axis=1).fillna(0)
    return df.sort_values(by=list(names), ascending=False)


def plot_profiles(df, title="Мотивы, на 10 000 слов"):
    import matplotlib.pyplot as plt
    ax = df.iloc[::-1].plot.barh(figsize=(8, 0.35 * len(df) + 1.5), color=["#a1392b", "#2c5f8a"][: df.shape[1]])
    ax.set_title(title)
    ax.set_xlabel("упоминаний на 10 000 слов")
    plt.tight_layout()
    return ax


def log_likelihood(a, b, na, nb):
    e1 = na * (a + b) / (na + nb)
    e2 = nb * (a + b) / (na + nb)
    ll = 0.0
    if a:
        ll += a * math.log(a / e1)
    if b:
        ll += b * math.log(b / e2)
    return 2 * ll


def keyness(corpus_a, corpus_b, top=30, min_freq=4):
    """Ключевые слова A против B (только для текстов одного языка)."""
    import pandas as pd
    langs = {a["lang"] for a in corpus_a} | {b["lang"] for b in corpus_b}
    if len(langs) > 1:
        print("⚠ Тексты на разных языках: ключевые слова не сравнимы. Сравнивайте профили мотивов и признаков.")
    fa, fb = Counter(), Counter()
    for a in corpus_a:
        fa.update(a["freq"])
    for b in corpus_b:
        fb.update(b["freq"])
    na, nb = sum(fa.values()) or 1, sum(fb.values()) or 1
    rows = []
    for w in set(fa) | set(fb):
        x, y = fa[w], fb[w]
        if x + y < min_freq:
            continue
        rows.append({"слово": w, "A": x, "B": y, "G2": round(log_likelihood(x, y, na, nb), 2), "чаще в": "A" if x / na > y / nb else "B"})
    df = pd.DataFrame(rows)
    if df.empty:
        return df, df
    return (df[df["чаще в"] == "A"].sort_values("G2", ascending=False).head(top).reset_index(drop=True),
            df[df["чаще в"] == "B"].sort_values("G2", ascending=False).head(top).reset_index(drop=True))


# ───────────────────────── места и карта ─────────────────────────
def place_table(corpus):
    import pandas as pd
    geo = _data("places")
    by = {p["id"]: p for p in geo["places"]}
    rows = defaultdict(lambda: {"n": 0, "ctx": ""})
    for an in corpus:
        for s in an["sentences"]:
            for pid, words in s["places"].items():
                r = rows[(an["label"], pid)]
                r["n"] += len(words)
                if not r["ctx"]:
                    r["ctx"] = s["sentence"][:300]
    out = []
    for (lab, pid), r in rows.items():
        p = by[pid]
        out.append({"текст": lab, "место": p["label"], "регион": p["region"], "широта": p["lat"], "долгота": p["lon"], "упоминаний": r["n"], "контекст": r["ctx"]})
    df = pd.DataFrame(out)
    return df.sort_values("упоминаний", ascending=False).reset_index(drop=True) if not df.empty else df


def unknown_names(corpus, top=30):
    c = Counter()
    for an in corpus:
        for s in an["sentences"]:
            c.update(s["propers"])
    return c.most_common(top)


def list_routes():
    for r in _data("places")["routes"]:
        print(f"{r['id']:13s} {r['side']:7s} {r['author']}, {r['work']} ({r['years']})")


def make_map(corpora=(), routes=("pushkin", "vambery"), colors=("#a1392b", "#2c5f8a", "#0f766e", "#8a5a00")):
    """Интерактивная карта folium: маршруты + места текстов (corpora — список корпусов analyze())."""
    import folium
    geo = _data("places")
    by = {p["id"]: p for p in geo["places"]}
    m = folium.Map(location=[43, 55], zoom_start=4, tiles="OpenStreetMap")
    for r in geo["routes"]:
        if r["id"] not in routes:
            continue
        pts = [(by[s]["lat"], by[s]["lon"]) for s in r["stops"]]
        folium.PolyLine(pts, color=r["color"], weight=3, opacity=.85, dash_array="7 6" if r["side"] == "запад" else None,
                        tooltip=f"{r['author']} · {r['work']} ({r['years']})").add_to(m)
        for i, s in enumerate(r["stops"]):
            folium.CircleMarker((by[s]["lat"], by[s]["lon"]), radius=4, color=r["color"], fill=True, fill_opacity=1,
                                tooltip=f"{i + 1}. {by[s]['label']} — {r['author']}").add_to(m)
    for k, corpus in enumerate(corpora):
        df = place_table(corpus)
        col = colors[k % len(colors)]
        for _, row in df.iterrows():
            folium.CircleMarker((row["широта"], row["долгота"] + (k - .5) * .2), radius=min(26, 5 + 3 * math.sqrt(row["упоминаний"])),
                                color=col, fill=True, fill_opacity=.35,
                                popup=folium.Popup(f"<b>{row['место']}</b> · {row['упоминаний']}<br>{row['текст']}<br><i>{row['контекст']}</i>", max_width=340)).add_to(m)
    return m


def to_geojson(corpora=(), routes=(), path="karta_vzglyada.geojson"):
    geo = _data("places")
    by = {p["id"]: p for p in geo["places"]}
    feats = []
    for k, corpus in enumerate(corpora):
        df = place_table(corpus)
        for _, row in df.iterrows():
            feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [row["долгота"], row["широта"]]},
                          "properties": {"place": row["место"], "region": row["регион"], "text": row["текст"], "mentions": int(row["упоминаний"]), "corpus": k + 1}})
    for r in geo["routes"]:
        if r["id"] in routes:
            feats.append({"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[by[s]["lon"], by[s]["lat"]] for s in r["stops"]]},
                          "properties": {"route": r["author"], "work": r["work"], "years": r["years"], "stroke": r["color"]}})
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f, ensure_ascii=False, indent=1)
    print("✓ сохранено:", path)
    return path


# ───────────────────────── досье ─────────────────────────
def image_contexts(corpus, group=None, stems=(), limit=None):
    """Контексты образа: по id народа из словаря и/или по своим основам слов ('сарт', 'sart')."""
    import pandas as pd
    st = [norm(x) for x in stems if x.strip()]
    rows = []
    for an in corpus:
        for s in an["sentences"]:
            hit = []
            if group and group in s["groups"]:
                hit += s["groups"][group]
            if st:
                hit += [t["raw"] for t in tokens(s["sentence"]) if any(t["n"].startswith(x) for x in st)]
            if hit:
                rows.append({"текст": s["text"], "сторона": s["side"], "слова": ", ".join(dict.fromkeys(hit)),
                             "признаки": "; ".join(labels("traits")[t] for t in s["traits"]),
                             "мотивы": "; ".join(labels("motifs")[m] for m in s["motifs"]), "предложение": s["sentence"]})
    df = pd.DataFrame(rows)
    return df.head(limit) if limit else df


def trait_row(ctx_df):
    """Сколько контекстов образа несут каждый признак, по сторонам (Россия/Запад)."""
    import pandas as pd
    if ctx_df.empty:
        return ctx_df
    rows = defaultdict(Counter)
    totals = Counter(ctx_df["сторона"])
    for _, r in ctx_df.iterrows():
        for t in [x.strip() for x in r["признаки"].split(";") if x.strip()]:
            rows[t][r["сторона"]] += 1
    df = pd.DataFrame(rows).T.fillna(0).astype(int)
    for side in df.columns:
        df[f"% ({side})"] = (100 * df[side] / max(1, totals[side])).round(1)
    return df.sort_values(by=list(df.columns[:1]), ascending=False)


def dossier_docx(image, corpus, ctx_df, traits_df=None, path=None, per_text=8):
    """Черновик досье в Word: корпус, таблица признаков, отобранные контексты по текстам."""
    import docx  # type: ignore
    from docx.shared import Pt
    d = docx.Document()
    d.styles["Normal"].font.name = "Times New Roman"
    d.styles["Normal"].font.size = Pt(12)
    d.add_heading(f"Досье одного образа: «{image}» (черновик)", 0)
    d.add_paragraph("Черновик собран блокнотом Colab курса «Имагология». Цифры — повод для чтения: проверьте каждый контекст по изданию.")
    d.add_heading("2. Корпус", 1)
    t = d.add_table(rows=1, cols=5)
    t.style = "Table Grid"
    for i, hcell in enumerate(["Текст", "Язык", "Сторона", "Слов", "Источник"]):
        t.rows[0].cells[i].text = hcell
    for an in corpus:
        r = t.add_row().cells
        r[0].text, r[1].text, r[2].text = an["label"], LANG_NAMES.get(an["lang"], an["lang"]), an["doc"].get("side", "")
        r[3].text, r[4].text = f"{an['n_words']:,}".replace(",", " "), an["doc"].get("url", "")
    if traits_df is not None and not traits_df.empty:
        d.add_heading("3. Признаки образа", 1)
        cols = list(traits_df.columns)
        t = d.add_table(rows=1, cols=len(cols) + 1)
        t.style = "Table Grid"
        t.rows[0].cells[0].text = "признак"
        for i, c in enumerate(cols):
            t.rows[0].cells[i + 1].text = str(c)
        for idx, row in traits_df.iterrows():
            cells = t.add_row().cells
            cells[0].text = str(idx)
            for i, c in enumerate(cols):
                cells[i + 1].text = str(row[c])
    d.add_heading("5. Контексты для медленного чтения", 1)
    for text, grp in ctx_df.groupby("текст", sort=False):
        d.add_heading(f"{text} ({len(grp)})", 2)
        for _, r in grp.head(per_text).iterrows():
            p = d.add_paragraph(style="List Bullet")
            p.add_run(r["предложение"])
            if r["признаки"]:
                p.add_run(f"  [{r['признаки']}]").italic = True
    for h in ["4. Карта", "6. Визуальный ряд", "7. Вывод: автообраз в гетерообразе", "8. Литература"]:
        d.add_heading(h, 1)
        d.add_paragraph("…")
    safe = re.sub(r"[^\w]+", "_", image)
    path = path or f"Dosye_{safe}.docx"
    d.save(path)
    print("✓ сохранено:", path)
    return path


def save_excel(frames, path="imagologiya.xlsx"):
    """frames: {'лист': DataFrame}. Сохраняет в Excel (по листу на таблицу)."""
    import pandas as pd
    with pd.ExcelWriter(path) as xw:
        for name, df in frames.items():
            df.to_excel(xw, sheet_name=str(name)[:31])
    print("✓ сохранено:", path)
    return path


def download(path):
    try:
        from google.colab import files  # type: ignore
        files.download(path)
    except Exception:  # noqa: BLE001
        print("Файл лежит в папке слева:", path)
