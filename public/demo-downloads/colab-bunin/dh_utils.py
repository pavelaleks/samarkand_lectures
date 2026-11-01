# -*- coding: utf-8 -*-
"""
dh_utils — общий набор функций для практик курса
«Анализ художественного текста с помощью ИИ и цифровых технологий» (СамГУ).

Студенту НЕ нужно читать этот файл. В каждом блокноте он подключается одной
ячейкой «Подготовка», а дальше вы меняете только поля формы.

Принцип каждой функции: результат → таблица, которую можно проверить цитатой.
Все функции работают и без интернета для своих файлов, и с демо-корпусами сайта.
"""

import io
import json
import math
import os
import re
import subprocess
import sys
import time
import zipfile
from collections import Counter, defaultdict
from functools import lru_cache
from pathlib import Path

import pandas as pd

SITE = "https://pavelaleks.github.io/samarkand_lectures/"
CORPORA = {
    "Бунин (демо)": "demo-corpora/bunin-temnye-allei/",
    "Чехов (демо)": "demo-corpora/chekhov-rasskazy/",
}

# ---------------------------------------------------------------------------
# 0. Подготовка среды
# ---------------------------------------------------------------------------

_MORPH = None
_BACKEND = "нет"


def _in_colab():
    return "google.colab" in sys.modules


def setup(lemmatize=True, quiet=False):
    """Готовит среду: ставит лемматизатор pymorphy3 (бесплатно, ~20 сек)."""
    global _MORPH, _BACKEND
    import matplotlib
    import matplotlib.pyplot as plt

    plt.rcParams["figure.dpi"] = 110
    plt.rcParams["axes.spines.top"] = False
    plt.rcParams["axes.spines.right"] = False
    if not lemmatize:
        _BACKEND = "без лемматизации"
        return _BACKEND
    try:
        import pymorphy3  # noqa: F401
    except ImportError:
        if not quiet:
            print("Ставлю лемматизатор pymorphy3 (один раз за сессию, ~20 сек)…")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "-q", "pymorphy3"],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=300,
            )
        except Exception as e:  # pragma: no cover - зависит от сети
            print("⚠ Не удалось поставить pymorphy3:", e)
    try:
        import pymorphy3

        _MORPH = pymorphy3.MorphAnalyzer()
        _BACKEND = "pymorphy3"
    except Exception as e:
        _MORPH = None
        _BACKEND = "упрощённый (обрезка окончаний, без словаря)"
        print("⚠ Лемматизатор недоступен:", type(e).__name__, e)
        print("  Блокнот будет работать, но формы слов не сводятся к лемме.")
        print("  В разделе «Ограничения» напишите об этом.")
    if not quiet:
        print(f"✓ Готово. Лемматизация: {_BACKEND}.")
    return _BACKEND


def backend():
    return _BACKEND


# ---------------------------------------------------------------------------
# 1. Загрузка текстов
# ---------------------------------------------------------------------------


@lru_cache(maxsize=4)
def _manifest(corpus):
    import requests

    url = SITE + CORPORA[corpus] + "manifest.json"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return tuple(json.loads(r.content.decode("utf-8")))


def list_demo(corpus="Бунин (демо)"):
    """Таблица рассказов демо-корпуса: название, слов."""
    rows = [{"название": e["title"], "слов": e.get("words")} for e in _manifest(corpus)]
    return pd.DataFrame(rows)


def _norm_title(s):
    return re.sub(r"[^а-яёa-z0-9]", "", s.lower().replace("ё", "е"))


def load_demo(corpus="Бунин (демо)", titles="все"):
    """Загружает рассказы демо-корпуса. titles — строка «Кавказ; Холодная осень» или «все»."""
    import requests

    man = _manifest(corpus)
    if isinstance(titles, str):
        wanted = [t.strip() for t in re.split(r"[;\n]", titles) if t.strip()]
    else:
        wanted = list(titles)
    if not wanted or wanted[0].lower() in ("все", "all", "*"):
        chosen = list(man)
    else:
        idx = {_norm_title(e["title"]): e for e in man}
        chosen, missing = [], []
        for t in wanted:
            e = idx.get(_norm_title(t))
            if e is None:
                # допускаем начало названия: «Чистый» → «Чистый понедельник»
                cands = [v for k, v in idx.items() if k.startswith(_norm_title(t))]
                e = cands[0] if len(cands) == 1 else None
            (chosen.append(e) if e else missing.append(t))
        if missing:
            names = ", ".join(e["title"] for e in man)
            raise ValueError(f"Не нашёл: {missing}. Доступны: {names}")
    texts = {}
    for e in chosen:
        r = requests.get(SITE + CORPORA[corpus] + "txt/" + e["slug"] + ".txt", timeout=60)
        r.raise_for_status()
        texts[e["title"]] = clean(r.content.decode("utf-8"))
    return texts


def _read_bytes(name, data):
    """Читает .txt (UTF-8 или cp1251) и .docx без дополнительных библиотек."""
    low = name.lower()
    if low.endswith(".docx"):
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        paras = re.findall(r"<w:p[ >].*?</w:p>", xml, flags=re.S)
        out = []
        for p in paras:
            p = re.sub(r"<w:tab/>", " ", p)
            p = re.sub(r"<w:br/>", "\n", p)
            t = re.sub(r"<[^>]+>", "", p)
            out.append(t)
        import html

        return html.unescape("\n".join(out))
    if low.endswith(".doc") or low.endswith(".pdf"):
        raise ValueError(f"{name}: сохраните файл как .txt или .docx (Файл → Сохранить как).")
    for enc in ("utf-8-sig", "cp1251"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def load_my_files(names=""):
    """Свои файлы (.txt или .docx).
    names пусто → откроется окно загрузки Colab. Иначе — имена уже загруженных файлов через «;».
    """
    texts = {}
    wanted = [n.strip() for n in re.split(r"[;\n]", names or "") if n.strip()]
    if wanted:
        for n in wanted:
            p = Path(n)
            if not p.exists():
                raise FileNotFoundError(
                    f"Нет файла «{n}». Загрузите его: значок папки слева → стрелка вверх. "
                    "Или оставьте поле MY_FILES пустым — появится кнопка загрузки."
                )
            texts[p.stem] = clean(_read_bytes(p.name, p.read_bytes()))
    else:
        if not _in_colab():
            raise RuntimeError("Укажите имена файлов в поле MY_FILES (вне Colab окно загрузки недоступно).")
        from google.colab import files

        print("Нажмите «Выбрать файлы» и отметьте свои .txt или .docx (можно несколько).")
        up = files.upload()
        for n, data in up.items():
            texts[Path(n).stem] = clean(_read_bytes(n, data))
    for k, v in texts.items():
        if len(v.split()) < 300:
            print(f"⚠ «{k}»: всего {len(v.split())} слов — для подсчётов маловато.")
    return texts


def load_texts(source="Бунин (демо)", titles="все", my_files=""):
    """Единая точка входа: source = «Бунин (демо)» | «Чехов (демо)» | «Мои файлы»."""
    if source == "Мои файлы":
        texts = load_my_files(my_files)
    else:
        texts = load_demo(source, titles)
    print(f"Загружено текстов: {len(texts)}")
    for k, v in texts.items():
        print(f"  • {k}: {len(tokenize(v))} слов")
    return texts


def clean(raw):
    """Убирает «жёсткие» переносы строк, заголовки ###, неразрывные пробелы.
    Абзацы (пустая строка) сохраняются — они нужны для окна «абзац»."""
    t = raw.replace("\r\n", "\n").replace("\xa0", " ").replace("​", "")
    t = re.sub(r"(?m)^#{1,6}\s.*$", "", t)            # markdown-заголовки
    t = re.sub(r"\[\d+\]", "", t)                      # сноски [1]
    t = re.sub(r"(\w)-\n(\w)", r"\1\2", t)             # перенос по слогам
    t = re.sub(r"(?m)^\s*([0-9]+|[IVXLC]+)\.?\s*$", "", t)  # номера глав и страниц
    paras = re.split(r"\n\s*\n|\n(?=[ \t]+\S)", t)   # абзац: пустая строка или отступ
    paras = [re.sub(r"\s+", " ", p).strip() for p in paras]
    return "\n\n".join(p for p in paras if p)


# ---------------------------------------------------------------------------
# 2. Токены и леммы
# ---------------------------------------------------------------------------

_WORD = re.compile(r"[А-Яа-яЁёA-Za-z]+(?:-[А-Яа-яЁёA-Za-z]+)*")

STOP = set(
    """
а без более бы был была были было быть в вам вас ваш весь во вот все всего всех вы где да даже
для до его ее её ей ему если есть еще ещё же за здесь и из или им их к как ко когда кто ли
либо мне может мы на над надо наш не него нее неё нет ни них но ну о об однако он она они оно
от очень по под при с со так также такой там те тем то того тоже той только том ты у уже хотя
чего чей чем что чтобы чье чья эта эти это этот я ах ох эх ведь вдруг вон вот-вот опять уж
себя себе свой своя своё свои сам сама само сами самый тот та тут потом теперь тогда всегда
никогда ничего нибудь кто-то что-то как-то какой какая какое какие который которая которое
которые мой моя моё мои твой твоя твоё твои будто словно точно чуть лишь между через после
перед около вокруг ради разве неужели нельзя можно тоже иной другой каждый всякий весь сей
меня мне мной тебя тебе тобой ему ним нему нём нем ней ею ими ними нас нам нами вам вами
больше меньше совсем почему зачем отчего куда откуда туда сюда оттуда тот-то раз два
""".split()
)
# леммы-«служебные» глаголы и местоимения, которые после лемматизации всплывают наверх
STOP_LEMMAS = STOP | set(
    "быть мочь сказать говорить стать хотеть знать весь свой который этот тот такой один два "
    "сей оный ещё уже очень вот ну да нет теперь опять всегда тоже ничто никто что-то кто-то "
    "мой твой наш ваш его её их себя сам самый такой этакой сказать".split()
)


def content_lemmas(text, extra_stop=()):
    """Леммы значимых слов: без служебных (проверяем и форму, и лемму), длиной > 2."""
    toks = tokenize(text)
    out = []
    for f, l in zip(toks, lemmas(toks)):
        if f in STOP or l in STOP_LEMMAS or l in extra_stop or len(l) <= 2:
            continue
        out.append(l)
    return out


def tokenize(text):
    """Слова в нижнем регистре (ё → е не меняем: это решение исследователя)."""
    return [m.group(0).lower() for m in _WORD.finditer(text)]


_ENDINGS = sorted(
    "ями ами ого его ому ему ыми ими ются ется ится ала ило или ыла ась ось ись ах ях ой ей ий ый ая яя "
    "ое ее ые ие ом ем ую юю ам ям ов ев ть ла ло ли а я о е ы и у ю ь".split(), key=len, reverse=True)


def _crude_stem(word):
    """Запасной вариант без словаря: отрезаем типичное окончание (основа ≥ 3 букв)."""
    for e in _ENDINGS:
        if word.endswith(e) and len(word) - len(e) >= 3:
            return word[: -len(e)]
    return word


@lru_cache(maxsize=200_000)
def _lemma(word):
    if _MORPH is None:
        return _crude_stem(word.replace("ё", "е")) if _BACKEND.startswith("упрощ") else word
    try:
        return _MORPH.parse(word)[0].normal_form.replace("ё", "е")
    except Exception:
        return word


def lemma(word):
    return _lemma(word.lower())


def lemmas(text_or_tokens):
    toks = tokenize(text_or_tokens) if isinstance(text_or_tokens, str) else text_or_tokens
    return [_lemma(t) for t in toks]


def _parse_words(spec):
    """«любовь, любить, влюб*» → множество лемм и список префиксов (со звёздочкой)."""
    if isinstance(spec, str):
        items = [w.strip().lower() for w in re.split(r"[,;\n]", spec) if w.strip()]
    else:
        items = [w.strip().lower() for w in spec]
    exact, prefixes = set(), []
    for w in items:
        if w.endswith("*"):
            prefixes.append(w[:-1].replace("ё", "е"))
        else:
            exact.add(lemma(w))
    return exact, prefixes


def _match(lem, form, exact, prefixes):
    l = lem.replace("ё", "е")
    if l in exact or form.replace("ё", "е") in exact:
        return True
    return any(l.startswith(p) or form.startswith(p) for p in prefixes)


# ---------------------------------------------------------------------------
# 3. Частоты смысловых полей и конкорданс
# ---------------------------------------------------------------------------


def parse_fields(block):
    """Текст формы «поле: слово, слово, слово*» (по строке на поле) → словарь."""
    fields = {}
    for line in re.split(r"[|\n]", block):
        if ":" in line:
            name, words = line.split(":", 1)
            if words.strip():
                fields[name.strip()] = words.strip()
    if not fields:
        raise ValueError("Поля не заданы. Формат: «любовь: любовь, любить, страсть | память: помнить, вспомнить»")
    return fields


def field_table(texts, fields):
    """Абсолютная частота и частота на 1000 слов для каждого поля в каждом тексте."""
    rows, hits = [], []
    parsed = {name: _parse_words(spec) for name, spec in fields.items()}
    for title, text in texts.items():
        toks = tokenize(text)
        lems = lemmas(toks)
        n = max(len(toks), 1)
        row = {"текст": title, "слов": n}
        for name, (ex, pr) in parsed.items():
            found = [(f, l) for f, l in zip(toks, lems) if _match(l, f, ex, pr)]
            row[name] = len(found)
            row[f"{name} /1000"] = round(1000 * len(found) / n, 2)
            for f, l in found:
                hits.append({"текст": title, "поле": name, "форма": f, "лемма": l})
        rows.append(row)
    df = pd.DataFrame(rows)
    hits = pd.DataFrame(hits, columns=["текст", "поле", "форма", "лемма"])
    small = [(r["текст"], name) for _, r in df.iterrows() for name in fields if r[name] < 5]
    if small:
        print("⚠ Мало вхождений (<5) — пик может быть случайным:")
        for t, f in small[:8]:
            print(f"   {t} · {f}")
    return df, hits


def plot_fields(df, title="Смысловые поля, на 1000 слов"):
    import matplotlib.pyplot as plt

    cols = [c for c in df.columns if c.endswith(" /1000")]
    ax = df.set_index("текст")[cols].rename(columns=lambda c: c.replace(" /1000", "")).plot(
        kind="bar", figsize=(9, 4), rot=0, width=0.8
    )
    ax.set_ylabel("вхождений на 1000 слов")
    ax.set_xlabel("")
    ax.set_title(title)
    ax.legend(title="поле", frameon=False)
    plt.tight_layout()
    plt.show()


def top_forms(hits, n=10):
    """Какие формы реально дали частоту поля — главная проверка «не ловит ли словарь мусор»."""
    if hits.empty:
        return hits
    return (
        hits.groupby(["поле", "лемма"]).size().rename("вхождений").reset_index()
        .sort_values(["поле", "вхождений"], ascending=[True, False])
        .groupby("поле").head(n).reset_index(drop=True)
    )


def kwic(texts, words, width=60, limit=30):
    """Конкорданс (KWIC): слово в контексте. words — «вечер, вечерний» или «памят*»."""
    ex, pr = _parse_words(words)
    rows = []
    for title, text in texts.items():
        for m in _WORD.finditer(text):
            f = m.group(0).lower()
            if _match(_lemma(f), f, ex, pr):
                a, b = m.start(), m.end()
                left = text[max(0, a - width):a].replace("\n", " ")
                right = text[b:b + width].replace("\n", " ")
                rows.append({"текст": title, "левый контекст": "…" + left, "слово": m.group(0), "правый контекст": right + "…"})
    df = pd.DataFrame(rows, columns=["текст", "левый контекст", "слово", "правый контекст"])
    print(f"Найдено вхождений: {len(df)}" + (f" (показаны первые {limit})" if len(df) > limit else ""))
    with pd.option_context("display.max_colwidth", width + 5):
        return df.head(limit)


def zipf_plot(text, title="", top=200):
    """Ранг–частота в log-log + оценка наклона α. Диагностика корпуса, не доказательство."""
    import numpy as np
    import matplotlib.pyplot as plt

    freqs = sorted(Counter(tokenize(text)).values(), reverse=True)[:top]
    r = np.arange(1, len(freqs) + 1)
    k = slice(0, len(freqs))
    a, b = np.polyfit(np.log(r[k]), np.log(freqs), 1)
    pred = a * np.log(r) + b
    ss_res = ((np.log(freqs) - pred) ** 2).sum()
    ss_tot = ((np.log(freqs) - np.log(freqs).mean()) ** 2).sum()
    r2 = 1 - ss_res / ss_tot
    plt.figure(figsize=(6.5, 4))
    plt.loglog(r, freqs, "o", ms=3, label="слова текста")
    plt.loglog(r, np.exp(pred), "-", lw=1.5, label=f"прямая: α = {-a:.2f}, R² = {r2:.2f}")
    plt.xlabel("ранг (log)")
    plt.ylabel("частота (log)")
    plt.title(f"Закон Ципфа · {title}")
    plt.legend(frameon=False)
    plt.tight_layout()
    plt.show()
    return round(-a, 3), round(r2, 3)


def lexical_stats(texts, sample=1000):
    """Объём, словарь, TTR и стандартизованный TTR (средний по кускам по 1000 слов)."""
    rows = []
    for title, text in texts.items():
        toks = tokenize(text)
        sttr = [len(set(toks[i:i + sample])) / sample for i in range(0, len(toks) - sample + 1, sample)]
        rows.append({
            "текст": title,
            "слов": len(toks),
            "разных словоформ": len(set(toks)),
            "TTR (зависит от длины!)": round(len(set(toks)) / max(len(toks), 1), 3),
            f"STTR по {sample}": round(sum(sttr) / len(sttr), 3) if sttr else None,
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# 4. Паспорт корпуса
# ---------------------------------------------------------------------------


def passport(texts, source="", edition="УКАЖИТЕ издание", why="УКАЖИТЕ", excluded="УКАЖИТЕ"):
    rows = []
    for title, text in texts.items():
        rows.append({
            "единица": title,
            "слов": len(tokenize(text)),
            "абзацев": text.count("\n\n") + 1,
            "источник файла": source,
            "печатное издание для сверки": edition,
            "зачем в диссертации": why,
            "что исключено и почему": excluded,
        })
    return pd.DataFrame(rows)


def save_texts(texts, zip_name="clean_texts.zip", suffix="_clean"):
    """Сохраняет очищенные тексты в .txt и пакует в zip (в Colab сразу предлагает скачать)."""
    names = []
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as z:
        for title, text in texts.items():
            fn = re.sub(r"[^\w\-]+", "_", title).strip("_") + suffix + ".txt"
            Path(fn).write_text(text, encoding="utf-8")
            z.write(fn)
            names.append(fn)
    print("Сохранено:", ", ".join(names), "→", zip_name)
    if _in_colab():
        from google.colab import files

        files.download(zip_name)
    return names


# ---------------------------------------------------------------------------
# 5. Ключевые слова: текст vs корпус сравнения (log-likelihood Даннинга)
# ---------------------------------------------------------------------------


def keywords(target, reference, top=30, min_freq=3, use_lemmas=True):
    """Слова, статистически значимо более частые в target, чем в reference.
    target / reference — словари {название: текст}. G² > 10.83 ≈ p < 0.001.
    """
    def counts(texts):
        c = Counter()
        for t in texts.values():
            if use_lemmas:
                c.update(content_lemmas(t))
            else:
                c.update(w for w in tokenize(t) if w not in STOP and len(w) > 2)
        return c

    ct, cr = counts(target), counts(reference)
    nt, nr = sum(ct.values()), sum(cr.values())
    rows = []
    for w, a in ct.items():
        if a < min_freq:
            continue
        b = cr.get(w, 0)
        e1 = nt * (a + b) / (nt + nr)
        e2 = nr * (a + b) / (nt + nr)
        g2 = 2 * ((a * math.log(a / e1) if a else 0) + (b * math.log(b / e2) if b else 0))
        # log ratio со сглаживанием 0.5: во сколько раз чаще (log2)
        lr = math.log2(((a + 0.5) / nt) / ((b + 0.5) / nr))
        if lr > 0:
            rows.append({
                "слово": w, "в тексте": a, "в фоне": b,
                "на 1000 (текст)": round(1000 * a / nt, 2),
                "на 1000 (фон)": round(1000 * b / nr, 2),
                "G²": round(g2, 1), "log2-перевес": round(lr, 2),
                "значимо (p<0.001)": "да" if g2 > 10.83 else "",
            })
    df = pd.DataFrame(rows)
    if df.empty:
        print("Нет кандидатов: увеличьте тексты или уменьшите min_freq.")
        return df
    df = df.sort_values("G²", ascending=False).head(top).reset_index(drop=True)
    print(f"Текст: {nt} слов (без служебных) · Фон: {nr} слов. "
          "Имена собственные почти всегда наверху — их обычно вычёркивают вручную.")
    return df


# ---------------------------------------------------------------------------
# 6. Тональность / «эмоциональная дуга» по отрезкам
# ---------------------------------------------------------------------------


def segments(text, n=None, size=None):
    """Делит текст на n равных кусков или куски по size слов (по словам, без потерь хвоста)."""
    words = text.split()
    if size is None:
        n = max(int(n or 10), 1)
        size = math.ceil(len(words) / n)
    size = max(int(size), 1)
    return [" ".join(words[i:i + size]) for i in range(0, len(words), size)]


def arc(text, pos, neg, n=10, title=""):
    """Дуга (POS − NEG на 1000 слов) по n отрезкам. Возвращает таблицу отрезков."""
    import matplotlib.pyplot as plt

    pe, pp = _parse_words(pos)
    ne, np_ = _parse_words(neg)
    rows = []
    for i, seg in enumerate(segments(text, n=n), 1):
        toks = tokenize(seg)
        lems = lemmas(toks)
        p = [f for f, l in zip(toks, lems) if _match(l, f, pe, pp)]
        q = [f for f, l in zip(toks, lems) if _match(l, f, ne, np_)]
        k = max(len(toks), 1)
        rows.append({
            "отрезок": i, "слов": k, "POS": len(p), "NEG": len(q),
            "баланс /1000": round(1000 * (len(p) - len(q)) / k, 1),
            "POS-слова": ", ".join(p[:6]), "NEG-слова": ", ".join(q[:6]),
            "начало отрезка": seg[:140] + "…",
        })
    df = pd.DataFrame(rows)
    plt.figure(figsize=(9, 3.4))
    plt.plot(df["отрезок"], df["баланс /1000"], marker="o")
    plt.axhline(0, color="gray", lw=1)
    plt.xticks(df["отрезок"])
    plt.xlabel("отрезок текста (начало → конец)")
    plt.ylabel("POS − NEG на 1000 слов")
    plt.title(f"Учебная дуга тональности · {title}")
    plt.tight_layout()
    plt.show()
    if (df["POS"] + df["NEG"]).sum() < 10:
        print("⚠ Словарь почти ничего не нашёл — дугу нельзя интерпретировать. Расширьте списки.")
    return df


# ---------------------------------------------------------------------------
# 7. Имена и места (учебный NER на морфологии pymorphy3)
# ---------------------------------------------------------------------------


def name_candidates(texts, top=40):
    """Кандидаты в персонажей и места: слова с заглавной буквы НЕ в начале предложения
    + пометы pymorphy3 (Name — имя, Surn — фамилия, Patr — отчество, Geox — топоним).
    Это список для ручной проверки, а не готовый ответ."""
    c = Counter()
    kinds = {}
    for text in texts.values():
        for sent in re.split(r"(?<=[.!?…])\s+|\n+", text):
            prev_end = 0
            for j, m in enumerate(_WORD.finditer(sent)):
                w = m.group(0)
                gap = sent[prev_end:m.start()]
                prev_end = m.end()
                # начало предложения, реплики, цитаты — заглавная там ничего не значит
                if j == 0 or re.search(r'[.!?…:«"„—–\-]', gap) or not w[0].isupper() or len(w) < 2:
                    continue
                lem = _lemma(w.lower())
                kind = "?"
                if _MORPH is not None:
                    try:
                        tag = str(_MORPH.parse(w)[0].tag)
                        if "Geox" in tag:
                            kind = "место"
                        elif "Surn" in tag:
                            kind = "фамилия"
                        elif "Patr" in tag:
                            kind = "отчество"
                        elif "Name" in tag:
                            kind = "имя"
                    except Exception:
                        pass
                key = lem.capitalize()
                c[key] += 1
                if kinds.get(key, "?") == "?":
                    kinds[key] = kind
    df = pd.DataFrame([{"кандидат (лемма)": k, "тип по морфологии": kinds[k], "вхождений": v}
                       for k, v in c.most_common(top)])
    print("Проверьте каждый кандидат глазами: слова с заглавной бывают и началом реплики, и Богом, и названием.")
    return df


def entity_table(texts, entities):
    """entities — строки «Москва: Москва | Новодевичий: Новодевичий монастырь*, Новодевич*».
    Считает по леммам, поэтому «Москве», «Москвы» → «Москва»."""
    groups = parse_fields(entities)
    rows = []
    for name, spec in groups.items():
        ex, pr = _parse_words(spec)
        for title, text in texts.items():
            toks = tokenize(text)
            lems = lemmas(toks)
            k = sum(1 for f, l in zip(toks, lems) if _match(l, f, ex, pr))
            rows.append({"сущность": name, "текст": title, "вхождений": k})
    df = pd.DataFrame(rows).pivot(index="сущность", columns="текст", values="вхождений").fillna(0).astype(int)
    df["всего"] = df.sum(axis=1)
    return df.sort_values("всего", ascending=False)


# ---------------------------------------------------------------------------
# 8. Граф совместной встречаемости
# ---------------------------------------------------------------------------


def _units(text, window):
    if window == "абзац":
        return [p for p in text.split("\n\n") if p.strip()]
    return [s for s in re.split(r"(?<=[.!?…])\s+", text.replace("\n\n", " ")) if s.strip()]


def cooccurrence(texts, nodes, window="предложение", min_weight=2):
    """nodes — «Он: я, рассказчик | Она: она, ее | Москва: Москва» (метка: слова-якоря).
    Ребро = узлы встретились в одном предложении/абзаце. Возвращает (граф, таблица рёбер с примером)."""
    import itertools
    import networkx as nx

    groups = {k: _parse_words(v) for k, v in parse_fields(nodes).items()}
    w = Counter()
    example = {}
    freq = Counter()
    for title, text in texts.items():
        for unit in _units(text, window):
            toks = tokenize(unit)
            lems = lemmas(toks)
            present = sorted({g for g, (ex, pr) in groups.items()
                              if any(_match(l, f, ex, pr) for f, l in zip(toks, lems))})
            freq.update(present)
            for a, b in itertools.combinations(present, 2):
                w[(a, b)] += 1
                example.setdefault((a, b), f"[{title}] " + unit[:220] + ("…" if len(unit) > 220 else ""))
    G = nx.Graph()
    for g in groups:
        G.add_node(g, freq=freq[g])
    for (a, b), k in w.items():
        if k >= min_weight:
            G.add_edge(a, b, weight=k)
    edges = pd.DataFrame(
        [{"узел A": a, "узел B": b, "вес (сколько раз вместе)": k, "в графе": "да" if k >= min_weight else "ниже порога",
          "пример-доказательство": example[(a, b)]} for (a, b), k in w.most_common()],
        columns=["узел A", "узел B", "вес (сколько раз вместе)", "в графе", "пример-доказательство"],
    )
    absent = [g for g in groups if freq[g] == 0]
    if absent:
        print("⚠ Не найдены в тексте:", ", ".join(absent), "— проверьте слова-якоря.")
    if G.number_of_edges() == 0:
        print("⚠ Ни одно ребро не прошло порог. Уменьшите MIN_WEIGHT или возьмите окно «абзац».")
    return G, edges


def draw_graph(G, title=""):
    import matplotlib.pyplot as plt
    import networkx as nx

    H = G.subgraph([n for n in G if G.degree(n) > 0 or G.nodes[n].get("freq", 0) > 0])
    if H.number_of_nodes() == 0:
        print("Граф пуст.")
        return
    plt.figure(figsize=(8, 6))
    pos = nx.spring_layout(H, seed=7, weight="weight")
    mx = max([H.nodes[n].get("freq", 1) for n in H] + [1])
    sizes = [400 + 1800 * H.nodes[n].get("freq", 1) / mx for n in H]
    widths = [0.8 + 0.6 * H[u][v]["weight"] for u, v in H.edges()]
    nx.draw_networkx_edges(H, pos, width=widths, alpha=0.5)
    nx.draw_networkx_nodes(H, pos, node_size=sizes, node_color="#5eead4", edgecolors="#0f766e")
    nx.draw_networkx_labels(H, pos, font_size=10)
    el = {(u, v): H[u][v]["weight"] for u, v in H.edges()}
    nx.draw_networkx_edge_labels(H, pos, edge_labels=el, font_size=8)
    plt.title(title or "Сеть совместной встречаемости (толщина = вес)")
    plt.axis("off")
    plt.tight_layout()
    plt.show()


def centrality(G):
    import networkx as nx

    if G.number_of_edges() == 0:
        return pd.DataFrame()
    deg = dict(G.degree(weight="weight"))
    btw = nx.betweenness_centrality(G)
    return pd.DataFrame(
        [{"узел": n, "связей": G.degree(n), "взвешенная степень": deg[n], "посредничество": round(btw[n], 3)} for n in G]
    ).sort_values("взвешенная степень", ascending=False).reset_index(drop=True)


# ---------------------------------------------------------------------------
# 9. Стилиометрия: Burrows's Delta по отрезкам
# ---------------------------------------------------------------------------


def delta(texts, mfw=150, segment_words=2000, show=True):
    """Каждый текст режется на отрезки по segment_words слов → z-оценки частот MFW
    по ВСЕМ отрезкам → Delta между текстами (среднее по парам их отрезков).
    Нужно минимум ~6 отрезков в сумме, иначе z-оценки бессмысленны."""
    import numpy as np

    segs, owner = [], []
    for title, text in texts.items():
        toks = tokenize(text)
        parts = [toks[i:i + segment_words] for i in range(0, len(toks), segment_words)]
        parts = [p for p in parts if len(p) >= segment_words * 0.6] or [toks]
        for p in parts:
            segs.append(p)
            owner.append(title)
    if len(segs) < 6:
        print(f"⚠ Всего {len(segs)} отрезков. Добавьте тексты или уменьшите SEGMENT_WORDS (не ниже 1000).")
    allc = Counter(w for s in segs for w in s)
    vocab = [w for w, _ in allc.most_common(mfw)]
    M = np.array([[Counter(s)[w] / len(s) for w in vocab] for s in segs])
    sd = M.std(axis=0)
    sd[sd == 0] = 1e-9
    Z = (M - M.mean(axis=0)) / sd
    names = list(texts)
    D = np.zeros((len(names), len(names)))
    for i, a in enumerate(names):
        for j, b in enumerate(names):
            ia = [k for k, o in enumerate(owner) if o == a]
            ib = [k for k, o in enumerate(owner) if o == b]
            vals = [np.abs(Z[x] - Z[y]).mean() for x in ia for y in ib if x != y]
            D[i, j] = np.mean(vals) if vals else 0.0
    df = pd.DataFrame(D, index=names, columns=names).round(3)
    if show:
        import matplotlib.pyplot as plt
        from scipy.cluster.hierarchy import dendrogram, linkage
        from scipy.spatial.distance import squareform

        fig, ax = plt.subplots(1, 2, figsize=(12, 4.5), gridspec_kw={"width_ratios": [1.1, 1]})
        im = ax[0].imshow(D, cmap="viridis_r")
        ax[0].set_xticks(range(len(names)), names, rotation=40, ha="right", fontsize=8)
        ax[0].set_yticks(range(len(names)), names, fontsize=8)
        fig.colorbar(im, ax=ax[0], label="Delta (меньше = ближе)")
        ax[0].set_title(f"Delta · {mfw} MFW · {len(segs)} отрезков")
        Dsym = (D + D.T) / 2
        np.fill_diagonal(Dsym, 0)
        if len(names) >= 3:
            dendrogram(linkage(squareform(Dsym, checks=False), "average"), labels=names, orientation="right", ax=ax[1])
            ax[1].set_title("Дерево близости (average linkage)")
        else:
            ax[1].axis("off")
        plt.tight_layout()
        plt.show()
    return df


# ---------------------------------------------------------------------------
# 10. Тематическое моделирование (LDA) по отрезкам
# ---------------------------------------------------------------------------


def topics(texts, k=5, segment_words=400, top_words=12, extra_stop="", seed=42):
    """LDA на отрезках по segment_words слов (а не на целых текстах!), по леммам, без служебных.
    Возвращает (темы, доля тем по текстам, лучшие отрезки для каждой темы)."""
    from sklearn.decomposition import LatentDirichletAllocation
    from sklearn.feature_extraction.text import CountVectorizer

    stop = STOP_LEMMAS | {w.strip().lower() for w in re.split(r"[,;\s]+", extra_stop) if w.strip()}
    docs, owner, raw = [], [], []
    for title, text in texts.items():
        for seg in segments(text, size=segment_words):
            if len(seg.split()) < segment_words * 0.5:
                continue
            ls = content_lemmas(seg, extra_stop=stop)
            docs.append(" ".join(ls))
            owner.append(title)
            raw.append(seg)
    if len(docs) < k * 3:
        print(f"⚠ Отрезков {len(docs)} — мало для {k} тем. Уменьшите K или SEGMENT_WORDS.")
    vec = CountVectorizer(min_df=2, max_df=0.35, token_pattern=r"(?u)\b[\w-]{3,}\b")
    X = vec.fit_transform(docs)
    lda = LatentDirichletAllocation(n_components=k, random_state=seed, learning_method="batch", max_iter=50)
    W = lda.fit_transform(X)
    terms = vec.get_feature_names_out()
    top = pd.DataFrame({
        "тема": [f"T{i + 1}" for i in range(k)],
        "слова темы": [", ".join(terms[j] for j in comp.argsort()[-top_words:][::-1]) for comp in lda.components_],
        "ваш ярлык (после чтения!)": ["" for _ in range(k)],
    })
    share = pd.DataFrame(W, columns=[f"T{i + 1}" for i in range(k)])
    share["текст"] = owner
    by_text = share.groupby("текст", sort=False).mean().round(2)
    best = []
    for i in range(k):
        j = int(W[:, i].argmax())
        best.append({"тема": f"T{i + 1}", "вес": round(float(W[j, i]), 2), "текст": owner[j], "отрезок": raw[j][:300] + "…"})
    print(f"Отрезков: {len(docs)} · словарь модели: {len(terms)} лемм · лемматизация: {_BACKEND}")
    return top, by_text, pd.DataFrame(best)


# ---------------------------------------------------------------------------
# 11. Библиография: OpenAlex (бесплатно; ключ даёт больший дневной лимит)
# ---------------------------------------------------------------------------


def openalex(queries, api_key="", per_query=25, from_year=None, out_csv="openalex_thesis.csv"):
    """queries — строки через «|» или перенос строки. Возвращает таблицу и сохраняет CSV."""
    import requests

    qs = [q.strip() for q in re.split(r"[|\n]", queries) if q.strip()]
    rows = []
    for q in qs:
        params = {"search": q, "per_page": min(int(per_query), 100), "sort": "relevance_score:desc"}
        if from_year:
            params["filter"] = f"from_publication_date:{int(from_year)}-01-01"
        if api_key.strip():
            params["api_key"] = api_key.strip()
        try:
            r = requests.get("https://api.openalex.org/works", params=params, timeout=60,
                             headers={"User-Agent": "SamSU-DH-course/2.0"})
        except Exception as e:
            print(f"✗ «{q}»: нет связи с OpenAlex ({type(e).__name__}).")
            continue
        if r.status_code == 429:
            print("✗ OpenAlex: лимит запросов исчерпан (429). Получите бесплатный ключ: "
                  "https://openalex.org/settings/api и вставьте в поле API_KEY.")
            break
        if r.status_code != 200:
            print(f"✗ «{q}»: ответ {r.status_code}: {r.text[:200]}")
            continue
        data = r.json()
        print(f"«{q}»: всего в каталоге ≈ {data.get('meta', {}).get('count')}, взято {len(data.get('results', []))}")
        for w in data.get("results", []):
            src = ((w.get("primary_location") or {}).get("source") or {}).get("display_name")
            authors = ", ".join(a["author"]["display_name"] for a in (w.get("authorships") or [])[:3]
                                if a.get("author"))
            rows.append({
                "запрос": q, "год": w.get("publication_year"), "название": w.get("display_name"),
                "авторы": authors, "издание": src, "цитирований": w.get("cited_by_count"),
                "язык": w.get("language"), "doi": w.get("doi") or "", "openalex": w.get("id"),
                "беру? (да/нет + почему)": "",
            })
        time.sleep(0.2)
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.drop_duplicates(subset=["openalex"]).reset_index(drop=True)
        df.to_csv(out_csv, index=False, encoding="utf-8-sig")
        print(f"Сохранено: {out_csv} ({len(df)} уникальных работ). Скачать: значок папки слева → ⋮ → Скачать.")
    return df


def plot_years(df, title="Публикации по годам"):
    import matplotlib.pyplot as plt

    if df is None or df.empty or "год" not in df or df["год"].dropna().empty:
        print("Нет данных о годах для графика.")
        return
    s = df["год"].dropna().astype(int).value_counts().sort_index()
    ax = s.plot(kind="bar", figsize=(10, 3.2), color="#0f766e")
    ax.set_xlabel("")
    ax.set_ylabel("работ")
    ax.set_title(title)
    plt.tight_layout()
    plt.show()


# ---------------------------------------------------------------------------
# 12. Wikidata и Open Library
# ---------------------------------------------------------------------------

_WD_HEADERS = {"User-Agent": "SamSU-DH-course/2.0 (educational; https://pavelaleks.github.io/samarkand_lectures/)"}


def _net_fail(service, e):
    print(f"✗ {service}: нет ответа ({type(e).__name__}). Проверьте интернет, подождите минуту и запустите ячейку снова.")


def wikidata_find(name, lang="ru", limit=5):
    """Находит Q-идентификатор по имени. Выберите нужную строку по описанию."""
    import requests

    try:
        return _wikidata_find(name, lang, limit)
    except Exception as e:
        _net_fail("Wikidata", e)
        return pd.DataFrame(columns=["QID", "название", "описание"])


def _wikidata_find(name, lang, limit):
    import requests

    r = requests.get("https://www.wikidata.org/w/api.php", headers=_WD_HEADERS, timeout=60, params={
        "action": "wbsearchentities", "search": name, "language": lang, "uselang": lang,
        "format": "json", "limit": limit, "type": "item"})
    r.raise_for_status()
    return pd.DataFrame([{"QID": x["id"], "название": x.get("label"), "описание": x.get("description", "")}
                         for x in r.json().get("search", [])])


def wikidata_author(qid):
    """Основные факты об авторе + его произведения из Wikidata (с годами, где есть)."""
    try:
        return _wikidata_author(qid)
    except Exception as e:
        _net_fail("Wikidata SPARQL", e)
        return pd.DataFrame(), pd.DataFrame()


def _wikidata_author(qid):
    import requests

    q = f"""
    SELECT ?prop ?valLabel WHERE {{
      VALUES (?p ?prop) {{ (wdt:P569 "родился") (wdt:P570 "умер") (wdt:P19 "место рождения")
                         (wdt:P20 "место смерти") (wdt:P27 "гражданство") (wdt:P1412 "язык")
                         (wdt:P135 "направление") (wdt:P166 "награда") }}
      wd:{qid} ?p ?val .
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ru,en". }}
    }}"""
    q2 = f"""
    SELECT ?work ?workLabel (MIN(YEAR(?d)) AS ?year) WHERE {{
      ?work wdt:P50 wd:{qid} .
      OPTIONAL {{ ?work wdt:P577 ?d }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "ru,en". }}
    }} GROUP BY ?work ?workLabel ORDER BY ?year LIMIT 200"""

    def run(query):
        r = requests.get("https://query.wikidata.org/sparql", params={"query": query, "format": "json"},
                         headers=_WD_HEADERS, timeout=90)
        r.raise_for_status()
        return r.json()["results"]["bindings"]

    facts = pd.DataFrame([{"свойство": b["prop"]["value"], "значение": b["valLabel"]["value"]} for b in run(q)])
    works = pd.DataFrame([{"произведение": b["workLabel"]["value"],
                           "год": int(b["year"]["value"]) if "year" in b else None,
                           "wikidata": b["work"]["value"]} for b in run(q2)])
    print(f"Фактов: {len(facts)}, произведений в Wikidata: {len(works)}. "
          "Wikidata — справочник для сверки, а не источник для цитирования.")
    return facts, works


def openlibrary_author(name, limit=100):
    import requests

    try:
        r = requests.get("https://openlibrary.org/search.json", params={"author": name, "limit": limit}, timeout=60)
        r.raise_for_status()
    except Exception as e:
        _net_fail("Open Library", e)
        return pd.DataFrame(columns=["название", "год первого издания", "изданий", "языки"])
    docs = r.json().get("docs", [])
    df = pd.DataFrame([{"название": d.get("title"), "год первого издания": d.get("first_publish_year"),
                        "изданий": d.get("edition_count"), "языки": ", ".join((d.get("language") or [])[:6])}
                       for d in docs])
    print(f"Open Library: найдено {r.json().get('numFound', 0)}, показано {len(df)}.")
    return df


# ---------------------------------------------------------------------------
# 13. Абзац для раздела «Методология»
# ---------------------------------------------------------------------------


def method_note(method, texts=None, **params):
    """Черновик абзаца для диссертации. ОБЯЗАТЕЛЬНО отредактируйте его своими словами."""
    n_texts = len(texts) if texts else "N"
    n_words = sum(len(tokenize(t)) for t in texts.values()) if texts else "N"
    p = ", ".join(f"{k} = {v}" for k, v in params.items())
    lem = ("лемматизация выполнена морфологическим анализатором pymorphy3"
           if _BACKEND == "pymorphy3" else "подсчёт вёлся по словоформам без лемматизации")
    txt = (
        f"Для проверки гипотезы был применён метод «{method}». Материал: {n_texts} текст(а/ов), "
        f"{n_words} словоупотреблений; тексты подготовлены по правилам, описанным в паспорте корпуса "
        f"(приложение _). Обработка выполнена в Google Colab (Python; учебная библиотека курса dh_utils), "
        f"{lem}. Параметры: {p or '—'}. Количественный результат рассматривается как гипотеза и проверен "
        f"анализом контекстов (конкорданс, _ примеров; цитаты сверены по изданию: _). "
        f"Ограничения метода: _."
    )
    print(txt)


# ---------------------------------------------------------------------------
# 14. Работа с бесплатным чатом ИИ: промпт и проверка цитат
# ---------------------------------------------------------------------------


def llm_prompt(fragment, question, role="литературовед, специалист по русской прозе"):
    """Готовит промпт для бесплатного чата (DeepSeek, Qwen, Gemini, GigaChat…).
    Требует от модели дословных цитат — их потом проверяет check_quotes()."""
    frag = re.sub(r"\s+", " ", fragment).strip()
    if len(frag.split()) > 900:
        print("⚠ Фрагмент длиннее ~900 слов — модели чаще «досочиняют». Возьмите короче.")
    prompt = f"""Ты — {role}. Работай ТОЛЬКО с фрагментом ниже, не используй пересказы из памяти.

ВОПРОС: {question.strip()}

ТРЕБОВАНИЯ К ОТВЕТУ:
1. Дай 3–5 наблюдений. Каждое — отдельным пунктом.
2. Для каждого наблюдения приведи ДОСЛОВНУЮ цитату из фрагмента в кавычках «…» (не длиннее 25 слов).
3. Укажи уверенность: высокая / средняя / низкая — и почему.
4. Если фрагмент не даёт ответа, так и напиши: «во фрагменте нет данных».
5. Не придумывай факты биографии, даты и цитаты из других текстов.

ФРАГМЕНТ:
«{frag}»"""
    print(prompt)
    return prompt


def _norm_q(s):
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[^а-яa-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def check_quotes(answer, texts, min_words=3):
    """Находит в ответе модели цитаты в «…», "…" или “…” и проверяет, есть ли они в текстах дословно.
    «частично» — совпало ≥ 70 % слов подряд идущими кусками (модель могла слегка переиначить)."""
    quotes = re.findall(r"«([^»]{5,400})»|\"([^\"]{5,400})\"|“([^”]{5,400})”", answer)
    quotes = [next(x for x in q if x) for q in quotes]
    corpus = {t: _norm_q(v) for t, v in texts.items()}
    rows = []
    for q in quotes:
        nq = _norm_q(q)
        if len(nq.split()) < min_words:
            continue
        where = [t for t, v in corpus.items() if nq in v]
        status = "✓ дословно" if where else ""
        if not where:
            ws = nq.split()
            best = 0
            for t, v in corpus.items():
                hit = sum(1 for i in range(len(ws) - 2) if " ".join(ws[i:i + 3]) in v)
                share = hit / max(len(ws) - 2, 1)
                if share > best:
                    best, where = share, [t]
            status = "≈ частично" if best >= 0.7 else "✗ НЕ НАЙДЕНО — возможна выдумка"
            if best < 0.7:
                where = []
        rows.append({"цитата из ответа ИИ": q[:120], "проверка": status, "где": ", ".join(where)})
    df = pd.DataFrame(rows, columns=["цитата из ответа ИИ", "проверка", "где"])
    if df.empty:
        print("Цитат в кавычках не найдено. Попросите модель цитировать в «ёлочках».")
    else:
        bad = (df["проверка"].str.startswith("✗")).sum()
        print(f"Цитат: {len(df)} · не найдено: {bad}. Даже дословную цитату сверьте с печатным изданием.")
    return df

