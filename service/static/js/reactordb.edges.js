var reactordb = {
    activeEdges : {},

    _htmlPassThrough : function(val) {
        return val;
    },

    _reactorStatusCount : function(params) {
        var status = params.status;

        return function(component) {
            var result = component.edge.result;
            var statuses = result.aggregation("status");

            var main = 0;
            var second = 0;

            for (var i = 0 ; i < statuses.buckets.length; i++) {
                var bucket = statuses.buckets[i];
                if (bucket.key === status) {
                    main = bucket.doc_count;
                    second = bucket.total_gwe.value;
                }
            }

            return {main: main, second: second};
        }
    },

    _yearsOperable : function(params) {
        var reactor = params.reactor;
        var upper = params.upper;

        // reactor must have been connnected to the grid at some point, if it is operable
        if (!reactor.reactor.hasOwnProperty("first_grid_connection")) {
            return [];
        }
        var first_grid_connection_year = reactor.index.first_grid_connection_year;

        // now find a limit to when the reactor could have ceased operation
        var nextLimit = upper;
        var psy = false;
        if (reactor.index.hasOwnProperty("permanent_shutdown_year")) {
            psy = reactor.index.permanent_shutdown_year;
            if (psy < upper) {
                nextLimit = psy;
            }
        }
        if (reactor.reactor.hasOwnProperty("longterm_shutdown")) {
            var lts = reactor.reactor.longterm_shutdown;
            var ltsy = parseInt(lts.split("-")[0]);
            if (ltsy < upper) {
                nextLimit = ltsy;
            }
        }

        // record the years
        var years = [];
        for (var i = first_grid_connection_year; i <= nextLimit; i++) {
            years.push(i);
        }

        // find out if there's a restart date
        var restart = false;
        if (reactor.reactor.hasOwnProperty(("restart"))) {
            var rd = reactor.reactor.restart;
            restart = parseInt(rd.split("-")[0]);
        }
        if (restart === false) {
            return years;
        }

        // now determine the year to go to next
        nextLimit = upper;
        if (psy !== false && psy < upper) {
            nextLimit = psy;
        }

        // and record the final years
        for (var i = restart; i <= nextLimit; i++) {
            years.push(i);
        }
        return years;
    },

    _operableNuclearCapacityInResults : function(params) {
        var year = parseInt(params.year);

        return function(component) {
            var operableCapacity = 0;
            var results = component.edge.result.results();
            for (var i = 0; i < results.length; i++) {
                var res = results[i];
                var rupDict = res.reactor.reference_unit_power;
                var rup = 0;
                if (rupDict.hasOwnProperty(year)) {
                    rup = rupDict[year];
                }
                operableCapacity += rup;
            }

            var formatter = edges.numFormat({
                decimalPlaces: 0,
                thousandsSeparator: ","
            });

            return {"a" : formatter(operableCapacity), "b" : year}
        }
    },

    _operableNuclearCapacityByYearInResults : function(args) {
        var upper = args.upperLimitYear;

        return function(component) {
            var buckets = {};
            var results = component.edge.result.results();
            for (var i = 0; i < results.length; i++) {
                var res = results[i];
                var years = reactordb._yearsOperable({reactor: res, upper: upper});
                for (var j = 0; j < years.length; j++) {
                    var year = years[j];
                    if (!buckets.hasOwnProperty(year)) {
                        buckets[year] = 0;
                    }
                    var rupDict = res.reactor.reference_unit_power;
                    var rup = 0;
                    if (rupDict.hasOwnProperty(year)) {
                        rup = rupDict[year];
                    }
                    buckets[year] += rup;
                }
            }

            // strip the leading zeros
            var years = Object.keys(buckets);
            years.sort();
            for (var i = 0; i < years.length; i++) {
                var onc = buckets[years[i]];
                if (onc === 0) {
                    delete buckets[years[i]];
                } else {
                    break;
                }
            }

            // now convert what remains to a data series
            years = Object.keys(buckets);
            years.sort();
            var seriesName = "Operable Nuclear Capacity";
            var values = [];
            var lastYear = false;
            for (var i = 0; i < years.length; i++) {
                var year = parseInt(years[i]);
                // fill in the gaps for any missing years
                if (lastYear !== false) {
                    if (lastYear + 1 !== year) {
                        for (var j = lastYear + 1; j < year; j++) {
                            values.push({label: String(j), value: 0});
                        }
                    }
                }
                values.push({label: String(year), value: buckets[String(year)]});
                lastYear = year;
            }
            return [{key: seriesName, values: values}]
        }
    },

    _nuclearGenerationThisYear : function(params) {
        var year = parseInt(params.year);
        var resultSet = params.resultSet;

        return function(component) {
            var results = component.edge.secondaryResults[resultSet];
            var buckets = results.data.aggregations.year.buckets;
            var gen = 0.0;
            for (var i = 0; i < buckets.length; i++) {
                var bucket = buckets[i];
                if (bucket.key === year) {
                    var gen = bucket.electricity_generation.value;
                }
            }

            var formatter = edges.numFormat({
                decimalPlaces: 0,
                thousandsSeparator: ","
            });

            return {"a" : formatter(gen), "b" : year}
        }
    },

    _electricityGenerationByYear : function(params) {
        var resultSet = params.resultSet;

        return function(component) {
            var seriesName = "Electricity Generation by Year";

            var results = component.edge.secondaryResults[resultSet];
            var buckets = results.data.aggregations.year.buckets;
            var values = [];
            for (var i = 0; i < buckets.length; i++) {
                var bucket = buckets[i];
                var gen = bucket.electricity_generation.value;
                values.push({label: bucket.key, value: gen});
            }

            return [{key: seriesName, values: values}]
        }
    },

    _filterResultsByStatus : function(args) {
        var status = args.status;

        return function(params) {
            var results = params.results;
            var filtered = [];
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (result.reactor.status === status) {
                    filtered.push(result);
                }
            }
            return filtered;
        }
    },

    _reactorPageLink : function(params) {
        var template = params.url_template;

        return function(params) {
            var reactor = params.result;

            var id = reactor.id;
            var name = reactor.reactor.name;

            var url = template.replace("{reactor_name}", id);
            var frag = '<a href="' + url + '">' + name + '</a>';
            return frag;
        }
    },

    _countryPageLink : function(params) {
        var template = params.url_template;

        return function(country_name) {
            var url = template.replace("{country_name}", country_name);
            var frag = '<a href="' + url + '">' + country_name + '</a>';
            return frag;
        }
    },

    /* =====================================================
     * Functions for the Generic Report Page
     * =====================================================
     */

    _defaultSections : [
        "filters", "highlight", "operable_nuclear_capacity", "electricity_generated", "top_operable_country",
        "top_under_construction_country", "top_load_factor", "top_generation", "operable_reactors", "under_construction_reactors",
        "longterm_shutdown_reactors", "permanent_shutdown_reactors"
    ],

    _topCapacityByStatusBySubProperty : function(params) {
        var x = params.x || 0;
        var operationStatus = params.status;
        var sub = params.sub;

        return function(component) {
            var result = component.edge.result;

            var values = [];
            var status = result.aggregation("status");
            for (var i = 0; i < status.buckets.length; i++){
                var bucket = status.buckets[i];
                if (bucket.key === operationStatus) {
                    for (var j = 0; j < bucket[sub].buckets.length; j++) {
                        var subBucket = bucket[sub].buckets[j];
                        var name = subBucket.key;
                        var total_gwe = subBucket.total_gwe.value;
                        values.push({label: name, value: total_gwe});
                    }
                }
            }

            values.sort(function(a, b) {
                if (a.value < b.value) {
                    return 1;
                }
                if (a.value > b.value) {
                    return -1;
                }
                return 0;
            });

            if (x > 0) {
                values = values.slice(0, x);
            }
            var seriesName = "Total " + operationStatus + " Reactor Net Capacity";
            return [{key: seriesName, values: values}];
        }
    },

    _topElectricityGenerationByCountry : function(params) {
        var x = params.x || 0;

        return function(component) {
            var result = component.edge.result;

            var values = [];
            var countries = result.aggregation("country");
            for (var i = 0; i < countries.buckets.length; i++){
                var bucket = countries.buckets[i];
                var total = bucket["electricity_generated"].value;
                values.push({label: bucket.key, value: total});
            }

            values.sort(function(a, b) {
                if (a.value < b.value) {
                    return 1;
                }
                if (a.value > b.value) {
                    return -1;
                }
                return 0;
            });

            if (x > 0) {
                values = values.slice(0, x);
            }
            var seriesName = "Top Electricity Generated by Country";
            return [{key: seriesName, values: values}];
        }
    },

    _showPageSection : function(params) {
        var sectionName = params.sectionName;
        var showComponents = params.showComponents;

        if (showComponents.length === 0) {
            return $.inArray(sectionName, reactordb._defaultSections) > -1;
        }

        return $.inArray(sectionName, showComponents) > -1
    },

    makeGenericReport : function(params) {
        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        var selector = params.selector || "#generic-report";
        var operation_index = params.operation_index || "operation";
        var reactor_index = params.reactor_index || "reactor";
        var reactor_search_url = params.reactor_search_url || current_scheme + "//" + current_domain + "/query/" + reactor_index + "/_search";
        var operation_search_url = params.operation_search_url || current_scheme + "//" + current_domain + "/query/" + operation_index + "/_search";

        var reactorPageURLTemplate = edges.getParam(params.reactorPageURLTemplate, "/reactor/{reactor_name}");
        var countryPageURLTemplate = edges.getParam(params.countryPageURLTemplate, "/country/{country_name}");
        var searchPageURLTemplate = edges.getParam(params.searchPageURLTemplate, "/search?source={query}");

        var reactorsBackground = edges.getParam(params.reactorsBackground, '/static/images/iconReactor.svg');
        var underConstructionBackground = edges.getParam(params.underConstructionBackground, "/static/images/iconConstruction.svg");
        var shutdownBackground = edges.getParam(params.shutdownBackground, "/static/images/iconShutdown.svg");

        var topX = edges.getParam(params.topX, 10);

        var thisYear = edges.getParam(params.year, (new Date()).getUTCFullYear());

        var urlParams = edges.getUrlParams();
        var showComponents = [];
        if (urlParams.hasOwnProperty("show") && urlParams["show"] !== "") {
            showComponents = urlParams["show"].split(",").map(function(x) { return x.trim()});
        }

        // depending on which components we're going to load, we will need to augment the base query as we go
        var baseQuery = es.newQuery({
            size: 10000,
            sort: [es.newSort({field: "reactor.name.exact", order: "asc"})],
            aggs : [
                es.newTermsAggregation({name: "status", field: "reactor.status.exact", aggs: [
                    es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
                ]})
            ]
        });

        // first load all the required components
        var components = [
            edges.newLeaveSearchNavigation({
                id: "return_to_search",
                urlTemplate: searchPageURLTemplate,
                urlQueryPlaceholder: "{query}",
                renderer: edges.bs3.newLeaveSearchNavigationRenderer({
                    text: "&laquo; Return to search",
                    hide: function(renderer) {
                        var urlParams = renderer.component.edge.urlParams;
                        if (urlParams.hasOwnProperty("ref")) {
                            if (urlParams.ref === "search") {
                                return false;
                            }
                        }
                        return true;
                    }
                })
            }),
            edges.numbers.newStory({
                id: "generic_page_title",
                category: "title",
                template: "<h1>{title}</h1>",
                calculate : function(component) {
                    var values = {};
                    if (component.edge.urlParams.hasOwnProperty("title") && component.edge.urlParams["title"] !== "") {
                        values["title"] = component.edge.urlParams["title"];
                    } else {
                        values["title"] = "Reactor Database Report";
                    }
                    return values;
                },
                renderer : edges.bs3.newStoryRenderer()
            })
        ];

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "filters"})) {
            // selected filters display, with all the fields given their display names
            components.push(
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
                    },
                    renderer: edges.bs3.newSelectedFiltersRenderer({
                        allowRemove: false
                    })
                })
            )
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "highlight"})) {
            components.push(
                edges.numbers.newImportantNumbers({
                    id: "operable_reactors_count",
                    category: "big-number",
                    calculate: reactordb._reactorStatusCount({status: "Operable"}),
                    renderer: edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Operable Reactors</h4>",
                        backgroundImg: reactorsBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.numbers.newImportantNumbers({
                    id: "reactors_under_construction_count",
                    category: "big-number",
                    calculate: reactordb._reactorStatusCount({status: "Under Construction"}),
                    renderer: edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Reactors&nbsp;Under Construction</h4>",
                        backgroundImg: underConstructionBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.numbers.newImportantNumbers({
                    id: "reactors_shutdown_count",
                    category: "big-number",
                    calculate: reactordb._reactorStatusCount({status: "Permanent Shutdown"}),
                    renderer: edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Reactors Shutdown</h4>",
                        backgroundImg: shutdownBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                })
            )
        }

        // if there is no component list provided, or operable_nuclear_capacity is in the list of components
        // then add it
        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "operable_nuclear_capacity"})) {
            components.push(
                edges.numbers.newStory({
                    id: "operable_nuclear_capacity_story",
                    category: "panel",
                    template: "{a} MWe in {b}",
                    calculate: reactordb._operableNuclearCapacityInResults({year: thisYear}),
                    renderer : edges.bs3.newStoryRenderer({
                        title: "<h3>Operable Nuclear Capacity</h3>"
                    })
                })
            );
            components.push(
                edges.newMultibar({
                    id: "operable_nuclear_capacity",
                    category: "panel",
                    dataFunction: reactordb._operableNuclearCapacityByYearInResults({upperLimitYear: parseInt(thisYear)}),
                    renderer: edges.nvd3.newMultibarRenderer({
                        hideIfNoData: true,
                        onHide: function () {
                            $("#operable_nuclear_capacity_story").hide();
                        },
                        onShow: function () {
                            $("#operable_nuclear_capacity_story").show();
                        },
                        xTickFormat: ".0f",
                        barColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Operable Nuclear Capacity (MWe)",
                        marginLeft: 80
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "electricity_generated"})) {
            components.push(
                edges.numbers.newStory({
                    id: "generic_nuclear_generation_story",
                    category: "panel",
                    template: "{a} GWh: electricity generation from nuclear energy",
                    calculate: reactordb._nuclearGenerationThisYear({year: thisYear, resultSet: "a"}),
                    renderer: edges.bs3.newStoryRenderer({
                        title: "<h3>Electricity Generated</h3>"
                    })
                })
            );

            components.push(
                edges.newMultibar({
                    id: "generic_nuclear_generation_histogram",
                    category: "panel",
                    dataFunction: reactordb._electricityGenerationByYear({resultSet: "a"}),
                    renderer: edges.nvd3.newMultibarRenderer({
                        hideIfNoData: true,
                        onHide: function () {
                            $("#generic_nuclear_generation_story").hide();
                        },
                        onShow: function () {
                            $("#generic_nuclear_generation_story").show();
                        },
                        xTickFormat: ".0f",
                        barColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Electricity Generated (GWh)",
                        marginLeft: 80,
                        yAxisLabelDistance: 10
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_electricity_gen"})) {
            var aggregation = es.newTermsAggregation({
                name: "country", field: "reactor.country.exact", size: 300, aggs: [
                    es.newSumAggregation({name: "electricity_generated", field: "reactor.electricity_supplied." + thisYear})
                ]
            });
            baseQuery.addAggregation(aggregation);

            components.push(
                edges.newHorizontalMultibar({
                    id: "top_electricity_gen",
                    category: "panel",
                    dataFunction: reactordb._topElectricityGenerationByCountry({x: topX}),
                    renderer: edges.nvd3.newHorizontalMultibarRenderer({
                        hideIfNoData: true,
                        title: "<h3>Top Electricity Generation by Country (" + thisYear + ")</h3>",
                        legend: false,
                        dynamicHeight: true,
                        barHeight: 40,
                        reserveAbove: 50,
                        reserveBelow: 50,
                        color: ["#1e9dd8"],
                        yAxisLabel: "Total Electricity Generation (GWh)",
                        valueFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " GWh"
                        })
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_country"})
                || reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_country"})) {

            var statusAgg = baseQuery.getAggregation({name: "status"});
            var aggregation = es.newTermsAggregation({
                name: "country", field: "reactor.country.exact", size: 300, aggs: [
                    es.newSumAggregation({name: "total_gwe", field: "reactor.reference_unit_power_capacity_net"})
                ]
            });
            statusAgg.addAggregation(aggregation);

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_country"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_operable_reactor_capacity_by_country",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Operable", x: topX, sub: "country"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Top Operable Reactor Net Capacity By Country</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_country"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_under_construction_reactor_capacity_by_country",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Under Construction", x: topX, sub: "country"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Top Under Construction Reactor Net Capacity By Country</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_process"})
                || reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_process"})) {

            var statusAgg = baseQuery.getAggregation({name: "status"});
            var aggregation = es.newTermsAggregation({
                name: "process", field: "reactor.process.exact", size: 20, aggs: [
                    es.newSumAggregation({name: "total_gwe", field: "reactor.reference_unit_power_capacity_net"})
                ]
            });
            statusAgg.addAggregation(aggregation);

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_process"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_operable_reactor_capacity_by_process",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Operable", sub: "process"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Operable Reactor Net Capacity By Reactor Type</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_process"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_under_construction_reactor_capacity_by_process",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Under Construction", x: topX, sub: "process"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Under Construction Reactor Net Capacity By Reactor Type</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_region"})
                || reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_region"})) {

            var statusAgg = baseQuery.getAggregation({name: "status"});
            var aggregation = es.newTermsAggregation({
                name: "region", field: "reactor.region.exact", size: 99, aggs: [
                    es.newSumAggregation({name: "total_gwe", field: "reactor.reference_unit_power_capacity_net"})
                ]
            });
            statusAgg.addAggregation(aggregation);

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operable_region"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_operable_reactor_capacity_by_region",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Operable", sub: "region"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Operable Reactor Net Capacity By Region</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }

            if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_under_construction_region"})) {
                components.push(
                    edges.newHorizontalMultibar({
                        id: "top_under_construction_reactor_capacity_by_region",
                        category: "panel",
                        dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Under Construction", sub: "region"}),
                        renderer: edges.nvd3.newHorizontalMultibarRenderer({
                            hideIfNoData: true,
                            title: "<h3>Under Construction Reactor Net Capacity By Region</h3>",
                            legend: false,
                            dynamicHeight: true,
                            barHeight: 40,
                            reserveAbove: 50,
                            reserveBelow: 50,
                            color: ["#1e9dd8"],
                            yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                            valueFormat: edges.numFormat({
                                decimalPlaces: 0,
                                thousandsSeparator: ",",
                                suffix: " MWe"
                            })
                        })
                    })
                );
            }
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_owners"})) {

            var statusAgg = baseQuery.getAggregation({name: "status"});
            var aggregation = es.newTermsAggregation({
                name: "owner", field: "reactor.owner.name.exact", size: 10000, aggs: [
                    es.newSumAggregation({name: "total_gwe", field: "reactor.reference_unit_power_capacity_net"})
                ]
            });
            statusAgg.addAggregation(aggregation);

            components.push(
                edges.newHorizontalMultibar({
                    id: "top_operable_reactor_capacity_by_owner",
                    category: "panel",
                    dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Operable", x: topX, sub: "owner"}),
                    renderer: edges.nvd3.newHorizontalMultibarRenderer({
                        hideIfNoData: true,
                        title: "<h3>Top Operable Reactor Net Capacity By Owner</h3>",
                        legend: false,
                        dynamicHeight: true,
                        barHeight: 40,
                        reserveAbove: 50,
                        reserveBelow: 50,
                        color: ["#1e9dd8"],
                        yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                        xAxisLabelWrap: true,
                        valueFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_operators"})) {

            var statusAgg = baseQuery.getAggregation({name: "status"});
            var aggregation = es.newTermsAggregation({
                name: "operator", field: "reactor.operator.exact", size: 10000, aggs: [
                    es.newSumAggregation({name: "total_gwe", field: "reactor.reference_unit_power_capacity_net"})
                ]
            });
            statusAgg.addAggregation(aggregation);

            components.push(
                edges.newHorizontalMultibar({
                    id: "top_operable_reactor_capacity_by_operator",
                    category: "panel",
                    dataFunction: reactordb._topCapacityByStatusBySubProperty({status: "Operable", x: topX, sub: "operator"}),
                    renderer: edges.nvd3.newHorizontalMultibarRenderer({
                        hideIfNoData: true,
                        title: "<h3>Top Operable Reactor Net Capacity By Operator</h3>",
                        legend: false,
                        dynamicHeight: true,
                        barHeight: 40,
                        reserveAbove: 50,
                        reserveBelow: 50,
                        color: ["#1e9dd8"],
                        yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                        xAxisLabelWrap: true,
                        valueFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_load_factor"})) {
            components.push(
                edges.newResultsDisplay({
                    id : "top_load_factor",
                    category: "panel",
                    filter: function(results) {
                        var filtered = [];
                        for (var i = 0; i < results.results.length; i++) {
                            var result = results.results[i];
                            var val = edges.objVal("reactor.load_factor." + String(thisYear), result);
                            if (val !== false) {
                                filtered.push(result);
                            }
                        }
                        return filtered;
                    },
                    sort: function(a, b) {
                        var aval = edges.objVal("reactor.load_factor." + String(thisYear), a);
                        var bval = edges.objVal("reactor.load_factor." + String(thisYear), b);
                        if (aval < bval) {
                            return 1;
                        }
                        if (aval > bval) {
                            return -1;
                        }
                        return 0;
                    },
                    limit: topX,
                    renderer : edges.bs3.newTabularResultsRenderer({
                        hideOnNoResults: true,
                        title: "<h3>Top Load Factor (" + thisYear + ")</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.load_factor." + thisYear, display: "Load Factor"},
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "top_generation"})) {
            components.push(
                edges.newResultsDisplay({
                    id: "top_annual_generation",
                    category: "panel",
                    filter: function (results) {
                        var filtered = [];
                        for (var i = 0; i < results.results.length; i++) {
                            var result = results.results[i];
                            var val = edges.objVal("reactor.electricity_supplied." + String(thisYear), result);
                            if (val !== false) {
                                filtered.push(result);
                            }
                        }
                        return filtered;
                    },
                    sort: function (a, b) {
                        var aval = edges.objVal("reactor.electricity_supplied." + String(thisYear), a);
                        var bval = edges.objVal("reactor.electricity_supplied." + String(thisYear), b);
                        if (aval < bval) {
                            return 1;
                        }
                        if (aval > bval) {
                            return -1;
                        }
                        return 0;
                    },
                    limit: topX,
                    renderer: edges.bs3.newTabularResultsRenderer({
                        hideOnNoResults: true,
                        title: "<h3>Top Generation (" + thisYear + ")</h3>",
                        fieldDisplay: [
                            {
                                field: "id",
                                fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}),
                                display: "Reactor Name",
                                valueFunction: reactordb._htmlPassThrough
                            },
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {
                                field: "reactor.electricity_supplied." + thisYear,
                                display: "Total Generation (" + thisYear + ") (GWh)",
                                valueFunction: edges.numFormat({
                                    reflectNonNumbers: true,
                                    decimalPlaces: 0,
                                    thousandsSeparator: ","
                                })
                            },
                            {
                                field: "reactor.country",
                                display: "Location",
                                valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})
                            }
                        ]
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "operable_reactors"})) {
            components.push(
                edges.newResultsDisplay({
                    id : "generic_operable_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Operable"}),
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Operable Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.first_grid_connection", display: "Grid Connection"},
                            {field: "reactor.load_factor." + thisYear, display: "Load Factor (" + thisYear + ") (%)"},
                            {
                                field: "electricity_generated",
                                fieldFunction: reactordb._electricityGeneratedInYear({year: thisYear}),
                                display: "Electricity Generated (" + thisYear + ") (GWh)",
                                valueFunction: edges.numFormat({
                                    reflectNonNumbers: true,
                                    decimalPlaces: 0,
                                    thousandsSeparator: ","
                                })
                            }
                        ]
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "under_construction_reactors"})) {
            components.push(
                edges.newResultsDisplay({
                    id: "generic_under_construction_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Under Construction"}),
                    renderer: edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Under Construction Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay: [
                            {
                                field: "id",
                                fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}),
                                display: "Reactor Name",
                                valueFunction: reactordb._htmlPassThrough
                            },
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.construction_start", display: "Construction Start"}
                        ]
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "longterm_shutdown_reactors"})) {
            components.push(
                edges.newResultsDisplay({
                    id: "generic_longterm_shutdown_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Long-term Shutdown"}),
                    renderer: edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Long-term Shutdown Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay: [
                            {
                                field: "id",
                                fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}),
                                display: "Reactor Name",
                                valueFunction: reactordb._htmlPassThrough
                            },
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.longterm_shutdown", display: "Long-term Shutdown"}
                        ]
                    })
                })
            );
        }

        if (reactordb._showPageSection({showComponents: showComponents, sectionName: "permanent_shutdown_reactors"})) {
            components.push(
                edges.newResultsDisplay({
                    id: "generic_permanent_shutdown_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Permanent Shutdown"}),
                    renderer: edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Permanent Shutdown Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay: [
                            {
                                field: "id",
                                fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}),
                                display: "Reactor Name",
                                valueFunction: reactordb._htmlPassThrough
                            },
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.permanent_shutdown", display: "Permanent Shutdown"}
                        ]
                    })
                })
            );
        }

        var e = edges.newEdge({
            selector: selector,
            search_url: reactor_search_url,
            template: reactordb.newGenericTemplate(),
            manageUrl: true,
            urlQueryOptions: {
                include_query_string : true,
                include_filters : true,
                include_paging : false,
                include_sort : false,
                include_fields : false,
                include_aggregations : false
            },
            openingQuery : es.newQuery(),
            baseQuery: baseQuery,
            secondaryQueries : {
                a : function(edge) {
                    var current = edge.cloneQuery();
                    current.clearAggregations();
                    return current;
                    /*
                    var results = edge.result.results();
                    var reactorIDs = [];
                    for (var i = 0; i < results.length; i++) {
                        reactorIDs.push(results[i]["id"])
                    }

                    return es.newQuery({
                        must : [
                            es.newRangeFilter({field: "year", lte: thisYear, gte: 1970}),
                            es.newTermsFilter({field: "reactor.exact", values: reactorIDs})
                        ],
                        size: 0,
                        aggs : [
                            es.newTermsAggregation({name: "year", field: "year", size: 100, orderBy: "_term", orderDir: "asc", aggs : [
                                es.newSumAggregation({name: "electricity_generation", field: "electricity_supplied"})
                            ]})
                        ]
                    })
                    */
                }
            },
            secondaryUrls : {
                a : operation_search_url
            },
            components : components
        });

        reactordb.activeEdges[selector] = e;
    },

    newGenericTemplate : function(params) {
        return edges.instantiate(reactordb.GenericTemplate, params, edges.newTemplate);
    },
    GenericTemplate : function(params) {
        this.namespace = "reactordb-generic";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var bigNumberClass = edges.css_classes(this.namespace, "bignumber");
            var panelClass = edges.css_classes(this.namespace, "panel");
            var mapClass = edges.css_classes(this.namespace, "map");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // return-to-search button
            frag += '<div class="row"><div class="col-md-12"><div id="return_to_search"></div></div></div>';

            // the header for the page
            frag += '<div class="row">\
                <div class="col-md-12">\
                    <div id="generic_page_title"><h1>Reactor Database Report</h1></div>\
                </div>\
            </div>';

            // selected filters
            frag += '<div class="row">\
                <div class="col-md-12">\
                    <div id="selected-filters"></div>\
                </div>\
            </div>';

            // the big numbers along the top
            frag += '<div class="row">\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-4 col-md-8 col-md-offset-4 col-sm-8 col-sm-offset-4 col-xs-10 col-xs-offset-1">\
                            <div id="operable_reactors_count"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 col-xs-10 col-xs-offset-1">\
                            <div id="reactors_under_construction_count"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-lg-offset-0 col-md-4 col-md-offset-0 col-sm-4 col-sm-offset-0 col-xs-10 col-xs-offset-1">\
                    <div class="row">\
                        <div class="col-lg-8 col-md-8 col-sm-8 col-xs-12">\
                            <div id="reactors_shutdown_count"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>';

            // the full width panels beneath
            var panel = edge.category("panel");
            if (panel.length > 0) {
                for (var i = 0; i < panel.length; i++) {
                    frag += '<div class="row"><div class="col-md-12"><div class="' + panelClass + '" dir="auto"><div id="' + panel[i].id + '"></div></div></div></div>';
                }
            }

            // final note about the data sources
            frag += '<div class="row"><div class="col-xs-12"><p>Data Sources: World Nuclear Association and <a href="https://www.iaea.org/PRIS/home.aspx">IAEA Power Reactor Information System</a></p></div></div>';

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    /* =====================================================
     * Functions for the Country Page
     * =====================================================
     */

    _electricityGeneratedInYear : function(args) {
        var year = args.year;

        return function(params) {
            var result = params.result;
            var def = params.default;

            var esc = result.reactor.electricity_supplied_cumulative;
            var current = 0.0;
            if (esc.hasOwnProperty(year)) {
                current = esc[year];
            }
            if (current === 0.0) {
                return def;
            }
            var lastYear = year - 1;
            var previous = 0.0;
            if (esc.hasOwnProperty(lastYear)) {
                previous = esc[lastYear];
            }
            return current - previous;
        }
    },

    _lifetimeGeneration : function(params) {
        var result = params.result;

        var lifetimeGen = 0.0;
        for (var year in result.reactor.electricity_supplied_cumulative) {
            var gen = result.reactor.electricity_supplied_cumulative[year];
            if (gen > lifetimeGen) {
                lifetimeGen = gen;
            }
        }
        return lifetimeGen;
    },

    _countryNuclearShare : function(component) {
        var iter = component.edge.resources.nuclear_share.iterator();
        var row = iter.next();

        var seriesName = "Nuclear Share of Generation";

        if (row) {
            var share = parseFloat(row["Nuclear Share [%]"]);
            var other = 100.0 - share;

            var values = [
                {label: "Nuclear", value: share},
                {label: "Other", value: other}
            ];

            return [{key: seriesName, values: values}]
        } else {
            var values = [
                {label: "Nuclear", value: 0.0},
                {label: "Other", value: 100.0}
            ];

            return [{key: seriesName, values: values}]
        }
    },

    _preFilterCountryNuclearShare : function(args) {
        var year = args.year;
        var country = args.country;

        return function(params) {
            var resource = params.resource;
            var edge = params.edge;

            resource.add_filter({filter: {field: "Country", value: country, type: "case_insensitive"}});
            resource.add_filter({filter: {field: "Year", value: String(year), type: "case_insensitive"}});
        }
    },

    makeCountryReport : function(params) {
        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        var selector = params.selector || "#country-report";
        var operation_index = params.operation_index || "operation";
        var reactor_index = params.reactor_index || "reactor";
        var reactor_search_url = params.reactor_search_url || current_scheme + "//" + current_domain + "/query/" + reactor_index + "/_search";
        var operation_search_url = params.operation_search_url || current_scheme + "//" + current_domain + "/query/" + operation_index + "/_search";

        var country_regex = params.country_regex || new RegExp("country\/(.+)");
        var country_name = params.country_name || country_regex.exec(window.location.pathname)[1];
        country_name = decodeURIComponent(country_name);
        country_name = country_name.toLowerCase();

        var nuclearShareURL = edges.getParam(params.nuclearShareURL, "/static/data/share-of-electricity-generation.csv");
        var reactorPageURLTemplate = edges.getParam(params.reactorPageURLTemplate, "/reactor/{reactor_name}");

        var reactorsBackground = edges.getParam(params.reactorsBackground, '/static/images/iconReactor.svg');
        var underConstructionBackground = edges.getParam(params.underConstructionBackground, "/static/images/iconConstruction.svg");

        var thisYear = edges.getParam(params.year, (new Date()).getUTCFullYear());

        var e = edges.newEdge({
            selector: selector,
            search_url: reactor_search_url,
            template: reactordb.newCountryTemplate(),
            manageUrl: false,
            staticFiles : [
                {
                    id : "nuclear_share",
                    url : nuclearShareURL,
                    processor : edges.csv.newObjectByRow,
                    datatype : "text",
                    opening: reactordb._preFilterCountryNuclearShare({year: thisYear, country: country_name})
                }
            ],
            openingQuery : es.newQuery({
                must : [
                    es.newTermFilter({field : "index.country.exact", value: country_name})
                ],
                size: 1000,
                sort: [es.newSort({field: "reactor.name.exact", order: "asc"})],
                aggs : [
                    es.newTermsAggregation({name: "status", field: "reactor.status.exact", aggs: [
                        es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
                    ]})
                ]
            }),
            secondaryQueries : {
                a : function() {
                    return es.newQuery({
                        must : [
                            es.newRangeFilter({field: "year", lte: thisYear, gte: 1970}),
                            es.newTermFilter({field : "index.country.exact", value: country_name})
                        ],
                        size: 0,
                        aggs : [
                            es.newTermsAggregation({name: "year", field: "year", size: 100, orderBy: "_term", orderDir: "asc", aggs : [
                                es.newSumAggregation({name: "electricity_generation", field: "electricity_supplied"})
                            ]})
                        ]
                    })
                }
            },
            secondaryUrls : {
                a : operation_search_url
            },
            components : [
                edges.numbers.newStory({
                    id: "country_page_title",
                    category: "title",
                    template: "<h1>Nuclear Reactors in {a}</h1>",
                    calculate: function(component) {
                        var results = component.edge.result.results();
                        if (results.length > 0) {
                            return {"a" : results[0].reactor.country};
                        } else {
                            return {"a" : "Unknown Location"}
                        }
                    },
                    renderer : edges.bs3.newStoryRenderer()
                }),
                edges.numbers.newImportantNumbers({
                    id: "operable_reactors_count",
                    category: "big-number",
                    calculate: reactordb._reactorStatusCount({status: "Operable"}),
                    renderer : edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Operable Reactors</h4>",
                        backgroundImg: reactorsBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.newPieChart({
                    id: "country_nuclear_share",
                    category: "big-number",
                    dataFunction: reactordb._countryNuclearShare,
                    display: "<h4>Nuclear Share of Generation</h4>",
                    renderer : edges.nvd3.newPieChartRenderer({
                        showLegend: false,
                        color: ["#1e9dd8", "#ddddff"],
                        footer: reactordb._nuclearPercentForPieRenderer,
                        showLabels: false,
                        valueFormat : edges.numFormat({
                            decimalPlaces: 2,
                            suffix: "%"
                        }),
                        growOnHover: false,
                        onResize : function(chart) {
                            var container = $(".edges-nvd3-pie-svg-container", "#country_nuclear_share");
                            var height = container.height();
                            var margin_map = {
                                180: -23,
                                145: -19,
                                118: -15
                            };
                            var margin = margin_map[height] || -23;
                            chart.margin({"left":margin, "right":margin, "top":margin, "bottom":margin});
                        },
                        resizeOnInit: true
                    })
                }),
                edges.numbers.newImportantNumbers({
                    id: "reactors_under_construction_count",
                    category: "big-number",
                    calculate: reactordb._reactorStatusCount({status: "Under Construction"}),
                    renderer : edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Reactors&nbsp;Under Construction</h4>",
                        backgroundImg: underConstructionBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.numbers.newStory({
                    id: "operable_nuclear_capacity_story",
                    category: "panel",
                    template: "{a} MWe in {b}",
                    calculate: reactordb._operableNuclearCapacityInResults({year: thisYear}),
                    renderer : edges.bs3.newStoryRenderer({
                        title: "<h3>Operable Nuclear Capacity</h3>"
                    })
                }),
                edges.newMultibar({
                    id: "operable_nuclear_capacity",
                    category: "panel",
                    dataFunction: reactordb._operableNuclearCapacityByYearInResults({upperLimitYear: parseInt(thisYear)}),
                    renderer : edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor : ["#1e9dd8"],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Operable Nuclear Capacity (MWe)",
                        marginLeft: 80
                    })
                }),
                edges.numbers.newStory({
                    id: "country_nuclear_generation_story",
                    category: "panel",
                    template: "{a} GWh: electricity generation from nuclear energy in {b}",
                    calculate: reactordb._nuclearGenerationThisYear({year: thisYear, resultSet: "a"}),
                    renderer : edges.bs3.newStoryRenderer({
                        title: "<h3>Electricity Generated</h3>"
                    })
                }),
                edges.newMultibar({
                    id: "country_nuclear_generation_histogram",
                    category: "panel",
                    dataFunction: reactordb._electricityGenerationByYear({resultSet: "a"}),
                    renderer : edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor : ["#1e9dd8"],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Electricity Generated (GWh)",
                        marginLeft: 80
                    })
                }),
                edges.newResultsDisplay({
                    id : "country_operable_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Operable"}),
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Operable Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.first_grid_connection", display: "Grid Connection"},
                            {field: "reactor.load_factor." + thisYear, display: "Load Factor (" + thisYear + ") (%)"},
                            {
                                field: "electricity_generated",
                                fieldFunction: reactordb._electricityGeneratedInYear({year: thisYear}),
                                display: "Electricity Generated (" + thisYear + ") (GWh)",
                                valueFunction: edges.numFormat({
                                    reflectNonNumbers: true,
                                    decimalPlaces: 0,
                                    thousandsSeparator: ","
                                })
                            }
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "country_under_construction_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Under Construction"}),
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Under Construction Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.construction_start", display: "Construction Start"}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "country_longterm_shutdown_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Long-term Shutdown"}),
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Long-term Shutdown Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Capacity (MWe)"},
                            {field: "reactor.longterm_shutdown", display: "Long-term Shutdown"}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "country_permanent_shutdown_reactors",
                    category: "panel",
                    filter: reactordb._filterResultsByStatus({status: "Permanent Shutdown"}),
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>All Permanent Shutdown Reactors</h3>",
                        sortable: true,
                        hideOnNoResults: true,
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.permanent_shutdown", display: "Permanent Shutdown"}
                        ]
                    })
                })
            ]
        });

        reactordb.activeEdges[selector] = e;
    },

    newCountryTemplate : function(params) {
        return edges.instantiate(reactordb.CountryTemplate, params, edges.newTemplate);
    },
    CountryTemplate : function(params) {
        this.namespace = "reactordb-country";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var bigNumberClass = edges.css_classes(this.namespace, "bignumber");
            var panelClass = edges.css_classes(this.namespace, "panel");
            var mapClass = edges.css_classes(this.namespace, "map");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // the header for the page
            frag += '<div class="row">\
                <div class="col-md-12">\
                    <div id="country_page_title"><h1>Nuclear Reactors</h1></div>\
                </div>\
            </div>';

            // the big numbers along the top
            frag += '<div class="row">\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-4 col-md-8 col-md-offset-4 col-sm-8 col-sm-offset-4 col-xs-10 col-xs-offset-1">\
                            <div id="operable_reactors_count"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 col-xs-10 col-xs-offset-1">\
                            <div id="country_nuclear_share"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-lg-offset-0 col-md-4 col-md-offset-0 col-sm-4 col-sm-offset-0 col-xs-10 col-xs-offset-1">\
                    <div class="row">\
                        <div class="col-lg-8 col-md-8 col-sm-8 col-xs-12">\
                            <div id="reactors_under_construction_count"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>';

            // the full width panels beneath
            var panel = edge.category("panel");
            if (panel.length > 0) {
                for (var i = 0; i < panel.length; i++) {
                    frag += '<div class="row"><div class="col-md-12"><div class="' + panelClass + '" dir="auto"><div id="' + panel[i].id + '"></div></div></div></div>';
                }
            }

            // final note about the data sources
            frag += '<div class="row"><div class="col-xs-12"><p>Data Sources: World Nuclear Association and <a href="https://www.iaea.org/PRIS/home.aspx">IAEA Power Reactor Information System</a></p></div></div>';

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    /* =====================================================
     * Functions for the Dashboard
     * =====================================================
     */
    _gwh2twh : function(gwh) {
        var twh = gwh / 1000.0;
        var formatter = edges.numFormat({
            decimalPlaces: 1,
            thousandsSeparator: ","
        });
        return formatter(twh);
    },

    _globalElectricityGenerationByYear : function(component) {
        var seriesName = "Global Electricity Generation by Year";

        var results = component.edge.secondaryResults.b;
        var buckets = results.data.aggregations.year.buckets;
        var values = [];
        for (var i = 0; i < buckets.length; i++) {
            var bucket = buckets[i];
            var gen = bucket.electricity_generation.value;
            gen = gen / 1000.0;
            values.push({label: bucket.key, value: gen});
        }

        return [{key: seriesName, values: values}]
    },

    _globalNuclearGeneration : function(params) {
        var year = parseInt(params.year);

        return function(component) {
            var results = component.edge.secondaryResults.b;
            var buckets = results.data.aggregations.year.buckets;
            var gen = 0.0;
            for (var i = 0; i < buckets.length; i++) {
                var bucket = buckets[i];
                if (bucket.key === year) {
                    var gen = bucket.electricity_generation.value;
                }
            }

            var gentwh = gen / 1000.0;

            var formatter = edges.numFormat({
                decimalPlaces: 0,
                thousandsSeparator: ","
            });

            return {"a" : formatter(gentwh), "b" : year}
        }
    },

    _preFilterGlobalNuclearShare : function(args) {
        var year = args.year;

        return function(params) {
            var resource = params.resource;
            var edge = params.edge;

            resource.add_filter({filter: {field: "Country", value: "GLOBAL", type: "exact"}});
            resource.add_filter({filter: {field: "Year", value: String(year), type: "exact"}});
        }
    },

    _globalNuclearShare : function(component) {
        var iter = component.edge.resources.nuclear_share.iterator();
        var row = iter.next();

        var seriesName = "Share of Global Electricity Generation";

        if (row) {
            var share = parseFloat(row["Nuclear Share [%]"]);
            var other = 100.0 - share;

            var values = [
                {label: "Nuclear", value: share},
                {label: "Other", value: other}
            ];

            return [{key: seriesName, values: values}]
        } else {
            var values = [
                {label: "Nuclear", value: 0.0},
                {label: "Other", value: 100.0}
            ];

            return [{key: seriesName, values: values}]
        }
    },

    _nuclearPercentForPieRenderer : function(renderer) {
        var ds = renderer.component.dataSeries;
        if (!ds) {
            return "-- %";
        }
        for (var i = 0; i < ds[0].values.length; i++) {
            var entry = ds[0].values[i];
            if (entry.label === "Nuclear") {
                return entry.value + " %";
            }
        }
        return "-- %";
    },

    _operableReactorsCount : function(params) {
        return function(component) {
            var result = component.edge.result;

            var main = result.total();
            var second = result.aggregation("total_gwe").value;

            return {main: main, second: second};
        }
    },

    _underConstructionReactorsCount : function(params) {
        return function(component) {
            var result = component.edge.secondaryResults.a;

            var main = result.total();
            var second = result.aggregation("total_gwe").value;

            return {main: main, second: second};
        }
    },

    _topXReactorsByOperableCapacity : function(params) {
        return function(component) {
            var result = component.edge.result;

            var values = [];
            var countries = result.aggregation("country");
            for (var i = 0; i < countries.buckets.length; i++){
                var bucket = countries.buckets[i];
                var name = bucket.key;
                var total_gwe = bucket.total_gwe.value;
                values.push({label: name, value: total_gwe});
            }

            values.sort(function(a, b) {
                if (a.value < b.value) {
                    return 1;
                }
                if (a.value > b.value) {
                    return -1;
                }
                return 0;
            });

            var limitted = values.slice(0, params.x);
            var seriesName = "Total Operable Reactor Net Capacity";
            return [{key: seriesName, values: limitted}];
        }
    },

    _topXReactorsByUnderConstructionCapacity : function(params) {
        return function(component) {
            var result = component.edge.secondaryResults.a;

            var values = [];
            var countries = result.aggregation("country");
            for (var i = 0; i < countries.buckets.length; i++){
                var bucket = countries.buckets[i];
                var name = bucket.key;
                var total_gwe = bucket.total_gwe.value;
                values.push({label: name, value: total_gwe});
            }

            values.sort(function(a, b) {
                if (a.value < b.value) {
                    return 1;
                }
                if (a.value > b.value) {
                    return -1;
                }
                return 0;
            });

            var limitted = values.slice(0, params.x);
            var seriesName = "Reactors Under Construction Net Capacity";
            return [{key: seriesName, values: limitted}];
        }
    },

    makeDashboard : function(params) {
        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        var selector = params.selector || "#dashboard";
        var operation_index = params.operation_index || "operation";
        var reactor_index = params.reactor_index || "reactor";
        var reactor_search_url = params.reactor_search_url || current_scheme + "//" + current_domain + "/query/" + reactor_index + "/_search";
        var operation_search_url = params.operation_search_url || current_scheme + "//" + current_domain + "/query/" + operation_index + "/_search";

        var nuclearShareURL = edges.getParam(params.nuclearShareURL, "/static/data/share-of-electricity-generation.csv");
        var reactorPageURLTemplate = edges.getParam(params.reactorPageURLTemplate, "/reactor/{reactor_name}");
        var countryPageURLTemplate = edges.getParam(params.countryPageURLTemplate, "/country/{country_name}");
        var searchPageURL = edges.getParam(params.searchPageURL, "/search");

        var topOperableCapacities = edges.getParam(params.topOperableCapacities, 10);
        var topUnderConstructionCapacities = edges.getParam(params.topUnderConstructionCapacities, 10);
        var mostRecentGridConnections = edges.getParam(params.mostRecentGridConnections, 10);
        var mostRecentConstructionStarts = edges.getParam(params.mostRecentConstructionStarts, 10);
        var topLoadFactors = edges.getParam(params.topLoadFactors, 10);
        var topLifetimeGenerations = edges.getParam(params.topLifetimeGenerations, 10);
        var topAnnualGenerations = edges.getParam(params.topAnnualGenerations, 10);

        var reactorsBackground = edges.getParam(params.reactorsBackground, '/static/images/iconReactor.svg');
        var underConstructionBackground = edges.getParam(params.underConstructionBackground, "/static/images/iconConstruction.svg");

        var thisYear = edges.getParam(params.year, (new Date()).getUTCFullYear());

        var e = edges.newEdge({
            selector: selector,
            search_url: reactor_search_url,
            template: reactordb.newDashboardTemplate({searchPageURL: searchPageURL}),
            manageUrl: false,
            staticFiles : [
                {
                    id : "nuclear_share",
                    url : nuclearShareURL,
                    processor : edges.csv.newObjectByRow,
                    datatype : "text",
                    opening: reactordb._preFilterGlobalNuclearShare({year: thisYear})
                }
            ],
            openingQuery : es.newQuery({
                must : [
                    es.newTermFilter({field : "reactor.status.exact", value: "Operable"})
                ],
                size: 0,
                aggs : [
                    es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"}),
                    es.newTermsAggregation({name: "country", field : "reactor.country.exact", size: 300, aggs: [
                        es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
                    ]})
                ]
            }),
            secondaryQueries : {
                a : function() {
                    return es.newQuery({
                        must : [
                            es.newTermFilter({field : "reactor.status.exact", value: "Under Construction"})
                        ],
                        size: 0,
                        aggs : [
                            es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"}),
                            es.newTermsAggregation({name: "country", field : "reactor.country.exact", size: 300, aggs: [
                                es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
                            ]})
                        ]
                    })
                },
                b : function() {
                    return es.newQuery({
                        must : [
                            es.newRangeFilter({field: "year", lte: thisYear, gte: 1970})
                        ],
                        size: 0,
                        aggs : [
                            es.newTermsAggregation({name: "year", field: "year", size: 100, orderBy: "_term", orderDir: "asc", aggs : [
                                es.newSumAggregation({name: "electricity_generation", field: "electricity_supplied"})
                            ]})
                        ]
                    })
                },
                c : function() {
                    return es.newQuery({
                        size: mostRecentGridConnections,
                        sort: [es.newSort({field: "reactor.first_grid_connection", order: "desc"})],
                        aggs : [
                            es.newTermsAggregation({name: "countries", field: "reactor.country.exact", size: 250, orderBy: "_term", orderDir: "asc"})
                        ]
                    })
                },
                d : function() {
                    return es.newQuery({
                        size: mostRecentConstructionStarts,
                        sort: [es.newSort({field: "reactor.construction_start", order: "desc"})]
                    })
                },
                e : function() {
                    return es.newQuery({
                        size: topLoadFactors,
                        sort: [es.newSort({field: "reactor.load_factor." + thisYear, order: "desc"})]
                    })
                },
                f : function() {
                    return es.newQuery({
                        size: topLifetimeGenerations,
                        sort: [es.newSort({field: "reactor.electricity_supplied_cumulative." + thisYear, order: "desc"})]
                    })
                },
                g : function() {
                    return es.newQuery({
                        size: topAnnualGenerations,
                        sort: [es.newSort({field: "reactor.electricity_supplied." + thisYear, order: "desc"})]
                    })
                }
            },
            secondaryUrls : {
                b : operation_search_url
            },
            components : [
                edges.newNavigationTermList({
                    id: "country-selector",
                    urlTemplate: countryPageURLTemplate,
                    placeholder: "{country_name}",
                    sourceResults: "c",
                    sourceAggregation: "countries",
                    renderer: edges.bs3.newNavigationTermListRenderer({
                        firstOption: "or select a location"
                    })
                }),
                edges.numbers.newImportantNumbers({
                    id: "operable_reactors_count",
                    category: "big-number",
                    calculate: reactordb._operableReactorsCount(),
                    renderer : edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Operable Reactors</h4>",
                        backgroundImg: reactorsBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.newPieChart({
                    id: "global_nuclear_share",
                    category: "big-number",
                    dataFunction: reactordb._globalNuclearShare,
                    display: "<h4>Share of Global Electricity Generation</h4>",
                    renderer : edges.nvd3.newPieChartRenderer({
                        showLegend: false,
                        color: ["#1e9dd8", "#ddddff"],
                        footer: reactordb._nuclearPercentForPieRenderer,
                        showLabels: false,
                        valueFormat : edges.numFormat({
                            decimalPlaces: 2,
                            suffix: "%"
                        }),
                        growOnHover: false,
                        onResize : function(chart) {
                            var container = $(".edges-nvd3-pie-svg-container", "#global_nuclear_share");
                            var height = container.height();
                            var margin_map = {
                                180: -23,
                                145: -19,
                                118: -15
                            };
                            var margin = margin_map[height] || -23;
                            chart.margin({"left":margin, "right":margin, "top":margin, "bottom":margin});
                        },
                        resizeOnInit: true
                    })
                }),
                edges.numbers.newImportantNumbers({
                    id: "reactors_under_construction_count",
                    category: "big-number",
                    calculate: reactordb._underConstructionReactorsCount(),
                    renderer : edges.bs3.newImportantNumbersRenderer({
                        title: "<h4>Reactors Under Construction</h4>",
                        backgroundImg: underConstructionBackground,
                        mainNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ","
                        }),
                        secondNumberFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.newHorizontalMultibar({
                    id: "top_operable_reactor_capacity",
                    category: "panel",
                    dataFunction: reactordb._topXReactorsByOperableCapacity({x: topOperableCapacities}),
                    renderer : edges.nvd3.newHorizontalMultibarRenderer({
                        title: "<h3>Total Operable Reactor Net Capacity (Top " + topOperableCapacities + ")</h3>",
                        legend: false,
                        dynamicHeight: true,
                        barHeight: 40,
                        reserveAbove: 50,
                        reserveBelow: 50,
                        color : ["#1e9dd8"],
                        yAxisLabel: "Total Operable Reactor Net Capacity (MWe)",
                        valueFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.newHorizontalMultibar({
                    id: "top_under_construction_reactors_capacity",
                    category: "panel",
                    dataFunction: reactordb._topXReactorsByUnderConstructionCapacity({x: topUnderConstructionCapacities}),
                    renderer : edges.nvd3.newHorizontalMultibarRenderer({
                        title: "<h3>Reactors Under Construction Net Capacity (Top " + topUnderConstructionCapacities + ")</h3>",
                        legend: false,
                        dynamicHeight: true,
                        barHeight: 40,
                        reserveAbove: 50,
                        reserveBelow: 50,
                        color : ["#1e9dd8"],
                        yAxisLabel: "Total Under Construction Reactor Net Capacity (MWe)",
                        valueFormat: edges.numFormat({
                            decimalPlaces: 0,
                            thousandsSeparator: ",",
                            suffix: " MWe"
                        })
                    })
                }),
                edges.numbers.newStory({
                    id: "global_nuclear_generation_story",
                    category: "panel",
                    template: "{a} TWh: global electricity generation from nuclear energy in {b}",
                    calculate: reactordb._globalNuclearGeneration({year: thisYear}),
                    renderer : edges.bs3.newStoryRenderer({
                        title: "<h3>Global Nuclear Generation</h3>"
                    })
                }),
                edges.newMultibar({
                    id: "global_nuclear_generation_histogram",
                    category: "panel",
                    dataFunction: reactordb._globalElectricityGenerationByYear,
                    renderer : edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor : ["#1e9dd8"],
                        yTickFormat : ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: "Electricity Generated (TWh)",
                        marginLeft: 80
                    })
                }),
                edges.newResultsDisplay({
                    id : "most_recent_grid_connections",
                    category: "panel",
                    secondaryResults: "c",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>Most recent grid connections</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.first_grid_connection", display: "Grid Connection"},
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "most_recent_construction_starts",
                    category: "panel",
                    secondaryResults: "d",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>Most recent construction starts</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.construction_start", display: "Construction Start"},
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "top_load_factor",
                    category: "panel",
                    secondaryResults: "e",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>Top Load Factor (" + thisYear + ")</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {field: "reactor.load_factor." + thisYear, display: "Load Factor"},
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "top_annual_generation",
                    category: "panel",
                    secondaryResults: "g",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>Top Generation (" + thisYear + ")</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {
                                field: "reactor.electricity_supplied." + thisYear,
                                display: "Total Generation (" + thisYear + ") (TWh)",
                                valueFunction: reactordb._gwh2twh
                            },
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                }),
                edges.newResultsDisplay({
                    id : "top_lifetime_generation",
                    category: "panel",
                    secondaryResults: "f",
                    renderer : edges.bs3.newTabularResultsRenderer({
                        title: "<h3>Top Lifetime Generation (up to " + thisYear + ")</h3>",
                        fieldDisplay : [
                            {field: "id", fieldFunction: reactordb._reactorPageLink({url_template: reactorPageURLTemplate}), display: "Reactor Name", valueFunction: reactordb._htmlPassThrough},
                            {field: "reactor.model", display: "Model"},
                            {field: "reactor.process", display: "Process"},
                            {field: "reactor.reference_unit_power_capacity_net", display: "Net Capacity (MWe)"},
                            {
                                field: "reactor.electricity_supplied_cumulative." + thisYear,
                                display: "Total Generation (to end " + thisYear + ") (TWh)",
                                valueFunction: reactordb._gwh2twh
                            },
                            {field: "reactor.country", display: "Location", valueFunction: reactordb._countryPageLink({url_template: countryPageURLTemplate})}
                        ]
                    })
                })
            ]
        });

        reactordb.activeEdges[selector] = e;
    },

    newDashboardTemplate : function(params) {
        return edges.instantiate(reactordb.DashboardTemplate, params, edges.newTemplate);
    },
    DashboardTemplate : function(params) {

        this.searchPageURL = edges.getParam(params.searchPageURL, "/search");

        this.namespace = "reactordb-dashboard";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var bigNumberClass = edges.css_classes(this.namespace, "bignumber");
            var panelClass = edges.css_classes(this.namespace, "panel");
            var mapClass = edges.css_classes(this.namespace, "map");
            var searchButtonClass = edges.css_classes(this.namespace, "search");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // the header for the page
            frag += '<div class="row">\
                <div class="col-sm-6 col-xs-12">\
                    <h1>Reactor Database</h1>\
                </div>\
                <div class="col-sm-6 col-xs-12">\
                    <div class="row">\
                        <div class="col-xs-12 col-sm-6"><div class="' + searchButtonClass + '"><a href="' + this.searchPageURL + '" class="btn btn-info btn-sm">Search the Database</a></div></div>\
                        <div class="col-xs-12 col-sm-6"><div id="country-selector"></div></div>\
                    </div>\
                </div>\
            </div>';

            // the big numbers along the top
            frag += '<div class="row">\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-4 col-md-8 col-md-offset-4 col-sm-8 col-sm-offset-4 col-xs-10 col-xs-offset-1">\
                            <div id="operable_reactors_count"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 col-xs-10 col-xs-offset-1">\
                            <div id="global_nuclear_share"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-lg-offset-0 col-md-4 col-md-offset-0 col-sm-4 col-sm-offset-0 col-xs-10 col-xs-offset-1">\
                    <div class="row">\
                        <div class="col-lg-8 col-md-8 col-sm-8 col-xs-12">\
                            <div id="reactors_under_construction_count"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>';

            // the full width panels beneath
            var panel = edge.category("panel");
            if (panel.length > 0) {
                for (var i = 0; i < panel.length; i++) {
                    frag += '<div class="row"><div class="col-md-12"><div class="' + panelClass + '" dir="auto"><div id="' + panel[i].id + '"></div></div></div></div>';
                }
            }

            // final note about the data sources
            frag += '<div class="row"><div class="col-xs-12"><p>Data Sources: World Nuclear Association and <a href="https://www.iaea.org/PRIS/home.aspx">IAEA Power Reactor Information System</a></p></div></div>';

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    /* ===================================================
     * Functions related to Search
     * ===================================================
     */

    makeSearch : function(params) {

        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;
        if (!params) { params = {} }

        var selector = params.selector || "#reactor-search";
        var index = params.index || "reactor";
        var search_url = params.search_url || current_scheme + "//" + current_domain + "/query/" + index + "/_search";
        var reactor_base_url = params.reactor_base_url || current_scheme + "//" + current_domain + "/reactor/";

        var genericPageURLTemplate = edges.getParam(params.genericPageURLTemplate, "/generic?source={query}");
        var widgetPageURLTemplate = edges.getParam(params.widgetPageURLTemplate, false);

        var components = [
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
                defaultOperator : "AND",
                renderer : edges.bs3.newFullSearchControllerRenderer({
                    freetextSubmitDelay: -1,
                    searchButton: true
                })
            }),

            // the pager, with the explicitly set page size options (see the openingQuery for the initial size)
            edges.newPager({
                id: "top-pager",
                category: "top-pager",
                renderer : edges.bs3.newPagerRenderer({
                    sizeOptions : [10, 25, 50, 100]
                })
            }),
            edges.newPager({
                id: "bottom-pager",
                category: "bottom-pager",
                renderer : edges.bs3.newPagerRenderer({
                    sizeOptions : [10, 25, 50, 100]
                })
            }),

            // be able to navigate away from the search page to the generic report page
            edges.newLeaveSearchNavigation({
                id: "leave-search-navigation",
                category: "results",
                urlTemplate: genericPageURLTemplate,
                urlQueryPlaceholder: "{query}",
                renderer: edges.bs3.newLeaveSearchNavigationRenderer({
                    text: "Create a report from these results &raquo;",
                    hide: function(renderer) {
                        if (!renderer.component.edge.result) {
                            return true;
                        }
                        if (renderer.component.edge.result.total() === 0) {
                            return true;
                        }
                    }
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
        ];

        if (widgetPageURLTemplate) {
            components.unshift(
                edges.newLeaveSearchNavigation({
                    id: "go-to-widget",
                    category: "results",
                    urlTemplate: widgetPageURLTemplate,
                    urlQueryPlaceholder: "{query}",
                    renderer: edges.bs3.newLeaveSearchNavigationRenderer({
                        text: "Create widget from these results &raquo;",
                        hide: function(renderer) {
                            if (!renderer.component.edge.result) {
                                return true;
                            }
                            if (renderer.component.edge.result.total() === 0) {
                                return true;
                            }
                        }
                    })
                })
            );
        }

        var e = edges.newEdge({
            selector: selector,
            template: edges.bs3.newFacetview(),
            search_url: search_url,
            manageUrl : true,
            openingQuery : es.newQuery({
                sort : {field: "index.sort_name.exact", order: "asc"},
                size: 25
            }),
            components : components
        });

        reactordb.activeEdges[selector] = e;
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
            var capacity_net = this._getValue("reactor.reference_unit_power_capacity_net", res, false);
            var type = this._getValue("reactor.process", res, false);
            var owners = this._getValue("reactor.owner", res, [{name: "Unknown Owner"}]);
            var grid = this._getValue("reactor.first_grid_connection", res, false);

            var reactor_name = this._getValue("reactor.name", res, "Unknown Reactor Name");
            var country = this._getValue("reactor.country", res, "Unknown Location");
            var status = this._getValue("reactor.status", res, "Unknown Status");
            var operator = this._getValue("reactor.operator", res, "Unknown Operator");

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
            if (owner === "") {
                owner = "Unknown Owner"
            }

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

        this._getValue = function (path, rec, def) {
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
    },

    /* ===================================================
     * Functions related to the Reactor Page
     * ===================================================
     */

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

        if (params.postInit) {
            $("#reactor-record").on("edges:post-init", params.postInit);
        }

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
                    display: "<h3>Electricity Supplied (GWh)</h3>",
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
                        yAxisLabel: "Electricity Supplied (GWh)"
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
                    display: "<h3>Total Electricity Supplied (GWh)</h3>",
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
                        yAxisLabel: "Total Electricity Supplied (GWh)"
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
                            {field: "electricity_supplied", display: "Electricity Supplied (GWh)"},
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
            var status = this._getValue("reactor.status", this.component.reactor, "Unknown Status");
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
                numbersRows += '<tr><td class="' + tableKeyClasses + '">Design Net Capacity</td><td class="' + tableValClasses + '">' + design_capacity + ' MWe</td></tr>';
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

