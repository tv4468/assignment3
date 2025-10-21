import * as THREE from "three";
import * as TWEEN from '@tweenjs/tween.js';
import { Group } from '@tweenjs/tween.js';
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { TeapotGeometry } from "three/examples/jsm/Addons.js";

// Automatically resizes the window.
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    // labelRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// SCENE
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.000);

// // HTML INTEGRATION
// const labelRenderer = new CSS2DRenderer();
// labelRenderer.setSize(window.innerWidth, window.innerHeight);
// labelRenderer.domElement.style.position = "absolute";
// labelRenderer.domElement.style.top = "0px";
// labelRenderer.domElement.style.color = "#ffffff";
// labelRenderer.domElement.style.pointerEvents = "none";
// document.body.appendChild(labelRenderer.domElement);
// const p = document.createElement("p");
// p.style.whiteSpace = "pre";
// p.style.right = "120%";
// p.style.bottom = "100%";
// p.textContent = "Green: Linear\r\n" + "Pink: De Casteljau\r\n" + "Orange: Quadratic_Out\r\n" + "Blue: Catmull-Rom\r\n" + "Yellow: Quadratic_Out (built-in)\r\n" + "Cyan: Catmull-Rom (built-in)\r\n";
// const pPointLabel = new CSS2DObject(p);
// pPointLabel.center.x = 0;
// pPointLabel.center.y = 0;
// scene.add(pPointLabel);
// // const input = document.createElement("input");
// // input.type = "file";
// // input.name = "filename";
// // const cPointLabel = new CSS2DObject(input);
// // cPointLabel.position.set(0, 0, 0);
// // scene.add(cPointLabel);

// RENDERER SETUP
let renderer;
initializeRenderer();
function initializeRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);
    renderer.setClearColor("#000000");
}

// CAMERA
let camera;
initializeCamera();
function initializeCamera() {
    camera = new THREE.PerspectiveCamera(
        75, // FoV
        window.innerWidth / window.innerHeight, // Aspect Ratio
        0.1, // Near
        1000 // Far
    );
    camera.position.set(0, -100, 100);
    camera.rotation.x = rad(90);
    camera.rotation.y = rad(0);
    camera.rotation.z = rad(0);
}

//
// Here be the Object(s)
//

// BALLS
const gravity = 100;
const us = 1; // Coefficient of restitution
let balls = [];
let leader, unleader;
initializeBalls();
function initializeBalls() {

    var i = 0;
    while (i != 100) {
        balls[i] = new THREE.Mesh(
            // new THREE.SphereGeometry(5, 32, 32, 0),
            new THREE.ConeGeometry(5, 5, 32, 1),
            // new THREE.BoxGeometry(5, 5, 5, 1, 1, 1),
            new THREE.MeshPhongMaterial({
                color: 0x00ff80,
                flatShading: false
            })
        );
        balls[i].castShadow = true;
        balls[i].receiveShadow = true;
        balls[i].position.set(-100.0 + Math.random() * 200.0, -100.0 + Math.random() * 200.0, Math.random() * 200.0);
        balls[i].velocity = new THREE.Vector3(-10.0 + Math.random() * 20.0, -10.0 + Math.random() * 20.0, Math.random() * 20.0);
        balls[i].acceleration = new THREE.Vector3(0, 0, 0);
        balls[i].maxForce = 5;
        balls[i].maxSpeed = 100;
        balls[i].geometry.rotateX(rad(90));
        scene.add(balls[i]);
        i++;
    }

    leader = new THREE.Mesh(
        new THREE.SphereGeometry(5, 32, 32, 0),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            flatShading: false
        })
    );
    scene.add(leader);

    unleader = new THREE.Mesh(
        new THREE.SphereGeometry(5, 32, 32, 0),
        new THREE.MeshPhongMaterial({
            color: 0xff0080,
            flatShading: false
        })
    );
    scene.add(unleader);

}

// WALLS (and floor)
let plane;
const coeffRest = 1; // Coefficient of restitution
initializeWalls(10000, 10000, 5);
function initializeWalls(w, l, border) {

    plane = new THREE.Mesh(
        new THREE.PlaneGeometry(w, l, 1, 1),
        new THREE.MeshPhongMaterial({
            color: 0xff0080,
            flatShading: false
        })
    );
    plane.receiveShadow = true;
    scene.add(plane);
    plane.position.z = -5;
}

// LIGHT(S)
let ambientLight, spotLight;
initializeLights();
function initializeLights() {
    ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    spotLight = new THREE.SpotLight(0xffffff, 3, 0, rad(-60), 1, 0);
    spotLight.position.set(0, 0, 500);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.set(1024, 1024);
    spotLight.shadow.camera.near = 0.1;
    spotLight.shadow.camera.far = 1000;
    spotLight.rotation.x = rad(90);
    scene.add(spotLight);
}


// AUDIO
let listener, audioLoader, sound;
initializeAudio();
function initializeAudio() {
    listener = new THREE.AudioListener();
    camera.add(listener);
    audioLoader = new THREE.AudioLoader();
    sound = new THREE.Audio(listener);
    audioLoader.load("../sounds/ding.wav", function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        window.addEventListener("click", function () {
            sound.stop();
            sound.play();
        });
    });
}

// ACTION!
var preTime = 0;
function animate(time) {
    requestAnimationFrame(function loop(time) {
        requestAnimationFrame(loop);
    })
    // labelRenderer.render(scene, camera);
    renderer.render(scene, camera);

    var dt = time - preTime;
    // console.log(preTime, time, dt);

    // console.log(leader.position);
    move(balls, dt / 1000, time);
    flocking(balls);

    preTime = time;
}

var leaderPath = [
    [40.0, 40.0, 100.0],
    [0.0, 0.0, 100.0],
    [40.0, -40.0, 100.0],
    [0.0, 0.0, 100.0],
    [-40.0, -40.0, 100.0],
    [0.0, 0.0, 100.0],
    [-40.0, 40.0, 100.0],
    [0.0, 0.0, 100.0]
];
var unleaderPath = [
    [0.0, 0.0, 200.0],
    [0.0, 0.0, 0.0]
];
function move(balls, dtS, time) {
    var keyframesParse = new Array();
    for (let i = 0; i < leaderPath.length; i++) {
        keyframesParse.push(new THREE.Vector3(leaderPath[i][0], leaderPath[i][1], leaderPath[i][2]));
    }
    leader.position.copy(catmullRomLoop(keyframesParse, (time / 1000 * 0.05) % 1, 1));

    keyframesParse = new Array();
    for (let i = 0; i < unleaderPath.length; i++) {
        keyframesParse.push(new THREE.Vector3(unleaderPath[i][0], unleaderPath[i][1], unleaderPath[i][2]));
    }
    unleader.position.copy(catmullRomLoop(keyframesParse, (time / 1000 * -0.0333) % 1, 1));

    for (const ball of balls) {
        ball.velocity.add(ball.acceleration).clampLength(0, ball.maxSpeed);
        var newPos = new THREE.Vector3(ball.position.x, ball.position.y, ball.position.z).addScaledVector(ball.velocity, dtS);
        
        // ball.quaternion.preMultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), new THREE.Vector3().copy().angleTo(directionToGo)));
        ball.lookAt(newPos);
        ball.position.addScaledVector(ball.velocity, dtS);
        ball.acceleration.set(0, 0, 0);

        // while (ball.position.x > 100.0) {
        //     ball.position.x -= 200.0
        // }
        // while (ball.position.x < -100.0) {
        //     ball.position.x += 200.0
        // }
        // while (ball.position.y > 100.0) {
        //     ball.position.y -= 200.0
        // }
        // while (ball.position.y < -100.0) {
        //     ball.position.y += 200.0
        // }
        // while (ball.position.z > 200.0) {
        //     ball.position.z -= 200.0
        // }
        // while (ball.position.z < -100.0) {
        //     ball.position.z += 200.0
        // }
    }
}

function catmullRomLoop(keyframesParse, t, alph) {

    var prog = 1 + t * (keyframesParse.length);
    var selectedKey = Math.floor(prog);
    var midKey = prog - selectedKey;

    var p0 = keyframesParse.at((selectedKey - 1) % keyframesParse.length);
    var p1 = keyframesParse.at((selectedKey + 0) % keyframesParse.length);
    var p2 = keyframesParse.at((selectedKey + 1) % keyframesParse.length);
    var p3 = keyframesParse.at((selectedKey + 2) % keyframesParse.length);

    var t01 = Math.max(Math.pow(p0.distanceTo(p1), alph), 0.0000001);
    var t12 = Math.max(Math.pow(p1.distanceTo(p2), alph), 0.0000001);
    var t23 = Math.max(Math.pow(p2.distanceTo(p3), alph), 0.0000001);

    var m1x = p2.x - p1.x + t12 * ((p1.x - p0.x) / t01 - (p2.x - p0.x) / (t01 + t12));
    var m1y = p2.y - p1.y + t12 * ((p1.y - p0.y) / t01 - (p2.y - p0.y) / (t01 + t12));
    var m1z = p2.z - p1.z + t12 * ((p1.z - p0.z) / t01 - (p2.z - p0.z) / (t01 + t12));

    var m2x = p2.x - p1.x + t12 * ((p3.x - p2.x) / t23 - (p3.x - p1.x) / (t12 + t23));
    var m2y = p2.y - p1.y + t12 * ((p3.y - p2.y) / t23 - (p3.y - p1.y) / (t12 + t23));
    var m2z = p2.z - p1.z + t12 * ((p3.z - p2.z) / t23 - (p3.z - p1.z) / (t12 + t23));

    var ax = 2 * p1.x - 2 * p2.x + m1x + m2x;
    var ay = 2 * p1.y - 2 * p2.y + m1y + m2y;
    var az = 2 * p1.z - 2 * p2.z + m1z + m2z;

    var bx = -3 * p1.x + 3 * p2.x - 2 * m1x - m2x;
    var by = -3 * p1.y + 3 * p2.y - 2 * m1y - m2y;
    var bz = -3 * p1.z + 3 * p2.z - 2 * m1z - m2z;

    var cx = m1x;
    var cy = m1y;
    var cz = m1z;

    var dx = p1.x;
    var dy = p1.y;
    var dz = p1.z;

    const px = ax * midKey * midKey * midKey + bx * midKey * midKey + cx * midKey + dx;
    const py = ay * midKey * midKey * midKey + by * midKey * midKey + cy * midKey + dy;
    const pz = az * midKey * midKey * midKey + bz * midKey * midKey + cz * midKey + dz;

    return new THREE.Vector3(px, py, pz);
}

let weightSep = 5;
let weightAli = 1;
let weightCoh = 1;
let weightFol = 2;
let weightFle = 5;
let weightAll = weightSep + weightAli + weightCoh + weightFol + weightFle;
function flocking(balls) {

    for (var i = 0; i < balls.length; i++) {
        var separateForce = separate(balls[i]).multiplyScalar(weightSep / weightAll);
        var alignmentForce = alignment(balls[i]).multiplyScalar(weightAli / weightAll);
        var cohesionForce = cohesion(balls[i]).multiplyScalar(weightCoh / weightAll);
        var followForce = seek(balls[i], leader.position).multiplyScalar(weightFol / weightAll);
        var fleeForce = fleeRadius(balls[i], unleader.position, false).multiplyScalar(weightFle / weightAll);

        // console.log(weightSep / weightAll);

        balls[i].acceleration.add(separateForce);
        balls[i].acceleration.add(alignmentForce);
        balls[i].acceleration.add(cohesionForce);
        balls[i].acceleration.add(followForce);
        balls[i].acceleration.add(fleeForce);
    }

}

let radiusFle = 50;
function fleeRadius(ball, target, bypass) {
    var force = new THREE.Vector3();
    if (bypass || (ball.position.distanceToSquared(target) <= (radiusFle ** 2))){
        force.subVectors(ball.position, target).normalize().multiplyScalar(ball.maxSpeed);
        force.sub(ball.velocity);
        force.clampLength(0, ball.maxForce);
        return force;
    }
    return force;
}


function seek(ball, target) {
    var force = new THREE.Vector3().subVectors(target, ball.position).normalize().multiplyScalar(ball.maxSpeed);
    force.sub(ball.velocity);
    force.clampLength(0, ball.maxForce);
    return force;
}

let radiusCoh = 35;
function cohesion(ball) {
    var count = 0;
    var force = new THREE.Vector3();

    for (var j = 0; j < balls.length; j++) {
        var jaw = balls[j];
        if (ball === jaw) {
            continue;
        }
        var dist = ball.position.distanceToSquared(jaw.position);
        if (dist <= (radiusCoh ** 2)) {
            force.add(jaw.position);
            count++;
        }
    }

    if (count > 0) {
        force.multiplyScalar(1 / count);
        return seek(ball, force);
    }

    return force;
}

let radiusAli = 35;
function alignment(ball) {
    var count = 0;
    var force = new THREE.Vector3();

    for (var j = 0; j < balls.length; j++) {
        var jaw = balls[j];
        if (ball === jaw) {
            continue;
        }
        var dist = ball.position.distanceToSquared(jaw.position);
        if (dist <= (radiusAli ** 2)) {
            force.add(jaw.velocity);
            count++;
        }
    }

    if (count > 0) {
        force.multiplyScalar(1 / count);
        force.normalize();
        force.multiplyScalar(ball.maxSpeed);
        force.sub(ball.velocity);
        force.clampLength(0, ball.maxForce);
    }

    return force;
}

let radiusSep = 15;
function separate(ball) {
    var count = 0;
    var force = new THREE.Vector3();

    for (var j = 0; j < balls.length; j++) {
        var jaw = balls[j];
        if (ball === jaw) {
            continue;
        }
        var dist = ball.position.distanceToSquared(jaw.position);
        if (dist <= (radiusSep ** 2)) {
            // console.log("uhoh");
            force.add(new THREE.Vector3().subVectors(ball.position, jaw.position).normalize().multiplyScalar(1 / dist));
            count++;
        }
    }

    if (count > 0) {
        force.multiplyScalar(1 / count);
    }

    if (force.length() != 0) {
        force.normalize();
        force.multiplyScalar(ball.maxSpeed);
        force.sub(ball.velocity);
        force.clampLength(0, ball.maxForce);
    }

    return force;
}

function removeItem(array, itemToRemove) {
    var index = array.indexOf(itemToRemove);
    if (index !== -1) {
        array.splice(index, 1);
    }
    // console.log("Updated Array: ", array);
}

// Helper function; Converts degrees to radians.
function rad(x) {
    return x / 180 * Math.PI;
}