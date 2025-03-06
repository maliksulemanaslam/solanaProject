import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, toMetaplexFile, toBigNumber, CreateCandyMachineInput, DefaultCandyGuardSettings, CandyMachineItem, toDateTime, sol, TransactionBuilder, CreateCandyMachineBuilderContext } from "@metaplex-foundation/js";
import secret from './guideSecret.json';


const QUICKNODE_RPC = 'https://winter-little-mound.solana-devnet.quiknode.pro/5e0c0233d9a7c9c03c09d22e7ac04704b1294923'; // 👈 Replace with your QuickNode Solana Devnet HTTP Endpoint
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, { commitment: 'finalized' });

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const NFT_METADATA = 'https://mfp2m2qzszjbowdjl2vofmto5aq6rtlfilkcqdtx2nskls2gnnsa.arweave.net/YV-mahmWUhdYaV6q4rJu6CHozWVC1CgOd9NkpctGa2Q'; 
const COLLECTION_NFT_MINT = 'FFiawqYcnTLDbQ93XG39Qhe6Yu1aSER9BeTPQqddmCp6'; 
const CANDY_MACHINE_ID = '2rM5VXQoRVy2Q8gWrDPNBTwgRhLUmM4sfK2ZDhf1YmPN';


const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
    .use(keypairIdentity(WALLET));

    async function createCollectionNft() {
        const { nft: collectionNft } = await METAPLEX.nfts().create({
            name: "QuickNode Demo NFT Collection",
            uri: NFT_METADATA,
            sellerFeeBasisPoints: 0,
            isCollection: true,
            updateAuthority: WALLET,
          });
    
          console.log(`✅ - Minted Collection NFT: ${collectionNft.address.toString()}`);
          console.log(`     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`);
    }

     //createCollectionNft();

    async function generateCandyMachine() {
        const candyMachineSettings: CreateCandyMachineInput<DefaultCandyGuardSettings> = {
            itemsAvailable: toBigNumber(3), // Collection size: 3
            sellerFeeBasisPoints: 1000,     // 10% royalties
            symbol: "DEMO",
            maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT
            isMutable: true,
            creators: [
                { address: WALLET.publicKey, share: 100 },
            ],
            collection: {
                address: new PublicKey(COLLECTION_NFT_MINT),
                updateAuthority: WALLET,
            },
        };

        const { candyMachine } = await METAPLEX.candyMachines().create(candyMachineSettings);
        console.log(`✅ - Created Candy Machine: ${candyMachine.address.toString()}`);
        console.log(`     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`);
    }

    // Call the function to create your Candy Machine
    //generateCandyMachine();
    
    async function updateCandyMachine() {
        const candyMachine = await METAPLEX
            .candyMachines()
            .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });
    
        const { response } = await METAPLEX.candyMachines().update({
            candyMachine,
            guards: {
                startDate: { date: toDateTime("2022-10-17T16:00:00Z") },
                mintLimit: {
                    id: 1,
                    limit: 4000,
                },
                solPayment: {
                    amount: sol(0.000001),
                    destination: METAPLEX.identity().publicKey,
                },
            }
        })
        
        console.log(`✅ - Updated Candy Machine: ${CANDY_MACHINE_ID}`);
        console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
    }

    //updateCandyMachine();

    async function addItems() {
        const candyMachine = await METAPLEX
            .candyMachines()
            .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) }); 
        const items = [];
        for (let i = 0; i < 3; i++ ) { // Add 3 NFTs (the size of our collection)
            items.push({
                name: `QuickNode Demo NFT # ${i+1}`,
                uri: NFT_METADATA
            })
        }
        const { response } = await METAPLEX.candyMachines().insertItems({
            candyMachine,
            items: items,
          },{commitment:'finalized'});
    
        console.log(`✅ - Items added to Candy Machine: ${CANDY_MACHINE_ID}`);
        console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);

        console.log("CandyMachine.itemsAvailable:", candyMachine.itemsAvailable.toNumber());
        console.log("CandyMachine.itemsLoadedCount:", candyMachine.itemsLoaded.toString());
        console.log("CandyMachine.itemsMinted:", candyMachine.itemsMinted.toNumber());
    }
    
    //addItems();
    

    async function mintNft() {
        const candyMachine = await METAPLEX
            .candyMachines()
            .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) }); 
        let { nft, response } = await METAPLEX.candyMachines().mint({
            candyMachine,
            collectionUpdateAuthority: WALLET.publicKey,
            },{commitment:'finalized'})
    
        console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
        console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
        console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
    }

    mintNft();
