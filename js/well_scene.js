
 var projection = d3.geo.albers().rotate([-48, 0]);
 z_scale = .0025


 coords = function(fips) {

   var state = _.filter(counties.features, function(v, i, l) {
     return v.properties.STATE_FIPS == fips
   })

   var boundaries = _.map(state, function(county) {

     var vectors = _.map(county.geometry.coordinates[0], function(lng_lat) {

       var points = projection(lng_lat)

       return new THREE.Vector2(points[1], points[0])

     })

     return vectors

   })

   return boundaries

 }

  Centroid =function (v_array) {
    var first = v_array[0]
   
    var corners = _.reduce(v_array,function (prev,next) {
     
      return {X: {
         max: next.x > prev.X.max ? next.x : prev.X.max,
         min: next.x < prev.X.min ? next.x : prev.X.min
         },
       Y: {
         max: next.y > prev.Y.max ? next.y : prev.Y.max,
         min: next.y < prev.Y.min ? next.y : prev.Y.min
         }
       }
     
    },{X:{max:first.x,min:first.x},Y:{max:first.y,min:first.y}})
   
    return new THREE.Vector3(
      ((corners.X.max - corners.X.min)/2)+corners.X.min,
      ((corners.Y.max - corners.Y.min)/2)+corners.Y.min,
      0
    )    
  }

 borders = function(vectors) {
   var group = new THREE.Object3D();

   _.forEach(vectors, function(county) {
     var countyShape = new THREE.Shape(county)
     var points = countyShape.createPointsGeometry();
     var line = new THREE.Line(points, new THREE.LineBasicMaterial({
       color: 0xFFFF00,
       linewidth: 1,
       castShadow:true
       
     }));
     group.add(line)
   })

   return group


 }


 HelperArrows = function(focus_vector) {

   var group = new THREE.Object3D();
   var length = 1000;
   var origin = focus_vector

   var dir = new THREE.Vector3(1, 0, 0);
   var hex = 0x999999;
   var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
   group.add(arrowHelper);

   var dir = new THREE.Vector3(0, 1, 0);
   var hex = 0xFF0000;
   var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
   group.add(arrowHelper);

   var dir = new THREE.Vector3(0, 0, 1);
   var hex = 0x00CCFF;

   var arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
   group.add(arrowHelper);

   return group
 }


 SkyDome = function(size,v) {

   var geometry = new THREE.SphereGeometry(size, 16, 16, 0, Math.PI, 0, Math.PI)
   
   var material = new THREE.MeshBasicMaterial({
     color: 0xCCFFFF,
     side: THREE.DoubleSide
   })
   var mesh = new THREE.Mesh(geometry, material);
   mesh.position.set(v.x, v.y, v.z)
   
   return mesh

 }

 HellDome = function(size,v) {
   var geometry = new THREE.SphereGeometry(size, 16, 16, Math.PI, Math.PI, 0, Math.PI)
   
   var material = new THREE.MeshBasicMaterial({
     color: 0xFF3300,
     side: THREE.DoubleSide
   })
   var mesh = new THREE.Mesh(geometry, material);
   mesh.position.set(v.x, v.y, v.z)
   
   return mesh
 }


 GroundPlane = function(size,v) {
   var geometry = new THREE.PlaneBufferGeometry( size, size )
   
	var groundTexture = THREE.ImageUtils.loadTexture( "textures/grasslight-big.jpg" );
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.repeat.set( size, size );
	groundTexture.anisotropy = 16;
   
   var material = new THREE.MeshPhongMaterial({
     color: 0xffffff,
     specular: 0x111111,
     map: groundTexture,
     side: THREE.DoubleSide,
     receiveShadow: true
   });
   
   var mesh = new THREE.Mesh(geometry, material);
   mesh.position.set(v.x, v.y, v.z)

   return mesh
 }

WellGeometry = function (well,height) {
  height = height | 1
  var geometry = new THREE.CylinderGeometry(.5, .5, height)
  // orient the cylinder on along the z axis
  geometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
  
  return geometry
  
}

WellMesh = function (geometry,material,well) {
  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(well.lat, well.lng, 0)
  mesh.receiveShadow = true
  return mesh
}


 KellyBushing = function(well) {
   
   var kb_val = well.kb ? (well.kb.value * z_scale) : 0
   geometry = WellGeometry (well,kb_val)
      
   var material = new THREE.MeshPhongMaterial({
     color: 0x555555,
     shininess: 150
   })
   
   var mesh = WellMesh(geometry, material,well);
   mesh.position.setZ(kb_val/2)
   return mesh
 }

 WellSite = function(well) {
   geometry = WellGeometry (well)
   var material = new THREE.MeshPhongMaterial({
     color: 0x996600,
     shininess: 1
   })
   var mesh = WellMesh(geometry, material,well);
   return mesh
 }


 Reservoir = function(well) {

   var height = (well.reservoir.bottom - well.reservoir.top)*z_scale
   
   geometry = WellGeometry (well,height)
   
   var material = new THREE.MeshPhongMaterial({
     color: 0x00FF00,
     specular: 0xffffff,
     shininess: 25
   })
   
   var mesh = WellMesh(geometry, material,well);
   mesh.position.setZ( -((well.reservoir.top/10)+height/2))
   return mesh
 }


 var container = document.createElement('div');
 var scene = new THREE.Scene();
 scene.fog = new THREE.Fog( 0xcce0ff, 100, 500 );
 var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
 var clock = new THREE.Clock();
 var renderer = new THREE.WebGLRenderer();

 function render() {
   controls.update(clock.getDelta());
   renderer.render(scene, camera);
 }

 function animate() {
   requestAnimationFrame(animate);
   render();
 };

 function pointAt(v) {
   camera.position.set(v.x, v.y, 50)
   camera.lookAt(v)
 }

 function init() {
   renderer.setSize(window.innerWidth, window.innerHeight);
   document.body.appendChild(renderer.domElement);

   controls = new THREE.FlyControls(camera);
   controls.movementSpeed = 50;
   controls.domElement = container;
   controls.rollSpeed = Math.PI / 12;
   controls.autoForward = false;
   controls.dragToLook = false;

   hemiLight = new THREE.HemisphereLight(0x99FFFF, 0xCC0033, 1.5);
   hemiLight.color.setHSL(0.6, 1, 0.6);
   hemiLight.groundColor.setHSL(0.095, 1, 0.75);
   hemiLight.position.set(0, 0, 2000);
   hemiLight.visible = true
   hemiLight.castShadow = true


   scene.add(hemiLight);

   // select counties using fips number for state
   var counties = coords(20)
   var state = borders(counties)
   state.position.z = 2 
   
   scene.add(state)

   var center = Centroid (_.flatten(counties))

   pointAt(center)
   
   // scene.add(HelperArrows(center))


   // world sphere
   scene.add(GroundPlane(1100,center));
   scene.add(SkyDome(1000,center))
   scene.add(HellDome(1000,center))


   _.forEach(wells, function(well) {
     points = projection([well.lng, well.lat])
     well.lat = points[1]
     well.lng = points[0]

     if (well.reservoir.top) {
       kb = KellyBushing(well)
       scene.add(kb);
       scene.add(Reservoir(well))
     } else {
       
       scene.add(WellSite(well))
       
     }

   })

 }


 init()


 animate()
