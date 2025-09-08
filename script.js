import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PMREMGenerator } from 'three';

// --- Escena, Cámara y Renderer ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- Iluminación ---
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
const pointLight = new THREE.PointLight(0xffa07a, 1.0);
pointLight.position.set(5, 5, 5);
pointLight.castShadow = true;
scene.add(pointLight);
const pointLight2 = new THREE.PointLight(0xffe0b3, 0.6);
pointLight2.position.set(-10, -5, -10);
scene.add(pointLight2);

// --- Geometría del Corazón 3D ---
const heartShape = new THREE.Shape()
    .moveTo(0.25, 0.25).bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0)
    .bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35)
    .bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95)
    .bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35)
    .bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0)
    .bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);

const extrudeSettings = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelOffset: 0,
    bevelSegments: 20
};
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
heartGeometry.center();
heartGeometry.scale(3, 3, 3);

// --- Geometría de las Pelotitas ---
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);

// --- Post-procesamiento ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.4, 0.85);
composer.addPass(bloomPass);

// --- Corazones y Pelotitas ---
const objects = [];

// Ajustes para la cantidad, tamaño y dispersión de los objetos
const heartCount = 500;
const sphereCount = 100;
const heartColors = ['#ff4d6d', '#ff809c', '#ff99cc', '#ff3366', '#ff6699'];
const sphereColor = '#c2a2da';

camera.position.z = 10; // Alejamos un poco la cámara para enmarcar mejor la nueva composición

// --- Cargar environment map HDR (con URL corregida) ---
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let heartInstance, sphereInstance;
const dummy = new THREE.Object3D(); // Objeto auxiliar para calcular matrices

new RGBELoader().load('https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    pmremGenerator.dispose();

    // --- Materiales Finales ---
    const heartMaterial = new THREE.MeshPhysicalMaterial({ metalness: 1.0, roughness: 0.4, clearcoat: 1.0, clearcoatRoughness: 0.05, envMap: envMap, reflectivity: 1.0, side: THREE.DoubleSide });
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ color: sphereColor, metalness: 1.0, roughness: 0.6, clearcoat: 1.0, clearcoatRoughness: 0.05, envMap: envMap, reflectivity: 1.0, side: THREE.DoubleSide });

    // --- InstancedMesh para Corazones ---
    heartInstance = new THREE.InstancedMesh(heartGeometry, heartMaterial, heartCount);
    for (let i = 0; i < heartCount; i++) {
        const orbitRadius = Math.random() * 8 + 4; // Rango de órbita muy compacto (4 a 12)
        const orbitSpeed = -(Math.random() * 0.005 + 0.002);
        const orbitAngle = Math.random() * Math.PI * 2;
        const verticalOffset = (Math.random() - 0.5) * 50; // Menos dispersión vertical
        const scale = Math.random() * 0.15 + 0.15;
        const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        dummy.position.set(orbitRadius * Math.cos(orbitAngle), verticalOffset, orbitRadius * Math.sin(orbitAngle));
        dummy.rotation.copy(rotation);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        heartInstance.setMatrixAt(i, dummy.matrix);
        heartInstance.setColorAt(i, new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]));
        
        objects.push({ isHeart: true, orbitRadius, orbitSpeed, orbitAngle, verticalOffset, rotation });
    }
    scene.add(heartInstance);

    // --- InstancedMesh para Esferas ---
    sphereInstance = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, sphereCount);
    for (let i = 0; i < sphereCount; i++) {
        const orbitRadius = Math.random() * 7 + 3; // Rango de órbita muy compacto (3 a 10)
        const orbitSpeed = -(Math.random() * 0.008 + 0.003);
        const orbitAngle = Math.random() * Math.PI * 2;
        const verticalOffset = (Math.random() - 0.5) * 40; // Menos dispersión vertical
        const scale = Math.random() * 0.1 + 0.1;
        const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        dummy.position.set(orbitRadius * Math.cos(orbitAngle), verticalOffset, orbitRadius * Math.sin(orbitAngle));
        dummy.rotation.copy(rotation);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        sphereInstance.setMatrixAt(i, dummy.matrix);

        objects.push({ isHeart: false, orbitRadius, orbitSpeed, orbitAngle, verticalOffset, rotation });
    }
    scene.add(sphereInstance);
});

// --- Animación ---
function animate() {
    requestAnimationFrame(animate);

    if (heartInstance && sphereInstance) {
        objects.forEach((obj, i) => {
            obj.orbitAngle += obj.orbitSpeed;
            dummy.position.set(obj.orbitRadius * Math.cos(obj.orbitAngle), obj.verticalOffset, obj.orbitRadius * Math.sin(obj.orbitAngle));
            
            // Mantener la rotación inicial, pero hacer que giren suavemente
            const rotationY = obj.rotation.y + (obj.orbitAngle * 0.1);
            dummy.rotation.set(obj.rotation.x, rotationY, obj.rotation.z);
            
            dummy.updateMatrix();

            if (obj.isHeart) {
                heartInstance.setMatrixAt(i, dummy.matrix);
            } else {
                // El índice para las esferas debe ajustarse
                sphereInstance.setMatrixAt(i - heartCount, dummy.matrix);
            }
        });
        heartInstance.instanceMatrix.needsUpdate = true;
        sphereInstance.instanceMatrix.needsUpdate = true;
    }
    composer.render();
}
animate();

// --- Resize ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// --- CÓDIGO PARA REPRODUCIR MÚSICA DE YOUTUBE ---
let player;
let playerInitialized = false;
let videoPlayedOnce = false;

window.onYouTubeIframeAPIReady = function() {
    console.log("¡La API de YouTube está lista!");
    document.addEventListener('click', startMusic);
}

function startMusic() {
    if (!playerInitialized) {
        player = new YT.Player('player', {
            videoId: '7as_BTOh-Lg',
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'mute': 0,
                'loop': 1,
                'playlist': '7as_BTOh-Lg'
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        playerInitialized = true;
        console.log("Creando reproductor de YouTube...");
    }
}

function onPlayerReady(event) {
    console.log("El reproductor está listo.");
    if (!videoPlayedOnce) {
        setTimeout(() => {
            event.target.playVideo();
            videoPlayedOnce = true;
        }, 100); 
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        console.log("Video terminado, reiniciando...");
        player.seekTo(0);
        player.playVideo();
    }
}