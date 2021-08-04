import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import stringifyObject from 'stringify-object';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

var zip = new JSZip();
export default class GenerateCode {
    constructor(obj) {
        this.Car = {...obj};
        this.exporter = new GLTFExporter();
        console.log(this.Car);
    }

    generateCode() {
        this.generateBundler();
        this.generateHCJ();
        this.generateGLTF();
        this.generateCAR();
        this.generateREADME();
        this.generatePackageJSON();
    }

    generateBundler() {
        zip.file("bundler/webpack.common.js", `const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
    entry: path.resolve(__dirname, '../src/script.js'),
    output:
    {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../dist')
    },
    devtool: 'source-map',
    plugins:
    [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, '../static') }
            ]
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            minify: true
        }),
        new MiniCSSExtractPlugin()
    ],
    module:
    {
        rules:
        [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader']
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },

            // CSS
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader'
                ]
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            outputPath: 'assets/images/'
                        }
                    }
                ]
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            outputPath: 'assets/fonts/'
                        }
                    }
                ]
            }
        ]
    }
}
`);
            zip.file("bundler/webpack.dev.js",`const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const ip = require('internal-ip')
const portFinderSync = require('portfinder-sync')

const infoColor = (_message) =>
{
    return \`\u001b[1m\u001b[34m\${_message}\u001b[39m\u001b[22m\`
}

module.exports = merge(
    commonConfiguration,
    {
        mode: 'development',
        devServer:
        {
            host: '0.0.0.0',
            port: portFinderSync.getPort(8080),
            contentBase: './dist',
            watchContentBase: true,
            open: true,
            https: false,
            useLocalIp: true,
            disableHostCheck: true,
            overlay: true,
            noInfo: true,
            after: function(app, server, compiler)
            {
                const port = server.options.port
                const https = server.options.https ? 's' : ''
                const localIp = ip.v4.sync()
                const domain1 = \`http\${https}://\${localIp}:\${port}\`
                const domain2 = \`http\${https}://localhost:\${port}\`

                console.log(\`Project running at:\n  - \${infoColor(domain1)}\n  - \${infoColor(domain2)}\`)
            }
        }
    }
)
`);

            zip.file("bundler/webpack.prod.js", `const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        plugins:
        [
            new CleanWebpackPlugin()
        ]
    }
)
`);
    }

    generateHCJ() {
        zip.file("src/index.html", `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Raycast Vehicle</title>
</head>
<body>
    <canvas class="webgl"></canvas>
</body>
</html>`);

        zip.file("src/style.css", `*
{
    margin: 0;
    padding: 0;
}

html,
body
{
    overflow: hidden;
}

.webgl
{
    position: fixed;
    top: 0;
    left: 0;
    outline: none;
}`);

        zip.file("src/script.js", `import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import cannonDebugger from 'cannon-es-debugger'
import Stats from 'stats.js';
import Car from './world/car';


var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );
/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
})
world.broadphase = new CANNON.SAPBroadphase(world);
cannonDebugger(scene, world.bodies, {color: 0x00ff00})

const car = new Car(scene, world);
car.init();

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
const floorMesh = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0,
        emissive: 0xffffff,
        emissiveIntensity: -0.36,
    })
)
floorMesh.rotation.x = -Math.PI * 0.5;
scene.add(floorMesh)

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
    canvas: canvas
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

tick()`);
    }

    generateGLTF() {
        const obj = this;

        obj.exporter
        .parse( obj.Car.chassisModel.scene, function ( gltf ) {
            zip.file("static/car/chassis.gltf", JSON.stringify(gltf, null, 2));

            obj.exporter
            .parse( obj.Car.wheelModel.scene, function ( gltf ) {
                zip.file("static/car/wheel.gltf", JSON.stringify(gltf, null, 2));
                obj.saveCode();
            });
        });
    }

    generateCAR() {
        let wheelInfos = [];
        const {primaryKeys, secondaryKeys} = this.Car.controlOptions;

        for(let i = 0 ; i < this.Car.car.wheelInfos.length ; i++) {
            const wheelInfo = this.Car.car.wheelInfos[i];
            wheelInfos.push(`{
                radius: ${wheelInfo.radius},
                directionLocal: new CANNON.Vec3(${wheelInfo.directionLocal.x}, ${wheelInfo.directionLocal.y}, ${wheelInfo.directionLocal.z}),
                suspensionStiffness: ${wheelInfo.suspensionStiffness},
                suspensionRestLength: ${wheelInfo.suspensionRestLength},
                frictionSlip: ${wheelInfo.frictionSlip},
                dampingRelaxation: ${wheelInfo.dampingRelaxation},
                dampingCompression: ${wheelInfo.dampingCompression},
                maxSuspensionForce: ${wheelInfo.maxSuspensionForce},
                rollInfluence:  ${wheelInfo.rollInfluence},
                axleLocal: new CANNON.Vec3(${wheelInfo.axleLocal.x}, ${wheelInfo.axleLocal.y}, ${wheelInfo.axleLocal.z}),
                chassisConnectionPointLocal: new CANNON.Vec3(${wheelInfo.chassisConnectionPointLocal.x}, ${wheelInfo.chassisConnectionPointLocal.y}, ${wheelInfo.chassisConnectionPointLocal.z}),
                maxSuspensionTravel: ${wheelInfo.maxSuspensionTravel},
                customSlidingRotationalSpeed: ${wheelInfo.customSlidingRotationalSpeed},
            }`);
        }

        const code =
        `
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Car {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;

        this.car = {};
        this.chassis = {};
        this.wheels = [];
        this.chassisDimension = ${stringifyObject(this.Car.chassisDimension)};
        this.chassisModelPos = ${stringifyObject(this.Car.chassisModelPos)};
        this.wheelScale = ${stringifyObject(this.Car.wheelScale)};
        this.mass = ${this.Car.car.chassisBody.mass};
    }

    init() {
        this.loadModels();
        this.setChassis();
        this.setWheels();
        this.controls();
        this.update()
    }

    loadModels() {
        const gltfLoader = new GLTFLoader();

        gltfLoader.load("./car/chassis.gltf", gltf => {
            this.chassis = gltf.scene;
            this.scene.add(this.chassis);
        })

        this.wheels = [];
        for(let i = 0 ; i < 4 ; i++) {
            gltfLoader.load("./car/wheel.gltf", gltf => {
                const model = gltf.scene;
                this.wheels[i] = model;
                if(i === 1 || i === 3)
                    this.wheels[i].scale.set(-1 * this.wheelScale.frontWheel, 1 * this.wheelScale.frontWheel, -1 * this.wheelScale.frontWheel);
                else
                    this.wheels[i].scale.set(1 * this.wheelScale.frontWheel, 1 * this.wheelScale.frontWheel, 1 * this.wheelScale.frontWheel);
                this.scene.add(this.wheels[i]);
            })
        }
    }

    setChassis() {
        const chassisShape = new CANNON.Box(new CANNON.Vec3(this.chassisDimension.x * 0.5, this.chassisDimension.y * 0.5, this.chassisDimension.z * 0.5));
        const chassisBody = new CANNON.Body({mass: this.mass, material: new CANNON.Material({friction: 0})});
        chassisBody.addShape(chassisShape);

        this.car = new CANNON.RaycastVehicle({
            chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });
        this.car.addToWorld(this.world);
    }

    setWheels() {
        this.car.wheelInfos = [];
        this.car.addWheel(${wheelInfos[0]});
        this.car.addWheel(${wheelInfos[1]});
        this.car.addWheel(${wheelInfos[2]});
        this.car.addWheel(${wheelInfos[3]});

        this.car.wheelInfos.forEach( function(wheel, index) {
            const cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20)
            const wheelBody = new CANNON.Body({
                mass: 1,
                material: new CANNON.Material({friction: 0}),
            })
            const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0)
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion)
            // this.wheels[index].wheelBody = wheelBody;
        }.bind(this));
    }

    controls() {
        const maxSteerVal = ${this.Car.controlOptions.maxSteerVal};
        const maxForce = ${this.Car.controlOptions.maxForce};
        const brakeForce = ${this.Car.controlOptions.brakeForce};
        const slowDownCar = ${this.Car.controlOptions.slowDownCar};
        const keysPressed = [];

        window.addEventListener('keydown', (e) => {
            // e.preventDefault();
            if(!keysPressed.includes(e.key.toLowerCase())) keysPressed.push(e.key.toLowerCase());
            hindMovement();
        });
        window.addEventListener('keyup', (e) => {
            // e.preventDefault();
            keysPressed.splice(keysPressed.indexOf(e.key.toLowerCase()), 1);
            hindMovement();
        });

        const hindMovement = () => {
            if(keysPressed.includes("${primaryKeys.reset}") || keysPressed.includes("${secondaryKeys.reset}")) resetCar();

            if(!keysPressed.includes("${primaryKeys.brake}") && !keysPressed.includes("${secondaryKeys.brake}")){
                this.car.setBrake(0, 0);
                this.car.setBrake(0, 1);
                this.car.setBrake(0, 2);
                this.car.setBrake(0, 3);

                if(keysPressed.includes("${primaryKeys.left}") || keysPressed.includes("${secondaryKeys.left}")) {
                    this.car.setSteeringValue(maxSteerVal * 1, 2);
                    this.car.setSteeringValue(maxSteerVal * 1, 3);
                }
                else if(keysPressed.includes("${primaryKeys.right}") || keysPressed.includes("${secondaryKeys.right}")) {
                    this.car.setSteeringValue(maxSteerVal * -1, 2);
                    this.car.setSteeringValue(maxSteerVal * -1, 3);
                }
                else stopSteer();

                if(keysPressed.includes("${primaryKeys.forward}") || keysPressed.includes("${secondaryKeys.forward}")) {
                    this.car.applyEngineForce(maxForce * -1, 0);
                    this.car.applyEngineForce(maxForce * -1, 1);
                    this.car.applyEngineForce(maxForce * -1, 2);
                    this.car.applyEngineForce(maxForce * -1, 3);
                }
                else if(keysPressed.includes("${primaryKeys.backward}") || keysPressed.includes("${secondaryKeys.backward}")) {
                    this.car.applyEngineForce(maxForce * 1, 0);
                    this.car.applyEngineForce(maxForce * 1, 1);
                    this.car.applyEngineForce(maxForce * 1, 2);
                    this.car.applyEngineForce(maxForce * 1, 3);
                }
                else stopCar();
            }
            else
                brake();
        }

        const resetCar = () => {
            this.car.chassisBody.position.set(0, 4, 0);
            this.car.chassisBody.quaternion.set(0, 0, 0, 1);
            this.car.chassisBody.angularVelocity.set(0, 0, 0);
            this.car.chassisBody.velocity.set(0, 0, 0);
        }

        const brake = () => {
            this.car.setBrake(brakeForce, 0);
            this.car.setBrake(brakeForce, 1);
            this.car.setBrake(brakeForce, 2);
            this.car.setBrake(brakeForce, 3);
        }

        const stopCar = () => {
            this.car.setBrake(slowDownCar, 0);
            this.car.setBrake(slowDownCar, 1);
            this.car.setBrake(slowDownCar, 2);
            this.car.setBrake(slowDownCar, 3);
        }

        const stopSteer = () => {
            this.car.setSteeringValue(0, 2);
            this.car.setSteeringValue(0, 3);
        }
    }

    update() {
        const updateWorld = () => {
            if(this.car.wheelInfos && this.chassis.position && this.wheels[0].position){
                this.chassis.position.set(
                    this.car.chassisBody.position.x + this.chassisModelPos.x,
                    this.car.chassisBody.position.y + this.chassisModelPos.y,
                    this.car.chassisBody.position.z + this.chassisModelPos.z
                );
                this.chassis.quaternion.copy(this.car.chassisBody.quaternion);
                for(let i = 0 ; i < 4 ; i++) {
                    if(this.car.wheelInfos[i]) {
                        this.car.updateWheelTransform(i);
                        this.wheels[i].position.copy(this.car.wheelInfos[i].worldTransform.position);
                        this.wheels[i].quaternion.copy(this.car.wheelInfos[i].worldTransform.quaternion);
                    }
                }
            }
        }
        this.world.addEventListener('postStep', updateWorld);
    }
}
    `
        zip.file("src/world/car.js", code);
        return code;
    }

    generatePackageJSON() {
        zip.file("package.json", `
{
  "scripts": {
    "build": "webpack --config ./bundler/webpack.prod.js",
    "start": "webpack serve --config ./bundler/webpack.dev.js"
  },
  "dependencies": {
    "@babel/core": "^7.12.10",
    "@babel/preset-env": "^7.12.11",
    "babel-loader": "^8.2.2",
    "cannon-es": "^0.18.0",
    "cannon-es-debugger": "^0.1.4",
    "clean-webpack-plugin": "^3.0.0",
    "copy-webpack-plugin": "^7.0.0",
    "css-loader": "^5.0.1",
    "file-loader": "^6.2.0",
    "html-loader": "^1.3.2",
    "html-webpack-plugin": "^5.0.0-alpha.7",
    "mini-css-extract-plugin": "^1.3.4",
    "portfinder-sync": "0.0.2",
    "raw-loader": "^4.0.2",
    "stats.js": "^0.17.0",
    "style-loader": "^2.0.0",
    "three": "^0.124.0",
    "webpack": "^5.14.0",
    "webpack-cli": "^4.3.1",
    "webpack-dev-server": "^3.11.2",
    "webpack-merge": "^5.7.3"
  }
}
`)
    }

    generateREADME() {
        zip.file("readme.md", `# Raycast Vehicle

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

\`\`\` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
\`\`\`
`);
    }

    saveCode() {
        zip.generateAsync({type : "blob"}).then((blob) => {
            saveAs(blob, "raycast-vehicle.zip");
        });
    }
}
