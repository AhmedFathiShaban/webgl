//
// <reference path="libs/jquery-1.9.1/jquery-1.9.1.j" />
// <reference path="libs/three.js.r58/three.js" />
// <reference path="libs/three.js.r58/controls/OrbitControls.js" />
// <reference path="libs/three.js.r59/loaders/ColladaLoader.js" />
// <reference path="libs/requestAnimationFrame/RequestAnimationFrame.js" />
// <reference path="js/babylon.max.js" />
// <reference path="js/cannon.max.js" />


var canvas;
var engine,scene, light;
var materialAmiga;
var materialWood;
var materialGround;
var followCamera;
var freeCamera;
var isAPressed = false;
var isDPressed = false;
var isWPressed = false;
var isSPressed = false;

var tank;
var dude;
var skeleteon;


document.addEventListener("DOMContentLoaded", startGame, false);

function startGame() {

    if (BABYLON.Engine.isSupported()) {
        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);
        scene = new BABYLON.Scene(engine);
        light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        followCamera = new BABYLON.FollowCamera("Follow", new BABYLON.Vector3(0, 100, 15), scene);

      freeCamera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 100, 15), scene);
      freeCamera.keysUp.push('w'.charCodeAt(0)); // "w"
      freeCamera.keysUp.push('W'.charCodeAt(0)); // "w"
        
      freeCamera.keysDown.push('s'.charCodeAt(0));
      freeCamera.keysDown.push('S'.charCodeAt(0));

      freeCamera.keysRight.push('d'.charCodeAt(0));
      freeCamera.keysRight.push('D'.charCodeAt(0));

      freeCamera.keysLeft.push('a'.charCodeAt(0));
      freeCamera.keysLeft.push('A'.charCodeAt(0));
      freeCamera.speed *= 5;
     //   followCamera.checkCollisions = true;
        followCamera.attachControl(canvas, true);
        //followCamera.inputs.remove(followCamera.inputs.attached.mouse);

        scene.activeCamera = followCamera;
        
        scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.CannonJSPlugin());
        scene.gravity = new BABYLON.Vector3(0, -10, 0);

      //  scene.getPhysicsEngine().setTimeStep(1 / 200);

        followCamera.applyGravity = true;
        followCamera.ellipsoid = new BABYLON.Vector3(2, 5, 2);
        followCamera.speed *= 3;

        createMaterials();
        addListeners();

        var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "images/height1.png", 5000, 5000, 200, 0, 400, scene, false, groundCreated);
   //     var ground = BABYLON.Mesh.CreateGround("ground", 5000, 5000, 400, scene);

        createHero();

        function groundCreated(ground) {
            ground.checkCollisions = true;
            ground.material = materialGround;
        //      materialGround.wireframe = true;
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0, restitution: 0 , friction:.1 }, scene);
            
        }


        BABYLON.SceneLoader.ImportMesh("him", "scenes/", "Dude.babylon", scene, function (newMeshes, particleSystems, skeletons) {
            player = newMeshes[0];
            player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100, friction: 0.5, restitution: 1 }, scene);
            for (var i = 1, len = newMeshes.length; i < len; i++) {
                newMeshes[i].parent = player;
                newMeshes[i].physicsImpostor = new BABYLON.PhysicsImpostor(newMeshes[i], BABYLON.PhysicsImpostor.BoxImpostor, { mass: 10, friction: 0.5, restitution: 1 }, scene);
                newMeshes[i].showBoundingBox = true;
            }

           
            player.position = new BABYLON.Vector3(0, 50, -300);
            skeletons[0].position = new BABYLON.Vector3(0, 50, -300);
           // player.scaling = new BABYLON.Vector3(.5, .5, .5);
            //  skeletons[0].scaling = new BABYLON.Vector3(.5, .5, .5);

            var MinBoundingInfo = player.getBoundingInfo().minimum;
            var MaxBoundingInfo = player.getBoundingInfo().maximum;

            console.log(MinBoundingInfo);
            console.log(MaxBoundingInfo);

            player.physicsImpostor.forceUpdate();
            player.showBoundingBox = true;

            scene.beginAnimation(skeletons[0], 0, 120, 1.0, true);
        });


        engine.runRenderLoop(function () {

            // This is because without this the tank collides with the ground and bounces strangely. dont know why the "2" though, just trial and error. 
            tank.physicsImpostor.applyForce(new BABYLON.Vector3(0, tank.physicsImpostor.mass * scene.gravity.y*-1 *2, 0), tank.getAbsolutePosition());
            scene.render();
            handleMouseFreeCameraRotation();
            handleKeyboardFreeCameraRotation();
            handleKeyboardMeshInputs(tank);

        });


    }
}


function createMaterials() {
    materialAmiga = new BABYLON.StandardMaterial("amiga", scene);
    materialAmiga.diffuseColor = new BABYLON.Color3.Red;
    materialAmiga.emissiveColor = new BABYLON.Color3.Blue;

    materialWood = new BABYLON.StandardMaterial("wood", scene);
    materialWood.diffuseColor = new BABYLON.Color3.Green;
    materialWood.emissiveColor = new BABYLON.Color3.Yellow;

    materialGround = new BABYLON.StandardMaterial("ground", scene);
    materialGround.diffuseTexture = new BABYLON.Texture("images/Crate22.jpgb12c5bae-74c1-477e-8d4e-fc3ff94fec3fLarger.jpg", scene);
    materialGround.emissiveColor = new BABYLON.Color3.Green;
}

function addListeners() {
    document.addEventListener("keydown", function (event) {

        if (event.key == 'a' || event.key == 'A') {
            isAPressed = true;
        }
        if (event.key == 'd' || event.key == 'D') {
            isDPressed = true;
        }
        if (event.key == 'w' || event.key == 'W') {
            isWPressed = true;
        }
        if (event.key == 's' || event.key == 'S') {
            isSPressed = true;
        }

        if(event.key == 'c' || event.key == 'C')
        {
            scene.activeCamera = freeCamera;
            freeCamera.attachControl(canvas);
           engine.isPointerLock = true; // This line makes pressing mouse not necessary to rotate
        }

        if (event.key == 'f' || event.key == 'F') {
            scene.activeCamera = followCamera;
            followCamera.attachControl(canvas);
            engine.isPointerLock = false; // This line makes pressing mouse not necessary to rotate
        }

        if(event.key == 'b' || event.key =='B')
        {
            var CannonBall = BABYLON.Mesh.CreateSphere("s", 30, 5, scene, false);
            CannonBall.position = tank.position.add(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(10, 10, 10).negate()));
            CannonBall.physicsImpostor = new BABYLON.PhysicsImpostor(CannonBall, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 5, friction: 10, restitution: .2 }, scene);
            CannonBall.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero().add(tank.frontVector.normalize().multiplyByFloats(1000, 1000, 1000).negate()));
            CannonBall.material = materialWood;

        }

    });

    document.addEventListener("keyup", function () {

        if (event.key == 'a' || event.key == 'A') {
            isAPressed = false;
        }
        if (event.key == 'd' || event.key == 'D') {
            isDPressed = false;
        }
        if (event.key == 'w' || event.key == 'W') {
            isWPressed = false;
        }
        if (event.key == 's' || event.key == 'S') {
            isSPressed = false;
        }

        if(event.keyCode == 32 )
        {
           // freeCamera.position.y += 30;
        }
    });


}

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});



function handleMouseFreeCameraRotation()
{
    

    var rotationSensitivity = .02;

    if (scene.pointerX < 10) {
        freeCamera.cameraRotation.y -= .1 * rotationSensitivity;
    }
    if (scene.pointerX > window.innerWidth - 10) {
        freeCamera.cameraRotation.y += .1 * rotationSensitivity;
    }
    if (scene.pointerY < 20) {
        freeCamera.cameraRotation.x -= .5 * rotationSensitivity;
    }
    
}



function handleKeyboardFreeCameraRotation()
{
    var rotationSensitivity =   .7;

        if (isAPressed)
        {
            freeCamera.cameraRotation.y -= .01  * rotationSensitivity;

        }
        if (isDPressed)
        {
            freeCamera.cameraRotation.y += .01  * rotationSensitivity;
        }

}


function handleKeyboardMeshInputs(mesh) {

    if (mesh) {
        var rotationSensitivity = .7;

        if (isAPressed) {
            mesh.yRotation -= .01 * rotationSensitivity;
        }
        if (isDPressed) {
            mesh.yRotation += .01 * rotationSensitivity;
        }


        // This is very bad code but it is their fault :D . 
        mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(mesh.yRotation, 0, 0);
        mesh.frontVector.x = Math.sin(mesh.yRotation);
        mesh.frontVector.z = Math.cos(mesh.yRotation);


        if (isWPressed) {
       //     mesh.position.x -=  mesh.frontVector.x;  // doing it that way doesnot handle collisions and objects penetrate
            //    mesh.position.z -= mesh.frontVector.z;
            
            mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(Number(mesh.frontVector.x) * -1 * mesh.velocity, Number(mesh.frontVector.y) * mesh.velocity, Number(mesh.frontVector.z) *-1* mesh.velocity));
            
        }

        if (isSPressed) {
            mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(Number(mesh.frontVector.x)  * mesh.velocity, Number(mesh.frontVector.y) * mesh.velocity, Number(mesh.frontVector.z)  * mesh.velocity));

        }
    }
}


function createHero()
{
    tank = BABYLON.Mesh.CreateBox("tank", 1, scene, true);
    tank.scaling.x *= 10;
    tank.scaling.z *= 20;
    tank.scaling.y *=1;
    tank.position.z += 10;
    tank.position.y += 10;
    tank.frontVector = new BABYLON.Vector3.Zero;
    tank.yRotation = 0; // There is a problem with tank.rotation.y when using physics engine. It needs quaternions and sets the rotation.y to zero
    // automatically.
    tank.velocity = 50;
    
    

    followCamera.lockedTarget = tank;

    tank.material = materialAmiga;

    followCamera.radius = 30; // how far from the object to follow
    followCamera.heightOffset = 4; // how high above the object to place the followCamera
    followCamera.rotationOffset = 0; // the viewing angle
    followCamera.cameraAcceleration = 0.1 // how fast to move
    followCamera.maxCameraSpeed = 200 // speed limit

    var tankMadfa3 = BABYLON.Mesh.CreateBox("madfa3", 1, scene, true);
    tankMadfa3.scaling.x *= .2;
    tankMadfa3.scaling.z *= 1;
    tankMadfa3.position.z -=.5;
    tankMadfa3.position.y += 1;
    tankMadfa3.material = materialWood;

    tankMadfa3.parent = tank;

  //  var newTank = BABYLON.Mesh.MergeMeshes([tank,tankMadfa3]);

    var tankBoundingBox = new BABYLON.Mesh.CreateBox("bounding", 1, scene, true);
    var wireframeMaterial = new BABYLON.StandardMaterial("wire", scene);
  //  wireframeMaterial.wireframe = true;
    tankBoundingBox.material = wireframeMaterial;
   tankBoundingBox.parent = tank;

   // tank.checkCollisions = true;
    tank.physicsImpostor = new BABYLON.PhysicsImpostor(tank, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 100,friction:.2, restitution: 0.0 }, scene);

    //var test = BABYLON.Mesh.CreateSphere("test1", 20,20, scene, true);
    //test.physicsImpostor = new BABYLON.PhysicsImpostor(test, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 10, friction: 10, restitution: .2 }, scene);

    //test.position.z -= 80;
    //test.position.y += 10;
    //// test.checkCollisions = true;
    //test.material = materialAmiga;
    //materialAmiga.wireframe = true;

    //tank.physicsImpostor.physicsBody.collisionResponse = false;

    tank.showBoundingBox = true;
    console.log(tank.getBoundingInfo());
    //  console.log(new BABYLON.VertexData.ExtractFromGeometry(tank).positions);
}


