import { Color, DirectionalLight, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";
import AudioManager from "./managers/AudioManager";
import BPMManager from "./managers/BpmManager";
import ReactiveParticles from "./entities/ReactiveParticles";

export default class App {
	//THREE objects
	static holder = null;
	static gui = null;

	//Managers
	static audioManager = null;
	static bpmManager = null;

	constructor() {
		this.onClickBinder = () => this.init();
		document.addEventListener("click", this.onClickBinder);
	}

	init() {
		document.removeEventListener("click", this.onClickBinder);

		this.renderer = new WebGLRenderer({
			antialias: true,
			alpha: true,
		});

		// this.renderer.setClearColor("#121212", 1);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.autoClear = false;
		document.getElementById("app").appendChild(this.renderer.domElement);

		this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.z = 12;
		this.camera.frustumCulled = true;

		this.scene = new Scene();
		// this.scene.background = new Color("#121212");
		this.scene.add(this.camera);

		this.light = new DirectionalLight("#ffffff", 5);
		this.scene.add(this.light);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.update();

		App.holder = new Object3D();
		App.holder.name = "holder";
		this.scene.add(App.holder);
		App.holder.sortObjects = false;

		App.gui = new GUI();

		this.createManagers();

		this.resize();
		window.addEventListener("resize", () => this.resize());
	}

	async createManagers() {
		App.audioManager = new AudioManager();
		await App.audioManager.loadAudioBuffer();
		App.audioManager.addGUI();

		App.bpmManager = new BPMManager();
		App.bpmManager.addEventListener("beat", () => {
			this.particles.onBPMBeat();
		});
		await App.bpmManager.detectBPM(App.audioManager.audio.buffer);

		document.querySelector(".initial-screen").remove();

		App.audioManager.play();

		this.particles = new ReactiveParticles();
		App.particles = this.particles;
		this.particles.init();

		this.update();
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
	}

	update() {
		requestAnimationFrame(() => this.update());

		this.particles?.update();
		App.audioManager.update();

		this.renderer.render(this.scene, this.camera);
		this.controls.update();
	}
}
