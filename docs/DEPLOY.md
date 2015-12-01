# Deployment in CMS

This document describes the CSS and JS dependencies of the reactor database, and the way that the reactor search
and reactor pages can be deployed.

## Required CSS files

The following CSS are required by both the reactor search and the reactor page:

* Font Awesome 4.5.0 - https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css
* Bootstrap 3.3.1 - magnificent-octopus/octopus/static/vendor/bootstrap-3.3.1/css/bootstrap.min.css
* Reactor DB CSS - service/static/css/reactordb.edges.css
* Edges Bootstrap 3 layout additional CSS - magnificent-octopus/octopus/static/vendor/edges/css/bs3.edges.css

For example:

```html
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="/static/vendor/bootstrap-3.3.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="/static/css/reactordb.edges.css">
    <link rel="stylesheet" href="/static/vendor/edges/css/bs3.edges.css">
```

### Reactor Search Page

There are no additional CSS files requires specifically for the reactor search page

### Reactor Page

The following additional CSS is required for the reactor page

* NVD3 1.8.1 - magnificent-octopus/octopus/static/vendor/edges/vendor/nvd3-1.8.1/nv.d3.css
* Edges Google Maps layout additional CSS - magnificent-octopus/octopus/static/vendor/edges/css/google.edges.css

For example:

```html
    <link rel="stylesheet" href="/static/vendor/edges/vendor/nvd3-1.8.1/nv.d3.css">
    <link rel="stylesheet" href="/static/vendor/edges/css/google.edges.css">
```

## Required JavaScript Files

The following JS is required by both the reactor search page and the reactor page

* JQuery 1.11.1 - magnificent-octopus/octopus/static/vendor/jquery-1.11.1/jquery-1.11.1.min.js
* Bootstrap 3.3.1 - magnificent-octopus/octopus/static/vendor/bootstrap-3.3.1/js/bootstrap.min.js
* Edges ElasticSearch layer - magnificent-octopus/octopus/static/vendor/edges/es.js
* Edges Core - magnificent-octopus/octopus/static/vendor/edges/edges.js
* Edges Bootstrap 3 Layout - magnificent-octopus/octopus/static/vendor/edges/bs3.edges.js
* ReactorDB custom layout - service/static/js/reactordb.edges.js

For example:

```html
    <script type="text/javascript" src="/static/vendor/jquery-1.11.1/jquery-1.11.1.min.js"></script>
    <script type="text/javascript" src="/static/vendor/bootstrap-3.3.1/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/es.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/edges.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/bs3.edges.js"></script>
    <script type="text/javascript" src="/static/js/reactordb.edges.js"></script>
```

### Reactor Search Page

The reactor search page does not require any additional JS libraries.

To deploy, include a div with id "reactor-search" and then call reactordb.makeSearch() when the document has finished loading

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

For example:

```html
    <div id="jquery-selector-for-div"></div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        reactordb.makeSearch({
            selector : "#jquery-selector-for-div".
            search_url : "http://api.wna.com/reactordb/query/reactor/_search",
            reactor_base_url: "http://api.wna.com/reactor/"
        });
    });
    </script>
```

### Reactor Page

The reactor page requires the following additional javascript:

* Google Maps (you will require a Google Maps API key) - https://maps.googleapis.com/maps/api/js?key={{map_key}}
* Showdown 1.2.3 - magnificent-octopus/octopus/static/vendor/showdown-1.2.3/showdown.min.js
* D3 v3 - magnificent-octopus/octopus/static/vendor/edges/vendor/d3-v3/d3.min.js
* NVD3 1.8.1 - magnificent-octopus/octopus/static/vendor/edges/vendor/nvd3-1.8.1/nv.d3.min.js
* Edges NVD3 layout - magnificent-octopus/octopus/static/vendor/edges/nvd3.edges.js
* Edges Google layout - magnificent-octopus/octopus/static/vendor/edges/google.edges.js

For example:

```html
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key={{map_key}}"></script>
    <script type="text/javascript" src="/static/vendor/showdown-1.2.3/showdown.min.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/vendor/d3-v3/d3.min.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/vendor/nvd3-1.8.1/nv.d3.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/nvd3.edges.js"></script>
    <script type="text/javascript" src="/static/vendor/edges/google.edges.js"></script>
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
            reactor_search_url: "http://wna.com/reactordb/query/reactor/_search",
            operation_search_url: "http://wna.com/reactordb/query/operation/_search",
            id_regex: new RegExp("reactor\/(.+)");
            reactor_name: "ARMENIAN-1"
        });
    });
    </script>
```

(note that in reality you would only include either "id_regex" OR "reactor_name" and not both.