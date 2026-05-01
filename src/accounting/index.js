const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

let rl;

function getReadlineInterface() {
  if (!rl) {
    rl = readline.createInterface({ input, output });
  }

  return rl;
}

// DataProgram equivalent: central in-memory balance storage.
let storageBalanceCents = 100000; // 1000.00

function dataProgram(operationType, balanceCents = 0) {
  if (operationType === 'READ') {
    return storageBalanceCents;
  }

  if (operationType === 'WRITE') {
    storageBalanceCents = balanceCents;
    return storageBalanceCents;
  }

  throw new Error(`Unsupported operation type: ${operationType}`);
}

function resetStorageBalance(balanceCents = 100000) {
  storageBalanceCents = balanceCents;
}

function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

function parseAmountToCents(rawValue) {
  const trimmed = String(rawValue).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

async function promptAmount(promptText, ask, log) {
  const response = await ask(promptText);
  const amountCents = parseAmountToCents(response);

  if (amountCents === null) {
    log('Invalid amount. Please enter a positive number with up to 2 decimal places.');
    return null;
  }

  return amountCents;
}

async function operations(operationType, deps = {}) {
  const ask = deps.ask || ((promptText) => getReadlineInterface().question(promptText));
  const log = deps.log || console.log;

  if (operationType === 'TOTAL ') {
    const finalBalanceCents = dataProgram('READ');
    log(`Current balance: ${formatMoney(finalBalanceCents)}`);
    return;
  }

  if (operationType === 'CREDIT') {
    const amountCents = await promptAmount('Enter credit amount: ', ask, log);
    if (amountCents === null) {
      return;
    }

    let finalBalanceCents = dataProgram('READ');
    finalBalanceCents += amountCents;
    dataProgram('WRITE', finalBalanceCents);
    log(`Amount credited. New balance: ${formatMoney(finalBalanceCents)}`);
    return;
  }

  if (operationType === 'DEBIT ') {
    const amountCents = await promptAmount('Enter debit amount: ', ask, log);
    if (amountCents === null) {
      return;
    }

    let finalBalanceCents = dataProgram('READ');
    if (finalBalanceCents >= amountCents) {
      finalBalanceCents -= amountCents;
      dataProgram('WRITE', finalBalanceCents);
      log(`Amount debited. New balance: ${formatMoney(finalBalanceCents)}`);
    } else {
      log('Insufficient funds for this debit.');
    }
    return;
  }

  throw new Error(`Unsupported account operation: ${operationType}`);
}

async function main(deps = {}) {
  const ask = deps.ask || ((promptText) => getReadlineInterface().question(promptText));
  const log = deps.log || console.log;
  const close = deps.close || (() => {
    if (rl) {
      rl.close();
      rl = undefined;
    }
  });

  let continueFlag = 'YES';

  while (continueFlag !== 'NO') {
    log('--------------------------------');
    log('Account Management System');
    log('1. View Balance');
    log('2. Credit Account');
    log('3. Debit Account');
    log('4. Exit');
    log('--------------------------------');

    const choiceInput = await ask('Enter your choice (1-4): ');
    const userChoice = Number.parseInt(choiceInput, 10);

    switch (userChoice) {
      case 1:
        await operations('TOTAL ', { ask, log });
        break;
      case 2:
        await operations('CREDIT', { ask, log });
        break;
      case 3:
        await operations('DEBIT ', { ask, log });
        break;
      case 4:
        continueFlag = 'NO';
        break;
      default:
        log('Invalid choice, please select 1-4.');
        break;
    }
  }

  log('Exiting the program. Goodbye!');
  close();
}

module.exports = {
  dataProgram,
  formatMoney,
  parseAmountToCents,
  operations,
  main,
  resetStorageBalance,
};

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected application error:', error);
    if (rl) {
      rl.close();
      rl = undefined;
    }
    process.exitCode = 1;
  });
}
