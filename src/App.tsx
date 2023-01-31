import React from 'react';
import logo from './logo.svg';
import './App.css';

import axios from 'axios';

import { Button } from "@mui/material";


function App() {

	const test = async () => {
		console.log("start");
		axios.post('http://localhost:5235', {
			"cache-control": "no-cache",
			"content-type": "application/json",
			"jsonrpc": '2.0',
			"method": 'subtfg',
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
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<p>
					Edit <code>src/App.tsx</code> and save to reload. 
				</p>
				<a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Learn React
				</a>
				<Button
					onClick={test}
				>Test</Button>
			</header>
		</div>
	);
}

export default App;
