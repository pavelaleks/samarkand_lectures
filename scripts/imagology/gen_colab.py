# -*- coding: utf-8 -*-
"""
Генератор блокнотов Colab курса «Имагология».

    python scripts/imagology/gen_colab.py public/imagology/lab/colab

Вся логика — в public/imagology/lab/colab/imago_utils.py (блокнот скачивает её с сайта в ячейке «Подготовка»).
"""
import json
import sys
from pathlib import Path

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "public/imagology/lab/colab")
OUT.mkdir(parents=True, exist_ok=True)
SITE = "https://pavelaleks.github.io/samarkand_lectures/imagology/lab/"

PAIRS = ["—", "persidskie", "custine", "orientales", "divan", "itineraire", "arzrum", "plennik", "bela", "peri",
         "prorok", "spor", "ammalat", "burden", "samarkand", "sarty", "nikitin"]


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip("\n")}


def code(text, form=True):
    meta = {"cellView": "form"} if form else {}
    return {"cell_type": "code", "metadata": meta, "execution_count": None, "outputs": [], "source": text.strip("\n")}


def header(n, title, question, get, stand, practicum):
    return md(f"""
# Имагология · блокнот {n}. {title}

| | |
|---|---|
| **Вопрос** | {question} |
| **Что вы получите** | {get} |
| **Стенд в браузере** | [{stand[0]}]({SITE}{stand[1]}) |
| **Практические** | {practicum} · [задания]({SITE}practicum.html) |

**Правило курса:** описываем образ в тексте, а не «правду» о народе. Число без контекста в работу не идёт: каждую цифру проверьте предложением.
""")


HOWTO = md("""
### Как работать
1. **Файл → Сохранить копию на Диске**, иначе правки пропадут.
2. Запускайте ячейки **сверху вниз** кнопкой ▶. Код спрятан, меняются только **поля формы** справа.
3. Сначала запустите всё как есть: демо на готовой паре текстов из Викитеки. Потом впишите свои тексты.

**Как задать тексты** (в полях через `;`):
- ключ готового текста: `pushkin-arzrum`, `custine`, `vambery` — список выводит `list_texts()`; русский перевод западного текста — `hugo-orientales@ru`;
- страница Викитеки: `ws:ru:Мцыри (Лермонтов)`, `ws:en:The Giaour`, `ws:fr:Les Orientales`;
- ссылка на .txt: `https://www.gutenberg.org/cache/epub/41751/pg41751.txt`;
- `МОИ ФАЙЛЫ` — появится кнопка загрузки .txt или .docx.

> Ошибка? **Среда выполнения → Перезапустить сеанс**, затем ячейки сверху вниз. Викитека иногда отвечает медленно: подождите и запустите ячейку ещё раз.
""")

SETUP = code(f"""
#@title 🔧 Подготовка — просто запустите ▶ {{ display-mode: "form" }}
import subprocess, sys, importlib, requests
subprocess.run([sys.executable, "-m", "pip", "-q", "install", "python-docx", "folium"], check=False)
_u = "{SITE}colab/imago_utils.py"
open("imago_utils.py", "wb").write(requests.get(_u, timeout=60).content)
import imago_utils; importlib.reload(imago_utils)
from imago_utils import *
setup()
""")


def texts_cell(a, b, pair="—", note=""):
    opts = json.dumps(PAIRS, ensure_ascii=False)
    return code(f"""
#@title 📂 Тексты {{ display-mode: "form" }}
#@markdown Готовая пара заполнит оба корпуса (поля ниже тогда не нужны). Список пар — `list_pairs()`.
PAIR = "{pair}"  #@param {opts}
#@markdown Корпус A (обычно Россия) и корпус B (обычно Запад): ключи, `ws:язык:Название`, ссылки, `МОИ ФАЙЛЫ` — через «;».
CORPUS_A = "{a}"  #@param {{type:"string"}}
CORPUS_B = "{b}"  #@param {{type:"string"}}
{note}
if PAIR != "—":
    _p = next(p for p in imago_utils._data("presets")["pairs"] if p["id"] == PAIR)
    CORPUS_A, CORPUS_B = _p["left"], _p["right"]
    print("Пара:", _p["title"]); print("Вопрос:", _p["question"])
A = analyze_all(load_spec(CORPUS_A, "россия")) if CORPUS_A.strip() else []
B = analyze_all(load_spec(CORPUS_B, "запад")) if CORPUS_B.strip() else []
print("\\nКорпус A:", "; ".join(a["label"] for a in A)); print("Корпус B:", "; ".join(b["label"] for b in B))
""")


def hypothesis(default):
    return code(f"""
#@title 💡 Гипотеза — до подсчёта! {{ display-mode: "form" }}
HYPOTHESIS = "{default}"  #@param {{type:"string"}}
print("Гипотеза зафиксирована:", HYPOTHESIS)
""")


def save(nb, name):
    nb_json = {"nbformat": 4, "nbformat_minor": 0,
               "metadata": {"colab": {"provenance": [], "toc_visible": True}, "kernelspec": {"name": "python3", "display_name": "Python 3"},
                            "language_info": {"name": "python"}},
               "cells": nb}
    (OUT / name).write_text(json.dumps(nb_json, ensure_ascii=False, indent=1), encoding="utf-8")
    print("✓", name)


# ── 1. Völkertafel
save([
    header(1, "Цифровая Völkertafel", "Какие признаки русские и западные тексты приписывают одним и тем же народам?",
           "Таблицу «признак × народ» по двум корпусам, тепловую карту для главы, контексты в Excel с колонкой ручной проверки.",
           ("Цифровая Völkertafel", "volkertafel.html"), "2, 5, 8"),
    HOWTO, SETUP,
    texts_cell("dostoevsky-zametki", "custine", "custine"),
    hypothesis("У Кюстина Россия получает признаки деспотии и рабства, у Достоевского их получает Европа"),
    code("""
#@title 📊 Таблица «признак × народ» { display-mode: "form" }
#@markdown Народы — части названий через запятую (`черкес, турк, русск`). Пусто — 8 самых упоминаемых.
GROUPS = ""  #@param {type:"string"}
METRIC = "pct"  #@param ["pct", "n"]
_g = [find_id("groups", x.strip()) for x in GROUPS.split(",") if x.strip()] or None
VT = volkertafel(A, B or None, groups=_g, metric=METRIC)
print("Предложений о народе (A, B):", VT.attrs["totals"])
fig = plot_volkertafel(VT, "Цифровая Völkertafel: " + ("% предложений о народе" if METRIC == "pct" else "число предложений"))
fig.savefig("volkertafel.png", dpi=200, bbox_inches="tight")
VT.loc[:, (VT != 0).any()]
"""),
    md("""
### Проверка контекстами
Выберите самую «яркую» клетку и прочитайте предложения. В колонке «проверка» поставьте *верно*, *ложно* (омоним, отрицание, чужая речь) или *спорно*. Доля ложных срабатываний — обязательная часть вывода.
"""),
    code("""
#@title 🔎 Контексты клетки { display-mode: "form" }
GROUP = "русск"  #@param {type:"string"}
TRAIT = "деспот"  #@param {type:"string"}
CTX = contexts(A + B, group=find_id("groups", GROUP), trait=find_id("traits", TRAIT))
print(len(CTX), "предложений")
CTX.head(40)
"""),
    code("""
#@title 💾 Сохранить: таблица, контексты, картинка { display-mode: "form" }
save_excel({"Völkertafel": VT, "Контексты": CTX}, "volkertafel.xlsx")
download("volkertafel.xlsx"); download("volkertafel.png")
"""),
    md("""
### Абзац для работы (образец)
> В корпусе A (…, N предложений о …) лексика *…* сопровождает этноним в X % случаев, в корпусе B (…) — в Y %. Ручная проверка 30 контекстов показала Z ложных срабатываний (…). Различие подтверждается чтением: «…» (с. …). Ограничение метода: словарь не учитывает отрицание и иронию.
"""),
], "Imago01_Volkertafel.ipynb")

# ── 2. Карта
save([
    header(2, "Карта взгляда", "Какое пространство строит травелог: что названо, что пропущено, где граница своего?",
           "Интерактивную карту маршрутов и мест текста, таблицу мест, GeoJSON для QGIS или geojson.io, список неизвестных имён.",
           ("Карта взгляда", "karta.html"), "4, 8"),
    HOWTO, SETUP,
    texts_cell("pushkin-arzrum", "dumas-caucase", "arzrum"),
    code("""
#@title 🧭 Маршруты { display-mode: "form" }
#@markdown Ключи через запятую: nikitin, karamzin, pushkin, lermontov, custine, dumas, vambery, vereshchagin, schuyler, burnaby.
ROUTES = "pushkin, dumas"  #@param {type:"string"}
_r = tuple(x.strip() for x in ROUTES.split(",") if x.strip())
list_routes()
"""),
    code("""
#@title 🗺️ Карта { display-mode: "form" }
M = make_map([c for c in (A, B) if c], routes=_r)
M.save("karta_vzglyada.html")
M
"""),
    code("""
#@title 📋 Места и регионы { display-mode: "form" }
PT = place_table(A + B)
print(PT.groupby(["текст", "регион"])["упоминаний"].sum().unstack(fill_value=0).T)
PT.head(40)
"""),
    code("""
#@title ❓ Неизвестные имена (кандидаты в места) { display-mode: "form" }
#@markdown Слова с заглавной буквы не в начале предложения, которых нет в газеттире. Проверьте вручную: место, человек или народ?
for w, n in unknown_names(A + B, 40):
    print(f"{n:4d}  {w}")
"""),
    code("""
#@title 💾 Сохранить GeoJSON, таблицу, карту { display-mode: "form" }
to_geojson([c for c in (A, B) if c], routes=_r)
save_excel({"Места": PT}, "mesta.xlsx")
for f in ("karta_vzglyada.geojson", "mesta.xlsx", "karta_vzglyada.html"):
    download(f)
"""),
], "Imago02_Karta_vzglyada.ipynb")

# ── 3. Параллель
save([
    header(3, "Параллельное чтение", "Одинаков ли Восток у русского и западного автора: какие мотивы и признаки выходят на первый план?",
           "Профили мотивов и признаков двух корпусов на 10 000 слов, «сцену» в обоих текстах, ключевые слова для текстов одного языка.",
           ("Параллельный читатель", "parallel.html"), "1, 3, 6, 7"),
    HOWTO, SETUP,
    texts_cell("pushkin-fontan", "hugo-orientales", "orientales"),
    hypothesis("У Гюго мотив гарема и оружия заметнее, у Пушкина — сад и фонтан"),
    code("""
#@title 📊 Профили { display-mode: "form" }
KIND = "motifs"  #@param ["motifs", "traits", "groups"]
PR = compare_profiles(A, B, KIND, names=("A", "B"))
plot_profiles(PR, {"motifs": "Мотивы", "traits": "Признаки", "groups": "Народы"}[KIND] + ", на 10 000 слов")
import matplotlib.pyplot as plt; plt.savefig("profili.png", dpi=200, bbox_inches="tight")
PR
"""),
    code("""
#@title 🎭 Сцена в обоих текстах { display-mode: "form" }
#@markdown Часть названия мотива: `гарем`, `кинжал`, `сад`, `пустын`, `мечет`.
MOTIF = "гарем"  #@param {type:"string"}
_m = find_id("motifs", MOTIF)
SC = contexts(A + B, motif=_m)
for side, g in SC.groupby("сторона"):
    print(f"\\n— {side}: {len(g)} предложений")
    for s in g["предложение"].head(8):
        print("  •", s[:300])
"""),
    code("""
#@title 🔑 Ключевые слова (если оба текста на одном языке) { display-mode: "form" }
KA, KB = keyness(A, B)
print("Чаще в A:"); display(KA.head(20)) if not KA.empty else print("—")
print("Чаще в B:"); display(KB.head(20)) if not KB.empty else print("—")
"""),
    code("""
#@title 💾 Сохранить { display-mode: "form" }
save_excel({"Профили": PR, "Сцена": SC}, "parallel.xlsx")
download("parallel.xlsx"); download("profili.png")
"""),
], "Imago03_Parallel.ipynb")

# ── 4. Досье
save([
    header(4, "Досье одного образа", "Как один образ (сарт, черкешенка, дервиш, Самарканд) живёт в русских и западных источниках?",
           "Все контексты образа по корпусу, таблицу его признаков по сторонам, черновик досье в Word по структуре задания.",
           ("Практикум и задание", "practicum.html#dosye"), "весь семестр"),
    HOWTO, SETUP,
    code("""
#@title 🎯 Образ { display-mode: "form" }
IMAGE = "черкешенка"  #@param {type:"string"}
#@markdown Народ из словаря (часть названия) — если образ связан с этнонимом. Пусто — только свои основы.
GROUP = "черкес"  #@param {type:"string"}
#@markdown Свои основы слов через запятую (по началу слова, на всех языках корпуса).
STEMS = "черкешенк, circassian, бэл"  #@param {type:"string"}
_g = find_id("groups", GROUP) if GROUP.strip() else None
_s = [x for x in STEMS.split(",") if x.strip()]
"""),
    texts_cell("pushkin-plennik; lermontov-bela; marlinsky-ammalat", "byron-giaour; montagu", "—"),
    code("""
#@title 🔎 Контексты образа { display-mode: "form" }
CTX = image_contexts(A + B, group=_g, stems=_s)
print(len(CTX), "контекстов:", CTX.groupby("текст").size().to_dict())
CTX.head(30)
"""),
    code("""
#@title 📊 Признаки образа по сторонам { display-mode: "form" }
TR = trait_row(CTX)
if not TR.empty:
    ax = TR[[c for c in TR.columns if str(c).startswith("%")]].head(15).iloc[::-1].plot.barh(figsize=(8, 6), color=["#a1392b", "#2c5f8a"])
    ax.set_title(f"«{IMAGE}»: % контекстов с признаком"); ax.set_xlabel("%")
    import matplotlib.pyplot as plt; plt.tight_layout(); plt.savefig("priznaki_obraza.png", dpi=200)
TR
"""),
    code("""
#@title 📝 Черновик досье в Word { display-mode: "form" }
PER_TEXT = 8  #@param {type:"integer"}
_f = dossier_docx(IMAGE, A + B, CTX, TR, per_text=PER_TEXT)
save_excel({"Контексты": CTX, "Признаки": TR}, "dosye_dannye.xlsx")
download(_f); download("dosye_dannye.xlsx")
"""),
    md(f"""
Дальше: [шаблон досье (.docx)]({SITE}Dosye_odnogo_obraza.docx) с критериями, карта — в блокноте 2, визуальный ряд — [Галерея образов]({SITE}galereya.html).
"""),
], "Imago04_Dosye_obraza.ipynb")
