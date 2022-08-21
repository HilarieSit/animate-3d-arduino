import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js';
import {
    CSS2DRenderer,
    CSS2DObject,
} from 'https://unpkg.com/three@0.127.0/examples/jsm/renderers/CSS2DRenderer'

// create scene
const scene = new THREE.Scene();

// create webGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = false
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

// add camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0,20,10)
scene.add(camera);

// add light
var spotLight = new THREE.SpotLight('white', 4);
spotLight.castShadow = true;
scene.add(spotLight);

// add orbit control 
const controls = new OrbitControls( camera, renderer.domElement );
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.5;
controls.minDistance = 7;
controls.maxDistance = 15;

// add annotation labels 
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

let arduino = new THREE.Object3D();
const loader = new GLTFLoader();
var aId = 0
let meshList = []
let annotations = {}
loader.load('https://dreamworthie.s3.us-east-2.amazonaws.com/arduino.glb', function (gltf) {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            const obj = (child).clone()
            // console.log(obj.uuid)
            if ((child.name !== "2590_Metro_Mini_Rev_B") && (child.name !== "Scene")){
                annotations[aId] = {
                    uuid: obj.uuid
                }
                const annotationDiv = document.createElement('div')
                annotationDiv.className = 'annotationLabelClass'
                const annotationTextDiv = document.createElement('div')
                annotationTextDiv.className = 'annotationDescriptionClass'
                annotationTextDiv.innerHTML = obj.name
                annotationDiv.appendChild(annotationTextDiv)
                annotations[aId].descriptionDomElement = annotationTextDiv
                const annotationLabel = new CSS2DObject(annotationDiv)
                
                annotationLabel.position.set(0, 0, 0)
                obj.add(annotationLabel)
                meshList.push(obj)
                aId += 1;
                obj.material = metalmaterial
            }
            arduino.add(obj);
        }
    })
    arduino.position.y = -7;
    scene.add(arduino);

}, undefined, function ( error ) {
    console.error( error );
} );


// on hover over mesh, show annotation label 
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2();

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
    console.log('hi')
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

