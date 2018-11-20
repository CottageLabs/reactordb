var rdbwidgets = {
    activeEdges : {},

    data : {
        singleValueReactorFields : function() {
            // TODO: list of all single-value reactor fields
            return ["reactor.name", "reactor.process"]
        },
        defaultReactorFieldName : function(params) {
            // TODO: this needs to return the appropriate default according to the reactor field selected
            return function() {
                return "Default Name"
            }
        },
        numericReactorFields : function() {
            // TODO: list all numerical reactor fields
            return ["reactor.reference_unit_power_capacity_net"]
        },
        fieldFormatters : function() {
            // TODO: this needs to return the appropriate formatters according to the reactor field selected
            return function() {
                return ["year only"]
            }
        },
        selectedValuesFrom : function(params) {
            // TODO: this needs to return the list of values selected in a related field
            return function() {
                return ["reactor.reference_unit_power_capacity_net"]
            }
        },
        numericOperationsFields : function() {
            // TODO: return a list of all numeric operations fields
            return ["load_factor_cumulative"]
        }
    },

    controlPanelOptions : function() {
        return [
            {
                "name": "Hightlight Numbers"
            },
            {
                "name": "Table : Reactor",
                "fields": [
                    {
                        "name": "reactor",
                        "type": "combo",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName()
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters()
                            }
                        ],
                        "repeatable": true
                    },
                    {
                        "name": "order",
                        "type": "combo",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields
                            },
                            {
                                "name": "dir",
                                "type": "select",
                                "source": ["ascending", "descending"]
                            }
                        ]
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10"
                    }
                ]
            },
            {
                "name": "Table : Aggregate",
                "fields": [
                    {
                        "name": "aggregate_around",
                        "type": "combo",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName()
                            }
                        ]
                    },
                    {
                        "name": "aggregate_on",
                        "type": "combo",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.numericReactorFields
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName()
                            }
                        ],
                        "repeatable": true
                    },
                    {
                        "name": "order",
                        "type": "select",
                        "source": rdbwidgets.data.selectedValuesFrom({field: "aggregate_on"})
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10"
                    }
                ]
            },
            {
                "name": "Chart : Histogram",
                "fields": [
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear()
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields
                    }
                ]
            },
            {
                "name": "Chart : Accumulator",
                "fields": [
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear()
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields
                    }
                ]
            }
        ]
    },

    editor : function(params) {
        var current_domain = document.location.host;
        var current_scheme = window.location.protocol;

        var selector = params.selector;
        var index = params.index || "reactor";
        var search_url = params.search_url || current_scheme + "//" + current_domain + "/query/" + index + "/_search";

        var e = edges.newEdge({
            selector: selector,
            template: rdbwidgets.newWidgetEditorTemplate(),
            search_url: search_url,
            manageUrl : true,
            components : [
                // selected filters display, with all the fields given their display names
                edges.newSelectedFilters({
                    id: "selected-filters",
                    category: "search-terms",
                    fieldDisplays : {
                        "reactor.country.exact" : "Location",
                        "reactor.status.exact" : "Current Status",
                        "reactor.process.exact" : "Reactor Type",
                        "index.construction_start_year" : "Construction Start Date",
                        "index.first_grid_connection_year" : "Grid Connection",
                        "index.permanent_shutdown_year" : "Permanent Shutdown Date",
                        "reactor.owner.name.exact" : "Owner",
                        "reactor.operator.exact" : "Operator",
                        "reactor.reference_unit_power_capacity_net" : "Reference Unit Power (Net Capacity)",
                        "reactor.name" : "Reactor Name",
                        "reactor.process" : "Reactor Type",
                        "reactor.owner.name" : "Owner",
                        "reactor.operator" : "Operator",
                        "reactor.model" : "Model"
                    },
                    renderer : edges.bs3.newSelectedFiltersRenderer({
                        showSearchString: true
                    })
                }),
                rdbwidgets.newControlPanel({
                    id: "main-control",
                    category: "control-panel",
                    options: rdbwidgets.controlPanelOptions(),
                    renderer : rdbwidgets.newControlPanelRenderer()
                })
            ]
        });

        reactordb.activeEdges[selector] = e;
    },

    newWidgetEditorTemplate : function(params) {
        return edges.instantiate(rdbwidgets.WidgetEditorTemplate, params, edges.newTemplate);
    },
    WidgetEditorTemplate : function(params) {

        this.namespace = "rdbwidgets-editor";

        this.draw = function(edge) {
            this.edge = edge;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container");
            var searchTermsClass = edges.css_classes(this.namespace, "search-terms");
            var controlPanelClass = edges.css_classes(this.namespace, "control-panel");
            var previewClass = edges.css_classes(this.namespace, "preview");
            var snippetClass = edges.css_classes(this.namespace, "snippet");

            // start building the page template
            var frag = '<div class="' + containerClass + '"><div class="row">';
            frag += '<div class="col-md-12">';

            // search terms
            var searchTerms = edge.category("search-terms");
            for (var i = 0; i < searchTerms.length; i++) {
                frag += '<div class="row"><div class="col-md-12"><div class="' + searchTermsClass + '"><div id="' + searchTerms[i].id + '"></div></div></div></div>';
            }

            // control panel
            var controlPanel = edge.category("control-panel");
            for (var i = 0; i < controlPanel.length; i++) {
                frag += '<div class="row"><div class="col-md-12"><div class="' + controlPanelClass + '" dir="auto"><div id="' + controlPanel[i].id + '"></div></div></div></div>';
            }

            // preview panel
            var preview = edge.category("preview");
            for (var i = 0; i < preview.length; i++) {
                frag += '<div class="row"><div class="col-md-8 col-sm-9"><div class="' + previewClass + '"><div id="' + preview[i].id + '"></div></div></div></div>';
            }

            // code snippet
            var snippet = edge.category("snippet");
            for (var i = 0; i < preview.length; i++) {
                frag += '<div class="row"><div class="col-md-8 col-sm-9"><div class="' + snippetClass + '"><div id="' + snippet[i].id + '"></div></div></div></div>';
            }

            // close off all the big containers and return
            frag += '</div></div></div>';

            edge.context.html(frag);
        };
    },

    newControlPanel : function(params) {
        return edges.instantiate(rdbwidgets.ControlPanel, params, edges.newComponent);
    },
    ControlPanel : function(params) {
        this.options = params.options;

        this.synchronise = function() {}
    },

    newControlPanelRenderer : function(params) {
        return edges.instantiate(rdbwidgets.ControlPanelRenderer, params, edges.newRenderer);
    },
    ControlPanelRenderer : function(params) {

        this.namespace = "rdbwidgets-control-panel";

        this.drawn = false;

        this.draw = function() {
            // we only want to draw this once, no need to redraw
            if (this.drawn) { return }

            var options = this.component.options;

            // the classes we're going to need
            var containerClass = edges.css_classes(this.namespace, "container", this);
            var typeSelectId = edges.css_id(this.namespace, "type", this);
            var controlsId = edges.css_id(this.namespace, "controls", this);

            var frag = '<div class="' + containerClass + '"><form>';

            var source = options.map(function(x) { return x.name });
            source.unshift("Select a Widget Type");
            frag += this._select({id: typeSelectId, source: source, name: "widget-type"});
            frag += '<div id="' + controlsId + '"></div>';
            frag += '</form></div>';

            this.component.context.html(frag);

            var typeSelectIdSelector = edges.css_id_selector(this.namespace, "type", this);
            edges.on(typeSelectIdSelector, "change", this, "typeChanged");

            this.drawn = true;
        };

        this._select = function(params) {
            var source = params.source;
            var name = params.name;
            var id = params.id;

            if (typeof(source) === 'function') {
                source = source()
            }
            var options = "";
            for (var i = 0; i < source.length; i++) {
                options += '<option value="' + source[i] + '">' + source[i] + '</option>';
            }
            var select = '<select id="' + id + '" name="' + name + '">' + options + '</select>';
            return select;
        };

        this.typeChanged = function() {
            var typeSelectIdSelector = edges.css_id_selector(this.namespace, "type", this);
            var newVal = this.component.context.find(typeSelectIdSelector).val();

            var controlsSelector = edges.css_id_selector(this.namespace, "controls", this);

            // if no valid type is selected, clear the control panel
            var valid = this.component.options.map(function(x) { return x.name });
            var pos = $.inArray(newVal, valid);
            if (pos === -1) {
                $(controlsSelector).html("");
                return;
            }

            var fieldSet = this.component.options[pos].fields;
            if (!fieldSet) {
                $(controlsSelector).html("");
                return;
            }
            
            var frag = "";
            for (var i = 0; i < fieldSet.length; i++) {
                var fieldDef = fieldSet[i];
                frag += fieldDef.name + "<br>";
            }
            $(controlsSelector).html(frag);
        }
    }
};
