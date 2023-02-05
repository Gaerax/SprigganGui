import axios from "axios";

import {
	createContext,
	ReactNode,
	useContext,
	useState,
} from "react";
import Game from "../types/Game";

/**
 * Types
 */
interface IContext {
	apiUrl: string,
	setApiUrl: React.Dispatch<React.SetStateAction<string>>,
	search: {
		byTerm: SearchCallback,
	}
}

export type SearchParams = {
	term: string;
};

type SearchCallback = (params: SearchParams) => Promise<Game[]>;

/**
 * Context
 */
export const SearchContext = createContext<IContext>({} as IContext);

/**
 * Provider
 */
export function SearchContextProvider({children}: {
	children: ReactNode | ReactNode[];
}) {
	const [apiUrl, setApiUrl] = useState('http://10.0.0.2:5233') 

	const toGameList = (hits: any) => {
		const games = new Array<Game>()
		if (hits) {
			hits.forEach((hit: any) => {
				games.push(hit._source as Game)
			});
		}
		return games
	}

	const search = {
		
		mostRecent: async (params: SearchParams) => {
			const response = await axios.get(`${apiUrl}/search`, { params: { term: params.term } })
			return toGameList(response.data.hits.hits);
		},

		byTerm: async (params: SearchParams) => {
			const response = await axios.get(`${apiUrl}/search`, { params: { term: params.term } })
			return toGameList(response.data.hits.hits);
		}
	}

	return (
		<SearchContext.Provider
			value={{
				apiUrl,
				setApiUrl,
				search,
			}}
			>
			{children}
		</SearchContext.Provider>
	);
}

export function useSearch() {
	const context = useContext(SearchContext);
	if (context === undefined) {
		throw new Error(
			"useSearch must be used within a SearchContextProvider"
		);
	}
	return context;
}
