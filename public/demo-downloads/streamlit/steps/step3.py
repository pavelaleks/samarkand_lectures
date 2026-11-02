# -*- coding: utf-8 -*-
# ШАГ 3. Частотный словарь: таблица, график, скачивание. Новые строки — «# НОВОЕ».
import re                                                          # НОВОЕ: регулярные выражения
from collections import Counter                                    # НОВОЕ: счётчик слов

import pandas as pd                                                # НОВОЕ: таблицы
import streamlit as st

STOP = set("и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее её мне было вот от меня еще ещё нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее неё сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это".split())  # НОВОЕ: стоп-слова


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


def tokenize(text):                                                # НОВОЕ: текст → список слов
    return re.findall(r"[а-яёa-z]+(?:-[а-яёa-z]+)?", text.lower())


st.title("Мой кабинет: тексты диссертации")

f = st.file_uploader("Загрузите текст (.txt или .docx)", type=["txt", "docx"])
if f is None:
    st.info("Загрузите файл, чтобы начать.")
    st.stop()

text = read_file(f)
words = tokenize(text)                                             # НОВОЕ: теперь слова без знаков препинания
c1, c2 = st.columns(2)
c1.metric("Слов", len(words))
c2.metric("Разных слов", len(set(words)))

st.subheader("Частотный словарь")                                  # НОВОЕ
top_n = st.slider("Сколько слов показать", 10, 100, 30)            # НОВОЕ: ползунок
skip_stop = st.checkbox("Убрать служебные слова", value=True)      # НОВОЕ: галочка
counted = Counter(w for w in words if not (skip_stop and w in STOP))  # НОВОЕ
df = pd.DataFrame(counted.most_common(top_n), columns=["слово", "частота"])  # НОВОЕ
st.bar_chart(df.set_index("слово"))                                # НОВОЕ: график
st.dataframe(df, hide_index=True)                                  # НОВОЕ: таблица
st.download_button("⬇ Скачать CSV (Excel)", df.to_csv(index=False).encode("utf-8-sig"),
                   "chastoty.csv", "text/csv")                     # НОВОЕ: кнопка скачивания

# ЗАДАНИЯ: 1) найдите в списке 3 слова, важных для вашей темы; 2) добавьте в STOP
# слова, которые мешают; 3) добавьте колонку «на 1000 слов»: df["на 1000"] = df["частота"] * 1000 / len(words)
