var micButton = document.getElementById("start-recording-button")
var elapsedTimeTag = document.getElementsByClassName("elapsed-time")[0]
var recordingControlButtonsContainer = document.getElementsByClassName("recording-control-buttons-container")[0]

let script = document.createElement('script')
script.setAttribute('src', 'https://unpkg.com/rxjs@7.5.5/dist/bundles/rxjs.umd.js')
script.setAttribute('id', "rxscript")
document.body.appendChild(script)

// now wait for it to load...
script.onload = () => {
	console.log(`loaded rxjs`)
	window.rxjs.race(
		window.rxjs.fromEvent(micButton, 'mousedown'),
		window.rxjs.fromEvent(micButton, 'touchstart')
	).pipe( //listen for first touch down
		window.rxjs.take(1),
		window.rxjs.tap(() => console.log(`Start recording`)),
		window.rxjs.switchMap(() => window.rxjs.from(audioRecorder.start()).pipe(
			window.rxjs.catchError((error) => window.rxjs.of(error)),	//catch the rejected promise in case the browser doesn't support mic
			window.rxjs.filter((promise) => {
				let canContinue = !(promise instanceof Error)

				if(!canContinue){
					//No Browser Support Error
					if (promise.message.includes("mediaDevices API or getUserMedia method is not supported in this browser.")) {
						console.log("To record audio, use browsers like Chrome and Firefox.");
						//displayBrowserNotSupportedOverlay();
					}

					//Error handling structure
					switch (promise.name) {
						case 'AbortError': //error from navigator.mediaDevices.getUserMedia
							console.log("An AbortError has occured.");
							break;
						case 'NotAllowedError': //error from navigator.mediaDevices.getUserMedia
							console.log("A NotAllowedError has occured. User might have denied permission.");
							break;
						case 'NotFoundError': //error from navigator.mediaDevices.getUserMedia
							console.log("A NotFoundError has occured.");
							break;
						case 'NotReadableError': //error from navigator.mediaDevices.getUserMedia
							console.log("A NotReadableError has occured.");
							break;
						case 'SecurityError': //error from navigator.mediaDevices.getUserMedia or from the MediaRecorder.start
							console.log("A SecurityError has occured.");
							break;
						case 'TypeError': //error from navigator.mediaDevices.getUserMedia
							console.log("A TypeError has occured.");
							break;
						case 'InvalidStateError': //error from the MediaRecorder.start
							console.log("An InvalidStateError has occured.");
							break;
						case 'UnknownError': //error from the MediaRecorder.start
							console.log("An UnknownError has occured.");
							break;
						default:
							console.log("An error occured with the error name " + promise.name);
					}
				}

				return canContinue
			}),
			window.rxjs.tap(() => {
				//store the recording start time to display the elapsed time according to it
				elapsedTimeTag.innerHTML = "00:00";
				//Display the recording control buttons
				recordingControlButtonsContainer.classList.remove("hide")
			}),
			window.rxjs.switchMap(() => window.rxjs.interval(1000).pipe(
				window.rxjs.tap((value) => {
					let elapsedTime = computeElapsedTime(value+1)
					//1. display the passed elapsed time as the elapsed time in the elapsedTime HTML element
					elapsedTimeTag.innerHTML = elapsedTime;

					//2. Stop the recording when the max number of hours is reached
					/*if (elapsedTimeReachedMaximumNumberOfHours(elapsedTime)) {
							stopAudioRecording();
					}*/
				}),
				window.rxjs.takeUntil(
					window.rxjs.race(
						window.rxjs.fromEvent(document, 'mouseup').pipe(window.rxjs.tap(() => console.log(`mouseup`))),
						window.rxjs.fromEvent(document, 'touchend').pipe(window.rxjs.tap(() => console.log(`touchend`)))
					).pipe(
						window.rxjs.take(1),
						window.rxjs.tap(() => console.log(`Stop recording`)),
						window.rxjs.tap((e) => console.log(e)),
						/*window.rxjs.takeUntil(window.rxjs.takeUntil(window.rxjs.fromEvent(el, 'touchend').pipe(
							window.rxjs.tap(() => console.log(`Stop recording`))
						)))*/
						window.rxjs.switchMap(() => window.rxjs.from(audioRecorder.stop()).pipe(
							window.rxjs.catchError((error) => window.rxjs.of(error)),	//catch rejected promise
							window.rxjs.filter((promise) => {
								let canContinue = !(promise instanceof Error)
	
								if(!canContinue){
									switch (promise.name) {
										case 'InvalidStateError': //error from the MediaRecorder.stop
												console.log("An InvalidStateError has occured.");
												break;
										default:
												console.log("An error occured with the error name " + promise.name);
									}
								}
								return canContinue
							}),
							window.rxjs.tap(() => console.log(`done`))
						))
					)
				)
			))
		)),
		window.rxjs.repeat()
	).subscribe()
}

/** Computes the elapsedTime since the moment the function is called in the format mm:ss or hh:mm:ss
 * @param {String} timeDiff Seconds since `touchstart`
 * @returns {String} elapsed time in mm:ss format or hh:mm:ss format, if elapsed hours are 0.
 */
function computeElapsedTime(timeDiff) {
	//extract integer seconds that dont form a minute using %
	let seconds = Math.floor(timeDiff % 60); //ignoring uncomplete seconds (floor)

	//pad seconds with a zero if neccessary
	seconds = seconds < 10 ? "0" + seconds : seconds;

	//convert time difference from seconds to minutes using %
	timeDiff = Math.floor(timeDiff / 60);

	//extract integer minutes that don't form an hour using %
	let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds
	minutes = minutes < 10 ? "0" + minutes : minutes;

	//convert time difference from minutes to hours
	timeDiff = Math.floor(timeDiff / 60);

	//extract integer hours that don't form a day using %
	let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds

	//convert time difference from hours to days
	timeDiff = Math.floor(timeDiff / 24);

	// the rest of timeDiff is number of days
	let days = timeDiff; //add days to hours

	let totalHours = hours + (days * 24);
	totalHours = totalHours < 10 ? "0" + totalHours : totalHours;

	if (totalHours === "00") {
			return minutes + ":" + seconds;
	} else {
			return totalHours + ":" + minutes + ":" + seconds;
	}
}

var audioRecorder = {
	/** Stores the recorded audio as Blob objects of audio data as the recording continues*/
	audioBlobs: [],/*of type Blob[]*/
	/** Stores the reference of the MediaRecorder instance that handles the MediaStream when recording starts*/
	mediaRecorder: null, /*of type MediaRecorder*/
	/** Stores the reference to the stream currently capturing the audio*/
	streamBeingCaptured: null, /*of type MediaStream*/
	/** Start recording the audio 
	 * @returns {Promise} - returns a promise that resolves if audio recording successfully started
	 */
	start: function () {
		//Feature Detection
		if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
			//Feature is not supported in browser
			//return a custom error
			return Promise.reject(new Error('mediaDevices API or getUserMedia method is not supported in this browser.'));
		}else{
			//Feature is supported in browser so create an audio stream
			return navigator.mediaDevices.getUserMedia({ audio: true }/*of type MediaStreamConstraints*/)
				//returns a promise that resolves to the audio stream
				.then(stream /*of type MediaStream*/ => {

					//save the reference of the stream to be able to stop it when necessary
					audioRecorder.streamBeingCaptured = stream;

					//create a media recorder instance by passing that stream into the MediaRecorder constructor
					audioRecorder.mediaRecorder = new MediaRecorder(stream); /*the MediaRecorder interface of the MediaStream Recording
									API provides functionality to easily record media*/

					//clear previously saved audio Blobs, if any
					audioRecorder.audioBlobs = [];

					//add a dataavailable event listener in order to store the audio data Blobs when recording
					audioRecorder.mediaRecorder.addEventListener("dataavailable", event => {
						//store audio Blob object
						audioRecorder.audioBlobs.push(event.data);
					});

					//start the recording by calling the start method on the media recorder
					audioRecorder.mediaRecorder.start();
				});

			/* errors are not handled in the API because if its handled and the promise is chained, the .then after the catch will be executed*/
		}
	},
	/** Stop the started audio recording
	 * @returns {Promise} - returns a promise that resolves to the audio as a blob file
	 */
	stop: function () {
		//return a promise that would return the blob or URL of the recording
		return new Promise(resolve => {
			//save audio type to pass to set the Blob type
			let mimeType = audioRecorder.mediaRecorder.mimeType;

			//listen to the stop event in order to create & return a single Blob object
			audioRecorder.mediaRecorder.addEventListener("stop", () => {
				//create a single blob object, as we might have gathered a few Blob objects that needs to be joined as one
				let audioBlob = new Blob(audioRecorder.audioBlobs, { type: mimeType });

				//resolve promise with the single audio blob representing the recorded audio
				resolve(audioBlob);
			});
			audioRecorder.cancel();
		});
	},
	/** Cancel audio recording*/
	cancel: function () {
		//stop the recording feature
		audioRecorder.mediaRecorder.stop();

		//stop all the tracks on the active stream in order to stop the stream
		audioRecorder.stopStream();

		//reset API properties for next recording
		audioRecorder.resetRecordingProperties();
	},
	/** Stop all the tracks on the active stream in order to stop the stream and remove
	 * the red flashing dot showing in the tab
	 */
	stopStream: function () {
		//stopping the capturing request by stopping all the tracks on the active stream
		audioRecorder.streamBeingCaptured.getTracks() //get all tracks from the stream
			.forEach(track /*of type MediaStreamTrack*/ => track.stop()); //stop each one
	},
	/** Reset all the recording properties including the media recorder and stream being captured*/
	resetRecordingProperties: function () {
		audioRecorder.mediaRecorder = null;
		audioRecorder.streamBeingCaptured = null;

		/*No need to remove event listeners attached to mediaRecorder as
		If a DOM element which is removed is reference-free (no references pointing to it), the element itself is picked
		up by the garbage collector as well as any event handlers/listeners associated with it.
		getEventListeners(audioRecorder.mediaRecorder) will return an empty array of events.*/
	}
}