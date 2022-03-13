// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

const storeName ={
	trackId: "track_id",
	playerId: "player_id",
	raceId: "race_id",
};

// The store will hold all information needed globally
var store = {
	[storeName.trackId]: undefined,
	[storeName.playerId]: undefined,
	[storeName.raceId]: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		// adding the tracks data to UI
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			});

		// adding the racers tracks to UI
		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			});

	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE


function updateStore(key, value){
	store[key] = value;
}

function getStoreDataFor(key){
	 return store[key];
}
// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {

	// Get player_id and track_id from the store
     const playerId = getStoreDataFor(storeName.playerId);
	 const trackId = getStoreDataFor(storeName.trackId);

	// invoke the API call to create the race, then save the result
	const race = await createRace(playerId, trackId);
	// update the store with the race id
	// For the API to work properly, the race id should be race id - 1
	updateStore(storeName.raceId, race.ID-1);

	// render starting UI
	renderAt('#race', renderRaceStartView(race.Track));



	// The race has been created, now start the countdown
	// call the async function runCountdown
	await runCountdown();

	// call the async function startRace
	const start_race = await startRace(getStoreDataFor(storeName.raceId));
	if(!!start_race && start_race.status >=200 && start_race.status <=300 ){
		// call the async function runRace
		await runRace(getStoreDataFor(storeName.raceId))
	}
}

const raceStatus={
	progress: "in-progress",
	finished: "finished"

}

function runRace(raceID) {
	return new Promise(resolve => {

		//used Javascript's built in setInterval method to get race info every 500ms
		const raceInterval = setInterval(fetchAndUpdatePosition, 500)

		async function fetchAndUpdatePosition(){
			const race = await getRace(raceID);
			if(!!race){
				/**
				 * if the race info status property is "in-progress", update the leaderboard by calling
				 * renderAt('#leaderBoard', raceProgress(race.positions))
				 */
				if(race.status === raceStatus.progress){
					renderAt('#leaderBoard', raceProgress(race.positions))
				}
				/**
				 *
				 *  if the race info status property is "finished", run the following:
				 clearInterval(raceInterval) // to stop the interval from repeating
				 renderAt('#race', resultsView(res.positions)) // to render the results view
				 reslove(res) // resolve the promise
				 */
				else if(race.status === raceStatus.finished){
					clearInterval(raceInterval) // to stop the interval from repeating
					renderAt('#race', resultsView(race.positions)) // to render the results view
					resolve(race) // resolve the promise
				}
			}else {
				console.log('return value of race::api is undefined');
			}
		}
	}).catch((error)=>console.error(error))
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
			// use Javascript's built in setInterval method to count down once per second
			const countdown = setInterval(countdownTimer, 600);
			function countdownTimer(){
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = --timer;
				// if the countdown is done, clear the interval, resolve the promise, and return
				if(timer === 0){
					clearInterval(countdown);
					resolve();
				}
			}
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	updateStore(storeName.playerId, Number(target.id));
}

function handleSelectTrack(target) {
	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected track id to the store
	updateStore(storeName.trackId, Number(target.id));
}

function handleAccelerate() {
	console.log("accelerate button clicked")
	// Invoke the API call to accelerate
	accelerate(getStoreDataFor(storeName.raceId))
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>top speed: ${top_speed}</p>
			<p>acceleration: ${acceleration}</p>
			<p>handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
        	<header>
			<h1>Race Results</h1>
		</header>
		<section>
		<main>
			${raceProgress(positions)}
			<a href="/race" class="button">Start a new race</a>
		</main>
        </section>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// Make a fetch call (with error handling!) to each of the following API endpoints
async function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	try{
		const response = await fetch(`${SERVER}/api/tracks`);
		return (await response.json());
	}catch (e) {
		console.error(e);
	}

}

async function getRacers() {
	// GET request to `${SERVER}/api/cars`
	try{
		const response = await fetch(`${SERVER}/api/cars`);
		return (await response.json());
	}catch (e) {
		console.error(e);
	}

}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

async function getRace(id) {
	// GET request to
	try{
		const response = await fetch( `${SERVER}/api/races/${id}`);
		return response.json();
	}catch (e) {
		console.error(e);
	}
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => res)
	.catch(err => console.log("Problem with getRace request::", err))
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: 'POST',
		...defaultFetchOpts(),
	}).then(response => response).catch(err => console.error("error in acceleration::request"+err.message))
}
