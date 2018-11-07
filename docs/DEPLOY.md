# Deployment in CMS

This document describes the CSS, JS and other dependencies of the reactor database, and the way that the various reactor pages can be deployed:

* Global Dashboard
* Reactor Search
* Reactor Pages
* Country Pages
* Generic Report


## Required CSS files

The following CSS is required by all pages (in this order):

* CSS for the Framework: service/static/css/reactordb.onlydeps.framework.css
    * This includes only bootstrap 3's css, and therefore may not be required if this is already present in the CMS
* CSS for bundled 3rd party dependencies: service/static/css/reactordb.onlydeps.implementation.css
    * This includes the css for the following libraries:
        * nvd3
        * tablesorter
* CSS for externally hosted 3rd party dependencies: https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css
    * This just provides a reference to Font Awesome 4.5.0
* CSS for the application: service/static/css/reactordb.nodeps.full.css
    * This contains css for the following components:
        * The reactor database itself
        * glyphtofa
        * Edges

For example:

```html
    <link rel="stylesheet" href="/static/css/reactordb.onlydeps.framework.css">
    <link rel="stylesheet" href="/static/css/reactordb.onlydeps.implementation.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="/static/css/reactordb.nodeps.full.css">
```


## Required JavaScript Files

The following JS is required by all pages:

* JS for the framework: service/static/js/reactordb.onlydeps.framework.js
    * This consists of the following libraries, which may already be present in your CMS and therefore may not be required
        * jquery
        * bootstrap
* JS for the bundled 3rd party dependencies: service/static/js/reactordb.onlydeps.implementation.no-gm.js
    * This consists of the following 3rd party libraries:
        * d3
		* papaparse
		* nvd3
		* tablesorter
		* showdown
* JS for the application: service/static/js/reactordb.nodeps.full.js
    * This contains the JS for the following components:
        * The reactor database itself
        * Edges

For example:

```html
    <script type="text/javascript" src="/static/js/reactordb.onlydeps.framework.js"></script>
    <script type="text/javascript" src="/static/js/reactordb.onlydeps.implementation.no-gm.js"></script>
    <script type="text/javascript" src="/static/js/reactordb.nodeps.full.js"></script>
```


### Additional Assets

In order to function, the reactor database needs a number of other assets to be present in the CMS to provide the data
and other resources for the visualisation.  These are:

* The Nuclear Share Data.  This is a CSV which provides a list of countries, and their nuclear share by year, as well as a line
with the GLOBAL nuclear share.  See static/data/share-of-electricity-generation.csv for an example.  This file should be available
at a URL within the CMS, and is provided to the pages when they are created, as documented in the relevant sections below.

* The background image for the "Operable Reactors" count.  This is an image (ideally an SVG) that is displayed behind the count
of operable reactors which appears on the dashboard, country pages and generic report.  This file should be available
at a URL within the CMS, and is provided to the pages when they are created, as documented in the relevant sections below.

* The background image for the "Under Construction Reactors" count.  This is an image (ideally an SVG) that is displayed behind the count
of under construction reactors which appears on the dashboard, country pages and generic report.  This file should be available
at a URL within the CMS, and is provided to the pages when they are created, as documented in the relevant sections below.

* The backgrount image for the "Reactors Shutdown" count.  This is an image (ideally an SVG) that is displayed
behind the count of shutdown reactors which appears on the generic report.  This file should be available at a URL within the
CMS, and is provided to the pages when they are created, as documented in the relevant sections below.


### Global Dashboard

To deploy, include a div with id "dashboard" and then call reactordb.makeDashboard() with suitable arguments.

```html
<div id="dashboard"></div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    reactordb.makeDashboard({
        year: 2016,
        nuclearShareURL: "/static/data/nuclear-share.csv",
        reactorsBackground: "/static/images/operableReactors.svg",
        underConstructionBackground: "/static/images/underConstruction.svg",
        reactorPageURLTemplate: "/reactor/{reactor_name}",
        countryPageURLTemplate: "/country/{country_name}",
        searchPageURL : "/search",
        reactor_search_url: "/query/reactor/_search",
        operation_search_url: "/query/operation/_search"
    });
});
</script>
```

makeDashboard takes a number of arguments you can supply:

**Arguments you need to supply**

* year - year for which to present data.
* nuclearShareURL - the URL to the CSV containing the nuclear share data
* reactorsBackground - image to use as background for count of operable reactors
* underConstructionBackground - image to use as background for count of under construction reactors
* reactorPageURLTemplate - the URL template for the reactor page, with "{reactor_name}" being replaced by the actual reactor name
* countryPageURLTemplate - the URL template for the country page, with "{country_name}" being replaced by the actual country name
* searchPageURL - the URL to the reactor search page
* reactor_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain
* operation_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain

**Additional arguments that you can probably leave as default**

* selector - the jQuery selector for the div into which the dashobard will be rendered.  Defaults to "#dashboard"
* operation_index - the index name for operation data.  Defaults to "operation"
* reactor_index - the index name for reactor data.  Defaults to "reactor"
* topOperableCapacities - max number of top X operable capacities, defaults to 10
* topUnderConstructionCapacities - max number of top under construction capacities, defaults 10
* mostRecentGridConnections - max number of most recent grid connections, defaults to 10
* mostRecentConstructionStarts - max number of most recent construction starts, defaults to 10
* topLoadFactors - max number of top load factors, defaults to 10
* topLifetimeGenerations - max number of top lifetime generations, defaults to 10
* topAnnualGenerations - max number of top annual generations, defaults to 10


### Reactor Search Page

To deploy, include a div with id "reactor-search" and then call reactordb.makeSearch() with suitable arguments

```html
    <div id="reactor-search"></div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        reactordb.makeSearch();
    });
    </script>
```

makeSearch takes several arguments that may need to be supplied:

* selector - the selector for the div into which the search will be rendered.  Defaults to #reactor-search
* search_url - the URL of the search service API for querying reactors.  Defaults to /query/reactor/_search in the current domain.
* reactor_base_url - the base URL of the reactor page.  When appended with the reactor ID, this should resolve to the reactor page.  Defaults to /reactor/ in the current domain.
* genericPageURLTemplate - the URL template for the generic report page, with the placeholder {query} for the search query. Note the use of the ref=search parameter if you want the user to be able to back-navigate to the search page later

For example:

```html
    <div id="jquery-selector-for-div"></div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        reactordb.makeSearch({
            selector : "#jquery-selector-for-div".
            search_url : "//api.wna.com/reactordb/query/reactor/_search",
            reactor_base_url: "//api.wna.com/reactor/",
            genericPageURLTemplate: "/generic?ref=search&source={query}"
        });
    });
    </script>
```

### Reactor Page

The reactor page requires the following additional javascript:

* JS for the externally hosted 3rd party dependencies: https://maps.googleapis.com/maps/api/js?key={{map_key}}
    * This just provides a reference to the Google Maps javascript

For example:

```html
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key={{map_key}}"></script>
```

To deploy, include a div with id "reactor-page" then call reactordb.makeReactorPage() when the document has loaded

```html
    <div id="reactor-page"></div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        reactordb.makeReactorPage();
    });
    </script>
```

makeReactorPage takes several arguments which may need to be set:

* selector - the selector for the div into which the reactor page will be rendered.  Defaults to #reactor-page
* reactor_search_url - the URL of the search service API for querying reactors.  Defaults to /query/reactor/_search in the current domain.
* operation_search_url - the URL of the search service API for querying operation history.  Defaults to /query/operation/_search in the current domain.
* id_regex - a RegExp object which can extract the reactor name from the path portion of the URL (e.g. /reactor/ARMENIAN-1).  Defaults to "new RegExp("reactor\/(.+)");"
* reactor_name - can be used instead of id_regex - specifies the reactor name around which to build the page

For example:

```html
    <div id="my-reactor"></div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        reactordb.makeReactorPage({
            selector: "#my-reactor"
            reactor_search_url: "//wna.com/reactordb/query/reactor/_search",
            operation_search_url: "//wna.com/reactordb/query/operation/_search",
            id_regex: new RegExp("reactor\/(.+)")
        });
    });
    </script>
```


### Country Page

To deploy, include a div with id "country-report" and then call reactordb.makeCountryReport() with suitable arguments.

```html
<div id="country-report"></div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    reactordb.makeCountryReport({
        year: 2016,
        nuclearShareURL: "/static/data/nuclear-share.csv",
        reactorsBackground: "/static/images/operableReactors.svg",
        underConstructionBackground: "/static/images/underConstruction.svg",
        reactorPageURLTemplate: "/reactor/{reactor_name}",
        country_regex: new RegExp("country\/(.+)"),
        reactor_search_url: "//reactordb.world-nuclear.org/query/reactor/_search",
        operation_search_url: "//reactordb.world-nuclear.org/query/operation/_search"
    });
});
</script>
```

makeCountryReport takes a number of arguments you can supply:

**Arguments you need to supply**

* year - year for which to present data.
* nuclearShareURL - the URL to the CSV containing the nuclear share data
* reactorsBackground - image to use as background for count of operable reactors
* underConstructionBackground - image to use as background for count of under construction reactors
* reactorPageURLTemplate - the URL template for the reactor page, with "{reactor_name}" being replaced by the actual reactor name
* country_regex - regular expression to extract country name from the url.  Defaults to `new RegExp("country\/(.+)")`
* reactor_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain
* operation_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain

**Additional arguments that you can probably leave as default**

* selector - the jQuery selector for the div into which the dashobard will be rendered.  Defaults to "#country-report"
* operation_index - the index name for operation data.  Defaults to "operation"
* reactor_index - the index name for reactor data.  Defaults to "reactor"
* country_name - explicitly supply the name of the country for the report.  Most likely this should be left blank, and the country determined
from the `country_regex`.  Defaults to extracting the country name from the country_regex.



### Generic Report Page

TODO

To deploy, include a div with id "generic-report" and then call reactordb.makeGenericReport() with suitable arguments.

```html
<div id="generic-report"></div>

<script type="text/javascript">
jQuery(document).ready(function($) {
    var year = 2016
    reactordb.makeGenericReport({
        year: year,
        reactor_search_url: "//reactordb.world-nuclear.org/query/reactor/_search",
        operation_search_url: "//reactordb.world-nuclear.org/custom/operation/_search?year=" + year,
        reactorPageURLTemplate: "/reactor/{reactor_name}",
        countryPageURLTemplate: "/country/{country_name}",
        searchPageURLTemplate: "/search?source={query}",
        reactorsBackground: "/static/images/operableReactors.svg",
        underConstructionBackground: "/static/images/underConstruction.svg",
        shutdownBackground: "/static/images/shutdownReactors.svg"
    });
});
</script>
```

makeGenericReport takes a number of arguments you can supply:

**Arguments you need to supply**

* year - year for which to present data.
* reactor_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain
* operation_search_url - the URL for the ES reactor search.  Defaults to the reactor_index query endpoint on the current domain.  NOTE: in live, this must be set to the custom operation query endpoint, rather than the default one
* reactorPageURLTemplate - the URL template for the reactor page, with "{reactor_name}" being replaced by the actual reactor name
* countryPageURLTemplate - the URL template for the country page, with "{country_name}" being replaced by the actual country name
* searchPageURLTemplate - the URL template for the search page, with "{query}" being replaced by the search query
* reactorsBackground - image to use as background for count of operable reactors
* underConstructionBackground - image to use as background for count of under construction reactors
* shutdownBackground - image to use as background for count of shutdown reactors

**Additional arguments that you can probably leave as default**

* selector - the jQuery selector for the div into which the dashobard will be rendered.  Defaults to "#generic-report"
* operation_index - the index name for operation data.  Defaults to "operation"
* reactor_index - the index name for reactor data.  Defaults to "reactor"
* topX - the maximum number of results to display for "Top X" charts
