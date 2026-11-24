// Сервер таблицы рекордов: Node.js + Express.
// Раздаёт файлы игры из папки public и два запроса: GET и POST /api/scores.
const express = require('express');
const fs = require('fs');
const path = require('path');
const { validate, addScore } = require('./scores');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'scores.json');

// Если файла с рекордами нет, создаём его с пустым массивом
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');

const readScores = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const writeScores = list => {
  const tmp = FILE + '.tmp';                       // пишем во временный файл,
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);                        // потом заменяем основной — файл не повредится
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Получить таблицу рекордов
app.get('/api/scores', (req, res) => {
  res.json(readScores());
});

// Отправить результат. Все операции с файлом синхронные, поэтому запросы
// нескольких игроков выполняются по очереди и не портят файл.
app.post('/api/scores', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const rec = {
    name: req.body.name.trim(),
    score: String(req.body.score),
    time: String(req.body.time)
  };
  const result = addScore(readScores(), rec);
  if (!result.added) return res.status(200).json(result.list);  // не попал в десятку
  writeScores(result.list);
  res.status(201).json(result.list);
});

// Обработка ошибок: неверный JSON -> 400, всё остальное -> 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' });
  console.error(err);
  res.status(500).json({ error: 'Ошибка сервера' });
});

app.listen(PORT, () => console.log('Сервер запущен: http://localhost:' + PORT));
