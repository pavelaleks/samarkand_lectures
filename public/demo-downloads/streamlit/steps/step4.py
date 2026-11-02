# -*- coding: utf-8 -*-
# ШАГ 4. Контексты (конкорданс): где и как стоит слово. Новые строки — «# НОВОЕ».
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


st.title("Мой кабинет: тексты диссертации")

f = st.file_uploader("Загрузите текст (.txt или .docx)", type=["txt", "docx"])
if f is None:
    st.info("Загрузите файл, чтобы начать.")
    st.stop()

text = read_file(f)
words = tokenize(text)                                             # теперь слова без знаков препинания
c1, c2 = st.columns(2)
c1.metric("Слов", len(words))
c2.metric("Разных слов", len(set(words)))

st.subheader("Частотный словарь")                                
top_n = st.slider("Сколько слов показать", 10, 100, 30)            # ползунок
skip_stop = st.checkbox("Убрать служебные слова", value=True)      # галочка
counted = Counter(w for w in words if not (skip_stop and w in STOP))
df = pd.DataFrame(counted.most_common(top_n), columns=["слово", "частота"])
st.bar_chart(df.set_index("слово"))                                # график
st.dataframe(df, hide_index=True)                                  # таблица
st.download_button("⬇ Скачать CSV (Excel)", df.to_csv(index=False).encode("utf-8-sig"),
                   "chastoty.csv", "text/csv")


def kwic(text, word, width=60):                                    # НОВОЕ: поиск контекстов
    rows = []                                                      # НОВОЕ
    for m in re.finditer(r"\b" + re.escape(word.lower()), text.lower()):  # НОВОЕ: каждое вхождение
        a, b = m.start(), m.end()                                  # НОВОЕ
        rows.append({"слева": text[max(0, a - width):a].replace("\n", " "),   # НОВОЕ
                     "слово": text[a:b],                           # НОВОЕ
                     "справа": text[b:b + width].replace("\n", " ")})       # НОВОЕ
    return pd.DataFrame(rows)                                      # НОВОЕ


st.subheader("Контексты")                                          # НОВОЕ
word = st.text_input("Слово или начало слова (вспомин — найдёт вспоминал, вспоминая…)", "")  # НОВОЕ
width = st.slider("Ширина контекста, знаков", 20, 150, 60)         # НОВОЕ
if word.strip():                                                   # НОВОЕ: только если что-то введено
    found = kwic(text, word.strip(), width)                        # НОВОЕ
    st.write(f"Найдено: {len(found)}")                             # НОВОЕ
    st.dataframe(found, hide_index=True, use_container_width=True) # НОВОЕ

# ЗАДАНИЯ: 1) найдите контексты ключевого слова своей темы; 2) выпишите 2 контекста,
# которые подтверждают вашу гипотезу, и 1 — который ей противоречит; 3) добавьте кнопку
# скачивания контекстов в CSV (по образцу кнопки частот).
