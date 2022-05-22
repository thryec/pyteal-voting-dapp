import dotenv from 'dotenv'
import algosdk from 'algosdk'
dotenv.config()

let myAccount = algosdk.mnemonicToSecretKey(process.env.ACCOUNT_MNEMONIC)

const baseServer = 'https://testnet-algorand.api.purestake.io/ps2'
const port = ''
const token = {
  'X-API-Key': process.env.API_KEY,
}

// This variable is our client. It is the link between our code and the blockchain
const algodClient = new algosdk.Algodv2(token, baseServer, port)

;(async () => {
  try {
    let params = await algodClient.getTransactionParams().do()
    console.log('params: ', params)
    const receiver =
      'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA'
    const enc = new TextEncoder()
    const note = enc.encode('My first transaction on Algo!')
    let amount = 100000 // equals .1 ALGO
    let sender = myAccount.addr

    let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      amount: amount,
      node: note,
      suggestedParams: params,
    })

    let accountInfo = await algodClient.accountInformation(myAccount.addr).do()
    console.log('Account balance: %d microAlgos', accountInfo.amount)

    // sign transaction
    let signedTxn = txn.signTxn(myAccount.sk)
    console.log('signed transaction:', signedTxn)
    let txId = txn.txID().toString()
    console.log('Signed transaction with txID: %s', txId)

    await algodClient.sendRawTransaction(signedTxn).do()

    // Wait for confirmation
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4)
    accountInfo = await algodClient.accountInformation(myAccount.addr).do()
    console.log('Transaction Amount: %d microAlgos', confirmedTxn.txn.txn.amt)
    console.log('Transaction Fee: %d microAlgos', confirmedTxn.txn.txn.fee)
    console.log('Account balance: %d microAlgos', accountInfo.amount)
  } catch (err) {
    console.error('Failed to get apps from the sdk', err)
    process.exit(1)
  }
})()
