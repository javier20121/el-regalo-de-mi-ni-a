import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
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

// --- Corazones y Pelotitas ---
const objects = [];
const heartCount = 800;
const sphereCount = 80;
const heartColors = ['#ff4d6d', '#ff809c', '#ff99cc', '#ff3366', '#ff6699'];
const sphereColor = '#c2a2da';

const baseMaterial = new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0, transmission: 0.8, clearcoat: 1.0, clearcoatRoughness: 0.05 });

for (let i = 0; i < heartCount; i++) {
    const material = baseMaterial.clone();
    const color = new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]);
    material.color.set(color);

    const heart = new THREE.Mesh(heartGeometry, material);
    heart.castShadow = true;
    heart.receiveShadow = true;

    heart.orbitRadius = Math.random() * 35 + 15;
    heart.orbitSpeed = -(Math.random() * 0.005 + 0.002);
    heart.orbitAngle = Math.random() * Math.PI * 2;
    heart.verticalOffset = (Math.random() - 0.5) * 100;
    heart.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const scale = Math.random() * 0.4 + 0.3;
    heart.scale.set(scale, scale, scale);

    scene.add(heart);
    objects.push(heart);
}

for (let i = 0; i < sphereCount; i++) {
    const material = baseMaterial.clone();
    material.color.set(new THREE.Color(sphereColor));
    material.roughness = 0.6;

    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    sphere.orbitRadius = Math.random() * 30 + 10;
    sphere.orbitSpeed = -(Math.random() * 0.008 + 0.003);
    sphere.orbitAngle = Math.random() * Math.PI * 2;
    sphere.verticalOffset = (Math.random() - 0.5) * 80;
    sphere.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const scale = Math.random() * 0.6 + 0.3;
    sphere.scale.set(scale, scale, scale);

    scene.add(sphere);
    objects.push(sphere);
}

camera.position.z = 35;

// --- Cargar environment map HDR (con URL corregida) ---
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader().load('https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    pmremGenerator.dispose();

    objects.forEach(obj => {
        obj.material = new THREE.MeshPhysicalMaterial({
            color: obj.material.color,
            metalness: 1.0,
            roughness: obj.geometry.type === 'SphereGeometry' ? 0.6 : 0.4,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            envMap: envMap,
            reflectivity: 1.0,
            side: THREE.DoubleSide
        });
    });
});

// --- Animación ---
function animate() {
    requestAnimationFrame(animate);
    objects.forEach(obj => {
        obj.orbitAngle += obj.orbitSpeed;
        obj.position.x = obj.orbitRadius * Math.cos(obj.orbitAngle);
        obj.position.z = obj.orbitRadius * Math.sin(obj.orbitAngle);
        obj.position.y = obj.verticalOffset;
        obj.rotation.y += 0.01;
    });
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