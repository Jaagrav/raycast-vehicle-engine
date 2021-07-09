import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

export class Car {
    constructor(scene, world, gui) {
        this.scene = scene;
        this.world = world;
        this.gui = gui;

        this.car = {};
        this.car.helpChassisGeo = {};
        this.car.helpChassisMat = {};
        this.car.helpChassis = {};
        this.chassis = {};
        this.wheels = [];
        this.chassisDimension = {x: 1.96, y: 1, z: 4.47};

        this.loadModels();
    }
    init() {
        this.setChassis();
        this.setWheels();
        this.controls();
        this.update();
    }
    loadModels() {
        const loadingManager = new THREE.LoadingManager(() => this.init());
        const gltfLoader = new GLTFLoader(loadingManager);
        gltfLoader.load("./models/mclaren/chassis.gltf", gltf => {
            this.chassis = gltf.scene;
            this.chassis.helpChassisGeo = new THREE.BoxBufferGeometry(1, 1, 1);
            this.chassis.helpChassisMat = new THREE.MeshStandardMaterial({color: 0xff0000, wireframe: false});
            this.chassis.helpChassis = new THREE.Mesh(this.chassis.helpChassisGeo, this.chassis.helpChassisMat);
            this.scene.add(gltf.scene, this.chassis.helpChassis);
        })
        let scale = {wheel: 0.67};
        for(let i = 0 ; i < 4 ; i++) {
            gltfLoader.load("./models/mclaren/wheel.gltf", gltf => {
                const model = gltf.scene;
                this.wheels[i] = model;
                if(i === 1 || i === 3)
                    this.wheels[i].scale.set(-1 * scale.wheel, 1 * scale.wheel, -1 * scale.wheel);
                else
                    this.wheels[i].scale.set(1 * scale.wheel, 1 * scale.wheel, 1 * scale.wheel);
                this.scene.add(model); 
            })
        }
        this.gui.Register({folder: 'Wheels', object: scale, type: 'range', label: 'Front Wheel Scale', property: 'wheel', min: 0, max: 5, step: 0.01, onChange: () => {
            for(let i = 0 ; i < 4 ; i++) {
                if(i === 1 || i === 3)
                    this.wheels[i].scale.set(-1 * scale.wheel, 1 * scale.wheel, -1 * scale.wheel)
                else
                    this.wheels[i].scale.set(1 * scale.wheel, 1 * scale.wheel, 1 * scale.wheel)
            }
        }})
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
            }, 100)
        }
        const updateGuiChanges = () => {
            this.car.chassisBody.shapes = [];
            this.car.chassisBody.addShape(new CANNON.Box(new CANNON.Vec3(this.chassisDimension.x * 0.5, this.chassisDimension.y * 0.5, this.chassisDimension.z * 0.5)));
            this.chassis.helpChassis.scale.set(this.chassisDimension.x, this.chassisDimension.y, this.chassisDimension.z);
        }
        resetCar();

        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'x', type: 'range', label: 'x', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'y', type: 'range', label: 'y', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper Dimension', object: this.chassisDimension, property: 'z', type: 'range', label: 'z', min: 0, max: 10, step: 0.01, onChange: updateGuiChanges})
        this.gui.Register({folder: 'Chassis Helper', type: 'checkbox', label: 'Show Chassis Helper', object: this.chassis.helpChassis, property:'visible'})
        this.gui.Register({folder: 'Chassis Helper', type: 'button', label: 'Reset Position', action: resetCar})
        this.gui.Register({folder: 'Chassis Helper', type: 'button', label: 'Stop Car', action: stopCar})
    }
    setWheels() {
        const obj = this;
        const options = {
            radius: 0.34,
            directionLocal: new CANNON.Vec3(0, -1, 0),
            suspensionStiffness: 55,
            suspensionRestLength: 0.5,
            frictionSlip: 30,
            dampingRelaxation: 2.3,
            dampingCompression: 4.3,
            maxSuspensionForce: 500000,
            rollInfluence:  0.01,
            axleLocal: new CANNON.Vec3(-1, 0, 0),
            chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
            maxSuspensionTravel: 1,
            customSlidingRotationalSpeed: 30,
        };
        const setWheelChassisConnectionPoint = (index, position) => {
            this.car.wheelInfos[index].chassisConnectionPointLocal.copy(position);
        }

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
            obj.world.addBody(wheelBody)
            
            obj.wheels[index].wheelBody = wheelBody;
            obj.wheels[index].helpWheelsGeo = new THREE.CylinderGeometry(wheel.radius, wheel.radius, wheel.radius / 2, 20);
            obj.wheels[index].helpWheelsGeo.rotateZ(Math.PI / 2);
            obj.wheels[index].helpWheelsMat = new THREE.MeshStandardMaterial({color: 0x00ffff});
            obj.wheels[index].helpWheels = new THREE.Mesh(obj.wheels[index].helpWheelsGeo, obj.wheels[index].helpWheelsMat);
            obj.wheels[index].helpWheels.visible = false;
            obj.scene.add(obj.wheels[index].helpWheels);
        });

        this.gui.Register({folder: 'Wheels Helper', type: 'checkbox', label: 'Show Wheels Helper', object: this.wheels[0].helpWheels, property:'visible', onChange: () => {
            for (let i = 0 ; i < 4 ; i++)
            this.wheels[i].helpWheels.visible = this.wheels[0].helpWheels.visible;
        }})

        this.gui.Register({folder: 'Wheels Helper', object: this.car.wheelInfos[2], property: 'radius', type: 'range', label: 'Front Wheels Radius', min: 0.1, max: 5, step: 0.01, onChange: () => {
            this.car.wheelInfos[2].radius = this.car.wheelInfos[2].radius;
            this.car.wheelInfos[3].radius = this.car.wheelInfos[2].radius;
            const cylinderGeometry = new THREE.CylinderGeometry(this.car.wheelInfos[2].radius, this.car.wheelInfos[2].radius, this.car.wheelInfos[2].radius / 2, 20);
            cylinderGeometry.rotateZ(Math.PI / 2);
            obj.wheels[2].helpWheels.geometry = cylinderGeometry;
            obj.wheels[3].helpWheels.geometry = cylinderGeometry;
        }})

        this.gui.Register({folder: 'Wheels Helper', object: this.car.wheelInfos[0], property: 'radius', type: 'range', label: 'Hind Wheels Radius', min: 0.1, max: 5, step: 0.01, onChange: () => {
            this.car.wheelInfos[0].radius = this.car.wheelInfos[0].radius;
            this.car.wheelInfos[1].radius = this.car.wheelInfos[0].radius;
            const cylinderGeometry = new THREE.CylinderGeometry(this.car.wheelInfos[0].radius, this.car.wheelInfos[0].radius, this.car.wheelInfos[0].radius / 2, 20);
            cylinderGeometry.rotateZ(Math.PI / 2);
            obj.wheels[0].helpWheels.geometry = cylinderGeometry;
            obj.wheels[1].helpWheels.geometry = cylinderGeometry;
        }})
        
        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Left Front Wheel', open: true})
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Left Front Wheel', object: this.car.wheelInfos[2].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01})
        
        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Right Front Wheel', open: true})
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Right Front Wheel', object: this.car.wheelInfos[3].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01})
        
        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Left Hind Wheel', open: true})
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Left Hind Wheel', object: this.car.wheelInfos[0].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01})
        
        this.gui.Register({folder: 'Wheel Helper Position', type: 'folder', label: 'Right Hind Wheel', open: true})
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'x', type: 'range', label: 'x', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'y', type: 'range', label: 'y', min: -10, max: 10, step: 0.01})
        this.gui.Register({folder: 'Right Hind Wheel', object: this.car.wheelInfos[1].chassisConnectionPointLocal, property: 'z', type: 'range', label: 'z', min: -10, max: 10, step: 0.01})
        
        console.log(this.car.wheelInfos, obj.wheels[0].helpWheels)
    }
    controls() {
        const maxSteerVal = 0.5;
        const maxForce = 750;
        const brakeForce = 15;
        const keysPressed = [];

        window.addEventListener('keydown', (e) => {
            if(e.key === 'r') resetCar();
            if(!keysPressed.includes(e.keyCode)) keysPressed.push(e.keyCode); 
            hindMovement();
        });
        window.addEventListener('keyup', (e) => {keysPressed.splice(keysPressed.indexOf(e.keyCode), 1); hindMovement();});

        const hindMovement = () => {
            
            if(!keysPressed.includes(32)){
                this.car.setBrake(0, 0);
                this.car.setBrake(0, 1);
                this.car.setBrake(0, 2);
                this.car.setBrake(0, 3);
                if(keysPressed.includes(65) || keysPressed.includes(37)) {
                    this.car.setSteeringValue(maxSteerVal * 1, 2);
                    this.car.setSteeringValue(maxSteerVal * 1, 3);
                }
                else if(keysPressed.includes(68) || keysPressed.includes(39)) {
                    this.car.setSteeringValue(maxSteerVal * -1, 2);
                    this.car.setSteeringValue(maxSteerVal * -1, 3);
                } 
                else stopSteer();
                
                if(keysPressed.includes(83) || keysPressed.includes(40)) {
                    this.car.applyEngineForce(maxForce * 1, 0);
                    this.car.applyEngineForce(maxForce * 1, 1);
                    this.car.applyEngineForce(maxForce * 1, 2);
                    this.car.applyEngineForce(maxForce * 1, 3);
                }
                else if(keysPressed.includes(87) || keysPressed.includes(38)) {
                    this.car.applyEngineForce(maxForce * -1, 0);
                    this.car.applyEngineForce(maxForce * -1, 1);
                    this.car.applyEngineForce(maxForce * -1, 2);
                    this.car.applyEngineForce(maxForce * -1, 3);
                } 
                else stopCar();
            }
            else
                brake();
        }

        const resetCar = () => {
            this.car.chassisBody.position.y = 4;
            this.car.chassisBody.quaternion.copy(this.car.chassisBody.initQuaternion);
            this.car.chassisBody.velocity.copy(this.car.chassisBody.initVelocity);
            this.car.chassisBody.angularVelocity.copy(this.car.chassisBody.initAngularVelocity);
        }

        const brake = () => {    
            this.car.setBrake(brakeForce * 2.4, 0);
            this.car.setBrake(brakeForce * 2.4, 1);
            this.car.setBrake(brakeForce * 2.4, 2);
            this.car.setBrake(brakeForce * 2.4, 3);
        }

        const stopCar = () => {
            this.car.setBrake(brakeForce * 1.4, 0);
            this.car.setBrake(brakeForce * 1.4, 1);
            this.car.setBrake(brakeForce * 1.4, 2);
            this.car.setBrake(brakeForce * 1.4, 3);
        }

        const stopSteer = () => {
            this.car.setSteeringValue(0, 2);
            this.car.setSteeringValue(0, 3);
        }
    }
    update() {
        const updateWorld = () => {
            if(this.car && this.chassis){
                this.chassis.position.set(
                    this.car.chassisBody.position.x,
                    this.car.chassisBody.position.y - 0.6,
                    this.car.chassisBody.position.z
                );
                this.chassis.quaternion.copy(this.car.chassisBody.quaternion);
                this.chassis.helpChassis.position.copy(this.car.chassisBody.position);
                this.chassis.helpChassis.quaternion.copy(this.car.chassisBody.quaternion);
                for(let i = 0 ; i < 4 ; i++) {
                    this.car.updateWheelTransform(i);
                    this.wheels[i].position.copy(this.car.wheelInfos[i].worldTransform.position);
                    this.wheels[i].quaternion.copy(this.car.wheelInfos[i].worldTransform.quaternion);
                    this.wheels[i].helpWheels.position.copy(this.car.wheelInfos[i].worldTransform.position);
                    this.wheels[i].helpWheels.quaternion.copy(this.car.wheelInfos[i].worldTransform.quaternion);
                }
            }
        }
        this.world.addEventListener('postStep', updateWorld);
    }
}