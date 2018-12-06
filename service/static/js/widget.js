var widget = {
    activeEdge : false,

    formatters : {
        year : function(val) {
            return (new Date(val)).getUTCFullYear();
        },
        year_month : function(val) {
            return val;
        },
        full_date : function(val) {
            return val;
        },
        number : function(val) {
            var formatter = edges.numFormat({
                reflectNonNumbers: true,
                thousandsSeparator: ","
            });
            return formatter(val);
        },
        country_link : function(val) {
            return val;
        },
        reactor_link : function(val) {
            return '<a href="#">' + val + '</a>';
        }
    },

    init : function(params) {
        // alert(params.id);
        params.selector = "#" + params.id + "-inner";
        var type = params.type;

        if (type === "highlight") {
            return widget.highlight(params);
        } else if (type === "chart_histogram") {
            return widget.chartHistogram(params);
        } else if (type === "table_reactor") {
            return widget.tableReactor(params);
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

        var reactorsBackground = params.base + "/static/images/iconReactor.svg";
        var underConstructionBackground = params.base + "/static/images/iconConstruction.svg";
        var shutdownBackground = params.base + "/static/images/iconShutdown.svg";

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.addAggregation(
            es.newTermsAggregation({name: "status", field: "reactor.status.exact", aggs: [
                es.newSumAggregation({name: "total_gwe", field : "reactor.reference_unit_power_capacity_net"})
            ]})
        );

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
                    })
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
                    })
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
                    })
                })
            })
        );

        var search_url = params.base + "/query/reactor/_search";
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

        if (!params.hasOwnProperty("settings")) {
            return;
        }
        if (!params.settings.hasOwnProperty("start") ||
                !params.settings.hasOwnProperty("end") ||
                !params.settings.hasOwnProperty("value")) {
            return false;
        }

        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = 10000;
        var components = [
            edges.newMultibar({
                id: "chart_histogram_" + params.id,
                category: "panel",
                dataFunction: widget._dataSeriesFromHistogram({seriesName: params.settings.label}),
                renderer : edges.nvd3.newMultibarRenderer({
                    xTickFormat: ".0f",
                    barColor : ["#1e9dd8"],
                    yTickFormat : ",.0f",
                    showLegend: false,
                    xAxisLabel: "Year",
                    yAxisLabel: params.settings.label,
                    marginLeft: 80
                })
            })
        ];

        var search_url = params.base + "/custom/chart_histogram/_search?start=" + params.settings.start + "&end=" + params.settings.end + "&field=" + params.settings.value;
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

        // compile the query
        var openingQuery = es.newQuery({raw: params.query});
        openingQuery.size = parseInt(params.settings.limit);
        openingQuery.addSortBy(es.newSort({field: params.settings.order.field + ".exact", order: params.settings.order.dir}));

        var fieldDisplay = [];
        for (var i = 0; i < params.settings.reactor.length; i++) {
            var fieldDef = params.settings.reactor[i];
            var obj = {field: fieldDef.field, display: fieldDef.display};
            if (fieldDef.hasOwnProperty("formatting")) {
                var fn = widget.formatters[fieldDef.formatting];
                obj.valueFunction = fn;
            }
            fieldDisplay.push(obj);
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

        var search_url = params.base + "/query/reactor/_search";
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
    }
};