import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/RGBELoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/DRACOLoader.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from 'https://unpkg.com/three@0.127.0/examples/jsm/renderers/CSS2DRenderer'

// create scene
const scene = new THREE.Scene();

// add loading manager
const loadingManager = new THREE.LoadingManager();
const progressBarContainer = document.querySelector('.progress-bar-container');
const fullscreenbtn = document.querySelector('#fullscreen');
loadingManager.onLoad = function() {
    progressBarContainer.style.display = "none";
    fullscreenbtn.style.display = "block";
}

// create webGL renderer
const fullcanvas = document.getElementById('fullcanvas');
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = false;
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor('#ffffff');

// add camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0,170,120);
scene.add(camera);

// add light
var hemiLight = new THREE.HemisphereLight('white', 0x080820, 4)
scene.add(hemiLight)

var spotLight = new THREE.SpotLight('white', 1);
spotLight.castShadow = true;
scene.add(spotLight);

// add materials
new RGBELoader(loadingManager)
    .load('https://dreamworthie.s3.us-east-2.amazonaws.com/animate-3d-arduino/gothic_manor_02_4k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });

var material0 = new THREE.MeshStandardMaterial( {
    color: '#ffffff',
    metalness: 0.2,
    roughness: 0.5
});
var material1 = new THREE.MeshStandardMaterial( {
    color: '#C0C0C0',
    metalness: 0.95, 
    roughness: 0.6
});
var material2 = new THREE.MeshStandardMaterial( {
    color: '#111111',
    metalness: 0.2,
    roughness: 0.6
});
var material3 = new THREE.MeshStandardMaterial( {
    color: '#EEE8AA',
    metalness: 0.9,   
    roughness: 0.5
});
var material4 = new THREE.MeshStandardMaterial( {
    color: '#2D3033',
    metalness: 0.3,
    roughness: 0.5
});
var material6 = new THREE.MeshStandardMaterial( {
    color: '#111111',
    metalness: 0.6,
    roughness: 0.5
});

// add orbit control 
const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.2;
controls.zoomSpeed = 0.5;
controls.minDistance = 50;
controls.maxDistance = 250;
controls.listenToKeyEvents(document.body)
controls.keys = {
    LEFT: "ArrowRight",
    UP: "ArrowDown",
    RIGHT: "ArrowLeft",
    BOTTOM: "ArrowUp" 
};

// add annotation labels 
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
fullcanvas.appendChild(labelRenderer.domElement);

let arduino = new THREE.Object3D();
const loader = new GLTFLoader(loadingManager);
var aId = 0
let meshList = []
let annotations = {}
var pins = {"Pin_0_Solder001": "0. Insufficient Wetting (board)",
    "Pin_1_Solder001": "1. Insufficient Wetting (pin)",
    "Pin_2_Solder001": "2. Solder Starved Joint (board+pin)",
    "Pin_3_Solder001": "3. Solder Starved Joint (pin)",
    "Pin_4_Solder001": "4. Cold Solder Joint",
    "Pin_5_Solder001": "5. Cold Solder Joint (crack)",
    "Pin_6_Solder001": "6. Excess Solder",
    "Pin_7_Solder001": "7. Excess Solder",
    "Pin_8_Solder001": "8. Solder Bridge (small)",
    "Pin_9_Solder001": "9. Solder Bridge (small)",
    "Pin_10_Solder001": "10. Solder Bridge (large)",
    "Pin_11_Solder001": "11. Solder Bridge (large)",
    "Pin_12_Solder001": "12. Splatters",
    "Pin_13_Solder001": "13. Overheated Joint",
}

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const pin_keys = Object.keys(pins);
loader.setDRACOLoader(dracoLoader)
loader.load('https://dreamworthie.s3.us-east-2.amazonaws.com/untitled5.glb', function (gltf) {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            // add materials
            if (child.name.includes("Curve")){
                child.material = material0
            }
            if (child.name == "2590_Metro_Mini_Rev_B1"){
                child.material = material2;
            }
            else if (child.name.includes("Spatter") || child.name.includes("Correct_Solder") ){
                child.material = material1;
            }
            else if (child.name.includes("Cube") || child.name.includes("Middle_Support")){
                child.material = material6;
            }
            else if (child.name.includes("Lower_Pin") || child.name.includes("Cylinder")){
                child.material = material3;
            }
            else if (child.name.includes("Tube")){
                child.material = material3;
            }
            // add labels
            else if (pin_keys.includes(child.name)){
                annotations[aId] = {
                    uuid: child.uuid
                }
                const annotationDiv = document.createElement('div')
                annotationDiv.className = 'annotationLabelClass'
                annotationDiv.tabIndex = '0'
                const annotationTextDiv = document.createElement('div')
                annotationTextDiv.className = 'annotationDescriptionClass'
                annotationTextDiv.innerHTML = pins[child.name]
                annotationDiv.appendChild(annotationTextDiv)
                annotations[aId].descriptionDomElement = annotationTextDiv
                const annotationLabel = new CSS2DObject(annotationDiv)
                
                annotationLabel.position.set(0, 0, 0)
                child.add(annotationLabel)
                meshList.push(child)
                aId += 1;
                if (child.name == "Pin_4_Solder001" || child.name == "Pin_5_Solder001"){
                    child.material = material4;
                } else {
                    child.material = material1;
                }
            }
        }
    })
    arduino.add(gltf.scene);
    arduino.position.set(-125,0,60);
    scene.add(arduino);
}, undefined, function (error) {
    console.error(error);
} );

// on hover over mesh (or mobile touch), show annotation label 
const raycaster = new THREE.Raycaster()

function clearLabels(){
    Object.keys(annotations).forEach((annotation) => {
        ;(
            annotations[annotation]
                .descriptionDomElement
        ).style.display = 'none';
    });
}

renderer.domElement.addEventListener('mousemove', (e) => onHover(e, false));
renderer.domElement.addEventListener('touchstart', (e) => onHover(e, true));
function onHover(e, touch) {
    if (touch){
        e.clientX = e.touches[0].pageX;
        e.clientY = e.touches[0].pageY;
    }
    raycaster.setFromCamera(
        {
            x: (e.clientX / renderer.domElement.clientWidth) * 2 - 1,
            y: -(e.clientY / renderer.domElement.clientHeight) * 2 + 1,
        },
        camera
    );
    const intersects = raycaster.intersectObjects(meshList);
    if (intersects.length > 0) {
            Object.keys(annotations).forEach((annotation) => {
                if (annotations[annotation].uuid !== intersects[0].object.uuid) {
                    ;(
                        annotations[annotation]
                            .descriptionDomElement
                    ).style.display = 'none';
                } else {
                    ;(
                        annotations[annotation]
                            .descriptionDomElement
                    ).style.display = 'block';
                    annotations[annotation].descriptionDomElement.parentElement.focus();
                }
            });
    }
    else {
        clearLabels();
    }   
};

fullscreenbtn.addEventListener('mouseenter', function() {
    fullscreenbtn.focus();
});
fullscreenbtn.addEventListener('mouseleave', function() {
    fullscreenbtn.blur();
});

// on window resize, update aspect ratio
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

// on keydown
document.addEventListener('keydown', onKeyDown);
function onKeyDown(e) {
    // tab through solder joints
    if (e.keyCode == 9) { 
        if (document.activeElement.id == "fullscreen"){
            var tabCount = 1
        } else {
            var tabCount = Object.keys(annotations).filter(function(key) {
                return annotations[key].descriptionDomElement == document.activeElement.firstChild;
            })
            tabCount = parseInt(tabCount[0])+2
        }
        clearLabels();
        if (15 > tabCount > 0){
            ;(
                annotations[tabCount-1]
                    .descriptionDomElement
            ).style.display = 'block';
        }  
    }
    // zoom in      
    if (e.keyCode == 187){
        camera.position.y *= 0.8
        camera.position.z *= 0.8
    }
    // zoom out
    if (e.keyCode == 189){
        camera.position.y *= 1.2
        camera.position.z *= 1.2
    }
}

// animate
function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    spotLight.position.set(
        camera.position.x + 0,
        camera.position.y + 50,
        camera.position.z + 0,
    );
    labelRenderer.render(scene, camera);
};
animate();