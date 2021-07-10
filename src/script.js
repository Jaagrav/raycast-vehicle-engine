import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import * as CANNON from 'cannon-es'
import cannonDebugger from 'cannon-es-debugger'
import Guify from 'guify'
import Stats from 'stats.js';
import {Car} from './world/car';

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

/**
 * Base
 */
// Canvas
const gui = new Guify({align: 'right', theme: 'dark', width: '400px', barMode: 'none'})
gui.Register({type: 'folder', label: 'Chassis', open: true})
gui.Register({type: 'folder', label: 'Wheels', open: true})
gui.Register({folder: 'Chassis', type: 'folder', label: 'Chassis Helper', open: true})
gui.Register({folder: 'Chassis Helper', type: 'folder', label: 'Chassis Helper Dimension', open: true})
gui.Register({folder: 'Wheels', type: 'folder', label: 'Wheels Helper', open: true})
gui.Register({folder: 'Wheels Helper', type: 'folder', label: 'Wheel Helper Position', open: false})


const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
})  
// cannonDebugger(scene, world.bodies, {color: 0x00ff00})
const car = new Car(scene, world, gui);
world.broadphase = new CANNON.SAPBroadphase(world);

const bodyMaterial = new CANNON.Material();
const groundMaterial = new CANNON.Material();
const bodyGroundContactMaterial = new CANNON.ContactMaterial(
    bodyMaterial,
    groundMaterial,
    {
        friction: 0.1,
        restitution: 0.3
    }
)
world.addContactMaterial(bodyGroundContactMaterial)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
const spotLight = new THREE.SpotLight( 0x29dfff, 2, 0, 0.9, 1, 0 );
spotLight.position.set( 7, 1.291, -6 );
const spotLight2 = new THREE.SpotLight( 0x943dff, 2, 0, 0.9, 1, 0 );
spotLight2.position.set( -7, 1.291, -6 );
const spotLight3 = new THREE.SpotLight( 0xd5f8ff, 2, 0, 0.9, 1, 0 );
spotLight3.position.set( 0, 1.291, 7 );
scene.add(spotLight, spotLight2, spotLight3);

/**
 * Cube Texture Loader
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()
const cubeEnvironmentMapTexture = cubeTextureLoader.load([
    "/textures/environmentMaps/2/px.jpg",
    "/textures/environmentMaps/2/nx.jpg",
    "/textures/environmentMaps/2/py.jpg",
    "/textures/environmentMaps/2/ny.jpg",
    "/textures/environmentMaps/2/pz.jpg",
    "/textures/environmentMaps/2/nz.jpg",
])
// scene.background = cubeEnvironmentMapTexture
scene.environment = cubeEnvironmentMapTexture

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Floor
 */
const floorGeo = new THREE.PlaneBufferGeometry(100, 100);
const floorMirror = new Reflector( floorGeo, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xffffff
});
const floorMesh = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0,
        emissive: 0xffffff,
        emissiveIntensity: -0.36,
        transparent: true,
        opacity: 0.7
    })
)
floorMirror.rotation.x = -Math.PI * 0.5;
floorMesh.rotation.x = -Math.PI * 0.5;
floorMesh.position.y = 0.001;
scene.add(floorMirror, floorMesh)

const floorS = new CANNON.Plane();
const floorB = new CANNON.Body();
floorB.mass = 0;

floorB.addShape(floorS);
world.addBody(floorB);

floorB.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
);

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 10000)
camera.position.set(0, 4, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const timeStep = 1 / 60 // seconds
let lastCallTime
 
const tick = () =>
{
    stats.begin();
    // Update controls
    controls.update()

    const time = performance.now() / 1000 // seconds
    if (!lastCallTime) {
        world.step(timeStep)
    } else {
        const dt = time - lastCallTime
        world.step(timeStep, dt)
    }
    lastCallTime = time

    // Render
    renderer.render(scene, camera)
    stats.end();
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()