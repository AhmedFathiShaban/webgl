/// <reference path="js/babylon.max.js" />
/// <reference path="js/cannon.max.js" />

document.addEventListener("DOMContentLoaded", startGame, false);

var canvas;
var engine;
var scene;
var tank;
var dudes = [];
var assetsManager;
var gunshotSound;
var cannonSound;
var laserSound;
var delayRayShot = false;
var particleSystem;
var decalMaterial;
var followCamera;
var isHeroAnimationPlaying = false;
var isWPressed = false;
var isSPressed = false;
var isDPressed = false;
var isAPressed = false;

var animationStopOk = false;

const NEG_Z_VECTOR = new BABYLON.Vector3(0, -1, -1);
function startGame() {
    canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);

     assetsManager = new BABYLON.AssetsManager(scene);

    //  scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -10, 0);
  
    engine.isPointerLock = true;

    var skybox = BABYLON.Mesh.CreateBox("skyBox", 10000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;

    var skyBoxTextureTask = assetsManager.addCubeTextureTask("skybox texture task", "textures/sky/sky");
    skyBoxTextureTask.onSuccess = function (task) {
        skyboxMaterial.reflectionTexture = task.texture;
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    }




   var freeCamera = createFreeCamera();
    freeCamera.attachControl(canvas);

     var impact = BABYLON.Mesh.CreateBox("box", .01, scene);
    
     freeCamera.minZ = .1;
     impact.parent = freeCamera;
    
     impact.position.z += .2;
    impact.isPickable = false;
    impact.material = new BABYLON.StandardMaterial("target", scene);
    impact.material.diffuseTexture = new BABYLON.Texture("textures/gunaims.png", scene);
    impact.material.diffuseTexture.hasAlpha = true;


   scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());
   scene.gravity = new BABYLON.Vector3(0, -10, 0);
     //scene.getPhysicsEngine().setTimeStep(1 / 200)
    var ground = createConfiguredGround();
    loadDudes(20);

    var binaryTask = assetsManager.addBinaryFileTask("gunshot task", "sounds/shot.wav");
    binaryTask.onSuccess = function (task) {
        gunshotSound = new BABYLON.Sound("gunshot", task.data, scene, null, { loop: false });
    }

    binaryTask = assetsManager.addBinaryFileTask("cannon task", "sounds/cannon.wav");
    binaryTask.onSuccess = function (task) {
        cannonSound = new BABYLON.Sound("cannon", task.data, scene, null, { loop: false });
    }

    binaryTask = assetsManager.addBinaryFileTask("laser task", "sounds/laser.wav");
    binaryTask.onSuccess = function (task) {
        laserSound = new BABYLON.Sound("laser", task.data, scene, null, { loop: false });
    }


    // Create a particle system
     particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", scene);

    // Where the particles come from

    //particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, 0); // Starting all from
    //particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 0); // To...

    // Colors of all particles
    particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

    // Size of each particle (random between...
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.1;
    particleSystem.maxLifeTime = 0.3;

    // Emission rate
    particleSystem.emitRate = 1500;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = new BABYLON.Vector3(0, -4, 0);
    particleSystem.direction2 = new BABYLON.Vector3(0, -4, 0);

    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI/2.0;

    // Speed
    particleSystem.minEmitPower = 4;
    particleSystem.maxEmitPower = 5;
    particleSystem.updateSpeed = 0.005;
   // particleSystem.manualEmitCount = 300;


    decalMaterial = new BABYLON.StandardMaterial("decalMat", scene);
    decalMaterial.diffuseColor = new BABYLON.Color3.Black();
    decalMaterial.zOffset = -2;


    assetsManager.load();
    var light1 = new BABYLON.HemisphericLight("l1",new BABYLON.Vector3(0, 5, 0), scene);
    tank = createHero();
     followCamera = createFollowCamera(tank);
  //  scene.activeCameras.push(followCamera);
 //  followCamera.attachControl(canvas);
  // followCamera.viewport = new BABYLON.Viewport(0,0,.5,1);
   

     assetsManager.onFinish = function (tasks) {

         setTimeout(function () { animationStopOk = true; }, 1000 );
    
             engine.runRenderLoop(function () {

                 applyTankMovements(tank);
                 applyHeroDudeMovements(dudes[0]);
                 dudes.forEach(function (dude, index) {

                     updateDudeOrientationsAndRotations(dude);
                 });

                 scene.render();
             });


    };


    //scene.onPointerDown = function (evt, pr) {

    //    var pickInfo = scene.pick(scene.pointerX, scene.pointerY);
    //    if (pickInfo.hit) {
    //        console.log(pickInfo.pickedMesh.name);
    //        var ray = new BABYLON.Ray(followCamera.position, pickInfo.pickedMesh.position , 1000);
    //        var rayHelper = new BABYLON.RayHelper(ray);
    //        rayHelper.show(scene);

    //        if(pickInfo.pickedMesh.name == "bounder")
    //        {
    //            pickInfo.pickedMesh.dude.dispose();
    //            pickInfo.pickedMesh.dispose();
    //        }
    //    }
    //};

    var isLocked = false;
    scene.onPointerDown = function (evt, pr) {


        if (!isLocked) {
            canvas.requestPointerLock = canvas.requestPointerLock ||
                canvas.msRequestPointerLock || canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
            return;
        }

        gunshotSound.play();

        var width =this.getEngine().getRenderWidth();
        var height = this.getEngine().getRenderHeight();
       
       
           
      
        var pickedInfos = scene.multiPick(width / 2, height / 2, function (mesh) {
            if (mesh.name.startsWith("clone_") /*|| mesh.name === "bounder"*/)
                return true;
            return false;
        });

        for (var i = 0 ; i < pickedInfos.length ; i++) {
            var hit = pickedInfos[i];
            if (hit.pickedMesh && hit.pickedMesh.name === "bounder") {
                console.log("hit turned to be bounder");
                hit.pickedMesh.dude.textPlane.dispose();
                hit.pickedMesh.dude.dispose();
                hit.pickedMesh.dispose();
                
                particleSystem.emitter = hit.pickedPoint; // the starting object, the emitter
                particleSystem.start();
                setTimeout(function () {
                    particleSystem.stop();
                }, 200);

            }

            else //  if (hit.pickedMesh && hit.pickedMesh.name.startsWith("clone_"))
            {
                console.log("hit turned to be clone_");
                console.log(hit.pickedMesh.name);
                particleSystem.emitter = hit.pickedPoint; // the starting object, the emitter
                particleSystem.start();
                setTimeout(function () {
                    particleSystem.stop();
                }, 200);
                if (hit.pickedMesh.parent && hit.pickedMesh.parent.health > 1) {
                    hit.pickedMesh.parent.health--;
                    updateTextTexture(hit.pickedMesh.parent);
                    return;
                }
                if (!hit.pickedMesh.parent) return; 
                hit.pickedMesh.parent.bounder.dispose();
                hit.pickedMesh.parent.textPlane.dispose();
                hit.pickedMesh.parent.dispose();
                hit.pickedMesh.dispose();
                

            }
        }


        
    };
    // Event listener when the pointerlock is updated (or removed by pressing ESC for example).
    var pointerlockchange = function () {
        var controlEnabled = document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement || document.pointerLockElement || null;

        // If the user is already locked
        if (!controlEnabled) {
            //camera.detachControl(canvas);
            isLocked = false;
        } else {
            //camera.attachControl(canvas);
            isLocked = true;
        }
    };

    // Attach events to the document
    document.addEventListener("pointerlockchange", pointerlockchange, false);
    document.addEventListener("mspointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);

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
        if (event.key == 'c' || event.key == 'C') {
            scene.activeCamera = freeCamera;
            freeCamera.attachControl(canvas);
            impact.visibility = true;
        }
        if (event.key == 'f' || event.key == 'F') {
            impact.visibility = false;
            scene.activeCamera = followCamera;
            followCamera.attachControl(canvas);
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
            cannonSound.play();
            var CannonBall = BABYLON.Mesh.CreateSphere("s", 30, 1, scene, false);
            CannonBall.position = tank.position.add(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(20, 0, 20)));
            CannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(CannonBall, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 0.1, friction: 0, restitution: .2 }, scene);
            CannonBall.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(400, 0, 400)));

            CannonBall.actionManager = new BABYLON.ActionManager(scene);
            dudes.forEach(function (dude)
            {
                CannonBall.actionManager.registerAction(new BABYLON.ExecuteCodeAction({ trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: { mesh: dude.bounder } }, function () {
                    
                    dude.bounder.dispose();
                    dude.textPlane.dispose();
                    dude.dispose();
                    
                    CannonBall.visibility = false;
                   
                }));

            });


            setTimeout(function () {
                CannonBall.dispose();
            }, 3000);

        }

        if (event.key == 'r' || event.key == 'R') {

            if (!delayRayShot) {

                delayRayShot = true;
                setTimeout(function () {
                    delayRayShot = false;
                },800)
                var origin = tank.position;

                var direction = new BABYLON.Vector3(tank.frontVector.x,.002, tank.frontVector.z);
                direction = BABYLON.Vector3.Normalize(direction);

                laserSound.play();
                var length = 1000;

                var ray = new BABYLON.Ray(origin, direction, length);

                var rayHelper = new BABYLON.RayHelper(ray);
                rayHelper.show(scene);
                setTimeout(function () {
                    rayHelper.hide();
                }, 500);

                var pickedInfos = scene.multiPickWithRay(ray, function (mesh) {
                    if (mesh.name.startsWith("clone_") || mesh.name === "bounder")
                        return true;
                    return false;
                });
 
                for (var i = 0 ; i < pickedInfos.length ; i++)
                {
                    var hit = pickedInfos[i];
                    if (hit.pickedMesh.name === "bounder") {
                        console.log("hit turned to be bounder");
                        if (hit.pickedMesh.dude.health > 1) {
                            hit.pickedMesh.dude.health--;
                            updateTextTexture(hit.pickedMesh.dude);
                            particleSystem.emitter = hit.pickedPoint; // the starting object, the emitter
                            particleSystem.start();
                            setTimeout(function () {
                                particleSystem.stop();
                            }, 200);


                            return;
                        }


                        hit.pickedMesh.dude.dispose();
                        hit.pickedMesh.dispose();
                    }

                    else // if (hit.pickedMesh.name.startsWith("clone_"))
                    {
                        console.log("hit turned to be clone_");
                        particleSystem.emitter = hit.pickedPoint; // the starting object, the emitter
                        particleSystem.start();
                        setTimeout(function () {
                            particleSystem.stop();
                        }, 200);
                        if (hit.pickedMesh.parent.health > 1) {
                            hit.pickedMesh.parent.health--;
                            updateTextTexture(hit.pickedMesh.parent);
                            return;
                        }
                        hit.pickedMesh.parent.bounder.dispose();
                        hit.pickedMesh.parent.textPlane.dispose();
                        hit.pickedMesh.parent.dispose();
                        

                    }
                }

              

            }
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
        50, 0, 10, scene, false, onGroundCreated);

    var groundMaterial = new BABYLON.StandardMaterial("m1", scene);
    groundMaterial.ambientColor = new BABYLON.Color3(1, 0, 0);
    groundMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
    groundMaterial.diffuseTexture = new BABYLON.Texture("images/checker_large.gif", scene);
    groundMaterial.diffuseTexture.uScale = 10;
    groundMaterial.diffuseTexture.vScale = 10;

    function onGroundCreated() {
        ground.material = groundMaterial;
        ground.checkCollisions = true;
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0, friction: 10, restitution: .2 }, scene);
        ground.isPickable = true;
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
    tank.isPickable = false;

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
  //  tank.onCollide = function(mesh){console.log("tank collided with " + mesh.name)}
    return tank;
}


function createFollowCamera(target) {
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

function createArcRotateCamera(target) {
  var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 20, target, scene);
  var animationRotateAlpha= new BABYLON.Animation("myAnimation", "alpha", 20, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

  var animationRotateBeta = new BABYLON.Animation("myAnimation", "beta", 10, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

  var animationElongateRadius = new BABYLON.Animation("myAnimation", "radius", 40, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

var alphaKeys = []; 
  alphaKeys.push({frame: 0,value: 0});
  alphaKeys.push({frame: 50,value: Math.PI});
  alphaKeys.push({frame: 100,value: 2*Math.PI});
  animationRotateAlpha.setKeys(alphaKeys);

  var betaKeys = []; 
  betaKeys.push({frame: 0,value: Math.PI/4});
  betaKeys.push({frame: 50,value: Math.PI/2});
  betaKeys.push({frame: 100,value: Math.PI/4});
  animationRotateBeta.setKeys(betaKeys);

  var radiusKeys = []; 
  radiusKeys.push({frame: 0,value: 20});
  radiusKeys.push({frame: 50,value: 50});
  radiusKeys.push({frame: 100,value: 20});
  animationElongateRadius.setKeys(radiusKeys);

  camera.animations = [];
  camera.animations.push(animationRotateAlpha);
  camera.animations.push(animationRotateBeta);
  camera.animations.push(animationElongateRadius);


//  scene.beginAnimation(camera, 0, 100, true);
 // console.log("heeere");

    return camera;
}



function applyTankMovements(tank) {

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

function applyHeroDudeMovements(heroDude) {

    if (heroDude.position.y > 1.1)
        heroDude.frontVector.y = -1;
    else if (heroDude.position.y < .6)
        heroDude.frontVector.y = +1;
    else
        heroDude.frontVector.y = 0;

    followCamera.lockedTarget = heroDude;

    if (isWPressed || isSPressed ) {
        if(!isHeroAnimationPlaying)
        {
            heroDude.animatableObject.restart();
            isHeroAnimationPlaying = true;
        }
    }
    else if(animationStopOk) {
        heroDude.animatableObject.pause();
        isHeroAnimationPlaying = false;

    }
    

    if (isWPressed) {
        heroDude.bounder.moveWithCollisions(heroDude.frontVector.normalize().multiplyByFloats(.2, 1, .2));
    }
    if (isSPressed) {
        var reverseVector = heroDude.frontVector.normalize().multiplyByFloats(-1, 1, -1).multiplyByFloats(.2, 1,.2);
        heroDude.bounder.moveWithCollisions(reverseVector);

    }
    if (isDPressed) {
        heroDude.rotation.y += .1 * tank.rotationSensitivity;
    }
    if (isAPressed)
        heroDude.rotation.y -= .1 * tank.rotationSensitivity;

    heroDude.frontVector.x = Math.sin(heroDude.rotation.y) * -1;
    heroDude.frontVector.z = Math.cos(heroDude.rotation.y) * -1;

}


function loadDudes(NumDudes)
{

    var dudeTask = assetsManager.addMeshTask("dude task", "", "scenes/", "Dude.babylon");

    dudeTask.onSuccess = function (task) {

        //_this.loadedMeshes = meshes;
        //_this.loadedParticleSystems = particleSystems;
        //_this.loadedSkeletons = skeletons;

        var newMeshes = task.loadedMeshes;
        var skeletons = task.loadedSkeletons;
        dudes[0] = newMeshes[0];
        dudes[0].health = 3;
        dudes[0].rotation.y += Math.PI;


        //   var followCamera2 = createArcRotateCamera(dudes[0]);
        //   scene.activeCameras.push(followCamera2);
        //// followCamera2.attachControl(canvas);
        //  followCamera2.viewport = new BABYLON.Viewport(.5,0,.5,1);


        var boundingBox = calculateBoundingBoxOfCompositeMeshes(newMeshes);
        dudes[0].bounder = boundingBox.boxMesh;
        dudes[0].bounder.dude = dudes[0];
        dudes[0].bounder.ellipsoidOffset.y += 2    ; // if I make this += 10 , no collision happens (better performance), but they merge
        // if I make it +=2 , they are visually good, but very bad performance (actually bad performance when I console.log in the onCollide)
        // if I make it += 1 , very very bad performance as it is constantly in collision with the ground

        dudes[0].position = dudes[0].bounder.position;

        dudes[0].bounder.onCollide = function (mesh) {
            //  console.log(mesh.name);
            if (mesh.name == "ground") {
                console.log("koko");
            }
        }

        dudes[0].scaling = new BABYLON.Vector3(0.05, 0.05, 0.05);
        //drawEllipsoid(tank);
        //drawEllipsoid(dudes[0].bounder);



        //  dudes[0].onCollide = function () { console.log('I am colliding with something') }

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
            dudes[id] = cloneModel(dudes[0], id);
            angle += 2 * Math.PI / NumDudes;
            //radius += 5;
            dudes[id].position = new BABYLON.Vector3(Math.sin(angle) * radius, dudes[0].position.y, -1 * Math.cos(angle) * radius);
            dudes[id].bounder.position = dudes[id].position;
            // dudes[id].bounder.position.y += 40;
            //   console.log(dudes[id].bounder)
        }

        dudes.forEach(function (dude)
        {
            addDynamicTextureToDude(dude);
        });
        console.log(dudes[0].name);
        dudes[0].name = "clone_original"
        for(var i = 0 ; i< dudes[0]._children.length ; i++)
        {
            dudes[0]._children[i].name = "clone_original. /" +i;
            console.log(dudes[0]._children[i].name);
        }


    }

    
}


function addDynamicTextureToDude(dude)
{
    var textPlaneTexture = new BABYLON.DynamicTexture("dynamic texture", 2048, scene, true);
    textPlaneTexture.drawText(dude.health, null, 1000, "bold 1000px verdana", "white", "transparent");
    textPlaneTexture.hasAlpha = true;

    dude.textPlane = BABYLON.Mesh.CreatePlane("textPlane", 1, scene, false);
    dude.textPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    dude.textPlane.material = new BABYLON.StandardMaterial("textPlane", scene);
    dude.textPlane.parent = dude;
    dude.textPlane.position.y += 80;
    dude.textPlane.material.diffuseTexture = textPlaneTexture;
    dude.textPlane.material.specularColor = new BABYLON.Color3(0, 0, 0);
    dude.textPlane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    dude.textPlane.material.backFaceCulling = false;
}

function updateTextTexture(dude)
{
    var context = dude.textPlane.material.diffuseTexture.getContext();
    context.save();
    var size = dude.textPlane.material.diffuseTexture.getSize();
    context.clearRect(0, 0, size.width, size.height);
    dude.textPlane.material.diffuseTexture.drawText(dude.health, null, 1000, "bold 1000px verdana", "white", "transparent");

}

function cloneModel(model,name) {
    var tempClone;
    tempClone = model.clone("clone_" + name);
    tempClone.bounder = model.bounder.clone("bounder");
    tempClone.bounder.dude = tempClone;

    tempClone.skeletons = [];
    for (var i = 0; i < model.skeletons.length; i += 1) {
        tempClone.skeletons[i] = model.skeletons[i].clone("skeleton clone #" + name +  i);
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

function updateDudeOrientationsAndRotations(dude) {
    if (dude.name == "clone_original") return;
    var requiredMovementDirection = tank.position.subtract(dude.position);

    dude.frontVector = requiredMovementDirection;
   // console.log(dude.position.y);
    if(dude.position.y > 1.1)
    	dude.frontVector.y = -1;
    else if(dude.position.y < .6)
    	dude.frontVector.y = +1;
    else
    	dude.frontVector.y = 0; 
    // if I make this negative weird rendereings 
    // happen and dudes appear and disappear randomly. most probably because the box I am enclosing the dudes 
    // into is penetrating the ground in a weird way. I have to fix this, shifting the box, w laken lays al2an.
    if (requiredMovementDirection.length() > 40) {
        dude.animatableObject.restart();
        dude.bounder.moveWithCollisions(dude.frontVector.normalize().multiplyByFloats(.2, 1, .2));
    }
    else
        dude.animatableObject.pause(); 
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
function calculateBoundingBoxOfCompositeMeshes(newMeshes) {
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

    var _boxMesh = BABYLON.Mesh.CreateBox("bounder", 1, scene);
    _boxMesh.scaling.x = _lengthX/35.0;
    _boxMesh.scaling.y = _lengthY /10.0;
    _boxMesh.scaling.z = _lengthZ / 10.0;
    _boxMesh.position.y += .05; // if I increase this, the dude gets higher in the skyyyyy
    _boxMesh.checkCollisions = true;
    _boxMesh.material = new BABYLON.StandardMaterial("alpha", scene);
    _boxMesh.material.alpha = .2;
    _boxMesh.isVisible = false;

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



