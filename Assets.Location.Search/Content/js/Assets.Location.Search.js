Coveo.$(function () {
    var locationSearch = Assets.Location.Search;

    locationSearch.Map.init(contextFields.CurrentLanguage);

    locationSearch.model.on("afterComponentsInitialization", function () {
        var newQueryStateModel = locationSearch.model.coveo(Coveo.QueryStateModel);

        sessionStorage.clear();

        locationSearch.state.init(newQueryStateModel);
        locationSearch.state.register("isQueryAfterBoundsChange", 0);
        locationSearch.state.register("isGoogleQueryResult", 0);
        locationSearch.state.register("isNamedSearchQueryResult", 0);
        locationSearch.state.register("isEmptyQuery", 0);
        locationSearch.state.register("isNoResults", 0);
        locationSearch.state.register("isStateSearch", 0);
        locationSearch.state.register("seeMoreResults", 0);
    });

    locationSearch.model.on("newQuery", function (e, args) {
        var keyword = locationSearch.getKeyword();

        locationSearch.state.refreshState("isGoogleQueryResult");
        locationSearch.state.refreshState("isNamedSearchQueryResult");
        locationSearch.state.refreshState("seeMoreResults");
        locationSearch.state.refreshState("isNoResults");

        /* If the keyword is a four-digit input, then it's searching for a location, therefore we are going to redirect to the location detail*/
        if (locationSearch.isLocationIDSearch(keyword)) {
            var redirectToLocationUrl = String.format("{0}//{1}/{2}", window.location.protocol, window.location.hostname, keyword);
            window.location.replace(redirectToLocationUrl);
        }
        else if (locationSearch.StateMachine.isInState("Idle")) {
            locationSearch.StateMachine.transition({ type: "INPUT_CHANGED" }, { keyword: keyword, args: args });
        }
    });

    locationSearch.model.on("buildingQuery", function (e, args) {
        if (locationSearch.GeoModule.coordinates.isGeoIpWorking()) {
            locationSearch.StateMachine.transition({ type: "CALCULATING_DISTANCE" }, { args: args });
        }
        else {
            locationSearch.StateMachine.transition({ type: "EXECUTE_QUERY" });
        }
    });

    locationSearch.model.on("doneBuildingQuery", function (e, args) {
        if (args && args.queryBuilder) {
            if (locationSearch.state.custom.seeMoreResults)
                args.queryBuilder.numberOfResults = locationSearch.state.custom.seeMoreResults;
        }
    });

    locationSearch.model.on("querySuccess", function (e, args) {
        var isSeeMoreAvailable;
        if (args.results.totalCount > 0) {
            if (args.results.totalCount > locationSearch.state.custom.seeMoreResults &&
                args.results.totalCount > locationSearch.resultsPerPage) {
                locationSearch.seeMore.$btnElement.show();
            } else {
                locationSearch.seeMore.$btnElement.hide();
            }
            locationSearch.StateMachine.transition({ type: "HAS_RESULTS" }, { queryResults: args.results.results });
        }
        else {
            locationSearch.StateMachine.transition({ type: "RETRY_QUERY" });
        }
    });

    locationSearch.model.on("noResults", function (e, args) {
        locationSearch.StateMachine.transition({ type: "NO_RESULTS" });
    });

    locationSearch.model.on("deferredQuerySuccess", function () {
        var searchbox = Coveo.$('.CoveoSearchbox');
        searchbox.find("input").attr("placeholder", $("<textarea/>").html(locationSearch.Placeholder).text()).attr("name", "q").attr("type", "search");
        searchbox.find('.magic-box-icon').text(locationSearch.Clear);
        searchbox.find('.magic-box-icon').click(locationSearch.clearGoogleResult);
    });

    /* Custom Event Listeners */
    locationSearch.state.addListenerToStateChange("seeMoreResults", locationSearch.seeMore.resetOnHide);

    /*Reset see more and q before changing the facets to avoid inconsistent values*/
    locationSearch.state.addListenerToStateChange("q", locationSearch.seeMore.resetOnStateChange);
    locationSearch.state.addListenerToStateChange(locationSearch.LatFacetID, locationSearch.seeMore.resetOnStateChange);
    locationSearch.state.addListenerToStateChange(locationSearch.LongFacetID, locationSearch.seeMore.resetOnStateChange);

    for (var facetID of locationSearch.FiltersIDs)
    {
        locationSearch.state.addListenerToStateChange(facetID, locationSearch.seeMore.resetOnStateChange);
        locationSearch.state.addListenerToStateChange(facetID, locationSearch.refreshKeywordOnFacetChange);

    }
   

    locationSearch.model.coveoForSitecore('init', CoveoForSitecore.componentsOptions);
    locationSearch.bindNewSearch();
    locationSearch.seeMore.$btnElement.on("click", locationSearch.seeMore.clickHandler);
});