var reactordb = {
    activeEdges : {},

    makeSearch : function(params) {

        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        var selector = params.selector || "#reactor-search";
        var index = params.index || "reactor";
        var search_url = params.search_url || current_scheme + "//" + current_domain + "/query/" + index + "/_search";
        var reactor_base_url = params.reactor_base_url || current_scheme + "//" + current_domain + "/reactor/";

        var e = edges.newEdge({
            selector: selector,
            template: edges.bs3.newFacetview(),
            search_url: search_url,
            manageUrl : true,
            openingQuery : es.newQuery({
                sort : {field: "index.sort_name.exact", order: "asc"},
                size: 25
            }),
            components : [
                // First configure our facets (category: facet)
                edges.newORTermSelector({
                    id: "country",
                    field : "reactor.country.exact",
                    display: "Location",
                    size: 200,
                    lifecycle: "update",
                    category: "facet",
                    renderer : edges.bs3.newORTermSelectorRenderer({
                        showCount: true,
                        hideEmpty: false
                    })
                }),
                edges.newORTermSelector({
                    id: "status",
                    field : "reactor.status.exact",
                    display: "Current Status",
                    size: 200,
                    lifecycle: "update",
                    category: "facet",
                    renderer : edges.bs3.newORTermSelectorRenderer({
                        showCount: true,
                        hideEmpty: false
                    })
                }),
                edges.newORTermSelector({
                    id: "process",
                    field : "reactor.process.exact",
                    display: "Reactor Type",
                    size: 200,
                    lifecycle: "update",
                    category: "facet",
                    renderer : edges.bs3.newORTermSelectorRenderer({
                        showCount: true,
                        hideEmpty: false
                    })
                }),
                edges.newNumericRangeEntry({
                    id: "construction_start",
                    field: "index.construction_start_year",
                    display: "Construction Start Date",
                    category: "facet"
                }),
                edges.newNumericRangeEntry({
                    id: "grid_connection",
                    field: "index.first_grid_connection_year",
                    display: "Grid Connection",
                    category: "facet"
                }),
                edges.newNumericRangeEntry({
                    id: "permanent_shutdown",
                    field: "index.permanent_shutdown_year",
                    display: "Permanent Shutdown Date",
                    category: "facet"
                }),
                edges.newORTermSelector({
                    id: "owner",
                    field : "reactor.owner.name.exact",
                    display: "Owner",
                    size: 200,
                    lifecycle: "update",
                    category: "facet",
                    renderer : edges.bs3.newORTermSelectorRenderer({
                        showCount: true,
                        hideEmpty: true
                    })
                }),
                edges.newORTermSelector({
                    id: "operator",
                    field : "reactor.operator.exact",
                    display: "Operator",
                    size: 200,
                    lifecycle: "update",
                    category: "facet",
                    renderer : edges.bs3.newORTermSelectorRenderer({
                        showCount: true,
                        hideEmpty: true
                    })
                }),
                edges.newNumericRangeEntry({
                    id: "capacity_net",
                    field: "reactor.reference_unit_power_capacity_net",
                    display: "Reference Unit Power<br>(Net Capacity)",
                    lower: 0,
                    increment: 300,
                    category: "facet"
                }),

                // configure the search controller
                edges.newFullSearchController({
                    id: "search-controller",
                    category: "controller",
                    sortOptions : [
                        {field: "index.sort_name.exact", display: "Reactor Name"},
                        {field: "reactor.country.exact", display: "Location"},
                        {field: "index.first_grid_connection_year", display: "Start Year"}
                    ],
                    fieldOptions : [
                        {field: "reactor.name", display: "Reactor Name"},
                        {field: "reactor.process", display: "Reactor Type"},
                        {field: "reactor.owner.name", display: "Owner"},
                        {field: "reactor.vendor", display: "Vendor"},
                        {field: "reactor.operator", display: "Operator"},
                        {field: "reactor.model", display: "Model"}
                    ],
                    defaultOperator : "AND"
                }),

                // the pager, with the explicitly set page size options (see the openingQuery for the initial size)
                edges.newPager({
                    id: "top-pager",
                    category: "top-pager",
                    rederer : edges.bs3.newPagerRenderer({
                        sizeOptions : [10, 25, 50, 100]
                    })
                }),
                edges.newPager({
                    id: "bottom-pager",
                    category: "bottom-pager",
                    rederer : edges.bs3.newPagerRenderer({
                        sizeOptions : [10, 25, 50, 100]
                    })
                }),

                // results display holding pattern - to be replaced with the real thing
                edges.newResultsDisplay({
                    id: "results",
                    category: "results",
                    renderer : reactordb.newReactorRecords({
                        reactorBaseUrl: reactor_base_url
                    })
                }),

                // selected filters display, with all the fields given their display names
                edges.newSelectedFilters({
                    id: "selected-filters",
                    category: "selected-filters",
                    fieldDisplays : {
                        "reactor.country.exact" : "Location",
                        "reactor.status.exact" : "Current Status",
                        "reactor.process.exact" : "Reactor Type",
                        "index.construction_start_year" : "Construction Start Date",
                        "index.first_grid_connection_year" : "Grid Connection",
                        "index.permanent_shutdown_year" : "Permanent Shutdown Date",
                        "reactor.owner.name.exact" : "Owner",
                        "reactor.operator.exact" : "Operator",
                        "reactor.reference_unit_power_capacity_net" : "Reference Unit Power (Net Capacity)"
                    }
                }),

                // the standard searching notification
                edges.newSearchingNotification({
                    id: "searching-notification",
                    category: "searching-notification"
                })
            ]
        });

        reactordb.activeEdges[selector] = e;
    },
    makeReactorPage : function(params) {

        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        // pull all of the important information out of the params
        var reactor_index = params.reactor_index || "reactor";
        var reactor_search_url = params.reactor_search_url || current_scheme + "//" + current_domain + "/query/" + reactor_index + "/_search";

        var operation_index = params.operation_index || "operation";
        var operation_search_url = params.operation_search_url || current_scheme + "//" + current_domain + "/query/" + operation_index + "/_search";

        var id_regex = params.id_regex || new RegExp("reactor\/(.+)");
        var reactor_name = params.reactor_name || id_regex.exec(window.location.pathname)[1];

        // make the frame for both of the edges
        var selector = params.selector || "#reactor-page";
        $("#reactor-page").html('<div id="reactor-record"></div>\
            <div id="reactor-operation"></div>\
            <div id="reactor-links"><div id="reactor_links"></div></div>'
        );

        // create the 3 edges ...

        // first for the main body of reactor information
        var e1 = edges.newEdge({
            selector: "#reactor-record",
            template: reactordb.newReactorPageTemplate(),
            search_url: reactor_search_url,
            manageUrl : false,
            baseQuery : es.newQuery({
                must : [
                    es.newTermFilter({field: "id.exact", value: reactor_name})
                ],
                size: 1
            }),
            components : [
                // the reactor metadata display component
                reactordb.newReactorMetadata({
                    id: "reactor_metadata",
                    category: "metadata",
                    renderer: reactordb.newReactorMetadataRenderer({})
                }),
                edges.newMapView({
                    id: "reactor_map",
                    geoPoint: "reactor.location",
                    category: "map",
                    renderer : edges.google.newMapViewRenderer({
                        initialZoom : 15,
                        onNoGeoPoints: "hide",
                        mapHiddenText: ""
                    })
                }),
                // the standard searching notification
                edges.newSearchingNotification({
                    id: "reactor-searching",
                    category: "searching-notification",
                    renderer : edges.bs3.newSearchingNotificationRenderer({
                        searchingMessage: "Loading reactor information ..."
                    })
                })
            ]
        });

        // second for all the operation history
        var e2 = edges.newEdge({
            selector: "#reactor-operation",
            template: reactordb.newReactorOperationTemplate(),
            search_url: operation_search_url,
            manageUrl : false,
            baseQuery : es.newQuery({
                must : [
                    es.newTermFilter({field: "reactor.exact", value: reactor_name})
                ],
                size: 100,
                sort : [
                    es.newSort({field: "year", order: "asc"})
                ]
            }),
            components : [
                // electricity supplied bar chart
                edges.newMultibar({
                    id: "electricity_supplied",
                    display: "<h3>Electricty Supplied (MWe)</h3>",
                    category: "chart",
                    dataFunction : edges.ChartDataFunctions.recordsXY({
                        key: "Electricity Supplied",
                        x: "year",
                        y: "electricity_supplied",
                        y_default: 0
                    }),
                    renderer : edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor : ["#1e9dd8"],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Electricty Supplied (MWe)"
                    })
                }),
                // annual energy availability factor
                edges.newSimpleLineChart({
                    id : "energy_availability_annual",
                    display: "<h3>Energy Availability Factor (%)</h3>",
                    category: "chart",
                    dataFunction : edges.ChartDataFunctions.recordsXY({
                        key: "Energy Availability Factor",
                        x: "year",
                        y: "energy_availability_factor_annual",
                        y_default: 0
                    }),
                    renderer : edges.nvd3.newSimpleLineChartRenderer({
                        xTickFormat: ".0f",
                        lineColor : ["#1e9dd8"],
                        includeOnY: [0],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Energy Availability Factor (%)"
                    })
                }),
                // total electricity supplied
                edges.newSimpleLineChart({
                    id : "total_electricity",
                    display: "<h3>Total Electricity Supplied (MWe)</h3>",
                    category: "chart",
                    dataFunction : edges.ChartDataFunctions.cumulativeXY({
                        key: "Total Electricity Supplied",
                        x: "year",
                        y: "electricity_supplied",
                        y_default: 0
                    }),
                    renderer : edges.nvd3.newSimpleLineChartRenderer({
                        xTickFormat: ".0f",
                        lineColor : ["#1e9dd8"],
                        includeOnY: [0],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Total Electricity Supplied (MWe)"
                    })
                }),
                // a table of all the data
                edges.newResultsDisplay({
                    id : "results_table",
                    category: "chart",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        fieldDisplay : [
                            {field: "year", display: "Year"},
                            {field: "reference_unit_power", display: "Reference Unit Power (MWe)"},
                            {field: "annual_time_online", display: "Annual Time Online (Hours)"},
                            {field: "electricity_supplied", display: "Electricity Supplied (MWe)"},
                            {field: "operation_factor", display: "Operation Factor (%)"},
                            {field: "energy_availability_factor_annual", display: "Energy Availability Annual (%)"},
                            {field: "energy_availability_factor_cumulative", display: "Energy Availability Cumulative (%)"},
                            {field: "load_factor_annual", display: "Load Factor Annual (%)"},
                            {field: "load_factor_cumulative", display: "Load Factor Cumulative (%)"}
                        ]
                    })
                }),

                // the standard searching notification
                edges.newSearchingNotification({
                    id: "history-searching",
                    category: "searching-notification",
                    renderer : edges.bs3.newSearchingNotificationRenderer({
                        searchingMessage: "Loading operation history ..."
                    })
                })
            ]
        });

        // third for the links at the bottom
        var e3 = edges.newEdge({
            selector: "#reactor-links",
            search_url: reactor_search_url,
            manageUrl : false,
            baseQuery : es.newQuery({
                must : [
                    es.newTermFilter({field: "id.exact", value: reactor_name})
                ],
                size: 1
            }),
            components : [
                // the reactor metadata display component
                reactordb.newReactorLinks({
                    id: "reactor_links",
                    renderer: reactordb.newReactorLinksRenderer({})
                })
            ]
        });

        reactordb.activeEdges["#reactor-record"] = e1;
        reactordb.activeEdges["#reactor-operation"] = e2;
        reactordb.activeEdges["#reactor-links"] = e3;
    },

    newReactorRecords: function (params) {
        if (!params) {
            params = {}
        }
        reactordb.ReactorRecords.prototype = edges.newRenderer(params);
        return new reactordb.ReactorRecords(params);
    },
    ReactorRecords: function (params) {
        //////////////////////////////////////////////
        // parameters that can be passed in

        // what to display when there are no results
        this.noResultsText = params.noResultsText || "No reactors match your search criteria";

        this.reactorBaseUrl = params.reactorBaseUrl;

        //////////////////////////////////////////////
        // parameters that are core parts of the object

        // map of shorted to expanded types
        this.typeMap = {
            "BWR": "Boiling Water Reactor",
            "GCR": "Gas-Cooled Reactor",
            "HTGR": "High Temperature Gas-Cooled Reactor",
            "HWGCR": "Heavy Water Gas-Cooled Reactor",
            "FBR": "Fast Reactor",
            "HWLWR": "Heavy Water Light Water Reactor",
            "LWGR": "Light Water Graphite Reactor",
            "PHWR": "Pressurized Heavy Water Reactor",
            "PWR": "Pressurised Water Reactor",
            "SGHWR": "Steam Generating Heavy Water Reactor",
            "X": "Other"
        };

        this.months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        this.namespace = "reactordb-reactor-records";

        this.draw = function () {
            var frag = this.noResultsText;
            if (this.component.results === false) {
                frag = "";
            }

            var results = this.component.results;
            if (results && results.length > 0) {
                // list the css classes we'll require
                var recordClasses = edges.css_classes(this.namespace, "record", this);

                // now call the result renderer on each result to build the records
                frag = "";
                for (var i = 0; i < results.length; i++) {
                    var rec = this._renderResult(results[i]);
                    frag += '<div class="row"><div class="col-md-12"><div class="' + recordClasses + '">' + rec + '</div></div></div>';
                }
            }

            // finally stick it all together into the container
            var containerClasses = edges.css_classes(this.namespace, "container", this);
            var container = '<div class="' + containerClasses + '">' + frag + '</div>';
            this.component.context.html(container);
        };

        this._renderResult = function (res) {
            // extract from the object the fields that we want to display
            var id = this._getValue("id", res);
            var reactor_name = this._getValue("reactor.name", res);
            var country = this._getValue("reactor.country", res);
            var capacity_net = this._getValue("reactor.reference_unit_power_capacity_net", res);
            var status = this._getValue("reactor.status", res);
            var type = this._getValue("reactor.process", res);
            var owners = this._getValue("reactor.owner", res);
            var operator = this._getValue("reactor.operator", res);
            var grid = this._getValue("reactor.first_grid_connection", res);

            // set some defaults/normalise the values we are going to display
            if (capacity_net === false) {
                capacity_net = "-";
            }
            var expandedType = type in this.typeMap ? this.typeMap[type] : "";
            var oarr = [];
            for (var i = 0; i < owners.length; i++) {
                var o = owners[i];
                oarr.push(o.name);
            }
            var owner = oarr.join(", ");
            var gridconn = "";
            if (grid !== false) {
                var griddate = new Date(grid);
                gridconn = griddate.getDate() + "&nbsp;" + this.months[griddate.getMonth()] + "&nbsp;" + griddate.getFullYear();
            }
            var url = this.reactorBaseUrl + id;

            // now prep all the relevant values for html rendering
            reactor_name = edges.escapeHtml(reactor_name);
            country = edges.escapeHtml(country);
            capacity_net = edges.escapeHtml(capacity_net);
            status = edges.escapeHtml(status);
            type = edges.escapeHtml(type);
            expandedType = edges.escapeHtml(expandedType);
            owner = edges.escapeHtml(owner);
            operator = edges.escapeHtml(operator);

            // list the css classes we'll require
            var expandedTypeClasses = edges.css_classes(this.namespace, "expanded-type", this);
            var typeClasses = edges.css_classes(this.namespace, "type", this);
            var typeContainerClasses = edges.css_classes(this.namespace, "type-container", this);
            var gridClasses = edges.css_classes(this.namespace, "grid", this);
            var nameClasses = edges.css_classes(this.namespace, "name", this);
            var urlClasses = edges.css_classes(this.namespace, "url", this);
            var locationClasses = edges.css_classes(this.namespace, "location", this);
            var statusClasses = edges.css_classes(this.namespace, "status", this);
            var capacityClasses = edges.css_classes(this.namespace, "capacity", this);
            var ownersClasses = edges.css_classes(this.namespace, "owners", this);
            var operatorClasses = edges.css_classes(this.namespace, "operator", this);
            var firstRowClasses = edges.css_classes(this.namespace, "first-row", this);
            var secondRowClasses = edges.css_classes(this.namespace, "second-row", this);

            // build the sub-frags which only appear if there are values to go in them
            var typefrag = "";
            if (expandedType === "") {
                typefrag = '<div class="' + typeContainerClasses + '"><span class="' + expandedTypeClasses + '">' + type + '</span></div>';
            } else {
                typefrag = '<div class="' + typeContainerClasses + '"><span class="' + expandedTypeClasses + '">' + expandedType + '</span> <span class="' + typeClasses + '">(or ' + type + ')</span></div>';
            }

            var gridfrag = "";
            if (gridconn !== "") {
                gridfrag = '<strong>Grid Connection:</strong>&nbsp;<span class="' + gridClasses + '">' + gridconn + '</span>';
            }

            // build the template for the record:
            var frag = '<div class="row ' + firstRowClasses + '">\
                            <div class="col-md-7">\
                                <span class="' + nameClasses + '"><a href="URL" class="' + urlClasses + '">NAME</a></span>,&nbsp;\
                                <span class="' + locationClasses + '">COUNTRY</span><br>\
                                <span class="' + statusClasses + '">STATUS</span>\
                            </div>\
                            <div class="col-md-5">\
                                <div class="' + capacityClasses + '">CAPACITY&nbsp;MWe</div>\
                                TYPE_FRAG \
                            </div>\
                        </div>\
                        <div class="row ' + secondRowClasses + '"><div class="col-md-12">\
                            <strong>Owner:</strong>&nbsp;<span class="' + ownersClasses + '">OWNERS</span>&nbsp;\
                            <strong>Operator:</strong>&nbsp;<span class="' + operatorClasses + '">OPERATOR</span><br>\
                            GRID_FRAG \
                        </div></div>';

            // substitute in all the values
            frag = frag.replace(/URL/g, url)
                .replace(/NAME/g, reactor_name)
                .replace(/COUNTRY/g, country)
                .replace(/STATUS/g, status)
                .replace(/CAPACITY/g, capacity_net)
                .replace(/TYPE_FRAG/g, typefrag)
                .replace(/OWNERS/g, owner)
                .replace(/OPERATOR/g, operator)
                .replace(/GRID_FRAG/g, gridfrag);

            return frag;
        };

        this._getValue = function (path, rec) {
            var bits = path.split(".");
            var val = rec;
            for (var i = 0; i < bits.length; i++) {
                var field = bits[i];
                if (field in val) {
                    val = val[field];
                } else {
                    return false;
                }
            }
            return val;
        };
    },

    newReactorPageTemplate : function(params) {
            if (!params) { params = {} }
            reactordb.ReactorPageTemplate.prototype = edges.newTemplate(params);
            return new reactordb.ReactorPageTemplate(params);
        },
    ReactorPageTemplate : function(params) {

        this.namespace = "reactordb-reactor-page";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var searchingClass = edges.css_classes(this.namespace, "searching");
            var metadataClass = edges.css_classes(this.namespace, "metadata");
            var mapClass = edges.css_classes(this.namespace, "map");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // loading notification (note that the notification implementation is responsible for its own visibility)
            var loading = edge.category("searching-notification");
            if (loading.length > 0) {
                frag += '<div class="row"><div class="col-md-12"><div class="' + searchingClass + '"><div id="' + loading[0].id + '"></div></div></div></div>'
            }

            // insert the frame within which the metadata will go
            var metadata = edge.category("metadata");
            if (metadata.length > 0) {
                frag += '<div class="row"><div class="col-md-12"><div class="' + metadataClass + '" dir="auto"><div id="' + metadata[0].id + '"></div></div></div></div>';
            }

            // insert the frame within which the map will go
            var maps = edge.category("map");
            if (maps.length > 0) {
                frag += '<div class="row"><div class="col-md-8 col-sm-9"><div class="' + mapClass + '"><div id="' + maps[0].id + '"></div></div></div></div>';
            }

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    newReactorOperationTemplate : function(params) {
        if (!params) { params = {} }
        reactordb.ReactorOperationTemplate.prototype = edges.newTemplate(params);
        return new reactordb.ReactorOperationTemplate(params);
    },
    ReactorOperationTemplate : function(params) {

        this.namespace = "reactordb-reactor-operation";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var searchingClass = edges.css_classes(this.namespace, "searching");
            var chartClasses = edges.css_classes(this.namespace, "chart");
            var ohClasses = edges.css_classes(this.namespace, "title");
            var prisClasses = edges.css_classes(this.namespace, "pris");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // add a title for this section
            frag += '<h2><span class="' + ohClasses + '">Operational History</span></h2><br>';

            // loading notification (note that the notification implementation is responsible for its own visibility)
            var loading = edge.category("searching-notification");
            if (loading.length > 0) {
                frag += '<div class="row"><div class="col-md-12"><div class="' + searchingClass + '"><div id="' + loading[0].id + '"></div></div></div></div>'
            }

            // create a container for each chart
            var charts = edge.category("chart");
            for (var i = 0; i < charts.length; i++) {
                var chart = charts[i];
                frag += '<div class="row"><div class="col-md-12"><div class="' + chartClasses + '" dir="auto"><div id="' + chart.id + '"></div></div></div></div>';
            }

            // insert the back-reference to the PRIS data
            frag += '<div class="row"><div class="col-md-12"><div class="pull-right '+ prisClasses +'">Source: Operating details - <a href="http://www.iaea.org/pris/">IAEA PRIS</a></div></div></div>'

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    newReactorLinks : function(params) {
        if (!params) { params = {} }
        reactordb.ReactorLinks.prototype = edges.newComponent(params);
        return new reactordb.ReactorLinks(params);
    },
    ReactorLinks : function(params) {
        this.reactor = false;

        this.synchronise = function() {
            this.reactor = false;
            if (this.edge.result) {
                var results = this.edge.result.results();
                if (results.length == 0) {
                    return
                }
                this.reactor = results[0];
            }
        }
    },

    newReactorLinksRenderer : function(params) {
        if (!params) { params = {} }
        reactordb.ReactorLinksRenderer.prototype = edges.newRenderer(params);
        return new reactordb.ReactorLinksRenderer(params);
    },
    ReactorLinksRenderer : function(params) {

        this.namespace = "reactordb-reactor-links";

        this.draw = function () {
            if (!this.component.reactor) {
                this.component.context.html("");
                return
            }

            var links = edges.objVal("reactor.links", this.component.reactor);

            var linksClasses = edges.css_classes(this.namespace, "links", this);
            var linkHeaderClasses = edges.css_classes(this.namespace, "link_header", this);
            var linkClasses = edges.css_classes(this.namespace, "link", this);

            // prep the wna and wnn links
            var wnalinks = '<div class="' + linksClasses + ' afterArticle"><hr/><h2><span class="' + linkHeaderClasses + '">See Also</span></h2><h3>_LINKS_</h3></div>';
            var wnnlinks = '<div class="' + linksClasses + ' afterArticle"><hr/><h2><span class="' + linkHeaderClasses + '">Related News</span></h2><h3>_LINKS_</h3></div>';
            var wnasub = "";
            var wnnsub = "";
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                if (link.type === "wnn") {
                    wnnsub += '<a href="' + link.url + '" class="' + linkClasses + '">' + link.text + '</a><br>';
                } else if (link.type === "wna") {
                    wnasub += '<a href="' + link.url + '" class="' + linkClasses + '">' + link.text + '</a><br>';
                }
            }
            if (wnasub === "") {
                wnasub = "No current links";
            }
            if (wnnsub === "") {
                wnnsub = "No current links";
            }
            wnalinks = wnalinks.replace(/_LINKS_/g, wnasub);
            wnnlinks = wnnlinks.replace(/_LINKS_/g, wnnsub);

            var frag = '<div class="row">\
                            <div class="col-md-12">_WNALINKS_</div>\
                            <div class="col-md-12">_WNNLINKS_</div>\
                        </div>';
            frag = frag.replace(/_WNALINKS_/g, wnalinks)
                        .replace(/_WNNLINKS_/g, wnnlinks);

            this.component.context.html(frag);
        }
    },

    newReactorMetadata : function(params) {
        if (!params) { params = {} }
        reactordb.ReactorMetadata.prototype = edges.newComponent(params);
        return new reactordb.ReactorMetadata(params);
    },
    ReactorMetadata : function(params) {
        this.reactor = false;

        this.synchronise = function() {
            this.reactor = false;
            if (this.edge.result) {
                var results = this.edge.result.results();
                if (results.length == 0) {
                    return
                }
                this.reactor = results[0];
            }
        }
    },

    newReactorMetadataRenderer : function(params) {
        if (!params) { params = {} }
        reactordb.ReactorMetadataRenderer.prototype = edges.newRenderer(params);
        return new reactordb.ReactorMetadataRenderer(params);
    },
    ReactorMetadataRenderer : function(params) {
        // map of shorted to expanded types
        this.typeMap = {
            "BWR" : "Boiling Water Reactor",
            "GCR" : "Gas-Cooled Reactor",
            "HTGR" : "High Temperature Gas-Cooled Reactor",
            "HWGCR" : "Heavy Water Gas-Cooled Reactor",
            "FBR" : "Fast Reactor",
            "HWLWR" : "Heavy Water Light Water Reactor",
            "LWGR" : "Light Water Graphite Reactor",
            "PHWR" : "Pressurized Heavy Water Reactor",
            "PWR" : "Pressurised Water Reactor",
            "SGHWR" : "Steam Generating Heavy Water Reactor",
            "X" : "Other"
        };

        // map of statuses to bootstrap alert statuses
        this.statusMap = {
            "Operational" : "operational",
            "Under Construction" : "construction",
            "Long-term Shutdown" : "longterm",
            "Permanent Shutdown" : "permanent"
        };

        this.months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        this.namespace = "reactordb-reactor-metadata";

        this.draw = function() {
            if (!this.component.reactor) {
                var frag = "No information found for this reactor.";
                this.component.context.html(frag);
                return
            }

            // get the values that we're going to want to render
            var reactor_name = this._getValue("reactor.name", this.component.reactor);
            var reactor_url = this._getValue("reactor.url", this.component.reactor);
            var country = this._getValue("reactor.country", this.component.reactor);
            var status = this._getValue("reactor.status", this.component.reactor);
            var image = this._getValue("reactor.image", this.component.reactor);
            var image_label = this._getValue("reactor.image_label", this.component.reactor);

            var info = this._getValue("reactor.additional_info", this.component.reactor, "");

            var site = this._getValue("reactor.site_name", this.component.reactor);
            var process = this._getValue("reactor.process", this.component.reactor);
            var vendor = this._getValue("reactor.vendor", this.component.reactor);
            var owners = this._getValue("reactor.owner", this.component.reactor);
            var model = this._getValue("reactor.model", this.component.reactor);
            var operator = this._getValue("reactor.operator", this.component.reactor);

            var proj_start = this._getValue("reactor.project_start", this.component.reactor);
            var con_start = this._getValue("reactor.construction_start", this.component.reactor);
            var con_suspend = this._getValue("reactor.construction_suspend", this.component.reactor);
            var con_restart = this._getValue("reactor.construction_restart", this.component.reactor);
            var criticality = this._getValue("reactor.first_criticality", this.component.reactor);
            var grid = this._getValue("reactor.first_grid_connection", this.component.reactor);
            var commercial = this._getValue("reactor.commercial_operation", this.component.reactor);
            var longterm = this._getValue("reactor.longterm_shutdown", this.component.reactor);
            var restart = this._getValue("reactor.restart", this.component.reactor);
            var permanent = this._getValue("reactor.permanent_shutdown", this.component.reactor);

            var capacity_net = this._getValue("reactor.reference_unit_power_capacity_net", this.component.reactor, "-");
            var thermal_capacity = this._getValue("reactor.thermal_capacity", this.component.reactor, "-");
            var design_capacity = this._getValue("reactor.design_net_capacity", this.component.reactor, "-");
            var gross_capacity = this._getValue("reactor.gross_capacity", this.component.reactor, "-");


            // set some defaults/normalise the values we are going to display
            var expandedProcess = process in this.typeMap ? this.typeMap[process] : "";

            var oarr = [];
            for (var i = 0; i < owners.length; i++) {
                var o = owners[i];
                oarr.push(o.name);
            }
            var owner = oarr.join(", ");

            proj_start = this._formatDate(proj_start);
            con_start = this._formatDate(con_start);
            con_suspend = this._formatDate(con_suspend);
            con_restart = this._formatDate(con_restart);
            criticality = this._formatDate(criticality);
            grid = this._formatDate(grid);
            commercial = this._formatDate(commercial);
            longterm = this._formatDate(longterm);
            restart = this._formatDate(restart);
            permanent = this._formatDate(permanent);

            // make a markdown converter
            var converter = new showdown.Converter(),

            // now prep all the relevant values for html rendering
            reactor_name = edges.escapeHtml(reactor_name);
            var escaped_url = edges.escapeHtml(reactor_url);
            image_label = converter.makeHtml(image_label);
            info = converter.makeHtml(info);
            country = edges.escapeHtml(country);
            status = edges.escapeHtml(status);
            site = edges.escapeHtml(site);
            process = edges.escapeHtml(process);
            expandedProcess = edges.escapeHtml(expandedProcess);
            vendor = edges.escapeHtml(vendor);
            owner = edges.escapeHtml(owner);
            model = edges.escapeHtml(model);
            operator = edges.escapeHtml(operator);
            capacity_net = edges.escapeHtml(capacity_net);
            thermal_capacity = edges.escapeHtml(thermal_capacity);
            design_capacity = edges.escapeHtml(design_capacity);
            gross_capacity = edges.escapeHtml(gross_capacity);

            // assemble the CSS classes we'll require
            var nameClasses = edges.css_classes(this.namespace, "name", this);
            var locationClasses = edges.css_classes(this.namespace, "location", this);
            var urlClasses = edges.css_classes(this.namespace, "url", this);
            var infoClasses = edges.css_classes(this.namespace, "info", this);
            var statusClasses = edges.css_classes(this.namespace, "status", this);
            var imgContainerClasses = edges.css_classes(this.namespace, "img_container", this);
            var imgClasses = edges.css_classes(this.namespace, "img", this);
            var imgLabelClasses = edges.css_classes(this.namespace, "imglabel", this);
            var tableClasses = edges.css_classes(this.namespace, "table", this);
            var tableHeadClasses = edges.css_classes(this.namespace, "table_head", this);
            var tableKeyClasses = edges.css_classes(this.namespace, "table_key", this);
            var tableValClasses = edges.css_classes(this.namespace, "table_val", this);

            // reactor status alert type
            var alertType = status in this.statusMap ? this.statusMap[status] : "operational";

            // prep the highlight information about the reactor
            var url = "";
            if (reactor_url) {
                url = '<a href="' + reactor_url + '" class="' + urlClasses + '">' + escaped_url + '</a><br>';
            }
            var highlight = '<h1><span class="' + nameClasses + '">_NAME_</span>,\
                                <span class="' + locationClasses + '">_COUNTRY_</span></h1><br>\
                                <span class="' + statusClasses + ' ' + alertType + '">' + status + '</span><br>\
                                _URL_\
                                <p class="' + infoClasses + '">_ADDITIONALINFO_</p>';
            highlight = highlight.replace(/_NAME_/g, reactor_name)
                    .replace(/_COUNTRY_/g, country)
                    .replace(/_URL_/g, url)
                    .replace(/_ADDITIONALINFO_/g, info);

            // prep the status box
            //var alertType = status in this.statusMap ? this.statusMap[status] : "success";
            //var status_box = '<div class="alert alert-' + alertType + ' ' + statusClasses + '">' + status + '</div>';

            // sort the image out
            var img = "";
            if (image) {
                var img = '<img src="' + image + '" class="' + imgClasses + '"><br>';
                if (image_label) {
                    img += '<span class="' + imgLabelClasses + '">' + image_label + "</span>";
                }
            }
            // table of details
            var details = '<table class="' + tableClasses + '"><thead><tr><td colspan="2" class="' + tableHeadClasses + '">Details</td></tr></thead><tbody>_ROWS_</tbody></table>';
            var detailsRows = "";
            //if (site) {
            //    detailsRows += '<tr><td class="' + tableKeyClasses + '">Site Name</td><td class="' + tableValClasses + '">' + site + '</td></tr>';
            //}
            if (process) {
                if (expandedProcess === "") {
                    detailsRows += '<tr><td class="' + tableKeyClasses + '">Reactor Type</td><td class="' + tableValClasses + '">' + process + '</td></tr>';
                } else {
                    detailsRows += '<tr><td class="' + tableKeyClasses + '">Reactor Type</td><td class="' + tableValClasses + '">' + expandedProcess + ' (' + process + ')</td></tr>';
                }
            }
            if (model) {
                detailsRows += '<tr><td class="' + tableKeyClasses + '">Model</td><td class="' + tableValClasses + '">' + model + '</td></tr>';
            }
            if (vendor) {
                detailsRows += '<tr><td class="' + tableKeyClasses + '">Vendor</td><td class="' + tableValClasses + '">' + vendor + '</td></tr>';
            }
            if (owner) {
                detailsRows += '<tr><td class="' + tableKeyClasses + '">Owner</td><td class="' + tableValClasses + '">' + owner + '</td></tr>';
            }
            if (operator) {
                detailsRows += '<tr><td class="' + tableKeyClasses + '">Operator</td><td class="' + tableValClasses + '">' + operator + '</td></tr>';
            }
            details = details.replace(/_ROWS_/g, detailsRows);

            // table of timeline
            var timeline = '<table class="' + tableClasses + '"><thead><tr><td colspan="2" class="' + tableHeadClasses + '">Timeline</td></tr></thead><tbody>_ROWS_</tbody></table>';
            var timelineRows = "";
            if (proj_start) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Project Start</td><td class="' + tableValClasses + '">' + proj_start + '</td></tr>';
            }
            if (con_start) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Construction Start</td><td class="' + tableValClasses + '">' + con_start + '</td></tr>';
            }
            if (con_suspend) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Construction Suspend</td><td class="' + tableValClasses + '">' + con_suspend + '</td></tr>';
            }
            if (con_restart) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Construction Restart</td><td class="' + tableValClasses + '">' + con_restart + '</td></tr>';
            }
            if (criticality) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">First Criticality</td><td class="' + tableValClasses + '">' + criticality + '</td></tr>';
            }
            if (grid) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">First Grid Connection</td><td class="' + tableValClasses + '">' + grid + '</td></tr>';
            }
            if (commercial) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Commercial Operation</td><td class="' + tableValClasses + '">' + commercial + '</td></tr>';
            }
            if (longterm) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Long-term Shutdown</td><td class="' + tableValClasses + '">' + longterm + '</td></tr>';
            }
            if (restart) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Restart</td><td class="' + tableValClasses + '">' + restart + '</td></tr>';
            }
            if (permanent) {
                timelineRows += '<tr><td class="' + tableKeyClasses + '">Permanent Shutdown</td><td class="' + tableValClasses + '">' + permanent + '</td></tr>';
            }
            timeline = timeline.replace(/_ROWS_/g, timelineRows);

            // table of numbers
            var numbers = '<table class="' + tableClasses + '"><thead><tr><td colspan="2" class="' + tableHeadClasses + '">Specification</td></tr></thead><tbody>_ROWS_</tbody></table>';
            var numbersRows = "";
            if (capacity_net) {
                numbersRows += '<tr><td class="' + tableKeyClasses + '">Capacity Net</td><td class="' + tableValClasses + '">' + capacity_net + ' MWe</td></tr>';
            }
            if (gross_capacity) {
                numbersRows += '<tr><td class="' + tableKeyClasses + '">Capacity Gross</td><td class="' + tableValClasses + '">' + gross_capacity + ' MWe</td></tr>';
            }
            if (thermal_capacity) {
                numbersRows += '<tr><td class="' + tableKeyClasses + '">Capacity Thermal</td><td class="' + tableValClasses + '">' + thermal_capacity + ' MWt</td></tr>';
            }
            if (design_capacity) {
                numbersRows += '<tr><td class="' + tableKeyClasses + '">Design Capacity</td><td class="' + tableValClasses + '">' + design_capacity + ' MWe</td></tr>';
            }
            numbers = numbers.replace(/_ROWS_/g, numbersRows);

            // finally assemble the full fragment
            var frag = '<div class="row">\
                            <div class="col-md-12">_HIGHLIGHT_</div>\
                        </div>\
                        <div class="row">\
                            <div class="col-md-4 col-sm-8' + imgContainerClasses + '">_IMAGE_</div>\
                        </div>\
                        <div class="row">\
                            <div class="col-md-4">_DETAILS_</div>\
                            <div class="col-md-4">_DATES_</div>\
                            <div class="col-md-4">_NUMBERS_</div>\
                        </div>';

            frag = frag.replace(/_HIGHLIGHT_/g, highlight)
                        .replace(/_IMAGE_/g, img)
                        .replace(/_DETAILS_/g, details)
                        .replace(/_DATES_/g, timeline)
                        .replace(/_NUMBERS_/g, numbers);

            this.component.context.html(frag);
        };

        this._getValue = function(path, rec, def) {
            if (def === undefined) {
                def = false;
            }
            var bits = path.split(".");
            var val = rec;
            for (var i = 0; i < bits.length; i++) {
                var field = bits[i];
                if (field in val) {
                    val = val[field];
                } else {
                    return def;
                }
            }
            return val;
        };

        this._formatDate = function(source) {
            var out = "";
            if (source !== false) {
                var d = new Date(source);
                out = d.getDate() + "&nbsp;" + this.months[d.getMonth()] + "&nbsp;" + d.getFullYear();
            }
            return out;
        }
    }
};

