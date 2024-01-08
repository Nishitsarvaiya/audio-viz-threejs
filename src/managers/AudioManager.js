import { Audio, AudioAnalyser, AudioListener, AudioLoader } from "three";
import App from "../App";

export default class AudioManager {
	constructor() {
		this.frequencyArray = [];
		this.frequencyData = {
			low: 0,
			mid: 0,
			high: 0,
		};
		this.isPlaying = false;
		this.lowFrequency = 15; //10Hz to 250Hz
		this.midFrequency = 250; //150Hz to 2000Hz
		this.highFrequency = 15000; //2000Hz to 20000Hz
		this.smoothedLowFrequency = 0;
		this.audioContext = null;
		this.songs = [
			{
				id: 0,
				name: "",
				url: "",
			},
			{
				id: 1,
				name: "Elektronomia - Sky High",
				url: "/Elektronomia - Sky High.mp3",
			},
			{
				id: 2,
				name: "Jim Yosef - Link",
				url: "/Jim Yosef - Link.mp3",
			},
		];
		this.songNames = this.songs.map((song) => song.name);
		this.songUrls = {
			"Culture Code - Make Me Move (feat. Karra)": "/Culture Code - Make Me Move (feat. Karra).mp3",
			"Elektronomia - Sky High": "/Elektronomia - Sky High.mp3",
			"Jim Yosef - Link": "/Jim Yosef - Link.mp3",
		};
		this.song = { song: this.songUrls["Jim Yosef - Link"] };
	}

	addGUI() {
		const songsFolder = App.gui.addFolder("SONGS");
		songsFolder
			.add(this.song, "song", this.songUrls)
			.listen()
			.onChange(async (e) => {
				if (this.isPlaying) {
					this.pause();
				}
				// this.song = this.songs.find((song) => song.name === e);
				App.particles.resetMesh();
				await this.loadAudioBuffer();
				await App.bpmManager.detectBPM(this.audio.buffer);
				this.play();
			});
	}

	async loadAudioBuffer() {
		// Load the audio file and create the audio buffer
		const promise = new Promise(async (resolve, reject) => {
			const audioListener = new AudioListener();
			this.audio = new Audio(audioListener);
			const audioLoader = new AudioLoader();

			audioLoader.load(this.song.song, (buffer) => {
				this.audio.setBuffer(buffer);
				this.audio.setLoop(true);
				this.audio.setVolume(1);
				this.audio.offset = 0;
				this.audioContext = this.audio.context;
				this.bufferLength = this.audioAnalyser.data.length;
				resolve();
			});

			this.audioAnalyser = new AudioAnalyser(this.audio, 1024);
		});

		return promise;
	}

	play() {
		this.audio.play();
		this.isPlaying = true;
	}

	pause() {
		this.audio.pause();
		this.isPlaying = false;
	}

	collectAudioData() {
		this.frequencyArray = this.audioAnalyser.getFrequencyData();
	}

	analyzeFrequency() {
		// Calculate the average frequency value for each range of frequencies
		const lowFreqRangeStart = Math.floor((this.lowFrequency * this.bufferLength) / this.audioContext.sampleRate);
		const lowFreqRangeEnd = Math.floor((this.midFrequency * this.bufferLength) / this.audioContext.sampleRate);
		const midFreqRangeStart = Math.floor((this.midFrequency * this.bufferLength) / this.audioContext.sampleRate);
		const midFreqRangeEnd = Math.floor((this.highFrequency * this.bufferLength) / this.audioContext.sampleRate);
		const highFreqRangeStart = Math.floor((this.highFrequency * this.bufferLength) / this.audioContext.sampleRate);
		const highFreqRangeEnd = this.bufferLength - 1;

		const lowAvg = this.normalizeValue(
			this.calculateAverage(this.frequencyArray, lowFreqRangeStart, lowFreqRangeEnd)
		);
		const midAvg = this.normalizeValue(
			this.calculateAverage(this.frequencyArray, midFreqRangeStart, midFreqRangeEnd)
		);
		const highAvg = this.normalizeValue(
			this.calculateAverage(this.frequencyArray, highFreqRangeStart, highFreqRangeEnd)
		);

		this.frequencyData = {
			low: lowAvg,
			mid: midAvg,
			high: highAvg,
		};
	}

	calculateAverage(array, start, end) {
		let sum = 0;
		for (let i = start; i <= end; i++) {
			sum += array[i];
		}
		return sum / (end - start + 1);
	}

	normalizeValue(value) {
		// Assuming the frequency values are in the range 0-256 (for 8-bit data)
		return value / 256;
	}

	update() {
		if (!this.isPlaying) return;

		this.collectAudioData();
		this.analyzeFrequency();
	}
}
