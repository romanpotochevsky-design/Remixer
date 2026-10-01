# Промпт для следующей сессии — «элементы интерфейса в чате»

Скопируй текст ниже в первое сообщение нового окна Claude Code (репозиторий `romanpotochevsky-design/Remixer`).
Файл написан 01.10.2026, в конце сессии докинга панели инструментов; обновляй его в конце каждой сессии.

---

Продолжаем работу над прототипом Remixer (DreamHost AI Website Builder). Я — UI/UX дизайнер, не программист:
вся техническая часть на тебе, объясняй просто, команды выполнять меня не проси.

**Вход в работу — строго в этом порядке:**
1. `git fetch origin --prune` и переключись на ветку `claude/remixer-connect-domain-flow-4fpgqc` — в ней лежит ВСЯ
   работа (`git checkout -B claude/remixer-connect-domain-flow-4fpgqc origin/claude/remixer-connect-domain-flow-4fpgqc`).
   Если сессии назначена другая ветка, работу всё равно веди отсюда и пуш делай сюда.
2. Прочитай `CLAUDE.md` целиком (правила проекта и все дорого купленные уроки), потом `docs/README.md`,
   `docs/knowledge/decisions.md` (что уже решено и отклонено — не предлагать повторно) и запись прошлой сессии
   `docs/sessions/2026-09-30--visual-editor.md`.
3. Для чата прочитай базу `docs/features/builder-shell/README.md` и код `prototype/src/modules/chat/`
   (`ChatPanel.tsx`, `BriefPanel.tsx`, `SuggestPanel.tsx`, `send.ts`, `thread.ts`) и `prototype/src/ui/motion.ts`.
4. `cd prototype && npm install`; `pip install fonttools brotli` (иначе артефакт не влезет в лимит);
   production-сборка для проверок: `npm run build`, затем `npx vite preview --port 4173 --strictPort` в фоне.
   Пробники и сюита в этом контейнере запускаются с `CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

**Задача этой сессии: новые элементы интерфейса в чате билдера.** Что именно — я опишу и пришлю борды Figma
(файл `GP4jNXtc37VTFVZDc9JF0a`) и/или экранные записи (.mov — режь на кадры через `imageio-ffmpeg`, разбирай
покадрово, запись точнее пересказа). Правила, которые ты уже знаешь из CLAUDE.md, но напомню главные:
- перфект-пиксель по борду; токены Figma читать через `get_variable_defs` в ТЁМНОЙ теме; строук Figma сидит внутри
  геометрии — рамки рисовать `inset box-shadow`, не `border`; борд компонента даёт метрики, борд экрана — координаты;
- моушен — один язык из `ui/motion.ts` (пружины, «уход быстрее прихода», только transform/opacity), стекло — канон
  `.liquid-glass*` из `index.css`, вход карточек — Card Arrival, блик обода — Rim Sweep; новая анимация = строка в
  реестре `docs/knowledge/design-system.md` §7;
- состояние — только через `prototype/src/state/world.ts` (новая ось сайта: `SITE_AXES` + `startBuild` + `completeSlice`);
- мои открытые вопросы молча не решай — спрашивай; всё, что борд не рисует, помечай как «наше» и спрашивай;
- тексты — английские, общение — русское.

**Приёмка и выкладка после каждого принятого куска:**
- смоук/пробник нового элемента в `prototype/scratchpad/<тема>/`, проверки в `scripts/check-brief-flow.mjs`
  (новый блок после Q); полная сюита `npm run check:brief` (~6 минут, ~725 проверок; известные флапы сэмплера
  блока I на софтверном растре — не чинить, но и не пересобирать `dist`, пока сюита идёт);
- коммит + `git push -u origin claude/remixer-connect-domain-flow-4fpgqc`;
- перед публикацией `Artifact action: read` по ссылке ниже (убедиться, что там лежит текущая сборка, а не откат),
  `npm run artifact`, публикация в ТУ ЖЕ ссылку https://claude.ai/code/artifact/3a24a501-7176-4bf4-8e99-cbb56b7ba1a9 ;
  при успехе поднять `CEILING` в `prototype/scripts/build-artifact.mjs` и дописать размер в цепочку в CLAUDE.md;
- доки: README фичи, `design-system.md` (§5 закон + §7 реестр), `decisions.md`, запись сессии
  `docs/sessions/YYYY-MM-DD--slug.md` + строка в `docs/sessions/index.md`, CLAUDE.md — только правила, которые
  сломают работу, если их не знать.

Состояние на момент передачи: артефакт v134 (1 454 192 байт), последняя работа — инструмент Select как у Lovable (рамка по боксу, пилюля-тег у курсора, любой элемент, бар «1 selection · Clear»); до этого — докинг панели инструментов
редактора в правый рейл, Glass Swell и второе стекло бара (`.liquid-glass--editbar`), Rim Sweep во всей системе.
Открытые вопросы дизайнеру перечислены в `docs/features/visual-editor/README.md` §6.
