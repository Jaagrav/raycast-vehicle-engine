import stringifyObject from 'stringify-object';

export default class GenerateCode {
    constructor(obj) {
        this.Car = {...obj};
    }

    generateCode() {
        console.log(this.Car);
        const {primaryKeys, secondaryKeys} = this.Car.controlOptions;
        const code =
        `
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

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
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderConfig({ type: 'js' })
        dracoLoader.setDecoderPath('draco/');

        gltfLoader.setDRACOLoader(dracoLoader);

        gltfLoader.load("./models/car/chassis.gltf", gltf => {
            this.chassis = gltf.scene;
            this.scene.add(this.chassis);
        })

        this.wheels = [];
        for(let i = 0 ; i < 4 ; i++) {
            gltfLoader.load("./models/mclaren/wheel.gltf", gltf => {
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
        this.car.addWheel(${stringifyObject(this.Car.car.wheelInfos[0])});
        this.car.addWheel(${stringifyObject(this.Car.car.wheelInfos[1])});
        this.car.addWheel(${stringifyObject(this.Car.car.wheelInfos[2])});
        this.car.addWheel(${stringifyObject(this.Car.car.wheelInfos[3])});

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
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * 1, 2);
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * 1, 3);
                }
                else if(keysPressed.includes("${primaryKeys.right}") || keysPressed.includes("${secondaryKeys.right}")) {
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * -1, 2);
                    this.car.setSteeringValue(this.controlOptions.maxSteerVal * -1, 3);
                }
                else stopSteer();

                if(keysPressed.includes("${primaryKeys.forward}") || keysPressed.includes("${secondaryKeys.forward}")) {
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 0);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 1);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 2);
                    this.car.applyEngineForce(this.controlOptions.maxForce * -1, 3);
                }
                else if(keysPressed.includes("${primaryKeys.backward}") || keysPressed.includes("${secondaryKeys.backward}")) {
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

        return code;
    }

}
