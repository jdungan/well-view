 

var projection = d3.geo.albers().rotate([-48,0]);

 coords = function (fips) {
      
    var state  = _.filter(counties.features,function (v,i,l) {
       return v.properties.STATE_FIPS == fips
    })
    
    return _.map(state,function (county) {
       
       return _.map(county.geometry.coordinates,function (coords) {
          
          var vectors =[]
          
          _.forEach(coords,function (lng_lat) {
             
             var points = projection(lng_lat)

             vectors.push(new THREE.Vector2(points[1],points[0]) )

          })
          
          return vectors
           
       })
    })
 }
 
 add_borders =  function(vectors){
   _.forEach(vectors,function (county) {
      var countyShape = new THREE.Shape(county[0])
      var points = countyShape.createPointsGeometry();      
      var line = new THREE.Line( points, new THREE.LineBasicMaterial( { color: 0xFFFF00, linewidth: 1 } ) );
      scene.add(line)
    })
    
 }   
 
 
 add_arrows = function (focus_vector) {
    
    var length = 100;
    var origin = focus_vector  
    
    
    var dir = new THREE.Vector3( 1, 0, 0 );
    var hex = 0x999999;

    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    scene.add( arrowHelper );
    
    var dir = new THREE.Vector3( 0, 1, 0 );
    var hex = 0xFF0000;

    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    scene.add( arrowHelper );
    
    var dir = new THREE.Vector3( 0, 0, 1 );
    var hex = 0x00CCFF;

    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    scene.add( arrowHelper );

 }

 
GroundPlane = function (height,width) {
   var geometry = new THREE.PlaneBufferGeometry(height, width, 0 );
   var material = new THREE.MeshBasicMaterial( {color: 0x996600, side: THREE.DoubleSide} )
   var mesh = new THREE.Mesh( geometry, material );
   mesh.position.set(width/2,width/2,0)
   return mesh
}

KellyBushing = function (pos) {
   var geometry  = new THREE.SphereGeometry (.1,32,32)
   var material = new THREE.MeshPhongMaterial( { color: 0x555555, specular: 0xffffff, shininess: 50 }  )
   var kb = new THREE.Mesh( geometry, material );
   kb.position.set (pos.x,pos.y,pos.z)
   kb.receiveShadow =true
   return kb
}



var container = document.createElement( 'div' );
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var clock = new THREE.Clock();
var renderer = new THREE.WebGLRenderer();

 
function render() {
  controls.update( clock.getDelta());
  renderer.render(scene, camera );
}

function animate() {
	requestAnimationFrame( animate );
  render();
};

    
function init() {
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  controls = new THREE.FlyControls( camera );
  controls.movementSpeed = 100;
  controls.domElement = container;
  controls.rollSpeed = Math.PI / 12;
  controls.autoForward = false;
  controls.dragToLook = false;

  hemiLight = new THREE.HemisphereLight( 0x99FFFF, 0x996600, 1 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
  hemiLight.position.set( 0, 0, 1000 );
  hemiLight.visible = true
  scene.add( hemiLight );


  // select counties using fips number for state
  counties =  coords(20)



  // var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  // scene.add( light );
  
  // Add ground plane  
  // scene.add(GroundPlane(960,500));

  first_county = counties[0][0][0]
  view_point = new THREE.Vector3(first_county.x,first_county.y,200)

  camera.position.copy(view_point)
  
  add_arrows(view_point)

  add_borders(counties)


  _.forEach(wells,function (well) {

     points = projection([well.lng,well.lat])

     // console.log(well)
     pos = {
        x : points[1],
        y : points[0],
        z : 0
     }
     // console.log(pos)
     scene.add( KellyBushing(pos) );







  })

}        


 init ()
 
 
 animate()
