# -*- coding: utf-8 -*-
"""
Шаг 3. «Панель моей диссертации» — веб-приложение на материале вашей магистерской.
Работает на той же библиотеке dh_utils, что и 12 пар в Colab.

ЧТО ПОМЕНЯТЬ ПОД СЕБЯ (блок НАСТРОЙКИ ниже):
  THESIS_TITLE, AUTHOR_LATIN, FIELDS_DEFAULT, POS_DEFAULT, NEG_DEFAULT, QUERIES_DEFAULT.
Дальше — по желанию: убрать ненужные разделы из PAGES, добавить свой.
На предзащите панель показывают как «цифровое приложение к диссертации».
"""
import contextlib
import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
import streamlit as st  # noqa: E402

import dh_utils as dh  # noqa: E402

# ============================ НАСТРОЙКИ (поменяйте под свою тему) ============================
THESIS_TITLE = "Мотив памяти в цикле И. А. Бунина «Тёмные аллеи»"
AUTHOR_LATIN = "Ivan Bunin"
FIELDS_DEFAULT = (
    "любовь: любовь, любить, страсть, нежность, поцелуй, поцеловать | "
    "память: память, помнить, вспомнить, вспоминать, воспоминание, забыть, прошлое, давно | "
    "время: время, год, вечер, ночь, осень, зима, утро, жизнь"
)
POS_DEFAULT = "счастье, счастливый, любовь, любить, нежный, радость, светлый, милый, весёлый, улыбаться"
NEG_DEFAULT = "смерть, умереть, война, горе, страшный, боль, тоска, слёзы, плакать, холодный, разлука"
QUERIES_DEFAULT = '"Ivan Bunin" memory | "Dark Avenues" Bunin'
DEMO_STORIES = ["Кавказ", "Холодная осень", "Чистый понедельник", "Натали", "Руся"]
# ============================================================================================

st.set_page_config(page_title="Панель диссертации", page_icon="📊", layout="wide")

# графики dh_utils рисуются через matplotlib — показываем их на странице
plt.show = lambda *a, **k: (st.pyplot(plt.gcf()), plt.close("all"))


@st.cache_resource(show_spinner="Готовлю лемматизатор (один раз)…")
def prepare():
    with contextlib.redirect_stdout(io.StringIO()):
        return dh.setup(quiet=True)


def quiet(fn, *args, **kw):
    """Вызывает функцию dh_utils и показывает её сообщения (предупреждения) под результатом."""
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = fn(*args, **kw)
    msg = buf.getvalue().strip()
    if msg:
        st.caption(msg.replace("\n", "  \n"))
    return out


@st.cache_data(show_spinner="Загружаю тексты…")
def load_demo(corpus, titles):
    with contextlib.redirect_stdout(io.StringIO()):
        return dh.load_demo(corpus, "; ".join(titles))


backend = prepare()
texts = st.session_state.get("texts", {})

# ---------------------------------------------------------------- боковая панель
with st.sidebar:
    st.markdown(f"### 📊 {THESIS_TITLE}")
    st.caption(f"Лемматизация: {backend}")
    PAGES = [
        "1. Мой корпус",
        "2. Смысловые поля",
        "3. Контексты",
        "4. Дуга тональности",
        "5. Ключевые слова",
        "6. Литература (API)",
        "7. Автор (Wikidata)",
        "8. Проверка цитат ИИ",
    ]
    page = st.radio("Раздел", PAGES, label_visibility="collapsed")
    st.divider()
    st.caption(f"Текстов в корпусе: {len(texts)}")

st.title(page[3:])

# ---------------------------------------------------------------- 1. корпус
if page.startswith("1"):
    src = st.radio("Откуда тексты", ["Мои файлы (.txt, .docx)", "Бунин (демо)", "Чехов (демо)"], horizontal=True)
    if src.startswith("Мои"):
        files = st.file_uploader("Загрузите главы, рассказы, стихотворения — один файл = одна единица анализа", type=["txt", "docx"], accept_multiple_files=True)
        if files and st.button("Взять эти файлы в корпус", type="primary"):
            st.session_state.texts = {f.name.rsplit(".", 1)[0]: dh.clean(dh._read_bytes(f.name, f.getvalue())) for f in files}
            st.rerun()
    else:
        titles = list(dh.list_demo(src)["название"])
        chosen = st.multiselect("Рассказы", titles, default=[t for t in DEMO_STORIES if t in titles] or titles[:3])
        if chosen and st.button("Загрузить", type="primary"):
            st.session_state.texts = load_demo(src, chosen)
            st.rerun()
    if texts:
        st.subheader("Состав корпуса")
        st.dataframe(dh.lexical_stats(texts), use_container_width=True, hide_index=True)
        st.caption("TTR зависит от длины текста — сравнивайте STTR.")
    else:
        st.info("Корпус пуст: загрузите свои файлы или демо-тексты.")

elif not texts:
    st.warning("Сначала загрузите тексты в разделе «1. Мой корпус».")

# ---------------------------------------------------------------- 2. поля
elif page.startswith("2"):
    fields_txt = st.text_area("Смысловые поля: «поле: лемма, лемма, начало*» — поля через |", FIELDS_DEFAULT, height=110)
    fields = dh.parse_fields(fields_txt)
    df, hits = quiet(dh.field_table, texts, fields)
    per = df.set_index("текст")[[c for c in df.columns if c.endswith(" /1000")]]
    per.columns = [c.replace(" /1000", "") for c in per.columns]
    st.bar_chart(per)
    st.dataframe(df, use_container_width=True, hide_index=True)
    with st.expander("Какие формы дали частоту (проверка словаря)"):
        st.dataframe(dh.top_forms(hits, 10), use_container_width=True, hide_index=True)
    st.download_button("⬇ Таблица полей (CSV)", df.to_csv(index=False).encode("utf-8-sig"), "polya.csv", "text/csv")

# ---------------------------------------------------------------- 3. контексты
elif page.startswith("3"):
    words = st.text_input("Слова через запятую (леммы; звёздочка — любое продолжение)", "вспомнить, помнить, память")
    width = st.slider("Ширина контекста (знаков)", 30, 150, 70)
    if words.strip():
        df = quiet(dh.kwic, texts, words, width=width, limit=5000)
        st.dataframe(df, use_container_width=True, hide_index=True)

# ---------------------------------------------------------------- 4. дуга
elif page.startswith("4"):
    title = st.selectbox("Текст", list(texts))
    c1, c2 = st.columns(2)
    pos = c1.text_area("Положительные слова", POS_DEFAULT, height=100)
    neg = c2.text_area("Отрицательные слова", NEG_DEFAULT, height=100)
    n = st.slider("Число отрезков", 4, 30, 10)
    arc = quiet(dh.arc, texts[title], pos, neg, n=n, title=title)
    st.dataframe(arc[["отрезок", "POS", "NEG", "баланс /1000", "POS-слова", "NEG-слова"]], use_container_width=True, hide_index=True)
    seg = st.number_input("Прочитать отрезок №", 1, len(arc), int(arc["баланс /1000"].idxmin()) + 1)
    st.write(dh.segments(texts[title], n=n)[seg - 1])

# ---------------------------------------------------------------- 5. ключевые слова
elif page.startswith("5"):
    target_names = st.multiselect("Изучаемые тексты", list(texts), default=list(texts)[:1])
    ref_mode = st.radio("Фон для сравнения", ["остальные тексты корпуса", "весь цикл Бунина (демо)", "рассказы Чехова (демо)"], horizontal=True)
    if target_names:
        target = {k: texts[k] for k in target_names}
        if ref_mode.startswith("остальные"):
            reference = {k: v for k, v in texts.items() if k not in target}
        else:
            corpus = "Бунин (демо)" if "Бунина" in ref_mode else "Чехов (демо)"
            reference = {k: v for k, v in load_demo(corpus, ["все"]).items() if k not in target}
        if not reference:
            st.warning("Фон пуст: добавьте в корпус ещё тексты или выберите демо-фон.")
        else:
            st.dataframe(quiet(dh.keywords, target, reference, top=40), use_container_width=True, hide_index=True)

# ---------------------------------------------------------------- 6. литература
elif page.startswith("6"):
    st.caption("OpenAlex API. Запросы через «|», по-английски. Бесплатный ключ увеличивает лимит: openalex.org/settings/api")
    q = st.text_input("Запросы", QUERIES_DEFAULT)
    key = st.text_input("Ключ OpenAlex (необязательно)", type="password")
    if st.button("Найти", type="primary"):
        st.session_state.bib = quiet(dh.openalex, q, api_key=key, per_query=25, out_csv="openalex_panel.csv")
    bib = st.session_state.get("bib")
    if bib is not None and not bib.empty:
        quiet(dh.plot_years, bib, "Публикации по годам")
        st.dataframe(bib.drop(columns=["беру? (да/нет + почему)"], errors="ignore"), use_container_width=True, hide_index=True)
        st.download_button("⬇ CSV", bib.to_csv(index=False).encode("utf-8-sig"), "literatura.csv", "text/csv")

# ---------------------------------------------------------------- 7. автор
elif page.startswith("7"):
    name = st.text_input("Автор", AUTHOR_LATIN)
    if name.strip():
        found = quiet(dh.wikidata_find, name)
        if found.empty:
            st.info("Не найдено.")
        else:
            opts = [f'{r["название"]} — {r["описание"]} ({r["QID"]})' for _, r in found.iterrows()]
            pick = st.selectbox("Кого показать", opts)
            qid = pick.rsplit("(", 1)[1].rstrip(")")
            facts, works = quiet(dh.wikidata_author, qid)
            c1, c2 = st.columns([1, 2])
            c1.dataframe(facts, use_container_width=True, hide_index=True)
            c2.dataframe(works, use_container_width=True, hide_index=True)

# ---------------------------------------------------------------- 8. проверка цитат
elif page.startswith("8"):
    title = st.selectbox("Текст", list(texts))
    words = texts[title].split()
    start = st.slider("С какого слова фрагмент", 0, max(len(words) - 200, 0), 0, step=50)
    n = st.slider("Длина фрагмента (слов)", 200, 900, 500, step=50)
    question = st.text_input("Ваш вопрос к фрагменту", "Какие детали создают мотив памяти в этом фрагменте?")
    with contextlib.redirect_stdout(io.StringIO()):
        prompt = dh.llm_prompt(" ".join(words[start : start + n]), question)
    st.markdown("**1. Скопируйте промпт в бесплатный чат ИИ** (DeepSeek, Qwen, Gemini):")
    st.code(prompt, language="text")
    answer = st.text_area("**2. Вставьте ответ модели** — проверим, есть ли его цитаты в тексте", height=160)
    if answer.strip():
        st.dataframe(quiet(dh.check_quotes, answer, texts), use_container_width=True, hide_index=True)
