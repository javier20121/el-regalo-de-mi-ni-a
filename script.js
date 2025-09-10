// JavaScript para la animación 3D, la generación de mensajes y la música.
import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { PMREMGenerator } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Scene, Camera, and Renderer ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas"), alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimización para pantallas de alta densidad
renderer.setClearColor(0x000000);

// --- Camera Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Dynamic Lighting ---
// New lighting setup for a softer, more uniform glow
const hemisphereLight = new THREE.HemisphereLight(0xffb8d1, 0x8a5592, 0.5); // Pinkish sky, violet ground
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// --- Starry Background ---
const starVertices = [];
for (let i = 0; i < 15000; i++) { // Creamos 15,000 estrellas para un efecto denso
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    sizeAttenuation: true, // Las estrellas lejanas se ven más pequeñas
    transparent: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// --- 3D Heart Geometry ---
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
    bevelSize: 0.2, // Reducimos la complejidad de la geometría para mejor rendimiento
    bevelOffset: 0,
    bevelSegments: 8
};
const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
heartGeometry.center();
heartGeometry.rotateX(Math.PI); // Rotamos el corazón 180 grados para que apunte hacia arriba
// Increased the size of the hearts
heartGeometry.scale(4, 4, 4);

// --- Sphere Geometry ---
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);

// --- Post-processing ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// Adjusted BloomPass parameters for a more subtle and less "pulsating" glow
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.15, 0.9, 0.85); // Reducimos la fuerza del bloom
composer.addPass(bloomPass);

// --- Hearts and Spheres ---
const objects = [];
// Reducimos la cantidad de corazones para mejorar el rendimiento en móviles
const heartCount = 500;
const sphereCount = 20;
const heartColors = ['#ff4d6d', '#ff809c', '#ff99cc', '#ff3366', '#ff6699'];
const sphereColor = '#c2a2da';

camera.position.z = 20;

// --- Load HDR environment map ---
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let heartInstance, sphereInstance, textMesh1, textMesh2;
const dummy = new THREE.Object3D();

new RGBELoader().load('https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    texture.dispose();
    pmremGenerator.dispose();

    // --- 3D Text Material ---
    const textMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        envMap: envMap,
        metalness: 0.0,
        roughness: 0.1,
        transmission: 0.8, // Efecto cristal/translúcido.
        ior: 1.5, // Índice de refracción para el efecto cristal
        thickness: 0.5, // Grosor para la refracción
        emissive: new THREE.Color('#ff6699'), // Brillo sutil rosado
        emissiveIntensity: 0.25,
        reflectivity: 0.9
    });

    // --- 3D Text Loading ---
    const fontLoader = new FontLoader();

    // Cargar fuente para "Te amo muchisimo"
    fontLoader.load('https://rawcdn.githack.com/mrdoob/three.js/dev/examples/fonts/optimer_bold.typeface.json', (font) => {
        const textGeo1 = new TextGeometry('Te amo muchisimo', {
            font: font,
            size: 3.5,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        textGeo1.center();
        textMesh1 = new THREE.Mesh(textGeo1, textMaterial);
        textMesh1.position.set(0, 2.5, 2);
        scene.add(textMesh1);
    });

    // Cargar fuente cursiva para "Karencita"
    // Usamos una fuente distinta pero fiable para "Karencita" para asegurar que se vea.
    fontLoader.load('https://rawcdn.githack.com/mrdoob/three.js/dev/examples/fonts/gentilis_regular.typeface.json', (font) => {
        const textGeo2 = new TextGeometry('Karencita', {
            font: font,
            size: 3.0, // Ajustamos el tamaño para la nueva fuente
            height: 0.15,
            curveSegments: 12,
            // Reactivamos el biselado para un look 3D consistente
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelSegments: 5
        });
        textGeo2.center();
        textMesh2 = new THREE.Mesh(textGeo2, textMaterial);
        textMesh2.position.set(0, -1.8, 2); // Ajustamos la posición para que esté más cerca
        scene.add(textMesh2);
    });

    const heartMaterial = new THREE.MeshPhysicalMaterial({
        metalness: 1.0,
        roughness: 0.1,
        transmission: 0.8,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        reflectivity: 1.0,
        side: THREE.DoubleSide
    });
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
        color: sphereColor,
        // Removed the emissive property to stop the glowing effect on the spheres
        metalness: 1.0,
        roughness: 0.6,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: envMap,
        reflectivity: 1.0,
        side: THREE.DoubleSide
    });

    heartInstance = new THREE.InstancedMesh(heartGeometry, heartMaterial, heartCount);
    for (let i = 0; i < heartCount; i++) {
        const orbitRadius = Math.random() * 30 + 10;
        const orbitSpeed = -(Math.random() * 0.003 + 0.001);
        const orbitAngle = Math.random() * Math.PI * 2;
        const verticalOffset = (Math.random() - 0.5) * 80;
        // Increased the scale of the hearts
        const scale = Math.random() < 0.8 ? (Math.random() * 0.2 + 0.15) : (Math.random() * 0.7 + 0.4);
        const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        dummy.position.set(orbitRadius * Math.cos(orbitAngle), verticalOffset, orbitRadius * Math.sin(orbitAngle));
        dummy.rotation.copy(rotation);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        heartInstance.setMatrixAt(i, dummy.matrix);
        heartInstance.setColorAt(i, new THREE.Color(heartColors[Math.floor(Math.random() * heartColors.length)]));
        
        objects.push({ isHeart: true, orbitRadius, orbitSpeed, orbitAngle, verticalOffset, rotation, scale, initialY: verticalOffset });
    }
    scene.add(heartInstance);

    sphereInstance = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, sphereCount);
    for (let i = 0; i < sphereCount; i++) {
        const orbitRadius = Math.random() * 25 + 8;
        const orbitSpeed = -(Math.random() * 0.005 + 0.002);
        const orbitAngle = Math.random() * Math.PI * 2;
        const verticalOffset = (Math.random() - 0.5) * 60;
        const scale = Math.random() * 0.2 + 0.2;
        const rotation = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        dummy.position.set(orbitRadius * Math.cos(orbitAngle), verticalOffset, orbitRadius * Math.sin(orbitAngle));
        dummy.rotation.copy(rotation);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        sphereInstance.setMatrixAt(i, dummy.matrix);

        objects.push({ isHeart: false, orbitRadius, orbitSpeed, orbitAngle, verticalOffset, rotation, scale, initialY: verticalOffset });
    }
    scene.add(sphereInstance);
});

// --- Parallax Logic ---
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// --- Animation ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    
    // Animación del fondo estrellado para darle un movimiento sutil
    stars.rotation.y += 0.0001;

    // Parallax
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 1.5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    if (textMesh1 && textMesh2) {
        // Animación de rotación y oscilación para el texto 3D

        // Oscilación suave
        textMesh1.position.y = 2.5 + Math.sin(time * 0.5) * 0.1;
        textMesh2.position.y = -1.8 + Math.cos(time * 0.5) * 0.1;
    }

    if (heartInstance && sphereInstance) {
        let heartIndex = 0;
        let sphereIndex = 0;

        objects.forEach((obj, i) => {
            obj.orbitAngle += obj.orbitSpeed;
            
            // Slow fall and oscillation
            obj.verticalOffset -= 0.005; 
            const osc = Math.sin(time * 0.5 + obj.verticalOffset) * 0.5;
            
            dummy.position.set(obj.orbitRadius * Math.cos(obj.orbitAngle), obj.verticalOffset + osc, obj.orbitRadius * Math.sin(obj.orbitAngle));
            
            // Maintain initial rotation
            dummy.rotation.copy(obj.rotation);
            
            // Restore the scale on each frame (this was the missing piece)
            dummy.scale.set(obj.scale, obj.scale, obj.scale);
            
            dummy.updateMatrix();

            if (obj.isHeart) {
                heartInstance.setMatrixAt(heartIndex++, dummy.matrix);
            } else {
                sphereInstance.setMatrixAt(sphereIndex++, dummy.matrix);
            }
        });
        heartInstance.instanceMatrix.needsUpdate = true;
        sphereInstance.instanceMatrix.needsUpdate = true;
    }
    controls.update();
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

// --- LLM powered message generation ---

/**
 * Anima la aparición de texto en un elemento, letra por letra.
 * @param {HTMLElement} element El elemento donde se mostrará el texto.
 * @param {string} text El texto a animar.
 * @param {number} [speed=50] La velocidad de escritura en milisegundos.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la animación termina.
 */
const typeWriterEffect = (element, text, speed = 50) => {
    return new Promise((resolve) => {
        element.textContent = '';
        element.classList.add('visible', 'typing');
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i++);
                setTimeout(type, speed);
            } else {
                element.classList.remove('typing');
                resolve();
            }
        }
        type();
    });
};

const generateButton = document.getElementById('generate-button');
const messageContainer = document.getElementById('message-container');
let isGenerating = false;

const generateMessage = async () => {
    if (isGenerating) return;

    isGenerating = true;
    generateButton.disabled = true;
    generateButton.textContent = 'Generando...';
    messageContainer.classList.remove('visible');
    messageContainer.textContent = ''; // Limpiamos el contenido anterior

    // Llamamos a nuestra propia función de servidor, que ocultará la clave.
    const apiUrl = `/api/generate-message`;

    try {
        // Usamos GET porque no necesitamos enviar datos, la pregunta está en el servidor.
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // La respuesta de nuestra función de servidor ahora tiene una propiedad "message"
        const text = result.message || "No se pudo generar el mensaje. Intenta de nuevo.";

        await typeWriterEffect(messageContainer, text);

    } catch (error) {
        console.error("Error al generar el mensaje:", error);
        const errorText = "Lo siento, hubo un error. Por favor, inténtalo de nuevo más tarde.";
        await typeWriterEffect(messageContainer, errorText);
    } finally {
        isGenerating = false;
        generateButton.disabled = false;
        generateButton.textContent = 'Generar Mensaje ✨';
    }
};

generateButton.addEventListener('click', generateMessage);
