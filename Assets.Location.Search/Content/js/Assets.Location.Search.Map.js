Assets.Location.Search.Map = (function ($, searchModule) {
    "use strict";
    var $map;
    var gmap;
    var imagePath;
    var currentZoom;
    var currentLanguage;
    var currentBoundaries;

    var mapStates = {
        centerChanged: false,
        zoomChanged: false,
        dragEnd: false,
        reset: function () {
            this.centerChanged = false;
            this.dragEnd = false;
            this.zoomChanged = false;
        }
    };

    var defaults = {
        mapTypeControl: false,
        mapTypeControlOptions: {
            mapTypeIds: ['Styled']
        },
        mapTypeId: 'Styled',
        scaleControl: true,
        zoomControl: true,
        streetViewControl: false,
        zoom: 8
    };

    /* Marker Module */
    var marker = (function () {
        var create = function (location, gmap) {

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(location.latitude, location.longitude),
                title: location.name,
                id: location.id,
                code: location.code,
                map: gmap
            });

            marker.addListener('click', function () {
                var card = $("#" + marker.code);
                console.log(card.offset().top)
                console.log($('#sidebar').offset().top)
                if (card.length) {
                    $('#sidebar').animate({ scrollTop: (card.offset().top - $('#sidebar').offset().top) });
                }
            });

            return marker;
        };

        var equals = function (markerA, markerB) {
            return (markerA.id == markerB.id)
        }

        return {
            create: create,
            equals: equals
        };

    })();

    /* Markers Collection Module */
    var markers = (function () {
        var markerCluster;
        var oldCollection = [];
        var currentCollection = [];


        /*Cleans the markers from map*/
        var cleanMap = function (markersToClean) {
            if (markersToClean) {
                for (var i = 0; i < markersToClean.length; i++) {
                    var markerToClean = markersToClean[i];
                    if (markerToClean) markerToClean.setMap(null);
                }
            }
        }

        /*Creates a fresh new collection of markers*/
        var createCollection = function (locations) {
            currentCollection = locations.map(function (location) {
                return marker.create(location, gmap);
            });
        };

        /*Cleans collectionA saving its values to an internal collection*/
        var swapCollections = function (collectionA) {
            oldCollection.length = 0;
            var length = collectionA.length;
            for (var i = 0; i < length; i++) {
                oldCollection.push(collectionA.pop());
            };
        }

        /*Fetchs the markers collection*/
        var getCurrentCollection = function () {
            return currentCollection;
        };

        var getOldCollection = function () {
            return oldCollection;
        };

        /*Creates a MarkerClusterer object from the new Markers*/
        var createCluster = function () {
            if (currentCollection.length > 0) {
                markerCluster = new MarkerClusterer(gmap, currentCollection,
                    { imagePath: "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m" });
            }
            else {
                console.warn("No locations passed to create markers");
            }
        };

        var updateCluster = function () {
            this.cleanCluster();
            this.createCluster();
        }

        /*Cleans the MarkerClusterer object*/
        var cleanCluster = function () {
            if (markerCluster) {
                markerCluster.clearMarkers();
            }
        };

        return {
            createCollection: createCollection,
            swapCollections: swapCollections,
            createCluster: createCluster,
            cleanCluster: cleanCluster,
            updateCluster: updateCluster,
            cleanMap: cleanMap,
            getCurrentCollection: getCurrentCollection,
            getOldCollection: getOldCollection
        }

    })();

    var pins = (function () {
        var newPins = [];

        /*Returns an array which contains the resulting elements of a set intersection -common element between sets*/
        var getCommonMarkers = function (oldMarkers, newMarkers) {
            var commonMarkers;

            if (oldMarkers && newMarkers) {
                /*Arrow functions is not supported by IE yet, so we have to solve this by callbacks*/
                commonMarkers = oldMarkers.filter(function (oldMarker) {
                    return newMarkers.some(function (oldMarker, newMarker) {
                        return marker.equals(oldMarker, newMarker);
                    });
                });
            }

            return commonMarkers;
        };

        /*Returns an array which contains the resulting elements of a set difference operation -different elements between sets*/
        var getDifferentMarkers = function (oldMarkers, newMarkers) {
            var differentMarkers;

            if (oldMarkers && newMarkers) {
                /*Arrow functions is not supported by IE yet, so we have to solve this by callbacks*/
                differentMarkers = newMarkers.filter(function (newMarker) {
                    return !oldMarkers.some(function (oldMarker, newMarker) {
                        return marker.equals(oldMarker, newMarker);
                    });
                });
            }

            return differentMarkers;
        };

        var reconcile = function (currentMarkersCollection, locations) {
            /*To avoid references issues, we have to save the current collection in another one by swapping it */
            markers.swapCollections(currentMarkersCollection);

            var oldMarkers = markers.getOldCollection();
            markers.createCollection(locations);
            var newMarkers = markers.getCurrentCollection();

            /*By concatenating these two arrays, we can obtain a set of unique updated markers*/
            var commonMarkers = getCommonMarkers(oldMarkers, newMarkers);
            var differentMarkers = getDifferentMarkers(oldMarkers, newMarkers);

            newPins = commonMarkers.concat(differentMarkers);
            markers.cleanMap(oldMarkers);

        }

        var existInMap = function (markers) {
            var result = markers.every(function (marker) {
                return marker.getMap() != null
            });

            return result; 
        }
        var drawInMap = function (locations) {
            var currentMarkersCollection = markers.getCurrentCollection();
            if (currentMarkersCollection.length > 0) {
                reconcile(currentMarkersCollection, locations);
            }
            else {
                markers.createCollection(locations);
            }
        };

        return {
            drawInMap: drawInMap,
            existInMap: existInMap
        }
    })();

    var init = function (currentLang, mapInstance) {
        currentLanguage = currentLang;
        if (mapInstance) {
            $map = mapInstance;
            gmap = new google.maps.Map(mapInstance);
        }
        else {
            if (!createMap()) return;
        }

        bindEvents();
        return gmap;
    }

    /*Initializes the map element */
    var createMap = function () {
        $map = $('#location-search-map');
        if ($map.length === 0) {
            console.warn('No element found with id "location-search-map"');
            return false;
        }

        var options = $.extend({}, defaults, $map.data());
        options.center = new google.maps.LatLng($map.data('latitude'), $map.data('longitude'));

        gmap = new google.maps.Map($map[0], options);
        var styledMapType = new google.maps.StyledMapType(styles, { name: 'Styled' });
        gmap.mapTypes.set('Styled', styledMapType);

        imagePath = $map.data('imagePath');
        currentZoom = gmap.getZoom();

        var scaleInterval = setInterval(function () {
            if (currentLanguage == 'en-ca' || currentLanguage == 'fr-ca') {
                var scalemi = $(".gm-style-cc:not(.gmnoprint):contains(' mi')");
                if (scalemi.length) {
                    scalemi.click();
                    clearInterval(scaleInterval);
                }
            }
            else {
                var scalekm = $(".gm-style-cc:not(.gmnoprint):contains(' km')");
                if (scalekm.length) {
                    scalekm.click();
                    clearInterval(scaleInterval);
                }
            }


        }, 100);

        return true;
    }

    /* Updates the map's current boundaries with the new boundaries */
    var updateMapBoundaries = function (newBoundaries) {
        if (newBoundaries) {
            currentBoundaries = newBoundaries;
        }
        else {
            currentBoundaries = mapBounds;
        }
    }

    /* Centers the map using the coordinates passed as argument*/
    var centerMap = function (coords) {
        mapStates.centerChanged = true;
        var newMapCenter = new google.maps.LatLng(coords.current.latitude, coords.current.longitude);
        gmap.fitBounds(currentBoundaries);
        gmap.panTo(newMapCenter);
    };

    /* Builds a Radius using the Named Search Results */
    var buildRadiusFromResults = function (namedSearchResults) {
        mapStates.centerChanged = true;
        var resultsLength = namedSearchResults.length;
        var resultsBounds = new google.maps.LatLngBounds();

        for (var i = 0; i < resultsLength; i++) {
            if (namedSearchResults[i].latitude && namedSearchResults[i].longitude) {
                resultsBounds.extend(new google.maps.LatLng(namedSearchResults[i].latitude,
                                                            namedSearchResults[i].longitude));
            }
        }

        return resultsBounds;
    }

    /*Gets the center of the bounds passed as argument */
    var getBoundsCenter = function (bounds) {
        if (bounds) {
            return bounds.getCenter();
        }
        else {
            return mapCenter; //fallback variable defined in the mock file
        }
    }

    /*Gets the current bounds of the map */
    var getMapBounds = function () {
        var bounds;

        if (gmap) bounds = gmap.getBounds();
        if (!bounds) bounds = currentBoundaries;

        return bounds;
    }

    var createBoundsFromCoordinates = function (coordinates) {
        mapStates.centerChanged = true;

        var anotherLiteralCoordsPlus,
            anotherLiteralCoordsLess,
            literalCoords = new google.maps.LatLng(coordinates.current.latitude, coordinates.current.longitude),
            bounds = new google.maps.LatLngBounds();

        if (Assets.Location.Search.state.custom.isStateSearch) {
            anotherLiteralCoordsPlus = new google.maps.LatLng(parseFloat(coordinates.current.latitude) + 2, parseFloat(coordinates.current.longitude) + 2);
            anotherLiteralCoordsLess = new google.maps.LatLng(parseFloat(coordinates.current.latitude) - 2, parseFloat(coordinates.current.longitude) - 2);
        }
        else {
            var anotherLiteralCoordsPlus = new google.maps.LatLng(parseFloat(coordinates.current.latitude) + 0.56, parseFloat(coordinates.current.longitude) + 0.8);
            var anotherLiteralCoordsLess = new google.maps.LatLng(parseFloat(coordinates.current.latitude) - 0.56, parseFloat(coordinates.current.longitude) - 0.8);
        }

        bounds.extend(literalCoords);
        bounds.extend(anotherLiteralCoordsPlus);
        bounds.extend(anotherLiteralCoordsLess);
        gmap.fitBounds(bounds);

        updateMapBoundaries(bounds);
        return bounds;
    };

    /*Add new event handlers to the map element */
    var bindEvents = function () {
        gmap.addListener('idle', eventHandlers.onMapIdle);
        gmap.addListener("zoom_changed", eventHandlers.onZoomChange);
        gmap.addListener("dragend", eventHandlers.onDragEnd);
    }

    var eventHandlers = {
        onDragEnd: function () {
            mapStates.dragEnd = true;
        },
        onZoomChange: function () {
            if (!mapStates.centerChanged && !mapStates.zoomChanged) {
                mapStates.zoomChanged = true;
            }
        },
        onMapIdle: function () {
            /*Since we center the map progamatically the map idle event triggers, 
            we have to make sure to avoid trigger unnecesary queries*/
            if (!mapStates.centerChanged && (mapStates.dragEnd || mapStates.zoomChanged) && $map.is(":visible")) {
                Assets.Location.Search.StateMachine.transition({ type: "MOVE_MAP" });
            }

            mapStates.reset();
        }
    };

    var styles =
       [
  {
      "elementType": "labels.text.fill",
      "stylers": [
        {
            "color": "#4a3c31"
        }
      ]
  },
  {
      "featureType": "administrative",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#4a3c31" }]
  },
  {
      "featureType": "administrative.province",
      "elementType": "geometry.stroke",
      "stylers": [{ "visibility": "off" }]
  },
  {
      "featureType": "landscape",
      "elementType": "geometry",
      "stylers": [
        { "lightness": "0" },
        { "saturation": "0" },
        { "color": "#f5f5f2" },
        { "gamma": "1" }
      ]
  },
  {
      "featureType": "landscape.man_made",
      "elementType": "all",
      "stylers": [
        { "lightness": "-3" },
        { "gamma": "1.00" }
      ]
  },
  {
      "featureType": "landscape.natural.terrain",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
  },
  {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
  },
  {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#bae5ce" },
        { "visibility": "on" }
      ]
  },
  {
      "featureType": "road",
      "elementType": "all",
      "stylers": [
        { "saturation": -100 },
        { "lightness": 45 },
        { "visibility": "simplified" }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "all",
      "stylers": [{ "visibility": "simplified" }]
  },
  {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#fac9a9" },
        { "visibility": "simplified" }
      ]
  },
  {
      "featureType": "road.highway",
      "elementType": "labels.text",
      "stylers": [{ "color": "#4e4e4e" }]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#787878" }]
  },
  {
      "featureType": "road.arterial",
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
  },
  {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "simplified" }]
  },
  {
      "featureType": "transit.station.airport",
      "elementType": "labels.icon",
      "stylers": [
        { "hue": "#0a00ff" },
        { "saturation": "-77" },
        { "gamma": "0.57" },
        { "lightness": "0" }
      ]
  },
  {
      "featureType": "transit.line",
      "elementType": "labels.text",
      "stylers": [
        {
            "color": "#4a3c31"
        }
      ]
  },
  {
      "featureType": "transit.station.rail",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#43321e" }]
  },
  {
      "featureType": "transit.station.rail",
      "elementType": "labels.icon",
      "stylers": [
        { "hue": "#ff6c00" },
        { "lightness": "4" },
        { "gamma": "0.75" },
        { "saturation": "-68" }
      ]
  },
  {
      "featureType": "water",
      "elementType": "all",
      "stylers": [
        { "color": "#4a3c31" },
        { "visibility": "on" }
      ]
  },
  {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#c7eced" }]
  },
  {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        { "lightness": "-49" },
        { "saturation": "-53" },
        { "gamma": "0.79" }
      ]
  }
       ];

    return {
        defaults: defaults,
        centerMap: centerMap,
        updateBoundaries: updateMapBoundaries,
        getMapBounds: getMapBounds,
        getCenterFromBounds: getBoundsCenter,
        buildRadiusFromResults: buildRadiusFromResults,
        createBoundsFromCoordinates: createBoundsFromCoordinates,
        pins: pins,
        init: init,
        currentLanguage: currentLanguage,
        eventHandlers: eventHandlers
    };


})(jQuery, Assets.Location.Search || {});
