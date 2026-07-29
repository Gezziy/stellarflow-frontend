/**
 * HTLC escrow contract operations.
 *
 * Stellar SDK and Freighter are lazy-loaded so they stay out of the initial bundle
 * until a user explicitly submits a claim transaction.
 */

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const DEFAULT_FEE = '100000';

export interface ClaimEscrowParams {
  contractId: string;
  preimageHex: string;
}

export interface ClaimEscrowResult {
  txHash: string;
}

async function waitForTransaction(
  server: InstanceType<
    Awaited<typeof import('@stellar/stellar-sdk')>['rpc']['Server']
  >,
  hash: string,
): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await server.getTransaction(hash);

    if (response.status === 'SUCCESS') {
      return;
    }

    if (response.status === 'FAILED') {
      throw new Error('Claim transaction failed on the Soroban network.');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error('Timed out waiting for claim transaction confirmation.');
}

/**
 * Builds, signs (via Freighter), and submits an HTLC `claim()` Soroban invocation.
 */
export async function claimEscrow({
  contractId,
  preimageHex,
}: ClaimEscrowParams): Promise<ClaimEscrowResult> {
  const { isConnected, getAddress, signTransaction } = await import(
    '@stellar/freighter-api'
  );
  const {
    Contract,
    Networks,
    rpc,
    TransactionBuilder,
    nativeToScVal,
    Transaction,
  } = await import('@stellar/stellar-sdk');

  if (!(await isConnected())) {
    throw new Error('Freighter wallet is not connected. Please connect your wallet first.');
  }

  const { address: publicKey } = await getAddress();
  if (!publicKey) {
    throw new Error('Could not retrieve public key from Freighter.');
  }

  const rpcServer = new rpc.Server(SOROBAN_RPC_URL, { allowHttp: true });
  const contract = new Contract(contractId);
  const preimageBytes = Buffer.from(preimageHex, 'hex');

  const sourceAccount = await rpcServer.getAccount(publicKey);

  const builtTx = new TransactionBuilder(sourceAccount, {
    fee: DEFAULT_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call('claim', nativeToScVal(preimageBytes, { type: 'bytes' })),
    )
    .setTimeout(180)
    .build();

  const preparedTx = await rpcServer.prepareTransaction(builtTx);

  const { signedTxXdr, error } = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: Networks.TESTNET,
  });

  if (error || !signedTxXdr) {
    throw new Error('Transaction signing failed or was canceled.');
  }

  const signedTx = TransactionBuilder.fromXDR(
    signedTxXdr,
    Networks.TESTNET,
  ) as Transaction;

  const submitResponse = await rpcServer.sendTransaction(signedTx);

  if (submitResponse.status === 'ERROR') {
    throw new Error(
      submitResponse.errorResult
        ? `Claim submission failed: ${submitResponse.errorResult}`
        : 'Claim submission failed.',
    );
  }

  await waitForTransaction(rpcServer, submitResponse.hash);

  return { txHash: submitResponse.hash };
}
