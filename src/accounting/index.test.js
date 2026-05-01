const {
  dataProgram,
  main,
  resetStorageBalance,
} = require('./index');

function createAsk(inputs) {
  let position = 0;

  return async () => {
    const value = inputs[position];
    position += 1;
    return value;
  };
}

async function runMainWithInputs(inputs) {
  const logs = [];

  await main({
    ask: createAsk(inputs),
    log: (message) => logs.push(String(message)),
    close: () => {},
  });

  return logs;
}

beforeEach(() => {
  resetStorageBalance(100000);
});

test('TC-01 View initial balance', async () => {
  const logs = await runMainWithInputs(['1', '4']);

  expect(logs).toContain('Current balance: 1000.00');
});

test('TC-02 Credit account with valid amount', async () => {
  const logs = await runMainWithInputs(['2', '200.00', '4']);

  expect(logs).toContain('Amount credited. New balance: 1200.00');
  expect(dataProgram('READ')).toBe(120000);
});

test('TC-03 Debit account with valid amount', async () => {
  const logs = await runMainWithInputs(['3', '100.00', '4']);

  expect(logs).toContain('Amount debited. New balance: 900.00');
  expect(dataProgram('READ')).toBe(90000);
});

test('TC-04 Debit account with insufficient funds', async () => {
  const logs = await runMainWithInputs(['3', '2000.00', '4']);

  expect(logs).toContain('Insufficient funds for this debit.');
  expect(dataProgram('READ')).toBe(100000);
});

test('TC-05 Credit then view balance', async () => {
  const logs = await runMainWithInputs(['2', '150.00', '1', '4']);

  expect(logs).toContain('Current balance: 1150.00');
});

test('TC-06 Debit then view balance', async () => {
  const logs = await runMainWithInputs(['3', '50.00', '1', '4']);

  expect(logs).toContain('Current balance: 950.00');
});

test('TC-07 Invalid menu option', async () => {
  const logs = await runMainWithInputs(['5', '4']);

  expect(logs).toContain('Invalid choice, please select 1-4.');
});

test('TC-08 Exit application', async () => {
  const logs = await runMainWithInputs(['4']);

  expect(logs).toContain('Exiting the program. Goodbye!');
});

test('TC-09 Multiple credits and debits sequence', async () => {
  const logs = await runMainWithInputs(['2', '100.00', '3', '50.00', '1', '4']);

  expect(logs).toContain('Current balance: 1050.00');
  expect(dataProgram('READ')).toBe(105000);
});

test('TC-10 Debit exact balance', async () => {
  const logs = await runMainWithInputs(['3', '1000.00', '1', '4']);

  expect(logs).toContain('Amount debited. New balance: 0.00');
  expect(logs).toContain('Current balance: 0.00');
  expect(dataProgram('READ')).toBe(0);
});
