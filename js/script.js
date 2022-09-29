import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from 'https://unpkg.com/three@0.127.0/examples/jsm/renderers/CSS2DRenderer'

// create scene
const scene = new THREE.Scene();

const loadingManager = new THREE.LoadingManager();
// const progressBar = document.getElementById('progress-bar');

// loadingManager.onProgress = function(_, loaded, total) {
//     progressBar.value = (loaded / total) * 100;
// }

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
renderer.sortObjects = false
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000);
// document.body.appendChild(renderer.domElement);

// add camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0,250,-30)
scene.add(camera);

// add light
var spotLight = new THREE.SpotLight('white', 2);
spotLight.castShadow = true;
scene.add(spotLight);

// add orbit control 
const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.5;
controls.minDistance = 50;
controls.maxDistance = 300;
// controls.autoRotate = true;

// add annotation labels 
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
// labelRenderer.domElement.id = "fullcanvas"
fullcanvas.appendChild(labelRenderer.domElement)

let arduino = new THREE.Object3D();
const loader = new GLTFLoader(loadingManager);
var aId = 0
let meshList = []
let annotations = {}
var pins = {"Pin_0_Solder001": "0. Insufficient Wetting (board)",
    "Pin_2_Solder001": "1. Insufficient Wetting (pin)",
    "Pin_1_Solder001": "2. Solder Starved Joint (board+pin)",
    "Pin_3_Solder001": "3. Solder Starved Joint (pin)",
    "Pin_4_Solder001": "4. Cold Solder Joint",
    "Pin_5_Solder001": "5. Cold Solder Joint (crack)",
    "Pin_6_Solder001": "6. Excess Solder",
    "Pin_7_Solder001": "7. Excess Solder",
    "Pin_8_Solder001": "8+9. Solder Bridge (small)",
    "Pin_10_Solder001": "10+11. Solder Bridge (large)",
    "Pin_12_Solder001": "12. Splatters",
    "Pin_13_Solder001": "13. Overheated Joint",
}
const pin_keys = Object.keys(pins);
loader.load('https://dreamworthie.s3.us-east-2.amazonaws.com/MetroMini2.glb', function (gltf) {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            if (pin_keys.includes(child.name)){
                annotations[aId] = {
                    uuid: child.uuid
                }
                const annotationDiv = document.createElement('div')
                annotationDiv.className = 'annotationLabelClass'
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
            }
        }
    })
    // arduino.position.y = -7;
    arduino.add(gltf.scene)
    arduino.position.set(-125,0,50)
    scene.add(arduino)

}, undefined, function ( error ) {
    console.error( error );
} );

// on hover over mesh, show annotation label 
const raycaster = new THREE.Raycaster()

renderer.domElement.addEventListener('mousemove', onClick, false);
function onClick(event) {
    raycaster.setFromCamera(
        {
            x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
            y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
        },
        camera
    )
    const intersects = raycaster.intersectObjects(meshList)
    if (intersects.length > 0) {
            Object.keys(annotations).forEach((annotation) => {
                if (annotations[annotation].uuid !== intersects[0].object.uuid) {
                    ;(
                        annotations[annotation]
                            .descriptionDomElement
                    ).style.display = 'none'
                } else {
                    ;(
                        annotations[annotation]
                            .descriptionDomElement
                    ).style.display = 'block'
                }
            })
    } 
    else {
        Object.keys(annotations).forEach((annotation) => {
            ;(
                annotations[annotation]
                    .descriptionDomElement
            ).style.display = 'none'
        });
    }
    
}

// on window resize, update aspect ratio
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

// animate
function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    spotLight.position.set(
        camera.position.x + 10,
        camera.position.y + 10,
        camera.position.z + 10,
    )
    labelRenderer.render(scene, camera);
};
animate();

