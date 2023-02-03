import { useEffect, useState } from "react";
import './App.css';

import axios from 'axios';

import { Button, Box, Grid } from "@mui/material";
import MainTopBar from "./components/MainTopBar";
import GameCard from "./components/GameCard";
import Game from "./types/Game";

import { useWalletConnectClient } from "./contexts/ClientContext";
import { useJsonRpc } from "./contexts/JsonRpcContext";
import { useChainData } from "./contexts/ChainDataContext";
import GameGrid from "./components/GameGrid";

function App() {
	const [baseUrl, setBaseUrl] = useState('http://10.0.0.2:5233') 
	const [searchTerm, setSearchTerm] = useState<string>("Sprigga");
	const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>(setTimeout(async () => {}, 100));
	const [searchResults, setSearchResults] = useState<Game[]>([]);
	const [searchOffset, setSearchOffset] = useState<number>(0);
	const [selectedGame, setSelectedGame] = useState<Game>();
	const [games, setGames] = useState<Game[]>([]);
	const [activeOffer, setActiveOffer] = useState<string>("");

	useEffect(() => {
		if (searchTerm !== "") {
			clearTimeout(searchDebounce)
			setSearchDebounce(setTimeout(async () => {
				setSearchOffset(0)
				const response = await axios.get(`${baseUrl}/search`, { params: { term: searchTerm } })
				setSearchResults(toGameList(response.data.hits.hits))
			}, 300));
		}
	}, [searchTerm, baseUrl]);

	const toGameList = (hits: any) => {
		const games = new Array<Game>()
		hits.forEach((hit: any) => {
			games.push(hit._source as Game)
		});
		return games
	}

	useEffect(() => {
		document.title = `Spriggan Marketplace`;
	}, [searchResults]);

	const [modal, setModal] = useState("");

	const closeModal = () => setModal("");
	const openPairingModal = () => setModal("pairing");
	const openPingModal = () => setModal("ping");
	const openRequestModal = () => setModal("request");

	// Initialize the WalletConnect client.
	const {
		client,
		pairings,
		session,
		connect,
		disconnect,
		chains,
		relayerRegion,
		accounts,
		balances,
		isFetchingBalances,
		isInitializing,
		setChains,
		setRelayerRegion,
	} = useWalletConnectClient();

	// Use `JsonRpcContext` to provide us with relevant RPC methods and states.
	const {
		ping,
		chiaRpc,
		isRpcRequestPending,
		rpcResult,
		isTestnet,
		setIsTestnet,
	} = useJsonRpc();

	const { chainData } = useChainData();

	// Close the pairing modal after a session is established.
	useEffect(() => {
		if (session && modal === "pairing") {
		closeModal();
		}
	}, [session, modal]);

	const onConnect = () => {
		if (typeof client === "undefined") {
			throw new Error("WalletConnect is not initialized");
		}
		// Suggest existing pairings (if any).
		if (pairings.length) {
			connect(pairings[0]);
		} else {
			handleChainSelectionClick("chia:mainnet");
			// If no existing pairings are available, trigger `WalletConnectClient.connect`.
			connect();
		}
	};

	const onPing = async () => {
		openPingModal();
		await ping();
	};

	const executeOffer = async () => {
		if (session && activeOffer) {
			var x = session.namespaces.chia.accounts[0].split(":");
			console.log(x[0] + ':' + x[1], x[2]);
			await chiaRpc.acceptOffer(x[0] + ':' + x[1], x[2], activeOffer);
		}
	};

	const handleChainSelectionClick = (chainId: string) => {
		if (chains.includes(chainId)) {
			// setChains(chains.filter((chain) => chain !== chainId));
		} else {
			setChains([...chains, chainId]);
		}
	};

	const test = async () => {
		console.log("start");
		axios.post('http://localhost:5235', {
			"cache-control": "no-cache",
			"content-type": "application/json",
			"jsonrpc": '2.0',
			"method": 'subtract',
			"id": 1,
			"params": {
				"x": 7,
				"y": 5100
			}
		}).then((response) => {
			console.log(response);
		}, (error) => {
			console.log(error);
		});;
	}

	
	
	return (
			<Box>
				{MainTopBar(session, onConnect, onPing, disconnect, (event) => {setSearchTerm(event.target.value)})}
				{GameGrid(searchResults, executeOffer, setActiveOffer)}
				
				<Button onClick={() => {
					const game = {
						"productid": "517B1E97-F1AF-4824-A7B9-8D85E281D7B8",
						"datastoreid": "56785678",
						"title": "NEW GAME",
						"publisher": "Gaerax",
						"developer": "Gaerax",
						"description": "A simple pong game",
						"longdescription": "A simple game of pong made to demonstrate the capabilities of spriggan",
						"website": "spriggan.io",
						"twitter": "@gaeraxx",
						"discord": "http://discord.com/iou1h34",
						"instagram": "@gaeraxx",
						"publisherdid": "did:chia:19qf3g9876t0rkq7tfdkc28cxfy424yzanea29rkzylq89kped9hq3q7wd2",
						"contentrating": "E",
						"capsuleimage": "https://i.imgur.com/Z8UT1Lx.png",
						"icon": "https://i.imgur.com/Z8UT1Lx.png",
						"tags": "simple, pong, casual",
						"status": "Complete",
						"version": "1.0",
						"screenshots": "https://i.guim.co.uk/img/static/sys-images/Technology/Pix/pictures/2008/04/16/Pong460x276.jpg?width=465&quality=85&dpr=1&s=none",
						"paymentaddress": "xch1w89m85c6kr7w4jtff5r53lfardjcawsnrdnxh5ke9aeqnaeddphqjez9jh",
						"password": "password123"
					}
					axios.post(`http://localhost:3000/requestlisting`, { params: { game: game } })
						.then(res => {
							console.log(res);
						}
					)
				}}>
					execute
				</Button>
			</Box>
	);
}

export default App;
