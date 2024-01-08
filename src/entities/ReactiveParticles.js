import gsap from "gsap";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import App from "../App";
import { BoxGeometry, Color, DoubleSide, MathUtils, Object3D, Points, ShaderMaterial } from "three";

export default class ReactiveParticles extends Object3D {
	constructor() {
		super();
		this.name = "ReactiveParticles";
		this.time = 0;
		this.properties = {
			startColor: "#624CAB",
			endColor: "#fafafa",
			autoMix: false,
			autoRotate: true,
		};
	}

	init() {
		App.holder.add(this);

		this.holderObjects = new Object3D();
		this.add(this.holderObjects);

		this.material = new ShaderMaterial({
			side: DoubleSide,
			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
			uniforms: {
				time: { value: 0 },
				offsetSize: { value: 3 },
				size: { value: 1.2 },
				frequency: { value: 0.2 },
				amplitude: { value: 1 },
				offsetGain: { value: 0.2 },
				maxDistance: { value: 2 },
				startColor: { value: new Color(this.properties.startColor) },
				endColor: { value: new Color(this.properties.endColor) },
			},
		});

		this.addGUI();
		this.resetMesh();
	}

	createBoxMesh() {
		// Randomly generate segment counts for width, height, and depth to create varied box geometries
		// let widthSeg = Math.floor(MathUtils.randInt(5, 20));
		// let heightSeg = Math.floor(MathUtils.randInt(1, 40));
		// let depthSeg = Math.floor(MathUtils.randInt(5, 80));
		// this.geometry = new BoxGeometry(1, 1, 1, widthSeg, heightSeg, depthSeg);
		this.geometry = new BoxGeometry(6.5, 6.5, 6.5, 100, 100, 100);

		// Update shader material uniform for offset size with a random value
		this.material.uniforms.offsetSize.value = 24;
		this.material.needsUpdate = true;

		// Create a container for the points mesh and set its orientation
		this.pointsMesh = new Object3D();
		this.pointsMesh.rotateX(Math.PI / 2); // Rotate the mesh for better visual orientation
		this.holderObjects.add(this.pointsMesh);

		// Create a points mesh using the box geometry and the shader material
		const pointsMesh = new Points(this.geometry, this.material);
		this.pointsMesh.add(pointsMesh);

		// Animate the rotation of the of the container
		// gsap.to(this.pointsMesh.rotation, {
		// 	repeat: -1,
		// 	yoyo: true,
		// 	duration: 10,
		// 	x: Math.random() * Math.PI,
		// 	y: Math.random() * Math.PI,
		// 	z: Math.random() * Math.PI * 2,
		// 	ease: "none", // No easing for a linear animation
		// });

		// gsap.to(this.position, {
		// 	duration: 1,
		// 	z: MathUtils.randInt(1, 7), // Random depth positioning within a range
		// 	ease: "elastic.out(0.8)", // Elastic ease-out for a bouncy effect
		// });
	}

	onBPMBeat() {
		// Calculate a reduced duration based on the BPM (beats per minute) duration
		const duration = App.bpmManager.getBPMDuration() / 1000;

		if (App.audioManager.isPlaying) {
			// Randomly determine whether to rotate the holder object
			if (Math.random() < 0.3 && this.properties.autoRotate) {
				gsap.to(this.holderObjects.rotation, {
					duration: duration, // Either a longer or BPM-synced duration
					x: Math.random() * Math.PI,
					y: Math.random() * Math.PI,
					z: Math.random() * Math.PI,
					ease: "elastic.out(0.76)",
				});
			}

			// // Randomly decide whether to reset the mesh
			// if (Math.random() < 0.3) {
			// 	this.resetMesh();
			// }
		}
	}

	resetMesh() {
		this.destroyMesh();
		this.createBoxMesh();
		// if (this.properties.autoMix) {
		// 	this.destroyMesh();
		// 	this.createBoxMesh();

		// 	// Animate the position of the mesh for an elastic movement effect

		// 	// Animate the frequency uniform in the material, syncing with BPM if available
		gsap.to(this.material.uniforms.frequency, {
			duration: App.bpmManager ? (App.bpmManager.getBPMDuration() / 1000) * 2 : 2,
			value: MathUtils.randInt(0.05, 0.2), // Random frequency value for dynamic visual changes
			ease: "expo.easeInOut", // Smooth exponential transition for visual effect
		});
		// }
	}

	destroyMesh() {
		if (this.pointsMesh) {
			this.holderObjects.remove(this.pointsMesh);
			this.pointsMesh.geometry?.dispose();
			this.pointsMesh.material?.dispose();
			this.pointsMesh = null;
		}
	}

	update() {
		if (App.audioManager?.isPlaying) {
			// Dynamically update amplitude based on the high frequency data from the audio manager
			this.material.uniforms.amplitude.value =
				0.8 + MathUtils.mapLinear(App.audioManager.frequencyData.high, 0, 0.6, -0.2, 0.8);

			// Update offset gain based on the low frequency data for subtle effect changes
			this.material.uniforms.offsetGain.value = App.audioManager.frequencyData.mid * 0.5;

			// Map low frequency data to a range and use it to increment the time uniform
			const t = MathUtils.mapLinear(App.audioManager.frequencyData.low, 0, 1, 0.2, 0.5);
			this.time += MathUtils.clamp(t, 0.2, 0.5); // Clamp the value to ensure it stays within a desired range
		} else {
			// Set default values for the uniforms when audio is not playing
			this.material.uniforms.frequency.value = 0.8;
			this.material.uniforms.amplitude.value = 1;
			this.time += 0.2;
		}

		this.material.uniforms.time.value = this.time;
	}

	addGUI() {
		//Add GUI controls
		const gui = App.gui;
		const particlesFolder = gui.addFolder("PARTICLES");
		particlesFolder
			.addColor(this.properties, "startColor")
			.listen()
			.name("Start Color")
			.onChange((e) => {
				this.material.uniforms.startColor.value = new Color(e);
			});

		particlesFolder
			.addColor(this.properties, "endColor")
			.listen()
			.name("End Color")
			.onChange((e) => {
				this.material.uniforms.endColor.value = new Color(e);
			});

		// const visualizerFolder = gui.addFolder("VISUALIZER");
		// visualizerFolder.add(this.properties, "autoMix").listen().name("Auto Mix");
		// visualizerFolder.add(this.properties, "autoRotate").listen().name("Auto Rotate");

		// const buttonShowBox = {
		// 	showBox: () => {
		// 		this.destroyMesh();
		// 		this.createBoxMesh();
		// 		this.properties.autoMix = false;
		// 	},
		// };
		// visualizerFolder.add(buttonShowBox, "showBox").name("Show Box");

		// const buttonShowCylinder = {
		// 	showCylinder: () => {
		// 		this.destroyMesh();
		// 		this.createCylinderMesh();
		// 		this.properties.autoMix = false;
		// 	},
		// };
		// visualizerFolder.add(buttonShowCylinder, "showCylinder").name("Show Cylinder");
	}
}
