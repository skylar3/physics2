import * as THREE from 'https://threejs.org/build/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

let initialVelocityMagnitude = 5;
let acceleration = -9.8; // Assuming downward acceleration like gravity
let airResistanceCoefficient = 0;
let angle = 45;
let velocity = new THREE.Vector2();
let position = new THREE.Vector2();
let gravityEnabled = false;

const cubeSize = geometry.parameters.width; // Assuming a cube, all sides are equal
const halfCubeSize = cubeSize / 2;

const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const lineGeometry = new THREE.BufferGeometry();
const points = [];
const line = new THREE.Line(lineGeometry, lineMaterial);
scene.add(line);

document.getElementById('velocity').addEventListener('input', function(event) {
    initialVelocityMagnitude = parseFloat(event.target.value);
    document.getElementById('velocityValue').innerText = event.target.value;
    resetSimulation();
});

document.getElementById('angle').addEventListener('input', function(event) {
    angle = parseFloat(event.target.value);
    document.getElementById('angleValue').innerText = angle;
    resetSimulation();
});

document.getElementById('gravity').addEventListener('change', function(event) {
    gravityEnabled = event.target.checked;
    resetSimulation();
});

document.getElementById('airResistance').addEventListener('input', function(event) {
    airResistanceCoefficient = parseFloat(event.target.value);
    document.getElementById('airResistanceValue').innerText = event.target.value;
    resetSimulation();
});

function resetSimulation() {
    position.set(0, 0);
    cube.position.set(0, 0, 0);
    points.length = 0;
    lineGeometry.setFromPoints(points);
    updateInitialVelocity();
}

function updateInitialVelocity() {
    let radianAngle = angle * Math.PI / 180;
    velocity.x = initialVelocityMagnitude * Math.cos(radianAngle);
    velocity.y = initialVelocityMagnitude * Math.sin(radianAngle);
}

function getVisibleDimensionsAtZDepth(depth, camera) {
    const cameraOffset = camera.position.z;
    const vFov = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(vFov / 2) * (depth + cameraOffset);
    const width = height * camera.aspect;
    return { width, height };
}

function updatePositionAndCheckCollisions(deltaTime) {
    if (gravityEnabled) velocity.y += acceleration * deltaTime;
    velocity.x -= airResistanceCoefficient * velocity.x * deltaTime;
    velocity.y -= airResistanceCoefficient * velocity.y * deltaTime;

    let nextX = position.x + velocity.x * deltaTime;
    let nextY = position.y + velocity.y * deltaTime;

    const { width, height } = getVisibleDimensionsAtZDepth(cube.position.z, camera);

    // Adjust for cube size in collision detection
    if (nextX - halfCubeSize <= -width / 2 || nextX + halfCubeSize >= width / 2) {
        velocity.x *= -1;
    }
    if (nextY - halfCubeSize <= -height / 2 || nextY + halfCubeSize >= height / 2) {
        velocity.y *= -1;
    }

    position.x = Math.min(Math.max(nextX, -width / 2 + halfCubeSize), width / 2 - halfCubeSize);
    position.y = Math.min(Math.max(nextY, -height / 2 + halfCubeSize), height / 2 - halfCubeSize);

    // Prevent cube from "sinking" into the ground when gravity is enabled
    if (gravityEnabled && position.y - halfCubeSize < -height / 2) {
        position.y = -height / 2 + halfCubeSize;
        velocity.y = 0;
    }
}

function animate(time) {
    time *= 0.001; // Convert time to seconds
    const deltaTime = Math.min(0.02, time - (lastTime || time)); // Cap max deltaTime to avoid large jumps
    lastTime = time;

    updatePositionAndCheckCollisions(deltaTime);

    cube.position.x = position.x;
    cube.position.y = position.y;

    points.push(new THREE.Vector3(position.x, position.y, 0));
    lineGeometry.setFromPoints(points);

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

let lastTime;
updateInitialVelocity(); // Initialize velocity based on initial angle and magnitude
requestAnimationFrame(animate);
