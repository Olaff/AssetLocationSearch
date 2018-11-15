Assets.createNamespace("Assets.Foundation.Global.Search");

/* Global Search Module */
Assets.Foundation.Global.Search = (function ($, module, coveoFields) {
    module.AuthorFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.authorFacet);
    module.TopicFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.topicFacet);
    module.TypeFacetID = module.facets.getFacetID(".CoveoFacet", coveoFields.typeFacet);
    module.Clear = coveoFields.Clear;
    module.Placeholder = coveoFields.Placeholder;

    return module
})(jQuery, Assets.Foundation.CoveoSearch.Base || {}, coveoFields);


Coveo.$(function () {
    var globalSearch = Assets.Foundation.Global.Search;

    globalSearch.model.on("afterComponentsInitialization", function (e, args) {
        var queryStateModel = globalSearch.model.coveo(Coveo.QueryStateModel);
       
        globalSearch.state.init(queryStateModel);
        globalSearch.state.register("seeMoreResults", 0);
    });

    globalSearch.model.on('newQuery', function (e, args) {
        globalSearch.state.refreshState("seeMoreResults");
    });

    globalSearch.model.on("doneBuildingQuery", function (e, args) {
        if (args && args.queryBuilder) {
            if (globalSearch.state.custom.seeMoreResults)
                args.queryBuilder.numberOfResults = globalSearch.state.custom.seeMoreResults;
        }
    });

    globalSearch.model.on("querySuccess", function (e, args) {
        
        if (args.results.totalCount >= globalSearch.state.custom.seeMoreResults &&
                args.results.totalCount >= globalSearch.resultsPerPage) {
            globalSearch.seeMore.$btnElement.show();
        } else {
            globalSearch.seeMore.$btnElement.hide();
        }
        
    });

    globalSearch.model.on("noResults", function (e, args) {
        globalSearch.seeMore.$btnElement.hide();
        Coveo.$('#filterResults').hide();
        globalSearch.state.buildNoResultsMessage();
    });

    globalSearch.model.on('querySuccess', function (e, args) {
        if (args.results.totalCount > 0) {
            Coveo.$(".custom-no-results-message-global").hide();
            Coveo.$(".CoveoQuerySummary").show();
        }
    });

    globalSearch.state.addListenerToStateChange("q", function (e, args) {
        globalSearch.state.set("seeMoreResults", 0);
        globalSearch.seeMoreClickedTimes = 0;
    });

    globalSearch.model.on("deferredQuerySuccess", function (e, args) {
        var searchbox = Coveo.$('.CoveoSearchbox');
        searchbox.find("input").attr("placeholder", $("<textarea/>").html(globalSearch.Placeholder).text()).attr("name", "q").attr("type", "search");
        searchbox.find('.magic-box-icon').text(globalSearch.Clear);
      
        // Hide the facets container if there are no facets
        var hasFacets = false;
        args.results.groupByResults.forEach(function (group) {
            hasFacets = hasFacets || group.values.length > 0;
        });

        if (!hasFacets) {
            Coveo.$('#filterResults').hide();
        } else {
            Coveo.$('#filterResults').show();
        }
     });

    globalSearch.state.addListenerToStateChange("seeMoreResults", globalSearch.seeMore.resetOnHide);
    globalSearch.state.addListenerToStateChange(globalSearch.AuthorFacetID, globalSearch.seeMore.resetOnStateChange);
    globalSearch.state.addListenerToStateChange(globalSearch.TopicFacetID, globalSearch.seeMore.resetOnStateChange);
    globalSearch.state.addListenerToStateChange(globalSearch.TypeFacetID, globalSearch.seeMore.resetOnStateChange);

    globalSearch.model.coveoForSitecore('init', CoveoForSitecore.componentsOptions);
    globalSearch.bindNewSearch();

    globalSearch.seeMore.$btnElement.on("click", globalSearch.seeMore.clickHandler);
});