// Обмен данными с сервером (запросы GET и POST /api/scores)
const API_URL = '/api/scores';

async function request(options) {
  let res;
  try {
    res = await fetch(API_URL, options);
  } catch (e) {
    throw new Error('Не удалось подключиться к серверу');   // сервер выключен или нет сети
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Ошибка сервера');
  return data;
}

// Получить таблицу рекордов (массив записей)
function fetchScores() {
  return request();
}

// Отправить результат; сервер вернёт обновлённую таблицу
function sendScore(name, score, time) {
  return request({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score: String(score), time: String(time) })
  });
}
