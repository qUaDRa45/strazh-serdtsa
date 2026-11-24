// Проверка логики таблицы рекордов: npm test
const assert = require('assert');
const { validate, addScore } = require('./scores');

// --- проверка данных
assert.strictEqual(validate({ name: 'Аня', score: '10', time: '20' }), null);
assert.strictEqual(validate({ name: 'Аня', score: 10, time: 20 }), null);
assert.ok(validate({ name: '', score: '1', time: '1' }));
assert.ok(validate({ name: 'ОченьДлинноеИмяИгрока', score: '1', time: '1' }));
assert.ok(validate({ name: 'Аня', score: '-5', time: '1' }));
assert.ok(validate({ name: 'Аня', score: '1.5', time: '1' }));
assert.ok(validate({ name: 'Аня', score: '1' }));
assert.ok(validate(null));

// --- вставка и сортировка
const r = n => ({ name: 'И' + n, score: String(n), time: '1' });
let list = [];
for (const n of [50, 70, 60]) list = addScore(list, r(n)).list;
assert.deepStrictEqual(list.map(x => x.score), ['70', '60', '50']);

// равный счёт: новая запись ниже старой
list = addScore(list, { name: 'Новый', score: '60', time: '1' }).list;
assert.deepStrictEqual(list.map(x => x.name), ['И70', 'И60', 'Новый', 'И50']);

// не больше десяти, слабый результат не добавляется
list = [];
for (let n = 100; n > 0; n -= 10) list = addScore(list, r(n)).list;
assert.strictEqual(list.length, 10);
let res = addScore(list, r(5));
assert.strictEqual(res.added, false);
res = addScore(list, r(55));
assert.ok(res.added);
assert.strictEqual(res.list.length, 10);
assert.strictEqual(res.list[res.list.length - 1].score, '20');

console.log('Все тесты пройдены');
