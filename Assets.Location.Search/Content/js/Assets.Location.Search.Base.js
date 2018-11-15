// Create the namespace for Location Search Pages
Assets.createNamespace("Assets.Location.Search");
//Assets.createNamespace("Assets.Location.Search.CityState");
//Assets.createNamespace("Assets.Location.Search.Custom");
//Assets.createNamespace("Assets.Location.Search.Map");

//Location Search Global Page Module
Assets.Location.Search = (function ($, module, coveoFields, contextFields) {
    module.LatField = coveoFields.Lat;
    module.LongField = coveoFields.Long;
    module.Placeholder = coveoFields.Placeholder;
    module.Clear = coveoFields.Clear;
    //module.PublicNameField = coveoFields.PublicName;
    module.CurrentLanguage = contextFields.CurrentLanguage;
    module.FiltersIDs = module.facets.getFacetsIDs(".CoveoFacet");
    //module.LocationTypeFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.LocationType);
    //module.SpecialFuneralServicesFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.SpecialFuneralServices);
    //module.SpecificLocationFeaturesFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.SpecificLocationFeatures);
    module.LatFacetID = module.facets.getFacetID(".CoveoFacetRange", coveoFields.Lat);
    module.LongFacetID = module.facets.getFacetID(".CoveoFacetRange", coveoFields.Long);
    module.DistFunction = "$qf(function:'dist({0},{1},{2},{3})',fieldName: '{4}')";
    module.ConvertDist = "$qf(function:'{0}' , fieldName: '{1}')";
    module.SortFunction = "$sort(criteria: '{0}', field: '{1}')";

    module.getDistanceUnits = function () {
        return contextFields.DistanceUnit;
    }


    module.buildDistanceQueryParameters = function (coords) {
        var distanceUnits = this.getDistanceUnits();
        /*Builds a Coveo Query Function Distance to be passed to the query builder
        First parameter: query function itself
        Second line of parameters: the indexed ranges fields
        Third line of parameters: the coordinates from which the distance will be calculated
        Last parameter: the name of the on-the-fly generated field*/
        var geoQuery = String.format(this.DistFunction,
                                     this.LatField, this.LongField,
                                     coords.latitude, coords.longitude,
                                     'distance');

        /*Converts the distance field to the desired rounded number, in this case
        a real number with one decimal place 
        The last parameter is the name of the on-the-fly generated field*/
        var convertQuery = String.format(this.ConvertDist,
                                         'round((@distance/' + distanceUnits + ') * 10) / 10',
                                         'distanceinmiles');

        /*Adds a sort criteria, in this case, the distance field
        The last parameter is the name of the on-the-fly generated field*/
        var sortFunction = String.format(this.SortFunction, 'fieldascending', '@distanceinmiles');


        return {
            geoQuery: geoQuery,
            convertQuery: convertQuery,
            sortFunction: sortFunction,
        };
    };

    /*Emulates the sessionStorage functionality */
    module.storage = {
        store: {},
        getItem: function (key) {
            return this.store[key];
        },
        setItem: function (key, value) {
            return this.store[key] = value + '';
        },
        clear: function () {
            this.store = {};
        }
    }

    module.getLatFacet = function () {
        return module.facets.getFacetValue(this.LatFacetID);
    };

    module.getLongFacet = function () {
        return module.facets.getFacetValue(this.LongFacetID);
    };

    module.setLatFacet = function (value) {
        module.facets.setFacetValue(this.LatFacetID, value);
    };

    module.setLongFacet = function (value) {
        module.facets.setFacetValue(this.LongFacetID, value);
    };

    module.cleanLatFacet = function () {
        module.facets.CleanFacet(this.LatFacetID);
    };

    module.cleanLongFacet = function () {
        module.facets.CleanFacet(this.LongFacetID);
    };

    module.setLocationTypeFacet = function (value) {
        module.facets.setFacetValue(this.LocationTypeFacetID, value);
    };

    module.setSpecialFuneralServicesFacet = function (value) {
        module.facets.setFacetValue(this.SpecialFuneralServicesFacetID, value);
    };

    module.setSpecificLocationFeaturesFacet = function (value) {
        module.facets.setFacetValue(this.SpecificLocationFeaturesFacetID, value);
    };

    module.locationTypeStateChange = function () {
        module.addListenerToStateChange(this.locationTypeFacetID, value)
    }

    module.showCoveoSummary = function () {
        Coveo.$(".CoveoQuerySummary").show();
    };

    module.showGoogleMap = function () {
        Coveo.$(".location-search-map").show();
    };

    module.hideCoveoNoResultsMessage = function () {
        Coveo.$(".CoveoQuerySummary").hide();
    };

    module.hideGoogleMap = function () {
        Coveo.$(".location-search-map").hide();
    };

    /* Hides the Coveo out of the box no results message and sets the the custom one */
    module.buildNoResultsMessage = function () {
        Coveo.$(".custom-results-message-global").hide();
        Coveo.$(".custom-no-results-message-global").show();
    };

    module.hideNoResultsMessage = function () {
        Coveo.$(".custom-no-results-message-global").hide();
    };

    module.prettifyCityState = function (cityValue, stateValue) {
        var prettyObject = { city: '', state: '' };

        if (cityValue && stateValue) {
            prettyObject.city = '<span class="text-capitalize">' + String.capitalize(cityValue) + '</span>';
            prettyObject.state = stateValue.toUpperCase();
        }

        return prettyObject
    };

    /* Builds the custom result message for the first load of the page */
    module.buildCustomResultMessageForInit = function () {
        if (contextFields.geoIPCity && contextFields.geoIPState && !contextFields.isCustomPage) {
            var cityState = "";
            if (contextFields.geoIPCity.toLowerCase() != 'n/a') {
                cityState = String.format("{0}, {1}", contextFields.geoIPCity, contextFields.geoIPState)
            }
            else {
                cityState = String.format("{0}", contextFields.geoIPState)
            }

            Coveo.$(".custom-results-message-global").show();
            Coveo.$(".global-search-text").html(cityState);
            contextFields.geoIPSCitytate = cityState;
        }
        else {
            Coveo.$(".custom-results-message-global").hide();
        }
    };

    module.buildCustomResultMessageCityState = function (cityValue, stateValue) {
        Coveo.$("#default-title").hide();
        var cityStateTitle = Coveo.$(".custom-results-message-citystate").show();
        var defaultContent = cityStateTitle.html();
        var prettyCS = this.prettifyCityState(cityValue, stateValue);
        var cityStateMessage = (prettyCS && prettyCS.city && prettyCS.state) ? String.format(defaultContent, prettyCS.city, prettyCS.state) : "";
        cityStateTitle.html(cityStateMessage);
    };

    /* Builds the feedback message for Global Funeral Homes in the format: Showing results from  */
    module.buildCustomResultMessageGlobal = function (searchInput) {
        if (searchInput) {
            var cityState = '';

            //If has GeoIP and is not Google, display FROM info. Important for understand the distance
            if (contextFields.geoIPSCitytate && !module.state.custom.isGoogleQueryResult) {
                cityState = ' - ' + contextFields.geoIPSCitytate;
            }
            Coveo.$(".custom-results-message-global").show();
            Coveo.$(".global-search-text").html(searchInput + cityState);
        }
    };

    module.hideCustomResultMessageGlobal = function () {
        Coveo.$(".custom-results-message-global").hide();
    };

    module.buildRedirectURL = function (keyword) {
        var pattern = "/{0}.*$";
        var relativeUrl = contextFields.currentUrl;

        //In case web.config doesn't take the values
        var sanitizedUrl = relativeUrl.replace(" ", "-").replace("/*", "");

        if (contextFields.currentItemName === "*") { //city-state page
            pattern = String.format(pattern, "[*]/g");
        }
        else { // Custom Landing Page
            pattern = String.format(pattern, contextFields.currentItemName.replace(/\s/g, "-"))
        }

        //var pattern = String.format("/{0}.*$", );
        var regex = new RegExp(pattern, ["i"]);
        var cleanedUrl = sanitizedUrl.replace(regex, "");

        var redirectUrl = cleanedUrl.concat("#q=", keyword);
        return redirectUrl;
    };

    /* Skips the Google Geocode Request if the search input belongs to the list of values to be skipped*/
    module.skipGoogleSearch = function (searchInput) {
        var cleanedSearchInput = searchInput.toLowerCase().trim()
        var skippedValuesArr = contextFields.SkipGoogleValues.split(",");

        var cleanedArrValues = skippedValuesArr.map(function (element) {
            return element.toLowerCase().trim();
        });

        var result = cleanedArrValues.some(function (cleanedElement, index, array) {
            return cleanedElement === cleanedSearchInput;
        });

        return result;
    };

    /* Returns true whether the search input matches with a four digit string */
    module.isLocationIDSearch = function (searchInput) {
        var regexPattern = /^\d{4}$/;
        return regexPattern.test(searchInput);
    }

    module.clearGoogleResult = function () {
        if (module.state.custom.isGoogleQueryResult) {
            module.setKeyword("");
            module.state.cleanState("q");
            module.executeQuery();
        }
    }

    return module;
})(jQuery, Assets.Foundation.CoveoSearch.Base || {}, coveoFields, contextFields);