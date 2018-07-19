var nem = require('nem-library');
var nemsdk = require('nem-sdk').default;
var gameCode = require('./game');
var dotenv = require('dotenv');

dotenv.load();

// Initialize NEMLibrary for TEST_NET Network
nem.NEMLibrary.bootstrap(nem.NetworkTypes.TEST_NET);

const nodeEndpoint = [
  {
    domain: '192.3.61.243',
  },
];

const address = new nem.Address(process.env.NEM_ADDRESS);

let confirmedTransactionListener = new nem.ConfirmedTransactionListener(
  nodeEndpoint
).given(address);

confirmedTransactionListener.subscribe(
  tx => {
    purchaseGame(tx);
  },
  err => {
    console.log(err);
  }
);

function purchaseGame(tx) {
  const buyerAdd = tx.signer.address.plain();
  const amount = tx._xem.amount;
  const code = JSON.parse(nemsdk.utils.convert.hex2a(tx.message.payload));

  var gamepurchase = [];

  gameCode.map(game => {
    if (game.name === code.gamecode) {
      gamepurchase.push(game);
    }
  });

  booking(gamepurchase[0], buyerAdd, amount);

  if (gamepurchase.length != 0) {
    if (amount >= gamepurchase[0].info.price) {
      sendActivationCode(tx, gamepurchase[0]);
    } else {
      console.log('credit not enough');
    }
  }
}

function sendActivationCode(tx, gamepurchase) {
  const transactionHttp = new nem.TransactionHttp();

  const privateKey = process.env.NEM_PRIVATE_KEY;

  const recipientPublicAccount = nem.PublicAccount.createWithPublicKey(
    tx.signer.publicKey
  );

  const account = nem.Account.createWithPrivateKey(privateKey);

  let key =
    gamepurchase.info.activationCode[
      Math.floor(Math.random() * gamepurchase.info.activationCode.length)
    ];

  let invoice = Math.floor(Math.random() * 99999);

  let receipt =
    '{"invoice": ' +
    invoice +
    ',"code": "' +
    key +
    '","game": "' +
    gamepurchase.name +
    '"}';

  const encryptedMessage = account.encryptMessage(
    receipt,
    recipientPublicAccount
  );
  const transferTransaction = nem.TransferTransaction.create(
    nem.TimeWindow.createWithDeadline(),
    recipientPublicAccount.address,
    new nem.XEM(0),
    encryptedMessage
  );

  const signedTransaction = account.signTransaction(transferTransaction);

  transactionHttp.announceTransaction(signedTransaction).subscribe(x => {
    sendInvoice(
      invoice,
      x.transactionHash.data,
      recipientPublicAccount.address.plain(),
      gamepurchase
    );
  });
}

function sendInvoice(invoice, tx, address, game) {
  console.log('----------------------Invoice------------------------');
  console.log('Invoice: ' + invoice);
  console.log('Tx: ' + tx);
  console.log('Receiver: ' + address);
  console.log('Game: ' + game.name);
}

function booking(game, address, amount) {
  console.log('----------------------Booking------------------------');
  console.log('Game: ' + game.name);
  console.log('Buyer: ' + address);
  console.log('Amount: ' + amount);
}

console.log('----------------------Steam Store------------------------');
console.log('Good day.....');
