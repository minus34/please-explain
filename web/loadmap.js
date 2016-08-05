"use strict";

var restUrl = 'geoms.json';
var map1 = null;
var map2 = null;
var info1 = null;
var info2 = null;
var info3 = null;
var geojsonLayer1 = null;
var geojsonLayer2 = null;
var minZoom = 4;
var maxZoom = 10;
var lastClickedLayer1 = null
var lastClickedLayer2 = null


var colours = ['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'];
var themeGrades = [2, 4, 6, 8, 10, 12, 14]


function init() {
    //Initialize the map on the "map" div
    map1 = new L.Map('map1', { attributionControl: false });
    map2 = new L.Map('map2', { zoomControl:false });

    // load CartoDB basemap tiles
    var tiles1 = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    var tiles2 = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        minZoom: minZoom,
        maxZoom: maxZoom
    });

    map1.addLayer(tiles1);
    map2.addLayer(tiles2);

    //Set the view to a given center and zoom
    var startPoint = new L.LatLng(-27.47, 153.10)
    map1.setView(startPoint, 9);
    map2.setView(startPoint, 9);

    // set move events to update the other map when we move this one
    map1.on('moveend', function(e) {
        map2.setView(map1.getCenter(), map1.getZoom());
    });
    map2.on('moveend', function(e) {
        map1.setView(map2.getCenter(), map2.getZoom());
    });

    //Add legend control
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map2) {

        var div = L.DomUtil.create('div', ' info legend'),
            labels = [],
            from,
            to;

        for (var i = 0; i < themeGrades.length; i++) {
            from = themeGrades[i] - 1;
            to = themeGrades[i + 1];

            labels.push('<i style="background:' + getColor(from) + '"></i>' + parseInt(from) + (to ? '%': '%+'));
        }

        div.innerHTML = "<div id='mapLegend'>" + labels.join('<br/>') + '</div>';

        return div;
    };

    legend.addTo(map2);

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

    //Acknowledge the Data
    map2.attributionControl.addAttribution('&copy; <a href="http://data.gov.au/dataset/psma-administrative-boundaries">PSMA</a>');
    map2.attributionControl.addAttribution('&copy; <a href="http://www.abs.gov.au/websitedbs/censushome.nsf/4a256353001af3ed4b2562bb00121564/datapacksdetails?opendocument&navpos=250">ABS</a>');
    map2.attributionControl.addAttribution('&copy; <a href="http://vtr.aec.gov.au/SenateDownloadsMenu-20499-Csv.htm">AEC</a>');

    info1 = L.control();
    info1.onAdd = function (map1) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info1.update = function (props) {
        //this._div.setStyle((props ? { visibility : 'visible' } : { visibility : 'hidden' }))
        // this._div.visibility = (props ? visible : hidden);
        this._div.innerHTML = (props ? '<b>Nationalist party voters</b> : ' + props.percent.toLocaleString(['en-AU']) + '%' : '');
    };
    info1.addTo(map1);

    info2 = L.control();
    info2.onAdd = function (map2) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info2.update = function (props) {
        //this._div.visibility = (props ? 'visible' : 'hidden');
        this._div.innerHTML = (props ? '<b>Muslim</b> : ' + props.pop_percent.toLocaleString(['en-AU']) + '%' : '');
    };
    info2.addTo(map2);

    info3 = L.control();
    info3.setPosition('bottomleft');
    info3.onAdd = function (map1) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info3.update = function (props) {
        this._div.innerHTML = (props ? '% of people in <b>' + props.name + '</b> that are...' : '<b>pick a boundary</b>');
    };
    info3.addTo(map1);

    //Get the boundaries
    getBoundaries();
}

function style1(feature) {
    var renderVal = parseInt(feature.properties.percent);

    return {
        weight: 1,
        opacity: 0.4,
        color: '#666',
        fillOpacity: 0.7,
        fillColor: getColor(renderVal)
    };
}

function style2(feature) {
    var renderVal = parseInt(feature.properties.pop_percent);

    return {
        weight: 1,
        opacity: 0.4,
        color: '#666',
        fillOpacity: 0.7,
        fillColor: getColor(renderVal)
    };
}

 // get color depending on ratio of count versus max value
 function getColor(d) {
   return d > 12 ? colours[6]:
          d > 10 ? colours[5]:
          d > 8 ? colours[4]:
          d > 6 ? colours[3]:
          d > 4 ? colours[2]:
          d > 2 ? colours[1]:
                  colours[0];
 }

function highlightFeature1(e) {
    if(lastClickedLayer1 || lastClickedLayer2){
       geojsonLayer1.resetStyle(lastClickedLayer1);
       geojsonLayer2.resetStyle(lastClickedLayer2);
       lastClickedLayer1 = null;
       lastClickedLayer2 = null;
    }

    var layer1 = e.target;

    layer1.setStyle({
        color: '#444',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.7
    });

    var match = geojsonLayer2.eachLayer(function(layer2) {
        if (layer2.feature.properties.name == layer1.feature.properties.name) {
            layer2.setStyle({
                color: '#444',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer2.bringToFront();
            }

            lastClickedLayer2 = layer2;
        }
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer1.bringToFront();
    }

    lastClickedLayer1 = layer1;

    info1.update(layer1.feature.properties);
    info2.update(layer1.feature.properties);
    info3.update(layer1.feature.properties);
}

function highlightFeature2(e) {
    if(lastClickedLayer1 || lastClickedLayer2){
       geojsonLayer1.resetStyle(lastClickedLayer1);
       geojsonLayer2.resetStyle(lastClickedLayer2);
       lastClickedLayer1 = null;
       lastClickedLayer2 = null;
    }

    var layer2 = e.target;

    layer2.setStyle({
        color: '#444',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.7
    });

    var match = geojsonLayer1.eachLayer(function(layer1) {
        if (layer1.feature.properties.name == layer2.feature.properties.name) {
            layer1.setStyle({
                color: '#444',
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer1.bringToFront();
            }

            lastClickedLayer1 = layer1;
        }
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer2.bringToFront();
    }

    lastClickedLayer2 = layer2;

    info1.update(layer2.feature.properties);
    info2.update(layer2.feature.properties);
    info3.update(layer2.feature.properties);
}

function resetHighlight1(e) {
    var layer1 = e.target
    geojsonLayer1.resetStyle(layer1);

    var match = geojsonLayer2.eachLayer(function(layer2) {
        if (layer2.feature.properties.name == layer1.feature.properties.name) {
            geojsonLayer2.resetStyle(layer2);
        }
    });

    info1.update();
    info2.update();
    info3.update();
}

function resetHighlight2(e) {
    var layer2 = e.target
    geojsonLayer2.resetStyle(layer2);

    var match = geojsonLayer1.eachLayer(function(layer1) {
        if (layer1.feature.properties.name == layer2.feature.properties.name) {
            geojsonLayer1.resetStyle(layer1);
        }
    });

    info1.update();
    info2.update();
    info3.update();
}

function onEachFeature1(feature, layer) {
    layer.on({
        mouseover: highlightFeature1,
        mouseout: resetHighlight1,
        click: highlightFeature1
    });
}

function onEachFeature2(feature, layer) {
    layer.on({
        mouseover: highlightFeature2,
        mouseout: resetHighlight2,
        click: highlightFeature2
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

    geojsonLayer1 = L.geoJson(json, {
        style: style1,
        onEachFeature: onEachFeature1
    }).addTo(map1);

    geojsonLayer2 = L.geoJson(json, {
        style: style2,
        onEachFeature: onEachFeature2
    }).addTo(map2);

    console.timeEnd("parsed GeoJSON");
}

