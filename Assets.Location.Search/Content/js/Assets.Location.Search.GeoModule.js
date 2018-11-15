/*GeoLocation Module for Location Search Pages */

Assets.Location.Search.GeoModule = (function ($, contextFields) {
    var coordinates = {
        current: {
            latitude: contextFields.geoIPLatitude,
            longitude: contextFields.geoIPLongitude
        },
        geoIP: {
            latitude: contextFields.geoIPLatitude,
            longitude: contextFields.geoIPLongitude,
            cityState: contextFields.geoIPSCitytate
        },
        update: function (newLat, newLong) { 
            this.current.latitude = newLat;
            this.current.longitude = newLong;
        },
        equalsToCurrent: function (lat, long) {
            return (this.current.latitude === lat && this.current.longitude === long);
        },
        isGeoIpWorking: function () {
            var result = !!(parseFloat(contextFields.geoIPLatitude) && parseFloat(contextFields.geoIPLongitude)) || false
            return result;
        }
    }

    /*Object to hold the value of the Range Facets*/
    var distanceRanges = {
        latitude: undefined,
        longitude: undefined,
        /*Builds the Ranges using the current map's boundaries*/
        build: function (boundary) {
            var northEastCorner = boundary.getNorthEast();
            var southWestCorner = boundary.getSouthWest();

            var lowerLatLimit = southWestCorner.lat();
            var upperLatLimit = northEastCorner.lat();
            var lowerLongLimit = southWestCorner.lng();
            var upperLongLimit = northEastCorner.lng();

            this.latitude = [lowerLatLimit + ".." + upperLatLimit];
            this.longitude = [lowerLongLimit + ".." + upperLongLimit];
        },
        /*Sets the ranges from URL*/
        buildFromURL: function (latFacetRange, longFacetRange) {
            this.latitude = latFacetRange;
            this.longitude = longFacetRange
        },
        /*Builds a new map boundary based on the values of the FacetsRanges*/
        debuildRanges: function () {
            var bounds = {
                latitude1: 0,
                latitude2: 0,
                longitude1: 0,
                longitude2: 0
            };
            bounds.latitude1 = this.latitude["0"].substring(0, this.latitude["0"].indexOf(".."));
            bounds.latitude2 = this.latitude["0"].substring(this.latitude["0"].indexOf("..") + 2);
            bounds.longitude1 = this.longitude["0"].substring(0, this.longitude["0"].indexOf(".."));
            bounds.longitude2 = this.longitude["0"].substring(this.longitude["0"].indexOf("..") + 2);

            return bounds;
        },
        getRanges: function () {
            return {
                latitude: this.latitude,
                longitude: this.longitude
            }
        }

    }

    /*This object is used to manage the Facet Ranges*/
    distanceFilters = {
        filterIsSet: function (filterID) {
            return String.contains(window.location.hash, filterID);
        },
        update: function (boundary) {
            distanceRanges.build(boundary);
            Assets.Location.Search.setLatFacet(distanceRanges.latitude);
            Assets.Location.Search.setLongFacet(distanceRanges.longitude);
        },
        updateFromURL: function (latFacet, longFacet) {
            distanceRanges.buildFromURL(latFacet, longFacet);
            Assets.Location.Search.setLatFacet(distanceRanges.latitude);
            Assets.Location.Search.setLongFacet(distanceRanges.longitude);
        },
        clean: function () {
            Assets.Location.Search.cleanLatFacet();
            Assets.Location.Search.cleanLongFacet();
        }
    };

    /*Returns true if the Google Response's type is allowed*/
    var isAllowedResultType = function (resultTypes) {
        var allowedResultTypes = ["street_address", "locality", "country", "postal_code", "colloquial_area",
                                  "neighborhood", "premise", "street_number", "administrative_area_level 1",
                                  "political"];

        /*Closure.function that makes the comparison between allowe results
        array and the returned results to check if they're allowed.
        We use a bitwise shift to avoid using two foreachs*/
        var checkResultType = function (element) {
            var result = !!~$.inArray(element, allowedResultTypes);
            return result;
        };

        return resultTypes.some(checkResultType);
    };

    /* Checks whether the resultTypes corresponds to a State Result */
    var isStateResultType = function (resultTypes) {
        var stateTypes = ['administrative_area_level_1', 'political'];

        var result = resultTypes.every(function (element) {
            return stateTypes.includes(element);
        });

        return result;
    }

    /*Throws a request to Google Geocode based on input
    This function is asynchronous so we have to use promises to use 
    its return value */
    var getLatitudeLongitude = function (address) {
        var deferred = $.Deferred(),
			geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (isAllowedResultType(results[0].types)) {
                    deferred.resolve(geocoderCallback(address, results[0]));
                }
                else {
                    deferred.reject(geocoderCallback(address));
                }
            }
            else {
                deferred.reject(geocoderCallback(address));
            }
        });

        return deferred.promise();
    };

    var geocoderCallback = function (searchedTerm, results) {
        if (results) {
            if (isStateResultType(results.types)) Assets.Location.Search.state.set("isStateSearch", 1);
            return results;
        }
        else {
            return searchedTerm;
        }
    }


    return {
        coordinates: coordinates,
        distanceRanges: distanceRanges,
        distanceFilters: distanceFilters,
        geocoderCall: getLatitudeLongitude
    }
})(jQuery, contextFields);