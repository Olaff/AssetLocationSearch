// Create the base namespace
Assets.createNamespace("Assets.Foundation.CoveoSearch.Base");

//Foundation Coveo Search Base Module
Assets.Foundation.CoveoSearch.Base = (function ($, coveoFields, contextFields) {
    /*Get the root element of Coveo Search Interface to fetch all needed elements */
    var coveoSearchModel = Coveo.$(coveoFields.modelID);
    var locationFilters = Coveo.$('#filterResults');
    var resultsPerPage = parseInt(Coveo.$(coveoSearchModel).attr("data-results-per-page"));


    /* Internal Module to handle Coveo Custom States */
    var stateModule = (function ($, coveoModel) {
        var queryStateModel;

        /*This object holds the states used in other pages and its populated dynamically*/
        var customStates = {};

        /*Registers a new state into Coveo QueryState object and saves it*/
        var registerNewState = function (newState, defaultValue) {
            this.queryStateModel.registerNewAttribute(newState, defaultValue);
            customStates[newState] = defaultValue;
        };

        /*Gets the current value of the state*/
        var get = function (selector) {
            return coveoModel.coveo('state', selector);
        };

        /*Sets the value of the state*/
        var set = function (state, value) {
            coveoModel.coveo('state', state, value);
            refreshCustomState(state);
        };

        /* Silent true allows us to change a state without triggering associated events */
        var setSilent = function (state, value) {
            coveoModel.coveo('state', state, value, { silent: true });
            refreshCustomState(state);
        }

        /*Blanks the value of the state*/
        var cleanState = function (selector) {
            coveoModel.coveo('state', selector, '');
        };

        /*Initalizes the module when its executed by instantiating a new QueryState object*/
        var init = function (queryStateModel) {
            if (queryStateModel) this.queryStateModel = queryStateModel;
            else console.log("QueryState Model is not defined, aborting");
        };

        /*Refresh the custom states value in the internal object to have consistency*/
        var refreshCustomState = function (state) {
            customStates[state] = get(state)
        };

        /*Adds a Listener function to the state change event of the state passed as argument*/
        var stateChangeListener = function (state, listener) {
            var stateEvent = String.format("state:change:{0}", state);
            coveoModel.on(stateEvent, listener);
        };

        var buildNoResultsMessage = function () {
            Coveo.$(".custom-results-message-global").hide();
            Coveo.$(".custom-no-results-message-global").show();
            Coveo.$(".CoveoQuerySummary").hide();
        };

        return {
            init: init,
            register: registerNewState,
            get: get,
            set: set,
            setSilent: setSilent,
            cleanState: cleanState,
            refreshState: refreshCustomState,
            custom: customStates,
            addListenerToStateChange: stateChangeListener,
            buildNoResultsMessage: buildNoResultsMessage
        }
    })($, coveoSearchModel);

    /* Internal Module to handle Coveo Facets */
    var facetsModule = (function ($, coveoModel, stateMod) {
        var fieldQueryString = "f:";

        

        /*Gets the Facet id from the DOM*/
        var getFacetID = function (facetClassOrId, coveoFacetField) {
            var facetSelectorExpression = "{0}[data-field='{1}']";
            var facetSelector = String.format(facetSelectorExpression, facetClassOrId, coveoFacetField);
            var facetID = fieldQueryString + coveoSearchModel.find(facetSelector).attr("id");
            return facetID;
        };
        
        
        /* Gets the IDs of all non-range facets*/
        var getFacetsIDs = function (facetClass) {
            var facetsIDs = [];
            var facets = coveoSearchModel.find(facetClass);

            Coveo.$.each(facets, function (index, value) {
                var facetID = String.format("{0}{1}", fieldQueryString, value.id);
                facetsIDs.push(facetID);
            });

            return facetsIDs;
        }

        /*Gets the current value of the facet*/
        var getFacetValue = function (facetID) {
            return stateMod.get(facetID);
        };

        /*Sets the current value of the facet*/
        var setFacetValue = function (facetID, value) {
            stateMod.set(facetID, value);
        };

        /*Blanks the facet value*/
        var cleanFacet = function (facetID) {
            stateMod.set(facetID, "");
        };


        return {
            fieldQueryString: fieldQueryString,
            getFacetID: getFacetID,
            getFacetsIDs: getFacetsIDs,
            getFacetValue: getFacetValue,
            setFacetValue: setFacetValue,
            CleanFacet: cleanFacet
        }

    })($, coveoSearchModel, stateModule);

    /* Internal Module to handle the See More Button Logic */
    var seeMoreModule = (function ($, coveoModel, stateModule) {
        var seeMoreClickedTimes = 0;
        var $seeMoreBtnElem = Coveo.$("#see-more-btn");


        /*Handler to reset the see more when any state changes*/
        var resetSeeMoreOnStateChange = function (e, args) {
            if (!stateModule.custom.isGoogleQueryResult) {
                stateModule.set("seeMoreResults", 0);
                seeMoreClickedTimes = 0;
            }
        };

        /*We have to reset the clicked times when the see more is hided*/
        var resetSeeMoreOnChange = function (e, args) {
            if (args.value === 0) {
                seeMoreClickedTimes = 0;
            }
        };

        var resetOnMapMove = function () {
            stateModule.set("seeMoreResults", 0);
            seeMoreClickedTimes = 0;
        }

        /*Everytime a user clicks on see more, this function is executed*/
        var seeMoreHandler = function () {
            var seeMoreResults;
            var keywordFromStorage = window.sessionStorage.getItem("searchKeyword");
            seeMoreClickedTimes++;

            /*We have to detect the first click to calculate the count of results shown.
			For the subsecuents clicks, we just multiply the resultsPerPage and the amount of clicks*/
            var currentMoreResults = stateModule.get("seeMoreResults");

            if (~currentMoreResults && seeMoreClickedTimes === 1) {
                seeMoreClickedTimes++;
                seeMoreResults = resultsPerPage * 2;
            }
            else {
                seeMoreResults = resultsPerPage * seeMoreClickedTimes;
            }

            /*Update the see more state*/
            stateModule.set("seeMoreResults", seeMoreResults);


            /*Before throwing the new query, we have to retain the keyword*/
            if (stateModule.custom.isNamedSearch && !stateModule.custom.isQueryAfterBoundsChange) {
                stateModule.set("q", keywordFromStorage);
            };

            /* Check if whether is the location search or the site search */
            if (Assets.Location) {
                Assets.Location.Search.StateMachine.transition({ type: "SEE_MORE_CLICKED" });
            }
            else {
                executeQuery();
            }

        };

        return {
            $btnElement: $seeMoreBtnElem,
            resetOnStateChange: resetSeeMoreOnStateChange,
            resetOnMapMove: resetOnMapMove,
            resetOnHide: resetSeeMoreOnChange,
            clickHandler: seeMoreHandler
        }


    })($, coveoSearchModel, stateModule);

    /* Internal Module to create custom objects based on the query results */
    var resultsModule = (function () {
        var resultItems = [];

        /*Factory Function that creates an object with the properties specified in
        propertiesNamesArray and fetches the value of the Coveo Query Result using
        as key the values stored in the valuesNamesArr */
        function ResultItemFactory(propertiesNamesArr, valuesNamesArr, queryResult) {
            if (propertiesNamesArr.length == valuesNamesArr.length) {
                var length = propertiesNamesArr.length;

                for (var i = 0; i < length; i++) {
                    this[propertiesNamesArr[i]] = queryResult.raw[valuesNamesArr[i]];
                }
                this["id"] = queryResult.uniqueId.match(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/i)[0];
            }
            else {
                console.error("Cannot create object because properties and values are not the same length");
            }
        }

        /* Builds the Custom item collection using two arrays: one with the name of the properties of the 
		custom object, the other with the keys of the raw results from Coveo array */
        var build = function (queryResults) {
            var propArray = ["name", "address", "phoneNumber", "latitude", "longitude", "code"];
            var valArray = [coveoFields.Name, coveoFields.Address, coveoFields.PhoneNumber,
							coveoFields.LatFieldName, coveoFields.LongFieldName, coveoFields.Code];
            this.resultItems = queryResults.map(function (queryResult) {
                return new ResultItemFactory(propArray, valArray, queryResult);
            });

            return this.resultItems;
        };

        var getResultByIndex = function (index) {
            return resultItems[index];
        };

        return {
            create: build,
            getByIndex: getResultByIndex,
        }
    })();

    /*Gets the current value of Coveo Search Input*/
    var getInputValue = function () {
        return Coveo.$(".CoveoSearchbox input").val();
    }

    /*Sets the valeu for the Coveo Search Input*/
    var setInputValue = function (value) {
        Coveo.$(".CoveoSearchbox input").val(value);
    }

    /*Returns true if the Coveo Search Input is empty*/
    var inputIsEmpty = function () {
        //undefined, null and empty strings are falsy values, therefore we negate it
        return !getInputValue();
    }

    /*Executes a new query*/
    var executeQuery = function () {
        coveoSearchModel.coveo("executeQuery");
    };

    /*Detects if the user comes from the back history*/
    var navIsBackForward = function () {
        return (performance.navigation.type == PerformanceNavigation.TYPE_BACK_FORWARD)
    }

    var bindNewSearch = function () {

        // Close the filter dropdown when the user clicks into the searchbox
        Coveo.$(".CoveoSearchbox input").focus(function () {
            if (Coveo.$("#filter-panel").hasClass('in')) {
                Coveo.$("#filterResults .see-more").trigger("click");
            }
        });

    };

    var customSortDistanceFunction = function (distanceField) {
        //Since all args comes as string, we need to parse them
        var distanceFieldNumeric = parseFloat(distanceField);
        return distanceField.sort(function (a, b) { return a - b });
    }


    return {
        model: coveoSearchModel,
        locationFilters: locationFilters,
        resultsPerPage: resultsPerPage,
        inputIsEmpty: inputIsEmpty,
        getKeyword: getInputValue,
        setKeyword: setInputValue,
        bindNewSearch: bindNewSearch,
        state: stateModule,
        facets: facetsModule,
        seeMore: seeMoreModule,
        results: resultsModule,
        navIsBackForward: navIsBackForward,
        executeQuery: executeQuery,
    }
})(jQuery, coveoFields, contextFields);