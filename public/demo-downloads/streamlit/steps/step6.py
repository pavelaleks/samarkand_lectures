# -*- coding: utf-8 -*-
# ШАГ 6. Блокнот цитат: приложение «запоминает» ваши записи (st.session_state) и выгружает их в Word. Новые строки — «# НОВОЕ».
import re                                                          # регулярные выражения
from collections import Counter                                    # счётчик слов

import pandas as pd                                                # таблицы
import streamlit as st

STOP = set("и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее её мне было вот от меня еще ещё нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее неё сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это".split())  # стоп-слова


def read_file(f):
    data = f.getvalue()
    if f.name.lower().endswith(".docx"):
        import io
        from docx import Document
        return "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
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



st.set_page_config(page_title="Мой кабинет", page_icon="📚", layout="wide")   # широкая страница

with st.sidebar:                                                   # всё внутри — в левой панели
    st.header("📚 Мой кабинет")
    files = st.file_uploader("Мои тексты (.txt, .docx)", type=["txt", "docx"],
                             accept_multiple_files=True)           # можно выбрать много файлов
    page = st.radio("Раздел", ["Мои тексты", "Частоты", "Контексты", "Мои цитаты"])  # НОВОЕ: + «Мои цитаты»

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
    st.write(texts[name][:3000])

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

elif page == "Мои цитаты":                                         # НОВОЕ: раздел 4
    if "quotes" not in st.session_state:                           # НОВОЕ: «память» приложения
        st.session_state.quotes = []                               # НОВОЕ: пустой список при первом запуске
    with st.form("new_quote", clear_on_submit=True):               # НОВОЕ: форма с кнопкой отправки
        quote = st.text_area("Цитата (скопируйте из «Контекстов» или из текста)")  # НОВОЕ
        source = st.selectbox("Из какого текста", list(texts))     # НОВОЕ
        note = st.text_input("Мой комментарий: что эта цитата доказывает")  # НОВОЕ
        if st.form_submit_button("Сохранить цитату") and quote.strip():     # НОВОЕ
            st.session_state.quotes.append({"текст": source, "цитата": quote.strip(), "комментарий": note})  # НОВОЕ
    q = pd.DataFrame(st.session_state.quotes)                      # НОВОЕ
    st.write(f"Сохранено цитат: {len(q)}")                         # НОВОЕ
    if not q.empty:                                                # НОВОЕ
        st.dataframe(q, hide_index=True, use_container_width=True) # НОВОЕ
        st.download_button("⬇ CSV", q.to_csv(index=False).encode("utf-8-sig"), "citaty.csv", "text/csv")  # НОВОЕ
        import io                                                  # НОВОЕ: выгрузка в Word
        from docx import Document                                  # НОВОЕ
        doc = Document()                                           # НОВОЕ: пустой документ
        doc.add_heading("Цитаты для диссертации", 1)               # НОВОЕ
        for _, r in q.iterrows():                                  # НОВОЕ: по одной цитате
            doc.add_paragraph(f"«{r['цитата']}» ({r['текст']})")   # НОВОЕ
            if r["комментарий"]:                                   # НОВОЕ
                doc.add_paragraph().add_run("Комментарий: " + r["комментарий"]).italic = True  # НОВОЕ: курсивом
        buf = io.BytesIO()                                         # НОВОЕ
        doc.save(buf)                                              # НОВОЕ
        st.download_button("⬇ Word (.docx)", buf.getvalue(), "citaty.docx")  # НОВОЕ
    st.warning("Цитаты живут, пока открыта вкладка и работает Colab. Скачивайте CSV/Word в конце работы!")  # НОВОЕ

# ЗАДАНИЯ: 1) сохраните 5 цитат по своей теме с комментариями и скачайте Word;
# 2) добавьте в форму поле «Глава диссертации» (st.selectbox с вариантами «Глава 1», «Глава 2»…)
# и выведите его в таблицу и в Word; 3) добавьте кнопку st.button("Очистить всё"),
# которая делает st.session_state.quotes = [].
