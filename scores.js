// Логика таблицы рекордов без работы с файлами и сетью — её легко проверить тестами.
const MAX = 10;        // сколько записей хранится в таблице
const NAME_MAX = 12;   // максимальная длина имени

const isInt = v =>
  (typeof v === 'number' && Number.isInteger(v) && v >= 0) ||
  (typeof v === 'string' && /^\d+$/.test(v));

// Возвращает текст ошибки или null, если данные корректны
function validate(body) {
  if (!body || typeof body !== 'object') return 'Тело запроса должно быть JSON-объектом';
  const { name, score, time } = body;
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > NAME_MAX)
    return 'Имя должно содержать от 1 до ' + NAME_MAX + ' символов';
  if (!isInt(score)) return 'Счёт должен быть целым числом не меньше 0';
  if (!isInt(time)) return 'Время должно быть целым числом не меньше 0';
  return null;
}

// Вставляет запись по убыванию счёта. При равном счёте новая запись встаёт ПОСЛЕ старых.
function addScore(list, rec) {
  const idx = list.findIndex(r => Number(r.score) < Number(rec.score));
  const pos = idx === -1 ? list.length : idx;
  if (pos >= MAX) return { list, added: false };
  const next = [...list];
  next.splice(pos, 0, rec);
  return { list: next.slice(0, MAX), added: true, place: pos + 1 };
}

module.exports = { validate, addScore, MAX, NAME_MAX };
