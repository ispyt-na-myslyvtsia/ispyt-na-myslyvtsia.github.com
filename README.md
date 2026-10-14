# [Іспит на мисливця — тренажер](https://ispyt-na-myslyvtsia.github.io/)

Безкоштовний тренажер до іспиту на мисливця: питання по темах, пояснення, календар термінів полювання і шпаргалки.
Сайт статичний і працює на GitHub Pages. Прогрес зберігається у браузері.


## Пропозиції питань

Кнопка «Запропонувати питання» відкриває на GitHub заповнену форму issue (шаблон `.github/ISSUE_TEMPLATE/question.yml`).

Щоб схвалити питання, постав на issue мітку **`approved`**. Workflow `.github/workflows/add-question.yml` перевіряє тему, обов'язкові поля, повтори у варіантах відповідей і дублікати питань. Якщо все гаразд, він додає питання в `data/questions.json`, комітить, оновлює сайт і закриває issue з подякою. Якщо ні, пише в issue, що не так, і знімає мітку. Мітка рахується лише від власника репозиторію.

Питання взято з таких джерел

[Криниця Мисливця](https://myslyvets.com.ua/ekzamenacijni-pitannya-dlya-otrimannya-posvidchennya-mislivcya-vidpovidi/)
[Мелітопільське господарство](https://web.archive.org/web/20220516162449/https://melitopol-forest.com.ua/ekzamenacijni-pitannya-dlya-otrimannya-posvidchennya-mislivcya-vidpovidi/)
[Jagten Exam](https://github.com/Olezha/Jagtex)

