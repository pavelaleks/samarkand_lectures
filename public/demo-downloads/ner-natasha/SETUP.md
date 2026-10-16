# Natasha на своём компьютере (лекция 6)

Сайт проекта: https://natasha.github.io  
Репозиторий: https://github.com/natasha/natasha

## Быстрый путь (для сдачи)

1. Создайте папку `Documents/ner_bunin`
2. Распакуйте этот ZIP внутрь
3. PyCharm → Open → New Virtualenv
4. Terminal:

```bash
python -m pip install -r requirements.txt
```

5. Run `ner_natasha_lab.py`
6. Откройте `out/ner_report.html`

## Клон исходников Natasha (опционально)

```bash
# macOS / Linux
bash clone_natasha.sh

# Windows (cmd)
clone_natasha.bat
```

или вручную:

```bash
git clone https://github.com/natasha/natasha.git
cd natasha
python -m pip install -e .
```

Учебные скрипты курса остаются в `ner_bunin/` — клон нужен, чтобы смотреть API и README upstream.
