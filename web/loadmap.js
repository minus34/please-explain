var restUrl = "geoms.json";
var layerName = "";
var map1 = null;
var map2 = null;
var map3 = null;
var map4 = null;
var info = null;
var geojsonLayer = null;
var minZoom = 4;
var maxZoom = 15;
var maxValue = 76346; //max address count per locality

var colours = []

function init() {
    //Initialize the map on the "map" div
    map1 = new L.Map('map1');
    map2 = new L.Map('map2', { zoomControl:false });
    map3 = new L.Map('map3', { zoomControl:false });
    map4 = new L.Map('map4', { zoomControl:false });

    // load CartoDB basemap tiles
    var tiles1 = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    var tiles2 = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    var tiles3 = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    var tiles4 = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    map1.addLayer(tiles1);
    map2.addLayer(tiles2);
    map3.addLayer(tiles3);
    map4.addLayer(tiles4);

    //Set the view to a given center and zoom
    startPoint = new L.LatLng(-33.85, 151)
    map1.setView(startPoint, 8);
    map2.setView(startPoint, 8);
    map3.setView(startPoint, 8);
    map4.setView(startPoint, 8);

    // Get bookmarks/
    var storage = {
        getAllItems: function(callback) {
             $.getJSON('bookmarks.json',
                function(json) {
                    callback(json);
                }
            );
        }
    };

    //Add bookmark control
    var bmControl = new L.Control.Bookmarks({
      position: 'topleft',
      localStorage: false,
      storage: storage
    }).addTo(map1);

    //Acknowledge the PSMA Data
    map4.attributionControl.addAttribution('Boundary data � <a href="http://data.gov.au/dataset/psma-administrative-boundaries">PSMA</a>');

    // control that shows hex info on hover
    info1 = L.control();
    info1.onAdd = function (map1) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info1.update = function (props) {
        this._div.innerHTML = (props ? '<b>' + props.name + '</b><br/><b>% nationalist voters</b> : ' + props.ratio.toLocaleString(['en-AU']) : 'pick a boundary');
    };
    info1.addTo(map1);

    // //Get a new set of boundaries when map panned or zoomed
    // //TO DO: Handle map movement due to popup
    // map1.on('moveend', function (e) {
    //     getBoundaries();
    // });
    //
    // map1.on('zoomend', function (e) {
    //     map1.closePopup();
    //     //getBoundaries();
    // });

    //Get the first set of boundaries
    getBoundaries();
}

function style(feature) {

//    colours = ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486']
    colours = ['#feedde','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04']

    var renderVal = parseInt(feature.properties.ratio);

    return {
        weight: 1,
        opacity: 0.3,
        color: '#666',
        fillOpacity: 0.7,
        fillColor: getColor(renderVal)
    };
}

 // get color depending on ratio of count versus max value
 function getColor(d) {
   return d > 14 ? colours[7]:
          d > 12 ? colours[6]:
          d > 10 ? colours[5]:
          d > 8 ? colours[4]:
          d > 6 ? colours[3]:
          d > 4 ? colours[2]:
          d > 2 ? colours[1]:
                  colours[0];
 }

function highlightFeature(e) {

    var layer = e.target;

    layer.setStyle({
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    info1.update(layer.feature.properties);
    info2.update(layer.feature.properties);
    info3.update(layer.feature.properties);
    info4.update(layer.feature.properties);
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map1.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}


function getBoundaries() {

    console.time("got boundaries");

    //Fire off AJAX request
    $.getJSON(restUrl, loadBdysNew);
}

function loadBdysNew(json) {

    console.timeEnd("got boundaries");
    console.time("parsed GeoJSON");

    if (json != null) {
        try {
            geojsonLayer.clearLayers();
        }
        catch(err) {
            //dummy
        }
        
        // TO FIX: ERRORS NOT BEING TRAPPED
        geojsonLayer = L.geoJson(json, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map1);
    }

    console.timeEnd("parsed GeoJSON");
}
