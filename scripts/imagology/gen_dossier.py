# -*- coding: utf-8 -*-
"""
Шаблон сквозного задания «Досье одного образа» (.docx).

    python scripts/imagology/gen_dossier.py public/imagology/lab/Dosye_odnogo_obraza.docx
"""
import sys
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ACCENT = RGBColor(0x7A, 0x34, 0x28)
GREY = RGBColor(0x6B, 0x62, 0x59)


def shade(cell, hex_fill):
    tc = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc.append(shd)


def tidy(t):
    for row in t.rows:
        for c in row.cells:
            for par in c.paragraphs:
                par.paragraph_format.first_line_indent = Cm(0)
                par.paragraph_format.line_spacing = 1.0
                for r in par.runs:
                    r.font.size = Pt(10.5)


def hint(doc, text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.italic = True
    r.font.size = Pt(11)
    r.font.color.rgb = GREY
    return p


def table(doc, header, rows=3, widths=None):
    t = doc.add_table(rows=1 + rows, cols=len(header))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(header):
        c = t.rows[0].cells[i]
        c.text = ""
        run = c.paragraphs[0].add_run(h)
        run.bold = True
        run.font.size = Pt(10.5)
        shade(c, "EEE7DA")
    for r in t.rows[1:]:
        for c in r.cells:
            c.paragraphs[0].add_run("").font.size = Pt(10.5)
    tidy(t)
    if widths:
        for r in t.rows:
            for i, w in enumerate(widths):
                r.cells[i].width = Cm(w)
    doc.add_paragraph()
    return t


def heading(doc, text, level=1):
    hd = doc.add_heading(text, level=level)
    hd.paragraph_format.first_line_indent = Cm(0)
    for r in hd.runs:
        r.font.color.rgb = ACCENT
        r.font.name = "Times New Roman"
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    return hd


def main(out):
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    sec.left_margin, sec.right_margin = Cm(3.0), Cm(1.5)
    sec.top_margin = sec.bottom_margin = Cm(2.0)

    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    st.font.size = Pt(14)
    st.paragraph_format.line_spacing = 1.5
    st.paragraph_format.first_line_indent = Cm(1.25)
    st.paragraph_format.space_after = Pt(0)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    r = p.add_run("Курс «Имагология» · сквозное задание семестра")
    r.font.size = Pt(12)
    r.font.color.rgb = GREY
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t.paragraph_format.first_line_indent = Cm(0)
    rr = t.add_run("ДОСЬЕ ОДНОГО ОБРАЗА: «___________________»")
    rr.bold = True
    rr.font.size = Pt(16)
    rr.font.color.rgb = ACCENT
    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta.paragraph_format.first_line_indent = Cm(0)
    meta.add_run("Студент(ка): ____________________   Группа: ________   Дата: ____________")

    hint(doc, "Шаблон: серым курсивом — подсказки, их удаляют. Каждый раздел пополняется на практических занятиях "
              "(номер занятия указан в скобках). Стенды: https://pavelaleks.github.io/samarkand_lectures/imagology/lab/")

    heading(doc, "1. Образ и его имена (практическое 1)")
    hint(doc, "Как называют образ на двух-трёх языках и в разное время (например: сарт / Sart / Sarte; Бухара / Bokhara / Boukhara). "
              "Откуда имя, кто им пользуется, когда оно исчезает. 150–250 слов.")
    table(doc, ["Язык", "Формы имени", "Период", "Кто употребляет", "Пример (цитата, источник)"], rows=4, widths=[2, 3.5, 2, 3, 6])

    heading(doc, "2. Корпус")
    hint(doc, "Не меньше 4 текстов: минимум 2 русских и 2 западных, не меньше 2 языков. Укажите, откуда взят текст (Викитека, Gutenberg, Gallica, НЭБ, ФЭБ).")
    table(doc, ["№", "Автор", "Текст", "Год", "Язык", "Сторона (Россия / Запад)", "Источник (ссылка)"], rows=5, widths=[0.8, 2.5, 3.5, 1.4, 1.4, 2.3, 4.5])

    heading(doc, "3. Völkertafel образа (практические 2 и 8)")
    hint(doc, "Стенд «Цифровая Völkertafel»: корпус A — русские тексты, корпус B — западные. Перенесите строки, где у образа есть признаки, "
              "и проверьте вручную 30 контекстов: верно / ложно / спорно. Приложите CSV.")
    table(doc, ["Признак", "A: % предложений", "B: % предложений", "Проверено контекстов", "Ложных", "Пример (цитата)"], rows=6, widths=[3, 2, 2, 2, 1.5, 6])
    hint(doc, "Вывод по таблице (200–300 слов): какие графы русские и западные авторы заполняют одинаково, какие по-разному, и почему.")

    heading(doc, "4. Карта (практические 4 и 8)")
    hint(doc, "Стенд «Карта взгляда»: скриншот или карта из GeoJSON. Где живёт образ, чьи маршруты его пересекают, какие места названы и какие пропущены. 200 слов.")
    hint(doc, "[место для рисунка: Рисунок 1 — …]")

    heading(doc, "5. Параллель: две сцены (практические 3 и 5)")
    hint(doc, "Одна русская и одна западная сцена с образом. Медленное чтение: кто говорит, кому, в каком жанре, какой признак выбран, "
              "что остаётся за кадром. Цитаты с точной ссылкой на издание. 500–700 слов.")
    table(doc, ["", "Русская сцена", "Западная сцена"], rows=5, widths=[3.5, 6, 6])

    heading(doc, "6. Визуальный ряд (практические 3 и 8)")
    hint(doc, "8–12 изображений из стенда «Галерея образов» с разметкой по кодовой книге (кто смотрит, жанр, фигуры, пространство, мотивы). Приложите CSV разметки.")
    table(doc, ["№", "Изображение (автор, название, год)", "Кто смотрит", "Жанр", "Мотивы", "Комментарий"], rows=6, widths=[0.8, 4.5, 2.5, 2.2, 3, 3])

    heading(doc, "7. Вывод: автообраз в гетерообразе")
    hint(doc, "Что русские и западные тексты говорят о самих себе, когда говорят об этом образе? Где совпадают, где расходятся? "
              "Что показали цифры и что опровергло медленное чтение? 400–600 слов.")

    heading(doc, "8. Литература")
    hint(doc, "По ГОСТ Р 7.0.100–2018. Список можно собрать в «Кабинете магистранта» курса DH и выгрузить в Word.")

    heading(doc, "Критерии оценки (100 баллов)", level=2)
    crit = [
        ("Корпус: объём, баланс сторон и языков, описание источников", "15"),
        ("Völkertafel: таблица и ручная проверка контекстов", "20"),
        ("Карта и пространственный анализ", "10"),
        ("Параллель: медленное чтение двух сцен, точность цитат", "20"),
        ("Визуальный ряд и разметка", "10"),
        ("Вывод об автообразе в гетерообразе; термины курса", "15"),
        ("Оформление, ссылки, список по ГОСТ", "10"),
    ]
    t = doc.add_table(rows=len(crit) + 1, cols=2)
    t.style = "Table Grid"
    for i, (a, b) in enumerate([("Критерий", "Баллы")] + crit):
        t.rows[i].cells[0].text = a
        t.rows[i].cells[1].text = b
        if i == 0:
            for c in t.rows[0].cells:
                shade(c, "EEE7DA")
                for r in c.paragraphs[0].runs:
                    r.bold = True
    tidy(t)
    for r in t.rows:
        r.cells[0].width, r.cells[1].width = Cm(13.5), Cm(2.5)
    doc.save(out)
    print("ok", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Dosye_odnogo_obraza.docx")
