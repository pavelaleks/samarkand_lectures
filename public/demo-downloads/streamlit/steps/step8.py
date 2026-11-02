# -*- coding: utf-8 -*-
# ШАГ 8. Тренажёр по СВОИМ текстам: угадай пропущенное слово / угадай, из какого текста фраза. Новые строки — «# НОВОЕ».
import re                                                          # регулярные выражения
from collections import Counter                                    # счётчик слов

import requests                                                    # запросы к API
import random                                                     # НОВОЕ: случайный выбор
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



@st.cache_data(ttl=3600)                                           # запомнить ответ на час
def openalex(query, n=25):                                         # запрос к API
    r = requests.get("https://api.openalex.org/works",             # адрес API
                     params={"search": query, "per_page": n, "sort": "cited_by_count:desc"},
                     timeout=30)
    r.raise_for_status()                                           # ошибка сервера → исключение
    return r.json()                                                # ответ в формате JSON → словарь

def sentences(text):                                               # НОВОЕ: текст → предложения
    parts = re.split(r"(?<=[.!?…])\s+", text.replace("\n", " "))  # НОВОЕ
    return [p.strip() for p in parts if len(p.split()) >= 8]       # НОВОЕ: только не слишком короткие


def make_task(texts, mode):                                        # НОВОЕ: составить задание
    pool = [(name, s) for name, t in texts.items() for s in sentences(t)]  # НОВОЕ: все предложения
    if mode == "Пропущенное слово":                                # НОВОЕ: нужны предложения с длинными словами
        pool = [(n, s) for n, s in pool if re.search(r"[А-Яа-яЁё]{5,}", s)]  # НОВОЕ
    if not pool:                                                   # НОВОЕ
        return None                                                # НОВОЕ
    name, sent = random.choice(pool)                               # НОВОЕ: случайное предложение
    task = {"id": str(random.random()), "mode": mode, "full": sent, "source": name}  # НОВОЕ
    if mode == "Пропущенное слово":                                # НОВОЕ
        word = random.choice(re.findall(r"[А-Яа-яЁё]{5,}", sent))  # НОВОЕ: случайное слово от 5 букв
        task.update(question=sent.replace(word, "_____", 1), answer=word)  # НОВОЕ
    else:                                                          # НОВОЕ
        task.update(question=sent, answer=name)                    # НОВОЕ
    return task                                                    # НОВОЕ

st.set_page_config(page_title="Мой кабинет", page_icon="📚", layout="wide")   # широкая страница

with st.sidebar:                                                   # всё внутри — в левой панели
    st.header("📚 Мой кабинет")
    files = st.file_uploader("Мои тексты (.txt, .docx)", type=["txt", "docx"],
                             accept_multiple_files=True)           # можно выбрать много файлов
    page = st.radio("Раздел", ["Мои тексты", "Частоты", "Контексты", "Мои цитаты", "Литература", "Тренажёр"])  # НОВОЕ

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

elif page == "Литература":                                         # раздел 5
    st.caption("OpenAlex — открытый каталог научных работ. Запрос лучше по-английски, 2–4 слова.")
    query = st.text_input("Запрос", "Bunin memory")
    if query.strip():
        try:                                                       # сеть может подвести
            data = openalex(query.strip())
        except Exception as e:
            st.error(f"OpenAlex не ответил: {e}. Подождите минуту и попробуйте снова.")
            st.stop()
        rows = [{"год": w.get("publication_year"),                 # из JSON берём нужные поля
                 "название": w.get("display_name"),
                 "авторы": ", ".join(a["author"]["display_name"] for a in w.get("authorships", [])[:3]),
                 "цитирований": w.get("cited_by_count"),
                 "DOI": w.get("doi") or ""}
                for w in data.get("results", [])]
        lit = pd.DataFrame(rows)
        st.write(f"Всего в базе: {data.get('meta', {}).get('count', 0)}, показано: {len(lit)}")
        if not lit.empty:
            st.dataframe(lit, hide_index=True, use_container_width=True,
                         column_config={"DOI": st.column_config.LinkColumn()})  # ссылки кликабельны
            st.bar_chart(lit["год"].value_counts().sort_index())   # работы по годам
            st.download_button("⬇ CSV", lit.to_csv(index=False).encode("utf-8-sig"), "literatura.csv", "text/csv")

elif page == "Тренажёр":                                           # НОВОЕ: раздел 6
    mode = st.radio("Режим", ["Пропущенное слово", "Из какого текста?"], horizontal=True)  # НОВОЕ
    if mode == "Из какого текста?" and len(texts) < 2:             # НОВОЕ
        st.info("Для этого режима загрузите хотя бы два текста.")  # НОВОЕ
        st.stop()                                                  # НОВОЕ
    if "task" not in st.session_state or st.session_state.task["mode"] != mode:  # НОВОЕ
        st.session_state.task = make_task(texts, mode)             # НОВОЕ: первое задание
    if st.button("🎲 Новое задание"):                              # НОВОЕ
        st.session_state.task = make_task(texts, mode)             # НОВОЕ
    task = st.session_state.task                                   # НОВОЕ
    if task is None:                                               # НОВОЕ
        st.warning("В текстах не нашлось подходящих предложений (нужны предложения от 8 слов).")  # НОВОЕ
        st.stop()                                                  # НОВОЕ
    st.markdown(f"> {task['question']}")                           # НОВОЕ: показываем задание цитатой
    if mode == "Пропущенное слово":                                # НОВОЕ
        guess = st.text_input("Какое слово пропущено?", key="guess_" + task["id"])  # НОВОЕ
        ok = guess.strip().lower() == task["answer"].lower()       # НОВОЕ
    else:                                                          # НОВОЕ
        guess = st.radio("Из какого текста?", list(texts), index=None, key="guess_" + task["id"])  # НОВОЕ
        ok = guess == task["answer"]                               # НОВОЕ
    if guess:                                                      # НОВОЕ: ответ дан — проверяем
        if ok:                                                     # НОВОЕ
            st.success("Верно! 🎉")                                # НОВОЕ
            if st.session_state.get("last") != task["id"]:         # НОВОЕ: не засчитывать одно задание дважды
                st.session_state.score = st.session_state.get("score", 0) + 1  # НОВОЕ
                st.session_state.last = task["id"]                 # НОВОЕ
        else:                                                      # НОВОЕ
            st.error(f"Нет. Правильно: {task['answer']}")          # НОВОЕ
        st.caption(f"Полностью: {task['full']} ({task['source']})")  # НОВОЕ
    st.metric("Верных ответов", st.session_state.get("score", 0))  # НОВОЕ

# ЗАДАНИЯ: 1) потренируйтесь на своих текстах: что запоминается, а что нет?
# 2) пусть пропускается не любое слово, а слово из ВАШЕГО списка (ключевые слова темы):
# KEY = ["память", "вспомнить"] и в make_task выбирайте только такие слова;
# 3) придумайте третий режим (например, «угадай героя» или «угадай главу»).
#
# ДАЛЬШЕ — САМИ: скопируйте весь этот файл в бесплатный чат ИИ (DeepSeek, Qwen, Gemini)
# и попросите добавить раздел — шаблон запроса есть в блокноте (шаг 9).
