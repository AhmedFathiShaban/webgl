/// <reference path="js/babylon.max.js" />
/// <reference path="js/cannon.max.js" />

document.addEventListener("DOMContentLoaded", startGame, false);

var canvas;
var engine;
var scene;
var tank;
var dudes = [];

var isWPressed = false;
var isSPressed = false;
var isDPressed = false;
var isAPressed = false;
const NEG_Z_VECTOR = new BABYLON.Vector3(0, 0, -1);
function startGame() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    //  scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -10, 0);
   
   

    engine.isPointerLock = true;

//    var freeCamera = createFreeCamera();
 //   freeCamera.attachControl(canvas);



    var ground = createConfiguredGround();
    loadDudes(10);

    var light1 = new BABYLON.HemisphericLight("l1",
        new BABYLON.Vector3(0, 5, 0), scene);
    tank = createHero();
    var followCamera = createFollowCamera();
    scene.activeCamera = followCamera;
   followCamera.attachControl(canvas);

    engine.runRenderLoop(function ()
    {
        scene.render();
        applyTankMovements();
        dudes.forEach(function (dude) {
            updateDudeOrientationsAndRotations(dude);
        });

    });

    document.addEventListener("keyup", function () {
        if (event.key == 'a' || event.key == 'A') {
            isAPressed = false;
        }
        if (event.key == 's' || event.key == 'S') {
            isSPressed = false;
        }
        if (event.key == 'd' || event.key == 'D') {
            isDPressed = false;
        }
        if (event.key == 'w' || event.key == 'W') {
            isWPressed = false;
        }


    });

    document.addEventListener("keydown", function () {

        if (event.key == 'a' || event.key == 'A') {
            isAPressed = true;
        }
        if (event.key == 's' || event.key == 'S') {
            isSPressed = true;
        }
        if (event.key == 'd' || event.key == 'D') {
            isDPressed = true;
        }
        if (event.key == 'w' || event.key == 'W') {
            isWPressed = true;
        }

    });
}


function createFreeCamera()
{
    var camera = new BABYLON.FreeCamera("c1",
        new BABYLON.Vector3(0, 5, 0), scene);
    camera.keysUp.push('w'.charCodeAt(0));
    camera.keysUp.push('W'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));
    camera.keysLeft.push('a'.charCodeAt(0));
    camera.keysLeft.push('A'.charCodeAt(0));
    camera.checkCollisions = true;
    return camera;
}

function createConfiguredGround()
{

    var ground = new BABYLON.Mesh.CreateGroundFromHeightMap
        ("ground", "images/height1.png", 1000, 1000,
        50, 0, 100, scene, false, onGroundCreated);

    var groundMaterial = new BABYLON.StandardMaterial("m1", scene);
    groundMaterial.ambientColor = new BABYLON.Color3(1, 0, 0);
    groundMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    groundMaterial.diffuseTexture = new BABYLON.Texture("images/checker_large.gif", scene);
    groundMaterial.diffuseTexture.uScale = 10;
    groundMaterial.diffuseTexture.vScale = 10;

    function onGroundCreated() {
        ground.material = groundMaterial;
        ground.checkCollisions = true;
    }

    return ground;
}


function createHero()
{
    var tank = new BABYLON.Mesh.CreateBox("tank",
        2, scene);
    var tankMaterial = new BABYLON.StandardMaterial("tankMat",
        scene);
    tankMaterial.diffuseColor = new BABYLON.Color3.Blue;
    tank.material = tankMaterial;

    tank.position.y += 1;
    tank.ellipsoid = new BABYLON.Vector3(0.5, 1.0, 0.5);
    tank.ellipsoidOffset = new BABYLON.Vector3(0, 2.0, 0);
    tank.scaling.y *= .5;
    tank.scaling.x = .5;
    tank.scaling.z = 1;
    
   // tank.material.wireframe = true;

    tank.rotationSensitivity = .1;
    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, -1);
    tank.checkCollisions = true;
    tank.applyGravity = true;
    return tank;
}


function createFollowCamera() {
    var camera = new BABYLON.FollowCamera("follow",
        new BABYLON.Vector3(0, 2, -20), scene);
   camera.lockedTarget = tank;
    camera.radius = 10; // how far from the object to follow
    camera.heightOffset = 2; // how high above the object to place the camera
    camera.rotationOffset = 0; // the viewing angle
    camera.cameraAcceleration = 0.05 // how fast to move
    camera.maxCameraSpeed = 20 // speed limit
    return camera;
}


function applyTankMovements()
{

    if (isWPressed) {
        tank.moveWithCollisions(tank.frontVector);
    }
    if (isSPressed) {
        var reverseVector = tank.frontVector.multiplyByFloats(-1,1,-1);
        tank.moveWithCollisions(reverseVector);
        
    }
    if (isDPressed) {
        tank.rotation.y += .1 * tank.rotationSensitivity;
    }
    if (isAPressed)
        tank.rotation.y -= .1 * tank.rotationSensitivity;

        tank.frontVector.x = Math.sin(tank.rotation.y)*-1;
        tank.frontVector.z = Math.cos(tank.rotation.y) * -1;
        tank.frontVector.y = -4; // adding a bit of gravity
}


function loadDudes(NumDudes)
{

    BABYLON.SceneLoader.ImportMesh("him", "scenes/", "Dude.babylon", scene, onDudeLoaded);
    function onDudeLoaded(newMeshes, particeSystems,skeletons)
    {
         dudes[0] = newMeshes[0];

         dudes[0].scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
         dudes[0].position.y = 3.392;
         dudes[0].checkCollisions = true;
         dudes[0].ellipsoid = new BABYLON.Vector3(1, 1, 1);
         dudes[0].ellipsoidOffset = new BABYLON.Vector3(0, 2, 0);

         dudes[0].applyGravity = true;
       //  dudes[0].onCollide = function () { console.log('I am colliding with something') }
        
        dudes[0].skeletons = [];
        for (var i = 0; i < skeletons.length; i += 1) {
            dudes[0].skeletons[i] = skeletons[i];
            scene.beginAnimation(dudes[0].skeletons[i], 0, 120, 1.0, true);
        }


        var angle = 0;
        var radius = 100;

        dudes[0].frontVector = new BABYLON.Vector3(0, -1, -1);
        dudes[0].position.z = -1 * radius;

        for (var j = 1 ; j < NumDudes ; j++) {
            var id = dudes.length;
            dudes[id] = cloneModel(dudes[0], "name#" + id);
            angle += 2 * Math.PI / NumDudes;
            dudes[id].position = new BABYLON.Vector3(Math.sin(angle) * radius, 3, -1 * Math.cos(angle) * radius);

        }
    }

    
}


function cloneModel(model,name) {
    var tempClone;
    tempClone = model.clone("clone_" + name);
    tempClone.skeletons = [];
    for (var i = 0; i < model.skeletons.length; i += 1) {
        tempClone.skeletons[i] = model.skeletons[i].clone("skeleton clone #" + name +  i);
        scene.beginAnimation(tempClone.skeletons[i],0, 120, 1.0, true);
    }
    if (model._children) {
        //model is a parent mesh with multiple _children.
        for (var i = 0; i < model._children.length; i += 1) {
            if (tempClone.skeletons.length > 1) //Mostlikely a seperate skeleton for each child mesh..
                tempClone._children[i].skeleton = tempClone.skeletons[i];
            else //Mostlikely a single skeleton for all child meshes.
                tempClone._children[i].skeleton = tempClone.skeletons[0];
        }
    } else {
        tempClone.skeleton = tempClone.skeletons[0];
    }
    return tempClone;

}

function updateDudeOrientationsAndRotations(dude) {
    var requiredMovementDirection = tank.position.subtract(dude.position);


    if (requiredMovementDirection.length() > 1)
        dude.moveWithCollisions(dude.frontVector.normalize().multiplyByFloats(.1, 1, .1)); // too too slow.
    //else
    //    scene.stopAnimation(dude.skeletons[0]);
    requiredMovementDirection = requiredMovementDirection.normalize();
    var cosAngle = BABYLON.Vector3.Dot(NEG_Z_VECTOR, requiredMovementDirection);
    var clockwise = BABYLON.Vector3.Cross(NEG_Z_VECTOR, requiredMovementDirection).y > 0;
    var LessThanPiAngle = Math.acos(cosAngle);


    dude.frontVector = requiredMovementDirection;
    dude.frontVector.y = -1;

    if (clockwise) {
        dude.rotation.y = LessThanPiAngle;
    }
    else {
        dude.rotation.y = 2 * Math.PI - LessThanPiAngle;
    }
}