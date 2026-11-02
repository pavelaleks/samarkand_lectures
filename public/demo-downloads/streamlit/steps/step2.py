# -*- coding: utf-8 -*-
# ШАГ 2. Загружаем СВОИ файлы (.txt или .docx). Новые строки помечены «# НОВОЕ».
import streamlit as st


def read_file(f):                                                  # НОВОЕ: функция чтения файла
    data = f.getvalue()                                            # НОВОЕ: байты файла
    if f.name.lower().endswith(".docx"):                           # НОВОЕ: Word читаем через python-docx
        import io
        from docx import Document
        from docx.oxml.ns import qn  # НОВОЕ
        from docx.text.paragraph import Paragraph  # НОВОЕ
        doc = Document(io.BytesIO(data))  # НОВОЕ
        # все абзацы, включая таблицы и надписи (doc.paragraphs таблицы пропускает)
        return "\n".join(Paragraph(p, doc).text for p in doc.element.body.iter(qn("w:p")))  # НОВОЕ
    for enc in ("utf-8-sig", "cp1251"):                            # НОВОЕ: пробуем две кодировки
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    return data.decode("utf-8", errors="replace")


st.title("Мой кабинет: тексты диссертации")

f = st.file_uploader("Загрузите текст (.txt или .docx)", type=["txt", "docx"])   # НОВОЕ
if f is None:                                                      # НОВОЕ: файла ещё нет —
    st.info("Загрузите файл, чтобы начать.")                       # НОВОЕ: подсказка
    st.stop()                                                      # НОВОЕ: дальше код не выполняется

text = read_file(f)                                                # НОВОЕ
words = text.split()
c1, c2 = st.columns(2)                                             # НОВОЕ: две колонки рядом
c1.metric("Слов", len(words))
c2.metric("Знаков", len(text))

with st.expander("Показать весь текст"):                           # НОВОЕ: раскрывающийся блок
    st.text_area("Текст целиком (прокрутите)", text, height=400)   # НОВОЕ: весь текст, с прокруткой

# ЗАДАНИЯ: 1) загрузите главу/рассказ своего автора; 2) добавьте третью колонку «Абзацев»
# (text.count("\n") + 1); 3) проверьте, что в окне виден конец вашего текста.
