﻿/// <reference path="js/babylon.max.js" />
/// <reference path="js/cannon.max.js" />

document.addEventListener("DOMContentLoaded", startGame, false);

var canvas;
var engine;

var Game = {};
 Game.scenes = [];
 Game.activeScene = 0;
 var isWPressed = false;
 var isSPressed = false;
 var isDPressed = false;
 var isAPressed = false;
 var isBPressed = false;
 var isRPressed = false;
 var isCPressedAndReleased = false;
 var isFPressedAndReleased = false;
 var isTPressedAndReleased = false;


 const NEG_Z_VECTOR = new BABYLON.Vector3(0, -1, -1);



Game.createFirstScene = function()
{
    
    var tank; 
    var dudes = [];
    var scene = new BABYLON.Scene(engine);

    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -10, 0);
    scene.enablePhysics(scene.gravity, new BABYLON.CannonJSPlugin());

    var freeCamera = createFreeCamera(scene);
    scene.activeCamera = freeCamera;
    //   freeCamera.attachControl(canvas);

    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());
    scene.gravity = new BABYLON.Vector3(0, -10, 0);

    var ground = createConfiguredGround("images/height1.png","images/checker_large.gif",new BABYLON.Color3.Red,scene);
    loadDudes(20,dudes,scene);
    var light1 = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 5, 0), scene);
    tank = createHero(new BABYLON.Color3.Blue,scene);
    var followCamera = createFollowCamera(tank,scene);
   // scene.activeCameras.push(followCamera);
    // followCamera.attachControl(canvas);
  //  followCamera.viewport = new BABYLON.Viewport(0, 0, .5, 1);
    var portal = new BABYLON.Mesh.CreateCylinder("portal",10, 10, 10, 50, 50, scene);
    portal.position = new BABYLON.Vector3(20, 5, -100);
    portal.material = new BABYLON.StandardMaterial("portalMaterial", scene);
    portal.material.alpha = .8;
    portal.material.diffuseTexture = new BABYLON.Texture("images/lightning.jpg", scene);
    portal.material.diffuseTexture.uScale = 3;




    var sceneIndex = Game.scenes.push(scene) - 1;

    Game.scenes[sceneIndex].manageCameras = function()
    {
        console.log("managingCameras");
        if(isCPressedAndReleased)
        {
            isCPressedAndReleased = false;
            this.activeCamera = freeCamera;
            freeCamera.attachControl(canvas);
        }
        if(isFPressedAndReleased)
        {
            isFPressedAndReleased = false;
            this.activeCamera = followCamera;
            followCamera.lockedTarget = dudes[0];
            
        }

        if (isTPressedAndReleased) {
            isTPressedAndReleased = false;
            this.activeCamera = followCamera;
            followCamera.lockedTarget = tank;

        }
    }


    Game.scenes[sceneIndex].updateDudeOrientationsAndRotations = function (dude, target) {

        if (dude == dudes[0]) return;
        var requiredMovementDirection = target.position.subtract(dude.position);

        dude.frontVector = requiredMovementDirection;
        // console.log(dude.position.y);
        if (dude.position.y > 1.1)
            dude.frontVector.y = -1;
        else if (dude.position.y < .6)
            dude.frontVector.y = +1;
        else
            dude.frontVector.y = 0;
        // if I make this negative weird rendereings 
        // happen and dudes appear and disappear randomly. most probably because the box I am enclosing the dudes 
        // into is penetrating the ground in a weird way. I have to fix this, shifting the box, w laken lays al2an.
        if (requiredMovementDirection.length() > 40) {
            dude.animatableObject.restart();
            dude.bounder.moveWithCollisions(dude.frontVector.normalize().multiplyByFloats(.5, 1, .5));
        }
        else
        {
            dude.animatableObject.pause();
        }
        //    scene.stopAnimation(dude.skeletons[0]);
        requiredMovementDirection = requiredMovementDirection.normalize();
        var cosAngle = BABYLON.Vector3.Dot(NEG_Z_VECTOR, requiredMovementDirection);
        var clockwise = BABYLON.Vector3.Cross(NEG_Z_VECTOR, requiredMovementDirection).y > 0;
        var LessThanPiAngle = Math.acos(cosAngle);

        if (clockwise) {
            dude.rotation.y = LessThanPiAngle;
        }
        else {
            dude.rotation.y = 2 * Math.PI - LessThanPiAngle;
        }
    }

    Game.scenes[sceneIndex].applyHeroDudeMovements = function (heroDude)
    {
        if (this.activeCamera == followCamera && followCamera.lockedTarget == heroDude) {

            if (heroDude.position.y > 1.1)
                heroDude.frontVector.y = -.1;
            else if (heroDude.position.y < .6)
                heroDude.frontVector.y = +.1;
            else
                heroDude.frontVector.y = 0;

            if (isWPressed || isSPressed)
            {
                heroDude.animatableObject.restart();
            }
            else
            {
                heroDude.animatableObject.pause();
            }

            if (isWPressed) {
                heroDude.bounder.moveWithCollisions(heroDude.frontVector.multiplyByFloats(heroDude.speed, 1, heroDude.speed));
            }
            if (isSPressed) {
                var reverseVector = heroDude.frontVector.multiplyByFloats(-1, 1, -1).multiplyByFloats(heroDude.speed, 1, heroDude.speed);
                heroDude.moveWithCollisions(reverseVector);

            }
            if (isDPressed) {
                heroDude.rotation.y += .1;
            }
            if (isAPressed)
                heroDude.rotation.y -= .1;

            heroDude.frontVector.x = Math.sin(heroDude.rotation.y) * -1;
            heroDude.frontVector.z = Math.cos(heroDude.rotation.y) * -1;
        }
    }

    Game.scenes[sceneIndex].applyTankMovements = function (tank) {

        if (this.activeCamera == followCamera && followCamera.lockedTarget == tank) {

            if (isWPressed) {
                tank.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
            }
            if (isSPressed) {
                var reverseVector = tank.frontVector.multiplyByFloats(-1, 1, -1).multiplyByFloats(tank.speed, tank.speed, tank.speed);
                tank.moveWithCollisions(reverseVector);

            }
            if (isDPressed) {
                tank.rotation.y += .1 * tank.rotationSensitivity;
            }
            if (isAPressed)
                tank.rotation.y -= .1 * tank.rotationSensitivity;

            tank.frontVector.x = Math.sin(tank.rotation.y) * -1;
            tank.frontVector.z = Math.cos(tank.rotation.y) * -1;
            tank.frontVector.y = -4; // adding a bit of gravity
        }
    }

    Game.scenes[sceneIndex].checkEmitCannonBallsFromTank = function(tank, scene) {
        if (isBPressed) {
            var CannonBall = BABYLON.Mesh.CreateSphere("s", 30, 1, scene, false);
            CannonBall.position = tank.position.add(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(15, 0, 15)));
            CannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(CannonBall, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 5, friction: 10, restitution: .2 }, scene);
            CannonBall.physicsImpostor.
                setLinearVelocity(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(1000, 0, 1000)));
        
            CannonBall.actionManager =
                new BABYLON.ActionManager(scene);

            dudes.forEach(function (dude)

            {
                CannonBall.actionManager.registerAction
                (new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                    parameter: dude.bounder
                }, function () {

                dude.bounder.dispose();
                dude.dispose();

    }));

            }

            );


            setTimeout(function () {
                CannonBall.dispose();
            }, 3000);
        }
    }

    Game.scenes[sceneIndex].checkEmitRaysFromTank =
        function (tank, scene)
        {
            if(isRPressed)
            {
                console.log("here");    
                var origin = tank.position;
                var direction = tank.frontVector;
                direction.y = 0;

                var ray = new BABYLON.Ray(origin, direction, 1000);

                
                var rayHelper = new BABYLON.RayHelper(ray);
                rayHelper.show(scene);

                var pickResult = scene.pickWithRay(ray);

                if(pickResult.pickedMesh)
                {
                    console.log(pickResult.pickedMesh.name);
                    if(pickResult.pickedMesh.name == "dudebox")
                    {
                        pickResult.pickedMesh.dispose();
                        pickResult.pickedMesh.dude.dispose();
                    }
                }

            }
    }
    Game.scenes[sceneIndex].checkMoveToNextLevel = function (tank, portal) {
        if (
            tank.position.x > portal.position.x - 3 &&
            tank.position.x < portal.position.x + 3 &&
            tank.position.z > portal.position.z - 3 &&
            tank.position.z < portal.position.z + 3
            )
            Game.activeScene = 1;

    }

    Game.scenes[sceneIndex].renderLoop = function () {
        this.applyTankMovements(tank);
        this.applyHeroDudeMovements(dudes[0]);
        this.checkMoveToNextLevel(tank, portal);
        this.checkEmitCannonBallsFromTank(tank, scene);
        this.checkEmitRaysFromTank(tank, scene);
        dudes.forEach(function (dude, index) {
            Game.scenes[sceneIndex].updateDudeOrientationsAndRotations(dude, tank);
        });
        this.render();
    }

    return scene;

}


Game.createSecondScene = function () {
    var tank;
    var dudes = [];
    var scene = new BABYLON.Scene(engine);

    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -10, 0);

    var freeCamera = createFreeCamera(scene);
    //   freeCamera.attachControl(canvas);

    scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());
    scene.gravity = new BABYLON.Vector3(0, -10, 0);

    var ground = createConfiguredGround("images/height1.png", "images/webgl-logo-256.jpg", new BABYLON.Color3.Blue, scene);
    loadDudes(20, dudes, scene);

    var light1 = new BABYLON.HemisphericLight("l1", new BABYLON.Vector3(0, 5, 0), scene);
    tank = createHero(new BABYLON.Color3.Red, scene);
    var followCamera = createFollowCamera(tank, scene);
    scene.activeCameras.push(followCamera);
    followCamera.attachControl(canvas);
    followCamera.viewport = new BABYLON.Viewport(0, 0, .5, 1);
    var sceneIndex = Game.scenes.push(scene) - 1;

    Game.scenes[sceneIndex].manageCameras = function () {
        console.log("managingCameras");
        if (isCPressedAndReleased) {
            isCPressedAndReleased = false;
        }
        if (isFPressedAndReleased) {
            isFPressedAndReleased = false;
        }
    }


    Game.scenes[sceneIndex].updateDudeOrientationsAndRotations = function (dude, target) {

        var requiredMovementDirection = target.position.subtract(dude.position);

        dude.frontVector = requiredMovementDirection;
        // console.log(dude.position.y);
        if (dude.position.y > 1.1)
            dude.frontVector.y = -1;
        else if (dude.position.y < .6)
            dude.frontVector.y = +1;
        else
            dude.frontVector.y = 0;
        // if I make this negative weird rendereings 
        // happen and dudes appear and disappear randomly. most probably because the box I am enclosing the dudes 
        // into is penetrating the ground in a weird way. I have to fix this, shifting the box, w laken lays al2an.
        if (requiredMovementDirection.length() > 40)
            dude.bounder.moveWithCollisions(dude.frontVector.normalize().multiplyByFloats(.5, 1, .5));
        //else
        //    scene.stopAnimation(dude.skeletons[0]);
        requiredMovementDirection = requiredMovementDirection.normalize();
        var cosAngle = BABYLON.Vector3.Dot(NEG_Z_VECTOR, requiredMovementDirection);
        var clockwise = BABYLON.Vector3.Cross(NEG_Z_VECTOR, requiredMovementDirection).y > 0;
        var LessThanPiAngle = Math.acos(cosAngle);

        if (clockwise) {
            dude.rotation.y = LessThanPiAngle;
        }
        else {
            dude.rotation.y = 2 * Math.PI - LessThanPiAngle;
        }
    }


    Game.scenes[sceneIndex].applyTankMovements = function (tank) {

        if (isWPressed) {
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
        }
        if (isSPressed) {
            var reverseVector = tank.frontVector.multiplyByFloats(-1, 1, -1).multiplyByFloats(tank.speed, tank.speed, tank.speed);
            tank.moveWithCollisions(reverseVector);

        }
        if (isDPressed) {
            tank.rotation.y += .1 * tank.rotationSensitivity;
        }
        if (isAPressed)
            tank.rotation.y -= .1 * tank.rotationSensitivity;

        tank.frontVector.x = Math.sin(tank.rotation.y) * -1;
        tank.frontVector.z = Math.cos(tank.rotation.y) * -1;
        tank.frontVector.y = -4; // adding a bit of gravity

    }

    Game.scenes[sceneIndex].checkEmitCannonBallsFromTank = function (tank, scene) {
        if (isBPressed) {
            var CannonBall = BABYLON.Mesh.CreateSphere("s", 30, 1, scene, false);
            CannonBall.position = tank.position.add(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(15, 0, 15)));
            CannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(CannonBall, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 5, friction: 10, restitution: .2 }, scene);
            CannonBall.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(1000, 0, 1000)));

            setTimeout(function () {
                CannonBall.dispose();
            }, 3000);
        }
    }

    Game.scenes[sceneIndex].moveToNextLevel = function (tank) {

    }

    Game.scenes[sceneIndex].renderLoop = function () {
        this.applyTankMovements(tank);
        this.checkEmitCannonBallsFromTank(tank, scene);
        dudes.forEach(function (dude, index) {
            Game.scenes[sceneIndex].updateDudeOrientationsAndRotations(dude, tank);
        });
        this.render();
    }

    return scene;

}


function startGame() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    engine.isPointerLock = true;
    engine.displayLoadingUI();
    Game.createFirstScene();
    Game.createSecondScene();


    engine.runRenderLoop(function () {
        if (Game.scenes[0].isLoaded) {
            engine.hideLoadingUI();
        }
        else return;


        Game.scenes[Game.activeScene].renderLoop();
    });

}




//Possibly shared functions to multiple scenes

function createFreeCamera(scene) {
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

function createConfiguredGround(heightMapPath, diffuseMapPath, diffuseColor, scene) {

    var ground = new BABYLON.Mesh.CreateGroundFromHeightMap
        ("ground", heightMapPath, 1000, 1000,
        50, 0, 100, scene, false, onGroundCreated);

    var groundMaterial = new BABYLON.StandardMaterial("m1", scene);
    groundMaterial.ambientColor = new BABYLON.Color3(1, 0, 0);
    groundMaterial.diffuseColor = diffuseColor;
    groundMaterial.diffuseTexture = new BABYLON.Texture(diffuseMapPath, scene);
    groundMaterial.diffuseTexture.uScale = 10;
    groundMaterial.diffuseTexture.vScale = 10;

    function onGroundCreated() {
        ground.material = groundMaterial;
        ground.checkCollisions = true;
        ground.physicsImpostor =
            new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor,
            { mass: 0, friction: 10, restitution: .2 }, scene);
        ground.isPickable = false;
    }

    return ground;
}


function createHero(color, scene) {
    var tank = new BABYLON.Mesh.CreateBox("tank",
        2, scene);
    var tankMaterial = new BABYLON.StandardMaterial("tankMat",
        scene);
    tankMaterial.diffuseColor = color;
    tank.material = tankMaterial;

    tank.position.y += 1;
    tank.ellipsoid = new BABYLON.Vector3(1, 2.0, 1);
    tank.ellipsoidOffset = new BABYLON.Vector3(0, 3.0, 0);
    tank.scaling.y *= .5;
    tank.scaling.x = .5;
    tank.scaling.z = 1;

    // tank.material.wireframe = true;

    tank.rotationSensitivity = .3;
    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, -1);
    tank.checkCollisions = true;
    tank.applyGravity = true;
    tank.isPickable = false;
    return tank;
}


function createFollowCamera(target, scene) {
    var camera = new BABYLON.FollowCamera("follow",
        new BABYLON.Vector3(0, 2, -20), scene);
    camera.lockedTarget = target;
    camera.radius = 10; // how far from the object to follow
    camera.heightOffset = 2; // how high above the object to place the camera
    camera.rotationOffset = 0; // the viewing angle
    camera.cameraAcceleration = 0.05 // how fast to move
    camera.maxCameraSpeed = 20 // speed limit
    return camera;
}

function createArcRotateCamera(target, scene) {
    var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 20, target, scene);
    var animationRotateAlpha = new BABYLON.Animation("myAnimation", "alpha", 20, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var animationRotateBeta = new BABYLON.Animation("myAnimation", "beta", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var animationElongateRadius = new BABYLON.Animation("myAnimation", "radius", 40, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var alphaKeys = [];
    alphaKeys.push({ frame: 0, value: 0 });
    alphaKeys.push({ frame: 50, value: Math.PI });
    alphaKeys.push({ frame: 100, value: 2 * Math.PI });
    animationRotateAlpha.setKeys(alphaKeys);

    var betaKeys = [];
    betaKeys.push({ frame: 0, value: Math.PI / 4 });
    betaKeys.push({ frame: 50, value: Math.PI / 2 });
    betaKeys.push({ frame: 100, value: Math.PI / 4 });
    animationRotateBeta.setKeys(betaKeys);

    var radiusKeys = [];
    radiusKeys.push({ frame: 0, value: 20 });
    radiusKeys.push({ frame: 50, value: 50 });
    radiusKeys.push({ frame: 100, value: 20 });
    animationElongateRadius.setKeys(radiusKeys);

    camera.animations = [];
    camera.animations.push(animationRotateAlpha);
    camera.animations.push(animationRotateBeta);
    camera.animations.push(animationElongateRadius);

    scene.beginAnimation(camera, 0, 100, true);
    // console.log("heeere");

    return camera;
}



function loadDudes(NumDudes,dudes,scene) {

    BABYLON.SceneLoader.ImportMesh("him", "scenes/", "Dude.babylon", scene, onDudeLoaded);
    function onDudeLoaded(newMeshes, particeSystems, skeletons) {
        dudes[0] = newMeshes[0];

        //var followCamera2 = createArcRotateCamera(dudes[0], scene);
        //scene.activeCameras.push(followCamera2);
        //// followCamera2.attachControl(canvas);
        //followCamera2.viewport = new BABYLON.Viewport(.5, 0, .5, 1);

        var boundingBox = calculateAndMakeBoundingBoxOfCompositeMeshes(newMeshes, scene);
        dudes[0].bounder = boundingBox.boxMesh;
        dudes[0].bounder.dude = dudes[0];
        dudes[0].bounder.ellipsoidOffset.y += 3; // if I make this += 10 , no collision happens (better performance), but they merge
        // if I make it +=2 , they are visually good, but very bad performance (actually bad performance when I console.log in the onCollide)
        // if I make it += 1 , very very bad performance as it is constantly in collision with the ground

        dudes[0].position = dudes[0].bounder.position;
        dudes[0].speed = 1;
        dudes[0].bounder.onCollide = function (mesh) {
            //  console.log(mesh.name);
            if (mesh.name == "ground") {
                console.log("koko");
            }
        }
        dudes[0].scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
        //drawEllipsoid(dudes[0].bounder);
        dudes[0].skeletons = [];
        for (var i = 0; i < skeletons.length; i += 1) {
            dudes[0].skeletons[i] = skeletons[i];
            dudes[0].animatableObject = scene.beginAnimation(dudes[0].skeletons[i], 0, 120, 1.0, true);
        }

        
        var angle = 0;
        var radius = 100;

        dudes[0].frontVector = new BABYLON.Vector3(0, -1, -1);
        dudes[0].position.z = -1 * radius;

        for (var j = 1 ; j < NumDudes ; j++) {
            var id = dudes.length;
            dudes[id] = cloneModel(dudes[0], "name#" + id , scene);
            angle += 2 * Math.PI / NumDudes;
            //radius += 5;
            dudes[id].position = new BABYLON.Vector3(Math.sin(angle) * radius, dudes[0].position.y, -1 * Math.cos(angle) * radius);
            dudes[id].bounder.position = dudes[id].position;
            // dudes[id].bounder.position.y += 40;
            //   console.log(dudes[id].bounder)
        }

        scene.isLoaded = true;
    }


}


function cloneModel(model, name, scene) {
    var tempClone;
    tempClone = model.clone("clone_" + name);
    tempClone.bounder = model.bounder.clone("dudebox");
    tempClone.bounder.dude = tempClone;
    tempClone.skeletons = [];
    for (var i = 0; i < model.skeletons.length; i += 1) {
        tempClone.skeletons[i] = model.skeletons[i].clone("skeleton clone #" + name + i);
        tempClone.animatableObject = scene.beginAnimation(tempClone.skeletons[i], 0, 120, 1.0, true);
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


function calculateAndMakeBoundingBoxOfCompositeMeshes(newMeshes, scene) {
    var minx = 10000; var miny = 10000; var minz = 10000; var maxx = -10000; var maxy = -10000; var maxz = -10000;

    for (var i = 0 ; i < newMeshes.length ; i++) {

        var positions = new BABYLON.VertexData.ExtractFromGeometry(newMeshes[i]).positions;
        // newMeshes[i].checkCollisions = true;
        if (!positions) continue;
        var index = 0;

        for (var j = index ; j < positions.length ; j += 3) {
            if (positions[j] < minx)
                minx = positions[j];
            if (positions[j] > maxx)
                maxx = positions[j];
        }
        index = 1;

        for (var j = index ; j < positions.length ; j += 3) {
            if (positions[j] < miny)
                miny = positions[j];
            if (positions[j] > maxy)
                maxy = positions[j];
        }
        index = 2;
        for (var j = index ; j < positions.length ; j += 3) {
            if (positions[j] < minz)
                minz = positions[j];
            if (positions[j] > maxz)
                maxz = positions[j];
        }

    }

    var _lengthX = (minx * maxx > 1) ? Math.abs(maxx - minx) : Math.abs(minx * -1 + maxx);
    var _lengthY = (miny * maxy > 1) ? Math.abs(maxy - miny) : Math.abs(miny * -1 + maxy);
    var _lengthZ = (minz * maxz > 1) ? Math.abs(maxz - minz) : Math.abs(minz * -1 + maxz);
    var _center = new BABYLON.Vector3((minx + maxx) / 2.0, (miny + maxy) / 2.0, (minz + maxz) / 2.0);

    var _boxMesh = BABYLON.Mesh.CreateBox("dudebox", 1, scene);
    _boxMesh.scaling.x = _lengthX / 30.0;
    _boxMesh.scaling.y = _lengthY / 5.0;
    _boxMesh.scaling.z = _lengthZ / 10.0;
    _boxMesh.position.y += .5; // if I increase this, the dude gets higher in the skyyyyy
    _boxMesh.checkCollisions = true;
    _boxMesh.material = new BABYLON.StandardMaterial("alpha", scene);
    _boxMesh.material.alpha = .4;
    _boxMesh.isVisible = true;

    return { min: { x: minx, y: miny, z: minz }, max: { x: maxx, y: maxy, z: maxz }, lengthX: _lengthX, lengthY: _lengthY, lengthZ: _lengthZ, center: _center, boxMesh: _boxMesh };

}

function drawEllipsoid(mesh) {
    mesh.computeWorldMatrix(true);
    var ellipsoidMat = mesh.getScene().getMaterialByName("__ellipsoidMat__");
    if (!ellipsoidMat) {
        ellipsoidMat = new BABYLON.StandardMaterial("__ellipsoidMat__", mesh.getScene());
        ellipsoidMat.wireframe = true;
        ellipsoidMat.emissiveColor = BABYLON.Color3.Green();
        ellipsoidMat.specularColor = BABYLON.Color3.Black();
    }
    var ellipsoid = BABYLON.Mesh.CreateSphere("__ellipsoid__", 9, 1, mesh.getScene());
    ellipsoid.scaling = mesh.ellipsoid.clone();
    ellipsoid.scaling.y *= 2;
    ellipsoid.scaling.x *= 2;
    ellipsoid.scaling.z *= 2;
    ellipsoid.material = ellipsoidMat;
    ellipsoid.parent = mesh;
    ellipsoid.computeWorldMatrix(true);
}


// Listeners

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
    if (event.key == 'b' || event.key == 'B') {
        isBPressed = false;
    }
    if (event.key == 'r' || event.key == 'R') {
        isRPressed = false;
    }

    if (event.key == 'c' || event.key == 'C') {
        isCPressedAndReleased = true;
        if (Game.scenes[Game.activeScene] && Game.scenes[Game.activeScene].manageCameras)
            Game.scenes[Game.activeScene].manageCameras();
    }
    if (event.key == 'f' || event.key == 'F') {
        isFPressedAndReleased = true;
        if (Game.scenes[Game.activeScene] && Game.scenes[Game.activeScene].manageCameras)
            Game.scenes[Game.activeScene].manageCameras();
    }
    if (event.key == 't' || event.key == 'T') {
        isTPressedAndReleased = true;
        if (Game.scenes[Game.activeScene] && Game.scenes[Game.activeScene].manageCameras)
            Game.scenes[Game.activeScene].manageCameras();
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
    if (event.key == 'b' || event.key == 'B') {
        isBPressed = true;
    }
    if (event.key == 'r' || event.key == 'R') {
        isRPressed = true;
    }

});