
/***** for annotorious *****/
jQuery(document).ready(function(){

    window.console.log("calling ready..");
        window.console.log("calling init..");
        var viewer = OpenSeadragon({
          id: "openseadragon",
          prefixUrl: "images/",
          showNavigator: true,
constrainDuringPan: true,
defaultZoomLevel: 1,
visibilityRatio:        1,
tileSources: {
  height: 28712,
  width:  47647,
  tileSize: 512,
  minLevel: 0,
  maxLevel: 7,
  getTileUrl: function( level, x, y )
     { t='/tiletiff/data/sample1_DZI/sample1_files/'+(level)+"/"+x+"_"+y+".jpg"; return t; }
}
});

        anno.makeAnnotatable(viewer);
})

function dump() {
  var p=anno.getAnnotations();
  window.console.log("found.."+p.length+" annotations..");
}

function annotate() {
  var button = document.getElementById('map-annotate-button');
  button.style.color = '#777';

  anno.activateSelector(function() {
    // Reset button style
    button.style.color = '#fff';
  });
}


