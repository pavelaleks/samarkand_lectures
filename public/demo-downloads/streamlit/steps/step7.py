# -*- coding: utf-8 -*-
# ШАГ 7. Подключаем API: литература по теме из OpenAlex (st.cache_data — не спрашивать сервер дважды). Новые строки — «# НОВОЕ».
import re                                                          # регулярные выражения
from collections import Counter                                    # счётчик слов

import requests                                                    # НОВОЕ: запросы к API
import pandas as pd                                                # таблицы
import streamlit as st

STOP = set("и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее её мне было вот от меня еще ещё нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее неё сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это".split())  # стоп-слова


def read_file(f):
    data = f.getvalue()
    if f.name.lower().endswith(".docx"):
        import io
        from docx import Document
        from docx.oxml.ns import qn
        from docx.text.paragraph import Paragraph
        doc = Document(io.BytesIO(data))
        # все абзацы, включая таблицы и надписи (doc.paragraphs таблицы пропускает)
        return "\n".join(Paragraph(p, doc).text for p in doc.element.body.iter(qn("w:p")))
    for enc in ("utf-8-sig", "cp1251"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    return data.decode("utf-8", errors="replace")


def tokenize(text):                                                # текст → список слов
    return re.findall(r"[а-яёa-z]+(?:-[а-яёa-z]+)?", text.lower())


def kwic(text, word, width=60):                                    # поиск контекстов
    rows = []
    for m in re.finditer(r"\b" + re.escape(word.lower()), text.lower()):  # каждое вхождение
        a, b = m.start(), m.end()
        rows.append({"слева": text[max(0, a - width):a].replace("\n", " "),
                     "слово": text[a:b],
                     "справа": text[b:b + width].replace("\n", " ")})
    return pd.DataFrame(rows)



@st.cache_data(ttl=3600)                                           # НОВОЕ: запомнить ответ на час
def openalex(query, n=25):                                         # НОВОЕ: запрос к API
    r = requests.get("https://api.openalex.org/works",             # НОВОЕ: адрес API
                     params={"search": query, "per_page": n, "sort": "cited_by_count:desc"},  # НОВОЕ
                     timeout=30)                                   # НОВОЕ
    r.raise_for_status()                                           # НОВОЕ: ошибка сервера → исключение
    return r.json()                                                # НОВОЕ: ответ в формате JSON → словарь

st.set_page_config(page_title="Мой кабинет", page_icon="📚", layout="wide")   # широкая страница

with st.sidebar:                                                   # всё внутри — в левой панели
    st.header("📚 Мой кабинет")
    files = st.file_uploader("Мои тексты (.txt, .docx)", type=["txt", "docx"],
                             accept_multiple_files=True)           # можно выбрать много файлов
    page = st.radio("Раздел", ["Мои тексты", "Частоты", "Контексты", "Мои цитаты", "Литература"])  # НОВОЕ

texts = {f.name.rsplit(".", 1)[0]: read_file(f) for f in files or []}  # {название: текст}
if not texts:
    st.info("Загрузите слева один или несколько файлов: главы, рассказы, стихотворения.")
    st.stop()

st.title(page)                                                     # заголовок = выбранный раздел

if page == "Мои тексты":                                           # раздел 1
    rows = [{"текст": name, "слов": len(tokenize(t)), "разных слов": len(set(tokenize(t)))}
            for name, t in texts.items()]                          # строка таблицы на каждый текст
    st.dataframe(pd.DataFrame(rows), hide_index=True)
    name = st.selectbox("Прочитать", list(texts))                  # выпадающий список
    st.text_area("Текст целиком (прокрутите)", texts[name], height=400)

elif page == "Частоты":                                            # раздел 2
    name = st.selectbox("Текст", ["все вместе"] + list(texts))
    text = "\n".join(texts.values()) if name == "все вместе" else texts[name]
    words = tokenize(text)
    top_n = st.slider("Сколько слов показать", 10, 100, 30)
    skip_stop = st.checkbox("Убрать служебные слова", value=True)
    counted = Counter(w for w in words if not (skip_stop and w in STOP))
    df = pd.DataFrame(counted.most_common(top_n), columns=["слово", "частота"])
    st.bar_chart(df.set_index("слово"))
    st.dataframe(df, hide_index=True)
    st.download_button("⬇ Скачать CSV (Excel)", df.to_csv(index=False).encode("utf-8-sig"),
                       "chastoty.csv", "text/csv")

elif page == "Контексты":                                          # раздел 3
    word = st.text_input("Слово или начало слова", "")
    width = st.slider("Ширина контекста, знаков", 20, 150, 60)
    if word.strip():
        parts = []                                                 # ищем во всех текстах
        for name, t in texts.items():
            found = kwic(t, word.strip(), width)
            found.insert(0, "текст", name)                         # колонка «из какого текста»
            parts.append(found)
        found = pd.concat(parts, ignore_index=True)                # склеиваем таблицы
        st.write(f"Найдено: {len(found)}")
        st.dataframe(found, hide_index=True, use_container_width=True)

elif page == "Мои цитаты":                                         # раздел 4
    if "quotes" not in st.session_state:                           # «память» приложения
        st.session_state.quotes = []                               # пустой список при первом запуске
    with st.form("new_quote", clear_on_submit=True):               # форма с кнопкой отправки
        quote = st.text_area("Цитата (скопируйте из «Контекстов» или из текста)")
        source = st.selectbox("Из какого текста", list(texts))
        note = st.text_input("Мой комментарий: что эта цитата доказывает")
        if st.form_submit_button("Сохранить цитату") and quote.strip():
            st.session_state.quotes.append({"текст": source, "цитата": quote.strip(), "комментарий": note})
    q = pd.DataFrame(st.session_state.quotes)
    st.write(f"Сохранено цитат: {len(q)}")
    if not q.empty:
        st.dataframe(q, hide_index=True, use_container_width=True)
        st.download_button("⬇ CSV", q.to_csv(index=False).encode("utf-8-sig"), "citaty.csv", "text/csv")
        import io                                                  # выгрузка в Word
        from docx import Document
        doc = Document()                                           # пустой документ
        doc.add_heading("Цитаты для диссертации", 1)
        for _, r in q.iterrows():                                  # по одной цитате
            doc.add_paragraph(f"«{r['цитата']}» ({r['текст']})")
            if r["комментарий"]:
                doc.add_paragraph().add_run("Комментарий: " + r["комментарий"]).italic = True  # курсивом
        buf = io.BytesIO()
        doc.save(buf)
        st.download_button("⬇ Word (.docx)", buf.getvalue(), "citaty.docx")
    st.warning("Цитаты живут, пока открыта вкладка и работает Colab. Скачивайте CSV/Word в конце работы!")

elif page == "Литература":                                         # НОВОЕ: раздел 5
    st.caption("OpenAlex — открытый каталог научных работ. Запрос лучше по-английски, 2–4 слова.")  # НОВОЕ
    query = st.text_input("Запрос", "Bunin memory")                # НОВОЕ
    if query.strip():                                              # НОВОЕ
        try:                                                       # НОВОЕ: сеть может подвести
            data = openalex(query.strip())                         # НОВОЕ
        except Exception as e:                                     # НОВОЕ
            st.error(f"OpenAlex не ответил: {e}. Подождите минуту и попробуйте снова.")  # НОВОЕ
            st.stop()                                              # НОВОЕ
        rows = [{"год": w.get("publication_year"),                 # НОВОЕ: из JSON берём нужные поля
                 "название": w.get("display_name"),                # НОВОЕ
                 "авторы": ", ".join(a["author"]["display_name"] for a in w.get("authorships", [])[:3]),  # НОВОЕ
                 "цитирований": w.get("cited_by_count"),           # НОВОЕ
                 "DOI": w.get("doi") or ""}                        # НОВОЕ
                for w in data.get("results", [])]                  # НОВОЕ
        lit = pd.DataFrame(rows)                                   # НОВОЕ
        st.write(f"Всего в базе: {data.get('meta', {}).get('count', 0)}, показано: {len(lit)}")  # НОВОЕ
        if not lit.empty:                                          # НОВОЕ
            st.dataframe(lit, hide_index=True, use_container_width=True,
                         column_config={"DOI": st.column_config.LinkColumn()})  # НОВОЕ: ссылки кликабельны
            st.bar_chart(lit["год"].value_counts().sort_index())   # НОВОЕ: работы по годам
            st.download_button("⬇ CSV", lit.to_csv(index=False).encode("utf-8-sig"), "literatura.csv", "text/csv")  # НОВОЕ

# ЗАДАНИЯ: 1) подберите запрос по своей теме; 2) добавьте ползунок «годы от–до» и
# фильтр в params: "filter": f"from_publication_date:{y1}-01-01,to_publication_date:{y2}-12-31";
# 3) добавьте колонку «журнал»: ((w.get("primary_location") or {}).get("source") or {}).get("display_name").
