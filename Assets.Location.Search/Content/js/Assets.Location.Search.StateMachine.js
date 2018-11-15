Assets.Location.Search.StateMachine = (function ($) {
    var currentState = 'Idle';

    var updateState = function (newState) {
        currentState = newState;
        console.info("Machine Current State:", currentState);
    };

    var isInState = function (state) {
        return currentState === state;
    };

    var setInitialState = function (state) {
        currentState = state;
    };

    var addStates = function (newStates) {
        for (newState in newStates) {
            if (states.hasOwnProperty(newState)) {
                for (key in newStates[newState])
                {
                    states[newState][key] = newStates[newState][key];
                }
            }
            else {
                states[newState] = newStates[newState];
            }
        }
    }

    var reset = function () {
        updateState("Idle");
    }

	var states = {
		Idle: {
		    'INPUT_CHANGED': 'NewQueryTriggered',
			'MOVE_MAP': 'MapIdle',
			'SEE_MORE_CLICKED': 'SeeMoreQuery',
		},
		EmptyQuery: {
			'CALCULATING_DISTANCE': 'CalculateDistanceForNamedSearchQuery',
			'EXECUTE_QUERY': 'NamedSearchQuery'
		},
		NewQueryTriggered: {
			'GEOCODE_CALL': 'CancelledQuery',
			'SEARCH_INPUT_BLANK': 'EmptyQuery',
			'SKIP_GEOCODE_CALL': 'SkippedGoogleQuery'
		},
		CancelledQuery: {
			'GEOCODE_OK': 'BuildingGoogleQuery',
			'GEOCODE_FAIL': 'BuildingNamedSearchQuery',
		},
		MapIdle: {
			"EXECUTE_QUERY_FROM_BOUNDS_CHANGE": 'BuildingBoundsChangeQuery'
		},
		BuildingGoogleQuery: {
			'CALCULATING_DISTANCE': 'CalculateDistanceForGoogleQuery',
			'EXECUTE_QUERY': 'GoogleQuery'
		},
		SkippedGoogleQuery: {
			'CALCULATING_DISTANCE': 'CalculateDistanceForNamedSearchQuery',
			'EXECUTE_QUERY': 'NamedSearchQuery'
		},
		BuildingNamedSearchQuery: {
			'CALCULATING_DISTANCE': 'CalculateDistanceForNamedSearchQuery',
			'EXECUTE_QUERY': 'NamedSearchQuery'
		},
		BuildingBoundsChangeQuery: {
			'CALCULATING_DISTANCE': 'CalculateDistanceForBoundsChangeQuery',
			'EXECUTE_QUERY': 'BoundsChangeQuery'
		},
		GoogleQuery: {
			'HAS_RESULTS': 'GoogleResults',
			'NO_RESULTS': 'GoogleNoResults'
		},
		NamedSearchQuery: {
			'HAS_RESULTS': 'NamedSearchResults',
			'NO_RESULTS': 'NamedSearchNoResults'
		},
		BoundsChangeQuery: {
			'HAS_RESULTS': 'BoundsChangeQueryResults',
			'NO_RESULTS': 'BoundsChangeQueryNoResults'
		},
		SeeMoreQuery: {
			'FROM_GOOGLE_QUERY': 'BuildingGoogleQuery',
			'FROM_NAMED_SEARCH_QUERY': 'BuildingNamedSearchQuery',
			"FROM_BOUNDS_CHANGE_QUERY": "BuildingBoundsChangeQuery",
			"FROM_EMPTY_QUERY": "EmptyQuery"
		},
		CalculateDistanceForGoogleQuery: {
			'HAS_RESULTS': 'GoogleResults',
			'NO_RESULTS': 'GoogleNoResults'
		},
		CalculateDistanceForNamedSearchQuery: {
			'HAS_RESULTS': 'NamedSearchResults',
			'NO_RESULTS': 'NamedSearchNoResults'
		},
		CalculateDistanceForBoundsChangeQuery: {
			'HAS_RESULTS': 'BoundsChangeQueryResults',
			'NO_RESULTS': 'BoundsChangeQueryNoResults'
		},
		GoogleResults: {
			'QUERY_ENDS': 'QueryEnded'
		},
		GoogleNoResults: {
			'RETRY_QUERY': 'BuildingNamedSearchQuery'
		},
		NamedSearchResults: {
			'QUERY_ENDS': 'QueryEnded'
		},
		NamedSearchNoResults: {
			'QUERY_ENDS': 'QueryEnded'
		},
		BoundsChangeQueryResults: {
			'QUERY_ENDS': 'QueryEnded'
		},
		BoundsChangeQueryNoResults: {
			'QUERY_ENDS': 'QueryEnded'
		},
		QueryEnded: {
			'IDLE': 'Idle'
		}
	}

    var transition = function (action, payload) {
        var nextStateMachineState = states[currentState][action.type];

        if (nextStateMachineState) {
            updateState(nextStateMachineState);

            if (payload && payload.moduleName) {
                command[payload.moduleName](nextStateMachineState, action, payload)
            }
            else {
                command.base(nextStateMachineState, action, payload);
            }
        }
        else {
            var message = String.format("Couldn't make transition for state {0} and action {1}", currentState, action.type);
            console.info(message)
        }
    }

    var command = {
        base: function (nextState, action, payload) {
            switch (nextState) {
                case 'Idle':
                    break;
                case 'EmptyQuery':
                    Assets.Location.Search.buildCustomResultMessageForInit();
                    Assets.Location.Search.state.set("isEmptyQuery", 1);
                    break;
                case 'NewQueryTriggered':
                    /*Reset states*/
                    Assets.Location.Search.state.set("isGoogleQueryResult", 0);
                    Assets.Location.Search.state.set("isStateSearch", 0);
                    Assets.Location.Search.state.set("isNamedSearchQueryResult", 0);
                    Assets.Location.Search.state.set("isEmptyQuery", 0);
                    Assets.Location.Search.state.set("isQueryAfterBoundsChange", 0);

                    /*Reset distance filters */
                    Assets.Location.Search.GeoModule.distanceFilters.clean();

                    /* Show Messages elements */
                    Assets.Location.Search.showCoveoSummary();
                    Assets.Location.Search.showGoogleMap();
                    Assets.Location.Search.hideNoResultsMessage();

                    if (action && action.type == "INPUT_CHANGED") {
                        if (payload.keyword) {

                            payload.args.cancel = true;
                            Assets.Location.Search.storage.setItem("searchKeyword", payload.keyword);
                            //window.sessionStorage.setItem("searchKeyword", payload.keyword);

                            if (Assets.Location.Search.skipGoogleSearch(payload.keyword)) {
                                payload.args.cancel = false;
                                transition({ type: "SKIP_GEOCODE_CALL" }, { keyword: payload.keyword });
                            }
                            else {
                                transition({ type: "GEOCODE_CALL" }, { keyword: payload.keyword });
                            }
                        }
                        else {
                            Assets.Location.Search.storage.setItem("searchKeyword", "");
                            transition({ type: "SEARCH_INPUT_BLANK" });
                        }
                    }
                    break;
                case 'CancelledQuery':
                    Assets.Location.Search.GeoModule.geocoderCall(payload.keyword)
                           .done(function (results) {
                               transition({ type: "GEOCODE_OK" }, { geocodeResult: results });
                           })
                           .fail(function (results) {
                               transition({ type: "GEOCODE_FAIL" }, { keyword: payload.keyword });
                           });
                    break;
                case 'MapIdle':
                    Assets.Location.Search.seeMore.resetOnMapMove();
                    transition({ type: "EXECUTE_QUERY_FROM_BOUNDS_CHANGE" })
                    break;
                case 'BuildingGoogleQuery':
                    if (payload && payload.geocodeResult) {
                        var newFiltersBounds,
                            newLatitude = payload.geocodeResult.geometry.location.lat(),
                            newLongitude = payload.geocodeResult.geometry.location.lng();

	                    Assets.Location.Search.state.cleanState("q");
                        Assets.Location.Search.GeoModule.coordinates.update(newLatitude, newLongitude);
                        newFiltersBounds = Assets.Location.Search.Map.createBoundsFromCoordinates(Assets.Location.Search.GeoModule.coordinates);
                        Assets.Location.Search.GeoModule.distanceFilters.update(newFiltersBounds);

                        Assets.Location.Search.state.set("isGoogleQueryResult", 1);
                    }

                    Assets.Location.Search.executeQuery();
                    break;
                case 'BuildingNamedSearchQuery':
                    Assets.Location.Search.GeoModule.distanceFilters.clean();
                    Assets.Location.Search.state.set("isNamedSearchQueryResult", 1);
                    Assets.Location.Search.executeQuery();
                    break;
                case 'BuildingBoundsChangeQuery':
                    /* Show Messages elements */
                    Assets.Location.Search.showCoveoSummary();
                    Assets.Location.Search.showGoogleMap();
                    Assets.Location.Search.hideNoResultsMessage();
                    /*Remove Q if its a google result */
                    if (Assets.Location.Search.state.custom.isGoogleQueryResult) Assets.Location.Search.state.cleanState("q");
                    /* Fetch the new boundaries after moving the map and its center */
                    var newBoundaries = Assets.Location.Search.Map.getMapBounds();
                    var mapCenter = Assets.Location.Search.Map.getCenterFromBounds(newBoundaries);

                    /*Update the RangeFacet values and the parameters needed for center the map */
                    Assets.Location.Search.GeoModule.coordinates.update(mapCenter.lat(), mapCenter.lng());
                    Assets.Location.Search.GeoModule.distanceFilters.update(newBoundaries)

                    /*Update state and throw the query*/
                    Assets.Location.Search.state.set("isQueryAfterBoundsChange", 1);
                    Assets.Location.Search.executeQuery();
                    break;
                case 'SeeMoreQuery':
                    if (Assets.Location.Search.state.custom.isQueryAfterBoundsChange) {
                        transition({ type: "FROM_BOUNDS_CHANGE_QUERY" });
                    }
                    else if (Assets.Location.Search.state.custom.isGoogleQueryResult) {
                        Assets.Location.Search.state.cleanState("q");
                        transition({ type: "FROM_GOOGLE_QUERY" });
                    }
                    else if (Assets.Location.Search.state.custom.isNamedSearchQueryResult) {
                        transition({ type: "FROM_NAMED_SEARCH_QUERY" })
                    }
                    else {
                        transition({ type: "FROM_EMPTY_QUERY" });
                        Assets.Location.Search.executeQuery();
                    }
                    break;
                case 'CalculateDistanceForGoogleQuery':
                    if (payload && payload.args) {
                        var isStateTypeSearch = Assets.Location.Search.storage.getItem("isState");
                        var distanceQueryParams = Assets.Location.Search.buildDistanceQueryParameters(Assets.Location.Search.GeoModule.coordinates.current);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.geoQuery);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.convertQuery);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.sortFunction);


                        if (!Assets.Location.Search.state.custom.isStateSearch) {
                            payload.args.queryBuilder.advancedExpression.addFieldExpression("@distanceinmiles", "<", ["50"]);
                        }
                    }
                    break;
                case 'CalculateDistanceForNamedSearchQuery':
                    if (payload && payload.args) {
                        var distanceQueryParams = Assets.Location.Search.buildDistanceQueryParameters(Assets.Location.Search.GeoModule.coordinates.geoIP);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.geoQuery);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.convertQuery);
                        if (Assets.Location.Search.state.custom.isEmptyQuery) payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.sortFunction);
                    }
                    break;
                case 'CalculateDistanceForBoundsChangeQuery':
                    if (payload && payload.args) {
                        var distanceQueryParams = Assets.Location.Search.buildDistanceQueryParameters(Assets.Location.Search.GeoModule.coordinates.current);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.geoQuery);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.convertQuery);
                        payload.args.queryBuilder.advancedExpression.add(distanceQueryParams.sortFunction);
                    }
                    break;
                case 'GoogleResults':
                    if (payload.queryResults) {
                        var results = Assets.Location.Search.results.create(payload.queryResults);

                        /* Center the map using the GeocodeResult that was stored in previous state*/
                        Assets.Location.Search.Map.centerMap(Assets.Location.Search.GeoModule.coordinates);
                        Assets.Location.Search.Map.pins.drawInMap(results);

                    }

                    transition({ type: "QUERY_ENDS" });
                    break;
                case 'GoogleNoResults':
                    var keyword = Assets.Location.Search.storage.getItem("searchKeyword");

                    Assets.Location.Search.state.set("isGoogleQueryResult", 0);
                    Assets.Location.Search.state.set("q", keyword);
                    break;
                case 'NamedSearchResults':
                    if (payload.queryResults) {
                        var results = Assets.Location.Search.results.create(payload.queryResults);
                        var resultBounds = Assets.Location.Search.Map.buildRadiusFromResults(results);
                        var radiusCenter = Assets.Location.Search.Map.getCenterFromBounds(resultBounds);

                        /*Build a radius using the Lat&Long of the results. Fetch its center and send it to the map */
                        Assets.Location.Search.GeoModule.coordinates.update(radiusCenter.lat(), radiusCenter.lng());
                        Assets.Location.Search.Map.updateBoundaries(resultBounds);
                        Assets.Location.Search.Map.centerMap(Assets.Location.Search.GeoModule.coordinates);
                        Assets.Location.Search.Map.pins.drawInMap(results);
                    }

                    transition({ type: "QUERY_ENDS" });
                    break;
                case 'NamedSearchNoResults':
                    Assets.Location.Search.hideCoveoNoResultsMessage();
                    Assets.Location.Search.hideGoogleMap();
                    Assets.Location.Search.buildNoResultsMessage();
                    transition({ type: "QUERY_ENDS" });
                    break;
                case 'BoundsChangeQueryResults':
                    if (payload.queryResults) {
                        var results = Assets.Location.Search.results.create(payload.queryResults);
                        Assets.Location.Search.Map.pins.drawInMap(results);
                        Assets.Location.Search.buildCustomResultMessageGlobal(keywordFromStorage);
                    }

                    transition({ type: "QUERY_ENDS" });
                    break;
                case 'BoundsChangeQueryNoResults':
                    Assets.Location.Search.hideCoveoNoResultsMessage();
                    Assets.Location.Search.buildNoResultsMessage();
                    transition({ type: "QUERY_ENDS" });
                case 'QueryEnded':
                    var keywordFromStorage = Assets.Location.Search.storage.getItem("searchKeyword");

                    if (keywordFromStorage) {
                        Assets.Location.Search.state.set("q", keywordFromStorage);
                    }

                    Assets.Location.Search.buildCustomResultMessageGlobal(keywordFromStorage);
                    transition({ type: "IDLE" });
                    break;
                default:
                    break;
            }
        }
    }

    var addCommand = function (moduleName, newCommand) {
        command[moduleName] = newCommand;
    }

    return {
        transition: transition,
        addStates: addStates,
        addCommand: addCommand,
        isInState: isInState,
        reset: reset,
        setInitialState: setInitialState
    }
})(jQuery)