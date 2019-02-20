var widget = {
    activeEdge : false,

    formatters : {
        year : function(params) {
            return function(val) {
                var d = new Date(val);
                if (isNaN(d.getTime())) {
                    return val;
                }
                return d.getUTCFullYear();
            }
        },
        year_month : function(params) {
            var formatter = edges.numFormat({
                reflectNonNumbers: true,
                zeroPadding: 2
            });
            return function(val) {
                var d = new Date(val);
                if (isNaN(d.getTime())) {
                    return val;
                }
                return d.getUTCFullYear() + "-" + formatter(d.getUTCMonth() + 1);
            }
        },
        full_date : function(params) {
            return function(val) {
                return val;
            }
        },
        number : function(params) {
            var formatter = edges.numFormat({
                reflectNonNumbers: true,
                thousandsSeparator: ","
            });
            return function(val) {
                return formatter(val);
            }
        },
        country_link : function(params) {
            var urlTemplate = params.settings.countryPageTemplate;
            return function(val) {
                var url = urlTemplate.replace("{country}", encodeURIComponent(val));
                return '<a href="' + url + '">' + val + '</a>';
            }
        },
        reactor_link : function(params) {
            var urlTemplate = params.settings.reactorPageTemplate;
            return function(val, res) {
                var reactorId = res.id;
                var url = urlTemplate.replace("{reactor}", encodeURIComponent(reactorId));
                return '<a href="' + url + '">' + val + '</a>';
            }
        }
    },

    init : function(params) {
        // use this to stop execution on an embed page, so that you can attach the debugger to the anonymously
        // loaded code
        // alert(params.id);
        params.selector = "#" + params.id + "-inner";
        var type = params.type;

        if (type === "highlight") {
            return widget.highlight(params);
        } else if (type === "chart_histogram") {
            return widget.chartHistogram(params);
        } else if (type === "table_reactor") {
            return widget.tableReactor(params);
        } else if (type === "chart_accumulator") {
            return widget.chartAccumulator(params);
        } else if (type === "table_aggregate") {
            return widget.tableAggregate(params);
        } else if (type === "chart_status") {
            return widget.chartStatus(params);
        }

        return false;
    },

    newSingleComponentTemplate : function(params) {
        return edges.instantiate(widget.SingleComponentTemplate, params, edges.newTemplate);
    },
    SingleComponentTemplate : function(params) {

        this.namespace = "widget-single";

        this.height = params.height || false;

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");

            var panel = this.edge.category("panel");

            var style = "";
            if (this.height) {
                style = ' style="height: ' + this.height + 'px" ';
            }

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12"><div id="' + panel[0].id + '" ' + style + '></div></div></div></div>';

            edge.context.html(frag);
        };
    },

    newHighlightTemplate : function(params) {
        return edges.instantiate(widget.HighlightTemplate, params, edges.newTemplate);
    },
    HighlightTemplate : function(params) {

        this.namespace = "widget-highlight";
        this.id = params.id;

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");

            var frag = '<div class="row">\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-4 col-md-8 col-md-offset-4 col-sm-8 col-sm-offset-4 col-xs-10 col-xs-offset-1">\
                            <div id="operable_reactors_count_' + this.id + '"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12">\
                    <div class="row">\
                        <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 col-xs-10 col-xs-offset-1">\
                            <div id="reactors_under_construction_count_' + this.id + '"></div>\
                        </div>\
                    </div>\
                </div>\
                <div class="col-lg-4 col-lg-offset-0 col-md-4 col-md-offset-0 col-sm-4 col-sm-offset-0 col-xs-10 col-xs-offset-1">\
                    <div class="row">\
                        <div class="col-lg-8 col-md-8 col-sm-8 col-xs-12">\
                            <div id="reactors_shutdown_count_' + this.id + '"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>';

            // start building the page template
            var frag = '<div class="' + containerClass + '">' + frag + '</div>';

            edge.context.html(frag);
        };
    },

    highlight : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        var reactorsBackground = params.base + "/static/images/iconReactor.svg";
        var underConstructionBackground = params.base + "/static/images/iconConstruction.svg";
        var shutdownBackground = params.base + "/static/images/iconShutdown.svg";

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 0;
        openingQuery.from = 0;
        openingQuery.addAggregation(
            es.newTermsAggregation({name: "status", field: "reactor.status.exact", aggs: [
                es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
            ]})
        );

        function resizeHandler(renderer) {
            var container = renderer.component.context;
            var width = container.width();
            if (width > 180) {
                width = 180;
            }
            var selector = edges.css_class_selector(renderer.namespace, "graphic", renderer);
            var graphic = container.find(selector);
            graphic.css("height", width + "px");
        }

        var components = [];
        components.push(
            edges.numbers.newImportantNumbers({
                id: "operable_reactors_count_" + params.id,
                category: "big-number",
                calculate: widget._reactorStatusCount({status: "Operable"}),
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
                    }),
                    resizeHandler: resizeHandler
                })
            }),
            edges.numbers.newImportantNumbers({
                id: "reactors_under_construction_count_" + params.id,
                category: "big-number",
                calculate: widget._reactorStatusCount({status: "Under Construction"}),
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
                    }),
                    resizeHandler: resizeHandler
                })
            }),
            edges.numbers.newImportantNumbers({
                id: "reactors_shutdown_count_" + params.id,
                category: "big-number",
                calculate: widget._reactorStatusCount({status: "Permanent Shutdown"}),
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
                    }),
                    resizeHandler: resizeHandler
                })
            })
        );

        var search_url = params.base + "/query/" + prefix + "reactor/_search";
        return edges.newEdge({
            selector: selector,
            template: widget.newHighlightTemplate({id: params.id}),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
    },

    chartHistogram : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("start") ||
                !params.settings.hasOwnProperty("end") ||
                !params.settings.hasOwnProperty("value") ||
                !params.settings.hasOwnProperty("label") ||
                !params.settings.hasOwnProperty("height") ||
                !params.settings.hasOwnProperty("chart")) {
            return false;
        }

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 10000;
        openingQuery.from = 0;

        var leftMargin = params.settings.left;
        if (!leftMargin) {
            leftMargin = 80
        } else {
            leftMargin = parseInt(leftMargin)
        }

        var labelDistance = params.settings.distance;
        if (!labelDistance) {
            labelDistance = 0
        } else {
            labelDistance = parseInt(labelDistance)
        }

        var components = [];

        if (params.settings.chart === "bar") {
            components.push(
                edges.newMultibar({
                    id: "chart_histogram_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromHistogram({seriesName: params.settings.label}),
                    renderer: edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance
                    })
                })
            );
        } else if (params.settings.chart === "line") {
            components.push(
                edges.newSimpleLineChart({
                    id: "chart_histogram_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromHistogram({seriesName: params.settings.label}),
                    renderer: edges.nvd3.newSimpleLineChartRenderer({
                        xTickFormat: ".0f",
                        lineColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance,
                        includeOnY: 0
                    })
                })
            );
        } else {
            return false;
        }

        var search_url = params.base + "/custom/" + prefix + "chart_histogram/_search?start=" + params.settings.start + "&end=" + params.settings.end + "&field=" + params.settings.value;
        return edges.newEdge({
            selector: selector,
            template: widget.newSingleComponentTemplate({height: params.settings.height || false}),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
    },

    chartAccumulator : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("start") ||
                !params.settings.hasOwnProperty("end") ||
                !params.settings.hasOwnProperty("value") ||
                !params.settings.hasOwnProperty("label") ||
                !params.settings.hasOwnProperty("height") ||
                !params.settings.hasOwnProperty("chart")) {
            return false;
        }

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 10000;
        openingQuery.from = 0;
        openingQuery.setSourceFilters({include: ["operation." + params.settings.value]});

        var leftMargin = params.settings.left;
        if (!leftMargin) {
            leftMargin = 80
        } else {
            leftMargin = parseInt(leftMargin)
        }

        var labelDistance = params.settings.distance;
        if (!labelDistance) {
            labelDistance = 0
        } else {
            labelDistance = parseInt(labelDistance)
        }

        var components = [];

        if (params.settings.chart === "bar") {
            components.push(
                edges.newMultibar({
                    id: "chart_accumulator_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromAccumulator({
                        seriesName: params.settings.label,
                        field: params.settings.value,
                        start: params.settings.start,
                        end: params.settings.end
                    }),
                    renderer: edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance
                    })
                })
            );
        } else if (params.settings.chart === "line") {
            components.push(
                edges.newSimpleLineChart({
                    id: "chart_accumulator_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromAccumulator({
                        seriesName: params.settings.label,
                        field: params.settings.value,
                        start: params.settings.start,
                        end: params.settings.end
                    }),
                    renderer: edges.nvd3.newSimpleLineChartRenderer({
                        xTickFormat: ".0f",
                        lineColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance,
                        includeOnY: 0
                    })
                })
            );
        } else {
            return false;
        }

        var search_url = params.base + "/query/" + prefix + "reactor/_search";
        return edges.newEdge({
            selector: selector,
            template: widget.newSingleComponentTemplate({height: params.settings.height || false}),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
    },

    chartStatus : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("start") ||
                !params.settings.hasOwnProperty("end") ||
                !params.settings.hasOwnProperty("status") ||
                !params.settings.hasOwnProperty("primary") ||
                !params.settings.hasOwnProperty("label") ||
                !params.settings.hasOwnProperty("height") ||
                !params.settings.hasOwnProperty("chart")) {
            return false;
        }

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 10000;
        openingQuery.from = 0;
        // openingQuery.setSourceFilters({include: ["operation." + params.settings.value]});

        var leftMargin = params.settings.left;
        if (!leftMargin) {
            leftMargin = 80
        } else {
            leftMargin = parseInt(leftMargin)
        }

        var labelDistance = params.settings.distance;
        if (!labelDistance) {
            labelDistance = 0
        } else {
            labelDistance = parseInt(labelDistance)
        }

        var components = [];

        if (params.settings.chart === "bar") {
            components.push(
                edges.newMultibar({
                    id: "chart_status_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromStatus({
                        seriesName: params.settings.label,
                        status: params.settings.status,
                        primary: params.settings.primary,
                        fallback: params.settings.fallback,
                        start: params.settings.start,
                        end: params.settings.end
                    }),
                    renderer: edges.nvd3.newMultibarRenderer({
                        xTickFormat: ".0f",
                        barColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance
                    })
                })
            );
        } else if (params.settings.chart === "line") {
            components.push(
                edges.newSimpleLineChart({
                    id: "chart_status_" + params.id,
                    category: "panel",
                    dataFunction: widget._dataSeriesFromStatus({
                        seriesName: params.settings.label,
                        status: params.settings.status,
                        primary: params.settings.primary,
                        fallback: params.settings.fallback,
                        start: params.settings.start,
                        end: params.settings.end
                    }),
                    renderer: edges.nvd3.newSimpleLineChartRenderer({
                        xTickFormat: ".0f",
                        lineColor: ["#1e9dd8"],
                        yTickFormat: ",.0f",
                        showLegend: false,
                        xAxisLabel: "Year",
                        yAxisLabel: params.settings.label,
                        marginLeft: leftMargin,
                        yAxisLabelDistance: labelDistance,
                        includeOnY: 0
                    })
                })
            );
        } else {
            return false;
        }

        var search_url = params.base + "/query/" + prefix + "reactor/_search";
        return edges.newEdge({
            selector: selector,
            template: widget.newSingleComponentTemplate({height: params.settings.height || false}),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
    },

    tableReactor : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        // validate the incoming data, to determine if we can render the widget
        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("limit") ||
                !params.settings.hasOwnProperty("order") ||
                !params.settings.hasOwnProperty("reactor")) {
            return false;
        }
        if (!params.settings.order.hasOwnProperty("field") ||
            params.settings.reactor.length === 0) {
            return false;
        }
        for (var i = 0; i < params.settings.reactor; i++) {
            var reactorField = params.settings.reactor[i];
            if (!reactorField.hasOwnProperty("field") || !reactorField.hasOwnProperty("display")) {
                return false;
            }
        }

        var sortSuffix = "";
        if (params.settings.order.hasOwnProperty("sort_type")) {
            if (params.settings.order.sort_type === "exact") {
                sortSuffix = ".exact";
            }
        }

        // compile the query
        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = parseInt(params.settings.limit);
        openingQuery.from = 0;
        openingQuery.addSortBy(es.newSort({field: params.settings.order.field + sortSuffix, order: params.settings.order.dir}));
        openingQuery.addSourceFilters({include: ["id"]});

        var fieldDisplay = [];
        for (var i = 0; i < params.settings.reactor.length; i++) {
            var fieldDef = params.settings.reactor[i];
            var obj = {field: fieldDef.field, display: fieldDef.display};
            if (fieldDef.hasOwnProperty("formatting")) {
                var fn = widget.formatters[fieldDef.formatting](params);
                obj.valueFunction = fn;
            }
            fieldDisplay.push(obj);
            openingQuery.addSourceFilters({include: [obj.field]});
        }

        var components = [
            edges.newResultsDisplay({
                id : "results_table_" + params.id,
                category: "panel",
                renderer : edges.bs3.newTabularResultsRenderer({
                    fieldDisplay : fieldDisplay
                })
            })
        ];

        var search_url = params.base + "/query/" + prefix + "reactor/_search";
        return edges.newEdge({
            selector: selector,
            template: widget.newSingleComponentTemplate(),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
    },

    tableAggregate : function(params) {
        var selector = params.selector;
        var prefix = edges.getParam(params.prefix, "");

        // validate the incoming data, to determine if we can render the widget
        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("aggregate_around") ||
                !params.settings.hasOwnProperty("order") ||
                !params.settings.hasOwnProperty("aggregate_on") ||
                !params.settings.hasOwnProperty("limit")) {
            return false;
        }
        if (!params.settings.aggregate_around.hasOwnProperty("field") ||
                !params.settings.aggregate_around.hasOwnProperty("display")) {
            return false;
        }
        for (var i = 0; i < params.settings.aggregate_on.length; i++) {
            var aggField = params.settings.aggregate_on[i];
            if (!aggField.hasOwnProperty("field") || !aggField.hasOwnProperty("display")) {
                return false;
            }
        }

        // compile the query
        var subaggs = [];
        for (var i = 0; i < params.settings.aggregate_on.length; i++) {
            var aggField = params.settings.aggregate_on[i];
            subaggs.push(
                es.newSumAggregation({name: aggField.field, field: aggField.field})
            );
        }

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 0;
        openingQuery.from = 0;
        openingQuery.addAggregation(
            es.newTermsAggregation({
                name: params.settings.aggregate_around.field,
                field: params.settings.aggregate_around.field + ".exact",
                size: 10000,
                aggs: subaggs})
        );

        var fieldDisplay = [];
        var aaObj = {field: params.settings.aggregate_around.field, display: params.settings.aggregate_around.display};
        if (params.settings.aggregate_around.hasOwnProperty("formatting")) {
            var fn = widget.formatters[params.settings.aggregate_around.formatting](params);
            aaObj.valueFunction = fn;
        }
        fieldDisplay.push(aaObj);

        for (var i = 0; i < params.settings.aggregate_on.length; i++) {
            var fieldDef = params.settings.aggregate_on[i];
            var obj = {field: fieldDef.field, display: fieldDef.display};
            if (fieldDef.hasOwnProperty("formatting")) {
                var fn = widget.formatters[fieldDef.formatting](params);
                obj.valueFunction = fn;
            }
            fieldDisplay.push(obj);
        }

        var components = [
            edges.newAggregateTable({
                id : "aggregate_table_" + params.id,
                category: "panel",
                limit: params.settings.limit,
                sort: function(a,b) {
                    var acomp = parseInt(a[params.settings.order] || 0);
                    var bcomp = parseInt(b[params.settings.order] || 0);
                    if (acomp < bcomp) {
                        return 1;
                    }
                    if (acomp > bcomp) {
                        return -1;
                    }
                    return 0;
                },
                aggregateAround: params.settings.aggregate_around.field,
                splitFieldsOn: ".",
                renderer : edges.bs3.newTabularResultsRenderer({
                    fieldDisplay : fieldDisplay
                })
            })
        ];

        var search_url = params.base + "/query/" + prefix + "reactor/_search";
        return edges.newEdge({
            selector: selector,
            template: widget.newSingleComponentTemplate(),
            search_url: search_url,
            manageUrl : false,
            openingQuery: openingQuery,
            components : components
        });
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

    _dataSeriesFromHistogram : function(params) {
        var seriesName = params.seriesName;

        return function(component) {
            var results = component.edge.result;
            var buckets = results.data.aggregations.chart_histogram.buckets;
            var values = [];
            for (var i = 0; i < buckets.length; i++) {
                var bucket = buckets[i];
                var gen = bucket.summation.value;
                values.push({label: bucket.key, value: gen});
            }

            return [{key: seriesName, values: values}]
        }
    },

    _dataSeriesFromAccumulator : function(params) {
        var seriesName = params.seriesName;
        var start = parseInt(params.start);
        var end = parseInt(params.end);

        return function(component) {
            var results = component.edge.result.results();

            // set up the accumulator
            var accumulator = {};
            for (var s = parseInt(start); s <= parseInt(end) && s <= (new Date()).getUTCFullYear(); s++) {
                accumulator[s] = 0;
            }

            // for each reactor, accumulate its operational data into the accumulator
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var field = "operation." + params.field;
                var fieldData = edges.objVal(field, result);

                var years = Object.keys(accumulator);
                years.sort();

                // accumulate the single reactor into the accumulator for all years
                var cumulation = 0;
                for (var j = 0; j < years.length; j++) {
                    var year = years[j];
                    var val = fieldData[String(year)];
                    if (val) {
                        cumulation += val;
                    }
                    accumulator[year] += cumulation;
                }
            }

            var values = [];
            for (var year in accumulator) {
                values.push({label: year, value: accumulator[year]});
            }
            values.sort(function(a, b) {
                if (parseInt(a.year) < parseInt(b.year)) {
                    return 1;
                }
                if (parseInt(a.year) > parseInt(b.year)) {
                    return -1;
                }
                return 0;
            });

            // chop off the final values that are all the same (i.e. only continue while there is interesting data)
            if (values.length > 0) {
                var lastVal = values[values.length - 1].value;
                var limit = values.length;
                for (var i = values.length - 2; i > -1; i--) {
                    var val = values[i].value;
                    if (val === lastVal) {
                        limit--;
                    } else {
                        break;
                    }
                }
                values.splice(limit);
            }

            return [{key: seriesName, values: values}]
        }
    },

    _dataSeriesFromStatus : function(params) {
        var seriesName = params.seriesName;
        var status = params.status;
        var primary = params.primary;
        var fallback = params.fallback;
        var start = parseInt(params.start);
        var end = parseInt(params.end);

        return function(component) {
            var results = component.edge.result.results();

            // set up the histogram
            var histogram = {};
            for (var s = parseInt(start); s <= parseInt(end) && s <= (new Date()).getUTCFullYear(); s++) {
                histogram[s] = 0;
            }

            for (var i = 0; i < results.length; i++) {
                var reactor = results[i];

                var years = [];
                var possibleYears = Object.keys(reactor.operation.operational_status);
                for (var j = 0; j < possibleYears.length; j++) {
                    var possible = possibleYears[j];
                    var yearStatus = reactor.operation.operational_status[possible];
                    if (yearStatus === status) {
                        years.push(possible);
                    }
                }

                if (primary === "reactor_count") {
                    for (var j = 0; j < years.length; j++) {
                        var year = years[j];
                        if (histogram.hasOwnProperty(year)) {
                            histogram[year] += 1;
                        }
                    }
                } else if (primary.substring(0, 11) === "operational") {
                    var opsField = primary.substring(12);
                    var opsData = reactor.operation[opsField];

                    var fbVal = false;
                    if (fallback) {
                        var fbVal = reactor.reactor[fallback]
                    }

                    for (var j = 0; j < years.length; j++) {
                        var year = years[j];
                        if (!histogram.hasOwnProperty(year)) {
                            continue;
                        }
                        var wasSet = false;
                        if (opsData.hasOwnProperty(year)) {
                            var val = opsData[year];
                            if (val !== 0) {
                                histogram[year] += val;
                                wasSet = true;
                            }
                        }
                        if (!wasSet && fbVal) {
                            histogram[year] += fbVal;
                        }
                    }
                } else {
                    var val = reactor.reactor[primary];
                    for (var j = 0; j < years.length; j++) {
                        var year = years[j];
                        if (histogram.hasOwnProperty(year)) {
                            histogram[year] += val;
                        }
                    }
                }
            }

            var values = [];
            for (var year in histogram) {
                values.push({label: year, value: histogram[year]});
            }
            values.sort(function(a, b) {
                if (parseInt(a.year) < parseInt(b.year)) {
                    return 1;
                }
                if (parseInt(a.year) > parseInt(b.year)) {
                    return -1;
                }
                return 0;
            });

            // chop off the final values if they are zeroes
            if (values.length > 0) {
                var limit = values.length;
                for (var i = values.length - 1; i > -1; i--) {
                    var val = values[i].value;
                    if (val === 0) {
                        limit--;
                    } else {
                        break;
                    }
                }
                values.splice(limit);
            }

            return [{key: seriesName, values: values}]
        }
    }
};