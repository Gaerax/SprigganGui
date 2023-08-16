import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from "react-router-dom";

export const App = () => (
	<BrowserRouter>
		<div>
			<Routes>
				<Route path="/" element={<Navigate to='dapps/spriggan-marketplace-dapp' />} />
				{DApps()}
			</Routes>
		</div>
	</BrowserRouter>
);


const DApps = () => (
	<Route path={"dapps/:dapp"} loader={
		async ({ params }) => {
			console.log("dapp found")
			const dapp = fetch(
				`./dapps/${params.dapp}/index.html`
			);
			console.log("dapp found", dapp)
			if (dapp) {
				return dapp;
			}
			return <h1>DApp not Found</h1>;
		}
	} />
);