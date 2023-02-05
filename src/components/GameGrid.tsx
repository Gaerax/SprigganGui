import { Grid } from "@mui/material";
import Game from "../spriggan-shared/types/Game";
import GameCard from "./GameCard";

const GameGrid = (
			searchResults: Game[],
			onBuy: () => Promise<void>,
			setActiveOffer: React.Dispatch<React.SetStateAction<string>>
		) => {
	return (
		<Grid container p={4} spacing={4} id="gameslist">
			{searchResults && searchResults.map((result: Game) => (
				<Grid key={result.productid} item xs={6} sm={4} md={3} lg={2}>
				<GameCard
					game={result}
					onBuy={onBuy}
					setActiveOffer={setActiveOffer}
					/>
				</Grid>
			))}
		</Grid>
	);
}

export default GameGrid;