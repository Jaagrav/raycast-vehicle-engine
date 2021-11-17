import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import copy from "copy-to-clipboard";
import GenerateCode from "./generateCode";

export class Car {
    constructor(scene, world, gui, loadingManager) {
        this.scene = scene;
        this.world = world;
        this.gui = gui;
        this.loadingManager = loadingManager;

        this.car = {};
        this.car.helpChassisGeo = {};
        this.car.helpChassisMat = {};
        this.car.helpChassis = {};
        this.chassis = {};
        this.chassisModel = {};
        this.wheelModel = {};
        this.wheels = [];
        this.chassisDimension = {x: 1.96, y: 1, z: 4.47};
        this.chassisModelPos = {x: 0, y: -0.59, z: 0};
        this.wheelScale = {frontWheel: 0.67, hindWheel: 0.67};
        this.controlOptions = {
            maxSteerVal: 0.5,
            maxForce: 750,
            brakeForce: 36,
            slowDownCar: 19.6,
            primaryKeys: {
                forward: 'w',
                backward: 's',
                left: 'a',
                right: 'd',
                reset: 'r',
                brake: ' '
            },
            secondaryKeys: {
                forward: 'arrowup',
                backward: 'arrowdown',
                left: 'arrowleft',
                right: 'arrowright',
                reset: 'r',
                brake: ' '
            }
        };

        this.loadModels();
    }
    init() {
        this.setChassis();
        this.setWheels();
        this.controls();
        this.update();
        this.guiRegisterer();
        this.loadViaModelUploader();
    }
    loadModels() {
        const gltfLoader = new GLTFLoader(this.loadingManager);
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderConfig({ type: 'js' })
        dracoLoader.setDecoderPath('draco/');

        gltfLoader.setDRACOLoader(dracoLoader);

        const demo_car = 'mclaren';

        gltfLoader.load(`./models/${demo_car}/draco/chassis.gltf`, gltf => {
            this.chassisModel = gltf;
            this.chassis = gltf.scene;
            this.chassis.helpChassisGeo = new THREE.BoxBufferGeometry(1, 1, 1);
            this.chassis.helpChassisMat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
            this.chassis.helpChassis = new THREE.Mesh(this.chassis.helpChassisGeo, this.chassis.helpChassisMat);
            this.scene.add(this.chassis, this.chassis.helpChassis);
        })
        this.wheels = [];
        for(let i = 0 ; i < 4 ; i++) {
            gltfLoader.load(`./models/${demo_car}/draco/wheel.gltf`, gltf => {
                this.wheelModel = gltf;
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
    loadViaModelUploader() {
        const obj = this;
        const addChassisViaUpload = (e) => {
            const gltfLoader = new GLTFLoader();
            gltfLoader.parse( e, '', function( gltf ){
                obj.chassisModel = gltf;
                console.log(gltf);
                obj.scene.remove(obj.chassis);
                const temp = obj.chassis;
                obj.chassis = gltf.scene;
                obj.scene.add(obj.chassis);
                obj.chassis = {...temp, ...gltf.scene};
            });
        }
        const addWheelViaUpload = (e) => {
            const gltfLoader = new GLTFLoader();
            for(let i = 0 ; i < 4 ; i++) {
                gltfLoader.parse( e, '', function( gltf ){
                    obj.wheelModel = gltf;
                    obj.scene.remove(obj.wheels[i]);
                    const temp = obj.wheels[i];
                    obj.wheels[i] = gltf.scene;
                    if(i === 1 || i === 3)
                        obj.wheels[i].scale.set(-1 * obj.wheelScale.frontWheel, 1 * obj.wheelScale.frontWheel, -1 * obj.wheelScale.frontWheel);
                    else
                        obj.wheels[i].scale.set(1 * obj.wheelScale.frontWheel, 1 * obj.wheelScale.frontWheel, 1 * obj.wheelScale.frontWheel);
                    obj.scene.add(obj.wheels[i]);
                    obj.wheels[i] = {...temp, ...gltf.scene};
                })
            }
        };
        obj.gui.Register({folder: 'Upload', type: 'file', label: 'Upload Chassis Model (GLTF Only)', fileReadFunc: "readAsArrayBuffer", onChange: addChassisViaUpload});
        obj.gui.Register({folder: 'Upload', type: 'file', label: 'Upload Wheel Model (GLTF Only)', fileReadFunc: "readAsArrayBuffer", onChange: addWheelViaUpload});
    }
    setChassis() {
        //Setting up the chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(this.chassisDimension.x * 0.5, this.chassisDimension.y * 0.5, this.chassisDimension.z * 0.5));
        const chassisBody = new CANNON.Body({mass: 250, material: new CANNON.Material({friction: 0})});
        chassisBody.addShape(chassisShape);

        this.chassis.helpChassis.visible = false;
        this.chassis.helpChassis.scale.set(this.chassisDimension.x, this.chassisDimension.y, this.chassisDimension.z);

        this.car = new CANNON.RaycastVehicle({
            chassisBody,
            indexRightAxis: 0,
            indexUpAxis: 1,
            indexForwardAxis: 2
        });
        this.car.addToWorld(this.world);
    }
    setWheels() {
        const options = {
            radius: 0.34,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 55,
            suspensionRestLength: 0.5,
            frictionSlip: 30,
            dampingRelaxation: 2.3,
            dampingCompression: 4.3,
            maxSuspensionForce: 10000,
            rollInfluence:  0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
            maxSuspensionTravel: 1,
            customSlidingRotationalSpeed: 30,
        };
        const setWheelChassisConnectionPoint = (index, position) => {
            this.car.wheelInfos[index].chassisConnectionPointLocal.copy(position);
        }

        this.car.wheelInfos = [];
        this.car.addWheel(options);
        this.car.addWheel(options);
        this.car.addWheel(options);
        this.car.addWheel(options);
        setWheelChassisConnectionPoint(0, new CANNON.Vec3(0.75, 0.1, -1.32));
        setWheelChassisConnectionPoint(1, new CANNON.Vec3(-0.78, 0.1, -1.32));
        setWheelChassisConnectionPoint(2, new CANNON.Vec3(0.75, 0.1, 1.25));
        setWheelChassisConnectionPoint(3, new CANNON.Vec3(-0.78, 0.1, 1.25));

        this.car.wheelInfos.forEach( function(wheel, index){
            const cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20)
            const wheelBody = new CANNON.Body({
                mass: 1,
                material: new CANNON.Material({friction: 0}),
            })
            const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0)
            wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion)
            this.wheels[index].wheelBody = wheelBody;
            this.wheels[index].helpWheelsGeo = new THREE.CylinderGeometry(wheel.radius, wheel.radius, wheel.radius / 2, 20);
            this.wheels[index].helpWheelsGeo.rotateZ(Math.PI / 2);
            this.wheels[index].helpWheelsMat = new THREE.MeshBasicMaterial({color: 0x00ffff, wireframe: true});
            this.wheels[index].helpWheels = new THREE.Mesh(this.wheels[index].helpWheelsGeo, this.wheels[index].helpWheelsMat);
            this.wheels[index].helpWheels.visible = false;
            this.scene.add(this.wheels[index].helpWheels);
        }.bind(this));
    }

    controls() {
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
            const {primaryKeys, secondaryKeys} = this.controlOptions;

            if(keysPressed.includes(primaryKeys.reset) || keysPressed.includes(secondaryKeys.reset)) resetCar();

            if(!keysPressed.includes(primaryKeys.brake) && !keysPressed.includes(secondaryKeys.brake)){
                this.car.setBrake(0, 0);
                this.car.setBrake(0, 1);
                this.car.setBrake(0, 2);
                this.car.setBrake(0, 3);

                if(keysPressed.includes(primaryKeys.left) || keysPressed.includes(secondaryKeys.left)) {
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * 1, 2);
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * 1, 3);
                }
                else if(keysPressed.includes(primaryKeys.right) || keysPressed.includes(secondaryKeys.right)) {
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * -1, 2);
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * -1, 3);
                }
                else stopSteer();

                if(keysPressed.includes(primaryKeys.forward) || keysPressed.includes(secondaryKeys.forward)) {
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 0);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 1);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 2);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 3);
                }
                else if(keysPressed.includes(primaryKeys.backward) || keysPressed.includes(secondaryKeys.backward)) {
                    this.car.applyEngineForce(this.controlOptions.maxForce * 1, 0);
                    this.car.applyEngineForce(this.controlOptions.maxForce * 1, 1);
                    this.car.applyEngineForce(this.controlOptions.maxForce * 1, 2);
                    this.car.applyEngineForce(this.controlOptions.maxForce * 1, 3);
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
            this.car.setBrake(this.controlOptions.brakeForce, 0);
            this.car.setBrake(this.controlOptions.brakeForce, 1);
            this.car.setBrake(this.controlOptions.brakeForce, 2);
            this.car.setBrake(this.controlOptions.brakeForce, 3);
        }

        const stopCar = () => {
            this.car.setBrake(this.controlOptions.slowDownCar, 0);
            this.car.setBrake(this.controlOptions.slowDownCar, 1);
            this.car.setBrake(this.controlOptions.slowDownCar, 2);
            this.car.setBrake(this.controlOptions.slowDownCar, 3);
        }

        const stopSteer = () => {
            this.car.setSteeringValue(0, 2);
            this.car.setSteeringValue(0, 3);
        }
    }

    guiRegisterer() {
        const controllableKeysArray = [' ', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'control', 'alt', 'shift', 'meta', 'tab']
        const vehicleOptions = {
            suspensionStiffness: 55,
            suspensionRestLength: 0.5,
            frictionSlip: 30,
            dampingRelaxation: 2.3,
            dampingCompression: 4.3,
            maxSuspensionForce: 10000,
            maxSuspensionTravel: 1,
            rollInfluence:  0.01,
        };
        const resetCar = () => {
            this.car.chassisBody.position.set(0, 4, 0);
            this.car.chassisBody.quaternion.set(0, 0, 0, 1);
            this.car.chassisBody.angularVelocity.set(0, 0, 0);
            this.car.chassisBody.velocity.set(0, 0, 0);
        }
        const stopCar = () => {
            this.car.setBrake(1000, 0);
            this.car.setBrake(1000, 1);
            setTimeout(() => {
                this.car.setBrake(0, 0);
                this.car.setBrake(0, 1);
            }, 100);
            this.car.applyEngineForce(0, 0);
            this.car.applyEngineForce(0, 1);
            this.car.applyEngineForce(0, 2);
            this.car.applyEngineForce(0, 3);
            this.car.chassisBody.angularVelocity.set(0, 0, 0);
            this.car.chassisBody.velocity.set(0, 0, 0);
        }
        const updateGuiChanges = () => {
            this.car.chassisBody.shapes = [];
            this.car.chassisBody.addShape(new CANNON.Box(new CANNON.Vec3(this.chassisDimension.x * 0.5, this.chassisDimension.y * 0.5, this.chassisDimension.z * 0.5)));
            this.chassis.helpChassis.scale.set(this.chassisDimension.x, this.chassisDimension.y, this.chassisDimension.z);
        }
        const updateWheelOptions = () => {
            for(let i = 0 ; i < this.car.wheelInfos.length; i++) {
                this.car.wheelInfos[i] = {...this.car.wheelInfos[i], ...vehicleOptions};
            }
        }
        resetCar();

        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'x', type: 'range', label: 'x', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'y', type: 'range', label: 'y', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'z', type: 'range', label: 'z', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper', type: 'checkbox', label: 'Show Chassis Helper', object: this.chassis.helpChassis, property:'visible'})
        this.gui.Register({folder: 'Chassis Helper', type: 'button', label: 'Reset Position', action: resetCar})
        this.gui.Register({folder: 'Chassis Helper', type: 'button', label: 'Stop Car', action: stopCar})
        this.gui.Register({folder: 'Chassis Model Position', object: this.chassisModelPos, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01,})
        this.gui.Register({folder: 'Chassis Model Position', object: this.chassisModelPos, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01,})
        this.gui.Register({folder: 'Chassis Model Position', object: this.chassisModelPos, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01,})

        this.gui.Register({folder: 'Wheels', object: this.wheelScale, type: 'range', label: 'Front Wheels Scale', property: 'frontWheel', min: 0, max: 5, step: 0.01, onChange: () => {
            for(let i = 2 ; i < 4 ; i++) {
                const scaleSide = i === 3 ? -1 : 1;
                this.wheels[i].scale.set(scaleSide * this.wheelScale.frontWheel, 1 * this.wheelScale.frontWheel, scaleSide * this.wheelScale.frontWheel)
            }
        }})
        this.gui.Register({folder: 'Wheels', object: this.wheelScale, type: 'range', label: 'Hind Wheels Scale', property: 'hindWheel', min: 0, max: 5, step: 0.01, onChange: () => {
            for(let i = 0 ; i < 2 ; i++) {
                const scaleSide = i === 1 ? -1 : 1;
                this.wheels[i].scale.set(scaleSide * this.wheelScale.hindWheel, 1 * this.wheelScale.hindWheel, scaleSide * this.wheelScale.hindWheel)
            }
        }})

        this.gui.Register({folder: 'Wheels Helper', type: 'checkbox', label: 'Show Wheels Helper', object: this.wheels[0].helpWheels, property:'visible', onChange: () => {
            for (let i = 0 ; i < 4 ; i++)
            this.wheels[i].helpWheels.visible = this.wheels[0].helpWheels.visible;

        }});

        this.gui.Register({folder: 'Wheels Helper', object: this.car.wheelInfos[2], property: 'radius', type: 'range', label: 'Front Wheels Radius', min: 0.1, max: 5, step: 0.01, onChange: () => {
            this.car.wheelInfos[2].radius = this.car.wheelInfos[2].radius;
            this.car.wheelInfos[3].radius = this.car.wheelInfos[2].radius;
            const cylinderGeometry = new THREE.CylinderGeometry(this.car.wheelInfos[2].radius, this.car.wheelInfos[2].radius, this.car.wheelInfos[2].radius / 2, 20);
            cylinderGeometry.rotateZ(Math.PI / 2);
            this.wheels[2].helpWheels.geometry = cylinderGeometry;
            this.wheels[3].helpWheels.geometry = cylinderGeometry;
        }});

        this.gui.Register({folder: 'Wheels Helper', object: this.car.wheelInfos[0], property: 'radius', type: 'range', label: 'Hind Wheels Radius', min: 0.1, max: 5, step: 0.01, onChange: () => {
            this.car.wheelInfos[0].radius = this.car.wheelInfos[0].radius;
            this.car.wheelInfos[1].radius = this.car.wheelInfos[0].radius;
            const cylinderGeometry = new THREE.CylinderGeometry(this.car.wheelInfos[0].radius, this.car.wheelInfos[0].radius, this.car.wheelInfos[0].radius / 2, 20);
            cylinderGeometry.rotateZ(Math.PI / 2);
            this.wheels[0].helpWheels.geometry = cylinderGeometry;
            this.wheels[1].helpWheels.geometry = cylinderGeometry;
        }});

        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Left Front Wheel', open: true});
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01});

        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Right Front Wheel', open: true});
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01});

        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Left Hind Wheel', open: true});
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01});

        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Right Hind Wheel', open: true});
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01});
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01});

        this.gui.Register({folder: 'Vehicle', object: this.car.chassisBody, property: 'mass', type: 'range', label: 'Mass', min: 1, max: 1000, step: 1});

        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'suspensionStiffness', type: 'range', label:'Suspension Stiffness', min: 0, max: 100, step: 1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'suspensionRestLength', type: 'range', label:'Suspension Rest Height', min: -10, max: 10, step: 0.1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'frictionSlip', type: 'range', label:'Friction Slip', min: 0, max: 50, step: 1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'dampingRelaxation', type: 'range', label:'Damping Relaxation', min: -10, max: 10, step: 0.1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'dampingCompression', type: 'range', label:'Damping Compression', min: -10, max: 10, step: 0.1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'maxSuspensionForce', type: 'range', label:'Max Suspension Force', min: -10000, max: 10000, step: 10, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'maxSuspensionTravel', type: 'range', label:'Max Suspension Travel', min: -10, max: 10, step: 1, onChange: updateWheelOptions});
        this.gui.Register({folder: 'Vehicle', object: vehicleOptions, property:'rollInfluence', type: 'range', label:'Roll Influence', min: 0, max: 10, step: 0.1, onChange: updateWheelOptions});

        this.gui.Register({folder: 'Vehicle', type: 'folder', label: 'Controls', open: true});
        this.gui.Register({folder: 'Controls', object: this.controlOptions, property:'maxSteerVal', type: 'range', label:'Max Steer Value', min: 0, max: 1, step: 0.01});
        this.gui.Register({folder: 'Controls', object: this.controlOptions, property:'maxForce', type: 'range', label:'Max Force', min: 1, max: 10000, step: 10});
        this.gui.Register({folder: 'Controls', object: this.controlOptions, property:'brakeForce', type: 'range', label:'Brake Force', min: 1, max: 100, step: 0.1});
        this.gui.Register({folder: 'Controls', object: this.controlOptions, property:'slowDownCar', type: 'range', label:'Slow Car Force', min: 1, max: 100, step: 0.1});

        this.gui.Register({folder: 'Controls', type: 'folder', label: 'Primary Keys Controls', open: true});
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'forward', type: 'select', label: 'Move Forward', options: controllableKeysArray})
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'backward', type: 'select', label: 'Move Backward', options: controllableKeysArray})
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'left', type: 'select', label: 'Turn Left', options: controllableKeysArray})
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'right', type: 'select', label: 'Turn Right', options: controllableKeysArray})
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'brake', type: 'select', label: 'Apply Brakes', options: controllableKeysArray})
        this.gui.Register({folder: 'Primary Keys Controls', object: this.controlOptions.primaryKeys, property: 'reset', type: 'select', label: 'Reset Car Position', options: controllableKeysArray})

        this.gui.Register({folder: 'Controls', type: 'folder', label: 'Secondary Keys Controls', open: true});
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'forward', type: 'select', label: 'Move Forward', options: controllableKeysArray})
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'backward', type: 'select', label: 'Move Backward', options: controllableKeysArray})
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'left', type: 'select', label: 'Turn Left', options: controllableKeysArray})
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'right', type: 'select', label: 'Turn Right', options: controllableKeysArray})
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'brake', type: 'select', label: 'Apply Brakes', options: controllableKeysArray})
        this.gui.Register({folder: 'Secondary Keys Controls', object: this.controlOptions.secondaryKeys, property: 'reset', type: 'select', label: 'Reset Car Position', options: controllableKeysArray})

        this.gui.Register({folder: 'Generate Code', type: 'button', label: 'Copy to clipboard', action: () => {
            const generateCode = new GenerateCode(this);
            copy(generateCode.generateCAR());
        }})
        this.gui.Register({folder: 'Generate Code', type: 'button', label: 'Save as ZIP', action: () => {
            const generateCode = new GenerateCode(this);
            generateCode.generateCode();
        }})
    }

    update() {
        const updateWorld = () => {
            if(this.car && this.chassis && this.wheels[0]){
                this.chassis.position.set(
                    this.car.chassisBody.position.x + this.chassisModelPos.x,
                    this.car.chassisBody.position.y + this.chassisModelPos.y,
                    this.car.chassisBody.position.z + this.chassisModelPos.z
                );
                this.chassis.quaternion.copy(this.car.chassisBody.quaternion);
                this.chassis.helpChassis.position.copy(this.car.chassisBody.position);
                this.chassis.helpChassis.quaternion.copy(this.car.chassisBody.quaternion);
                for(let i = 0 ; i < 4 ; i++) {
                    if(this.wheels[i].helpWheels && this.car.wheelInfos[i]) {
                        this.car.updateWheelTransform(i);
                        this.wheels[i].position.copy(this.car.wheelInfos[i].worldTransform.position);
                        this.wheels[i].quaternion.copy(this.car.wheelInfos[i].worldTransform.quaternion);
                        this.wheels[i].helpWheels.position.copy(this.car.wheelInfos[i].worldTransform.position);
                        this.wheels[i].helpWheels.quaternion.copy(this.car.wheelInfos[i].worldTransform.quaternion);
                    }
                }
            }
        }
        this.world.addEventListener('postStep', updateWorld);
    }
}
