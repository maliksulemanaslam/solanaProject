const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
const secret = require("./guideSecret.json");

// 1) Setup your Solana connection
const QUICKNODE_RPC = "https://winter-little-mound.solana-devnet.quiknode.pro/5e0c0233d9a7c9c03c09d22e7ac04704b1294923"; // e.g., "https://your-custom-quiknode-endpoint.solana-devnet.quiknode.pro/..."
const connection = new Connection(QUICKNODE_RPC, { commitment: "finalized" });

// 2) Candy Machine + Server Wallet
const CANDY_MACHINE_ID = "2rM5VXQoRVy2Q8gWrDPNBTwgRhLUmM4sfK2ZDhf1YmPN";
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

// 3) Metaplex client
const METAPLEX = Metaplex.make(connection).use(keypairIdentity(WALLET));

// 4) Express App Setup
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get("/", (req, res) => {
  res.send("Candy Machine Server is Running!");
});

// 5) /mint endpoint
app.post("/mint", async (req, res) => {
  try {
    const { recipientAddress } = req.body;
    if (!recipientAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing recipientAddress in request body",
      });
    }

    // Fetch Candy Machine
    const candyMachine = await METAPLEX.candyMachines().findByAddress({
      address: new PublicKey(CANDY_MACHINE_ID),
    });

    // Convert to a PublicKey
    const recipientPubKey = new PublicKey(recipientAddress);

    // Mint the NFT
    const { nft, response: txResponse } = await METAPLEX.candyMachines().mint(
      {
        candyMachine,
        // The wallet that will own the minted NFT
        newOwner: recipientPubKey,
        // Because WALLET is the Candy Machine authority
        collectionUpdateAuthority: WALLET.publicKey,
      },
      { commitment: "finalized" }
    );

    // Log out minted NFT addresses, just like in app.ts
    console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
    console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
    console.log(`     https://explorer.solana.com/tx/${txResponse.signature}?cluster=devnet`);

    // Respond with success
    return res.status(200).json({
      success: true,
      mintedNft: nft.address.toString(),
      txSignature: txResponse.signature,
      explorerUrl: `https://explorer.solana.com/tx/${txResponse.signature}?cluster=devnet`,
    });
  } catch (error) {
    console.error("Error minting NFT:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 6) Start listening
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Candy Machine server is running at http://localhost:${PORT}`);
});