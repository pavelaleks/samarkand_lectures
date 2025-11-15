// Тест регулярного выражения
const test = (num, filename) => {
  const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped}(?!\\d)[-_\\s]`);
  const result = regex.test(filename);
  console.log(`Номер "${num}" для файла "${filename}": ${result}`);
  return result;
};

console.log('Тест текущего регулярного выражения:');
test('1', '1_test.pdf');
test('1', '10_test.pdf');
test('1', '11_test.pdf');
test('1', '12_test.pdf');
test('11', '11_test.pdf');
test('11', '1_test.pdf');
test('11', '111_test.pdf');

