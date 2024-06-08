const SECRET_CHAIN_ID = "pulsar-3";
const SECRET_LCD = "https://api.pulsar3.scrttestnet.com";
let secretAddress;
const contractCodeHash = "236456414a260a62e57f8142b4d3793df1072c6dd9cc76bc9f5817a72872d2a3";
const contractAddress = "secret1sszujacjmtfcm2yc37gvl57sy06qcs86wqrwp2";


async function connect(){
    if (!window.keplr) {
        alert("Please install keplr extension");
    } else {
        const chainId = "pulsar-3";
        await window.keplr.enable(chainId);
        window.keplr.defaultOptions = {
            sign: {
                preferNoSetFee: false,
                disableBalanceCheck: true,
            },
        };
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(SECRET_CHAIN_ID);
        const enigmaUtils = window.getEnigmaUtils(chainId);
        const accounts = await keplrOfflineSigner.getAccounts();
        secretAddress = accounts[0].address;
        let secret = new secretjs.SecretNetworkClient({
                url: SECRET_LCD,
                chainId: SECRET_CHAIN_ID,
                wallet: keplrOfflineSigner,
                walletAddress: secretAddress,
                encryptionUtils: window.getEnigmaUtils(SECRET_CHAIN_ID),
            }
        );

        console.log(secret);
        return secret;
    }

}


async function try_spin(max, secretAddress, secretjs){
    const tx = await secretjs.tx.compute.executeContract(
        {
            sender: secretAddress,
            contract_address: contractAddress,
            msg: {
                spin_raffle_wheel: {
                    max: parseInt(max),
                },
            },
            code_hash: contractCodeHash,
        },
        { gasLimit: 100_000 }
    );

    console.log(tx);
}

async function query_spin(secretjs){
    let tx = await secretjs.query.compute.queryContract({
        contract_address: contractAddress,
        code_hash: contractCodeHash,
        query: {
            get_raffle_number: {},
        },
    });

    const raffleNumber = tx.current_raffle_number;
    const spinBinary = tx.random_binary;

    return raffleNumber;

}