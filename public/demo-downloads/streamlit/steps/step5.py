# -*- coding: utf-8 -*-
# ШАГ 5. Настоящий кабинет: меню разделов слева и НЕСКОЛЬКО своих текстов. Новые строки — «# НОВОЕ».
# Код частот и контекстов тот же, что в шагах 3–4, — просто разложен по разделам.
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



st.set_page_config(page_title="Мой кабинет", page_icon="📚", layout="wide")   # НОВОЕ: широкая страница

with st.sidebar:                                                   # НОВОЕ: всё внутри — в левой панели
    st.header("📚 Мой кабинет")                                     # НОВОЕ
    files = st.file_uploader("Мои тексты (.txt, .docx)", type=["txt", "docx"],
                             accept_multiple_files=True)           # НОВОЕ: можно выбрать много файлов
    page = st.radio("Раздел", ["Мои тексты", "Частоты", "Контексты"])  # НОВОЕ: меню

texts = {f.name.rsplit(".", 1)[0]: read_file(f) for f in files or []}  # НОВОЕ: {название: текст}
if not texts:
    st.info("Загрузите слева один или несколько файлов: главы, рассказы, стихотворения.")
    st.stop()

st.title(page)                                                     # НОВОЕ: заголовок = выбранный раздел

if page == "Мои тексты":                                           # НОВОЕ: раздел 1
    rows = [{"текст": name, "слов": len(tokenize(t)), "разных слов": len(set(tokenize(t)))}
            for name, t in texts.items()]                          # НОВОЕ: строка таблицы на каждый текст
    st.dataframe(pd.DataFrame(rows), hide_index=True)              # НОВОЕ
    name = st.selectbox("Прочитать", list(texts))                  # НОВОЕ: выпадающий список
    st.write(texts[name][:3000])

elif page == "Частоты":                                            # НОВОЕ: раздел 2
    name = st.selectbox("Текст", ["все вместе"] + list(texts))     # НОВОЕ
    text = "\n".join(texts.values()) if name == "все вместе" else texts[name]  # НОВОЕ
    words = tokenize(text)
    top_n = st.slider("Сколько слов показать", 10, 100, 30)
    skip_stop = st.checkbox("Убрать служебные слова", value=True)
    counted = Counter(w for w in words if not (skip_stop and w in STOP))
    df = pd.DataFrame(counted.most_common(top_n), columns=["слово", "частота"])
    st.bar_chart(df.set_index("слово"))
    st.dataframe(df, hide_index=True)
    st.download_button("⬇ Скачать CSV (Excel)", df.to_csv(index=False).encode("utf-8-sig"),
                       "chastoty.csv", "text/csv")

elif page == "Контексты":                                          # НОВОЕ: раздел 3
    word = st.text_input("Слово или начало слова", "")
    width = st.slider("Ширина контекста, знаков", 20, 150, 60)
    if word.strip():
        parts = []                                                 # НОВОЕ: ищем во всех текстах
        for name, t in texts.items():                              # НОВОЕ
            found = kwic(t, word.strip(), width)
            found.insert(0, "текст", name)                         # НОВОЕ: колонка «из какого текста»
            parts.append(found)
        found = pd.concat(parts, ignore_index=True)                # НОВОЕ: склеиваем таблицы
        st.write(f"Найдено: {len(found)}")
        st.dataframe(found, hide_index=True, use_container_width=True)

# ЗАДАНИЯ: 1) загрузите 3–5 своих текстов и сравните частоты; 2) в «Контекстах» найдите,
# в каком тексте ключевое слово встречается чаще; 3) добавьте в меню четвёртый пункт
# «О проекте» и напишите там (st.markdown) тему, материал и метод своей диссертации.
