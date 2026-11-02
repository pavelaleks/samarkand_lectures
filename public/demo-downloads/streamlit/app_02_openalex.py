# -*- coding: utf-8 -*-
"""
Шаг 2. Подключаем API: приложение «Литература по моей теме» (OpenAlex).
Что показывает: запрос к научной базе → JSON → таблица → график → файлы Word и CSV.

ЗАДАНИЯ:
  1. Впишите в QUERY_DEFAULT запрос под свою диссертацию (по-английски, 2–4 слова).
  2. Добавьте в таблицу колонку «язык» (поле w["language"]).
  3. Добавьте фильтр «только открытый доступ»: в filters допишите "is_oa:true", если стоит галочка.
  4. (Сложнее) Добавьте второй источник — Crossref: https://api.crossref.org/works?query.bibliographic=...
"""
import io

import pandas as pd
import requests
import streamlit as st

QUERY_DEFAULT = "Bunin memory"  # ← запрос под вашу тему

st.set_page_config(page_title="Литература по теме", page_icon="🔎", layout="wide")
st.title("🔎 Литература по моей теме — OpenAlex API")
st.caption("OpenAlex — открытый каталог научных работ (~250 млн записей). Без ключа лимит маленький; бесплатный ключ: openalex.org/settings/api")

with st.sidebar:
    st.header("Параметры запроса")
    query = st.text_input("Запрос (лучше по-английски)", QUERY_DEFAULT)
    precise = st.checkbox("Только в названии и аннотации", value=True, help="Без галочки ищется и в полных текстах — больше случайных работ")
    years = st.slider("Годы публикации", 1950, 2026, (2000, 2026))
    per_page = st.slider("Сколько работ загрузить", 10, 100, 25, step=5)
    api_key = st.text_input("Ключ OpenAlex (необязательно)", type="password")


@st.cache_data(show_spinner=False, ttl=3600)
def search(query, precise, years, per_page, api_key):
    filters = [f"from_publication_date:{years[0]}-01-01", f"to_publication_date:{years[1]}-12-31"]
    if precise:
        filters.append("title_and_abstract.search:" + query.replace(",", " "))
    params = {"search": query, "filter": ",".join(filters), "per_page": per_page, "sort": "cited_by_count:desc"}
    if api_key:
        params["api_key"] = api_key
    r = requests.get("https://api.openalex.org/works", params=params, timeout=60)
    r.raise_for_status()
    return r.json(), r.url


if not query.strip():
    st.info("Введите запрос слева.")
    st.stop()

try:
    with st.spinner("Запрашиваю OpenAlex…"):
        data, url = search(query.strip(), precise, years, per_page, api_key.strip())
except requests.HTTPError as e:
    st.error(f"OpenAlex ответил ошибкой: {e}. Если 429 — лимит запросов: подождите или вставьте ключ.")
    st.stop()
except Exception as e:
    st.error(f"Нет связи с OpenAlex: {e}")
    st.stop()

with st.expander("Как это устроено: запрос к API"):
    st.code(url.replace(api_key, "***") if api_key else url, language="text")
    st.write("Ответ приходит в формате JSON. Первая запись:")
    st.json(data.get("results", [{}])[0] if data.get("results") else {})

rows = []
for w in data.get("results", []):
    rows.append(
        {
            "год": w.get("publication_year"),
            "название": w.get("display_name"),
            "авторы": ", ".join(a["author"]["display_name"] for a in (w.get("authorships") or [])[:3] if a.get("author")),
            "журнал": ((w.get("primary_location") or {}).get("source") or {}).get("display_name"),
            "цитирований": w.get("cited_by_count"),
            "DOI": (w.get("doi") or "").replace("https://doi.org/", ""),
            "открытый текст": (w.get("open_access") or {}).get("oa_url") or "",
        }
    )
df = pd.DataFrame(rows)

c1, c2, c3 = st.columns(3)
c1.metric("Всего работ по запросу", f'{data.get("meta", {}).get("count", 0):,}'.replace(",", " "))
c2.metric("Загружено", len(df))
c3.metric("С открытым текстом", int((df["открытый текст"] != "").sum()) if not df.empty else 0)

if df.empty:
    st.warning("Ничего не найдено. Сократите запрос до 2–3 слов или снимите галочку «Только в названии и аннотации».")
    st.stop()

st.dataframe(df, use_container_width=True, hide_index=True, column_config={"открытый текст": st.column_config.LinkColumn()})
st.subheader("Публикации по годам (среди загруженных)")
st.bar_chart(df["год"].value_counts().sort_index())

# --- Выгрузки --------------------------------------------------------------------
st.subheader("Скачать")
st.download_button("⬇ CSV (Excel)", df.to_csv(index=False).encode("utf-8-sig"), "literatura.csv", "text/csv")

try:
    from docx import Document

    doc = Document()
    doc.add_heading(f"Литература по запросу «{query}»", 1)
    for i, r in df.iterrows():
        p = doc.add_paragraph(style="List Number")
        p.add_run(f'{r["авторы"] or "—"}. {r["название"]} // {r["журнал"] or "—"}. — {r["год"]}.')
        if r["DOI"]:
            p.add_run(f' — DOI {r["DOI"]}.')
    buf = io.BytesIO()
    doc.save(buf)
    st.download_button("⬇ Word (.docx)", buf.getvalue(), "literatura.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
except ImportError:
    st.caption("Для выгрузки в Word нужна библиотека python-docx (в блокноте она ставится в первой ячейке).")

st.caption("Описания из каталога сверяйте с самими источниками. Полная версия с ГОСТом — «Кабинет магистранта» на сайте курса.")
