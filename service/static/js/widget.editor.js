var rdbwidgets = {
    activeEdges : {},

    data : {
        raw: {
            reactor : [
                {id : "reference_unit_power_capacity_net", type : ["single", "number"], display : "Reference Unit Power (Capacity Net)"},
                {id : "process", type : ["single"], display : "Reactor Type"},
                {id : "construction_start", type : ["single", "date"], display : "Construction Start"},
                {id : "operator", type : ["single"], display: "Operator"},
                {id : "first_grid_connection", type : ["single", "date"], display : "First Grid Connection"},
                {id : "gross_capacity", type: ["single", "number"], display: "Gross Capacity"},
                {id : "status", type: ["single"], display : "Current Status"},
                {id : "first_criticality", type : ["single", "date"], display : "First Criticality" },
                {id : "commercial_operation", type : ["single", "date"], display: "Commercial Operation"},
                {id : "termal_capacity", type: ["single", "number"], display: "Thermal Capacity"},
                {id : "design_net_capacity", type: ["single", "number"], display: "Design Net Capacity"},
                {id : "name", type: ["single", "reactor-link"], display: "Reactor Name"},
                {id : "country", type: ["single", "country-link"], display: "Location"},
                {id : "model", type : ["single"], display: "Model"}
            ],
            operations : [
                {id: "annual_time_online", type : ["number"], display: "Annual Time Online"},
                {id: "operation_factor", type: ["number"], display: "Operation Factor"},
                {id: "load_factor_cumulative", type: ["number"], display: "Load Factor Cumulative"},
                {id: "load_factor_annual", type: ["number"], display: "Load Factor Annual"},
                {id: "energy_availability_factor_annual", type: ["number"], display: "Energy Availability Factor Annual"},
                {id: "electricity_supplied", type: ["number"], display: "Electricity Supplied"},
                {id: "energy_availability_factor_cumulative", type: ["number"], display: "Energy Availability Factor Cumulative"},
                {id: "reference_unit_power", type: ["number"], display: "Reference Unit Power"}
            ],
            formatters : {
                date : [
                    {val: "year", display: "Year Only"},
                    {val : "year_month", display: "Year + Month"},
                    {val : "full_date", display: "Full Date"}
                ],
                number : [
                    {val: "number", display: "Formatted Number"}
                ],
                "country-link" : [
                    {val: "country_link", display: "Link to Country Page"}
                ],
                "reactor-link" : [
                    {val: "reactor_link", display: "Link to Reactor Page"}
                ]
            }
        },

        singleValueReactorFields : function() {
            var raw = rdbwidgets.data.raw.reactor;
            var list = [{val: "", display: "Select a Reactor Field"}];
            for (var i = 0; i < raw.length; i++) {
                if ($.inArray("single", raw[i].type) !== -1) {
                    list.push({val: "reactor." + raw[i].id, display: "reactor." + raw[i].id});
                }
            }
            return list;
        },

        defaultReactorFieldName : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var previousData = params.previousData;
                var idx = params.idx;

                if (!currentData) {
                    return "";
                }

                // get the value of the field we are dependent on
                var reactorField = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});

                var raw = rdbwidgets.data.raw.reactor;
                for (var i = 0; i < raw.length; i++) {
                    if ("reactor." + raw[i].id === reactorField) {
                        return raw[i].display;
                    }
                }

                return "unknown";
            }
        },

        numericReactorFields : function() {
            var raw = rdbwidgets.data.raw.reactor;
            var list = [{val: "", display: "Select a Reactor Field"}];
            for (var i = 0; i < raw.length; i++) {
                if ($.inArray("number", raw[i].type) !== -1) {
                    list.push({val: "reactor." + raw[i].id, display: "reactor." + raw[i].id});
                }
            }
            return list;
        },

        fieldFormatters : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var previousData = params.previousData;
                var idx = params.idx;

                if (!currentData) {
                    return [];
                }

                // get the value of the field we are dependent on
                var val = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});

                // get the type(s) of the field
                var types = false;
                var raw = rdbwidgets.data.raw.reactor;
                for (var i = 0; i < raw.length; i++) {
                    if ("reactor." + raw[i].id === val) {
                        types = raw[i].type;
                        break;
                    }
                }

                // get all the formatters relevant to this type
                var list = [{val: "", display: "Raw data"}];
                var formatters = rdbwidgets.data.raw.formatters;
                for (var i = 0; i < types.length; i++) {
                    if (formatters.hasOwnProperty(types[i])) {
                        list = list.concat(formatters[types[i]]);
                    }
                }

                return list;
            }
        },

        valuesFrom : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return [{val: "", display: "Select fields to Aggregate On first"}];
                }

                // get the value of the field we are dependent on
                var reactorFields = rdbwidgets.data._getAllFieldValues({data: currentData, ref: ref});
                var list = [{val: "", display: "Select a sort field"}];
                for (var i = 0; i < reactorFields.length; i++) {
                    list.push({val: reactorFields[i], display: reactorFields[i]});
                }
                return list
            }
        },

        numericOperationsFields : function() {
            var raw = rdbwidgets.data.raw.operations;
            var list = [{val: "", display: "Select an Operations Field"}];
            for (var i = 0; i < raw.length; i++) {
                if ($.inArray("number", raw[i].type) !== -1) {
                    list.push({val: raw[i].id, display: raw[i].id});
                }
            }
            return list;
        },

        defaultOperationsFieldName : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var previousData = params.previousData;
                var idx = params.idx;

                if (!currentData) {
                    return "";
                }

                // get the value of the field we are dependent on
                var reactorField = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});

                var raw = rdbwidgets.data.raw.operations;
                for (var i = 0; i < raw.length; i++) {
                    if (raw[i].id === reactorField) {
                        return raw[i].display;
                    }
                }

                return "unknown";
            }
        },


        _getFieldValue : function(params) {
            var ref = params.ref;
            var idx = params.idx;
            var data = params.data;

            var val = false;
            var bits = ref.split(".");
            var node = data[bits[0]];
            if (bits.length > 1) {
                if (idx !== false) {
                    val = node[idx - 1][bits[1]];
                } else {
                    val = node[bits[1]];
                }
            } else {
                val = node;
            }
            return val;
        },

        _getAllFieldValues : function(params) {
            var ref = params.ref;
            var data = params.data;

            var vals = [];
            var bits = ref.split(".");
            var node = data[bits[0]];
            if (bits.length > 1) {
                if (Array.isArray(node)) {
                    for (var i = 0; i < node.length; i++) {
                        vals.push(node[i][bits[1]]);
                    }
                } else {
                    vals.push(node[bits[1]]);
                }
            } else {
                vals.push(node);
            }
            return vals;
        }
    },

    controlPanelOptions : function() {
        return [
            {
                "name": "Hightlight Numbers",
                "id" : "highlight"
            },
            {
                "name": "Table : Reactor",
                "id" : "table_reactor",
                "fields": [
                    {
                        "name": "reactor",
                        "type": "combo",
                        "label" : "Fields to Display",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields,
                                "label" : "Field",
                                "dependents" : ["reactor.display", "reactor.formatting"]
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName({ref : "reactor.field"}),
                                "label" : "Display Name"
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters({ref: "reactor.field"}),
                                "label" : "Value Formatting"
                            }
                        ],
                        "repeatable": true
                    },
                    {
                        "name": "order",
                        "type": "combo",
                        "label" : "Sort Order",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields,
                                "label" : "Sort on Field"
                            },
                            {
                                "name": "dir",
                                "type": "select",
                                "source": [
                                    {val: "ascending", display: "ascending"},
                                    {val: "descending", display: "descending"}
                                ],
                                "label" : "Sort Direction"
                            }
                        ]
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10",
                        "label" : "Maximum Number of Records to Show"
                    }
                ]
            },
            {
                "name": "Table : Aggregate",
                "id" : "table_aggregate",
                "fields": [
                    {
                        "name": "aggregate_around",
                        "type": "combo",
                        "label" : "Aggregate Around",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.singleValueReactorFields,
                                "label" : "Field",
                                "dependents" : ["aggregate_around.display", "aggregate_around.formatting"]
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName({ref : "aggregate_around.field"}),
                                "label" : "Display Name"
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters({ref: "aggregate_around.field"}),
                                "label" : "Value Formatting"
                            }
                        ]
                    },
                    {
                        "name": "aggregate_on",
                        "type": "combo",
                        "label" : "Aggregate On",
                        "subfields": [
                            {
                                "name": "field",
                                "type": "select",
                                "source": rdbwidgets.data.numericReactorFields,
                                "label" : "Field",
                                "dependents" : ["aggregate_on.display", "order"]
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName({ref : "aggregate_on.field"}),
                                "label" : "Display Name"
                            }
                        ],
                        "repeatable": true
                    },
                    {
                        "name": "order",
                        "type": "select",
                        "source": rdbwidgets.data.valuesFrom({ref: "aggregate_on.field"}),
                        "label" : "Sort by Field"
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10",
                        "label" : "Maximum Number of Records to Show"
                    }
                ]
            },
            {
                "name": "Chart : Histogram",
                "id" : "chart_histogram",
                "fields": [
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970",
                        "label" : "From"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear(),
                        "label" : "To"
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields,
                        "label" : "Value Field",
                        "dependents" : ["label"]
                    },
                    {
                        "name" : "label",
                        "type" : "text",
                        "default" : rdbwidgets.data.defaultOperationsFieldName({ref : "value"}),
                        "label" : "Name"
                    },
                    {
                        "name" : "height",
                        "type" : "text",
                        "default" : "300",
                        "label" : "Widget Height (pixels)"
                    }
                ]
            },
            {
                "name": "Chart : Accumulator",
                "id" : "chart_accumulator",
                "fields": [
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970",
                        "label" : "From"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear(),
                        "label" : "To"
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields,
                        "label" : "Field to Accumulate"
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

        var base = params.base;
        var include = params.include;

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
                        showSearchString: true,
                        allowRemove: false
                    })
                }),
                rdbwidgets.newControlPanel({
                    id: "main-control",
                    category: "control-panel",
                    options: rdbwidgets.controlPanelOptions(),
                    renderer : rdbwidgets.newControlPanelRenderer()
                }),
                rdbwidgets.newWidgetPreview({
                    id: "preview",
                    category: "preview",
                    base: base,
                    include: include,
                    renderer : rdbwidgets.newWidgetPreviewRenderer()
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
                frag += '<div class="row"><div class="col-md-12"><div class="' + previewClass + '"><div id="' + preview[i].id + '"></div></div></div></div>';
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

        this.previousData = false;

        this.currentType = false;
        this.currentRawData = {};
        this.currentData = {};

        this.memory = {};

        this.synchronise = function() {};

        this.cycle = function() {
            this.edge.resources.control = {type : this.currentType, settings: this.currentData};
            this.edge.cycle();
        };

        this.isValidType = function(params) {
            var newVal = params.type;
            var valid = this.options.map(function(x) { return x.id });
            return $.inArray(newVal, valid) !== -1;
        };

        this.getCurrentFieldSet = function(params) {
            var entries = this.options.map(function(x) { return x.id });
            var pos = $.inArray(this.currentType, entries);
            return this.options[pos].fields;
        };

        this.currentDependentsMap = function() {
            var dependentsMap = {};

            var fieldSet = this.getCurrentFieldSet();
            for (var i = 0; i < fieldSet.length; i++) {
                var field = fieldSet[i];
                if (field.type === "combo") {
                    for (var j = 0; j < field.subfields.length; j++) {
                        var subfield = field.subfields[j];
                        if (subfield.hasOwnProperty("dependents")) {
                            dependentsMap[field.name + "." + subfield.name] = subfield.dependents;
                        }
                    }
                } else {
                    if (field.hasOwnProperty("dependents")) {
                        dependentsMap[field.name] = field.dependents;
                    }
                }
            }

            return dependentsMap;
        };

        this.getCurrentFieldDef = function(params) {
            var id = params.id;
            var bits = id.split(".");

            var fieldSet = this.getCurrentFieldSet();
            for (var i = 0; i < fieldSet.length; i++) {
                var fieldDef = fieldSet[i];
                if (bits[0] === fieldDef.name) {
                    if (bits.length === 2) {
                        for (var j = 0; j < fieldDef.subfields.length; j++) {
                            var subfield = fieldDef.subfields[j];
                            if (bits[1] === subfield.name) {
                                subfield = $.extend({}, subfield);
                                subfield.name = fieldDef.name + "." + subfield.name;
                                return subfield;
                            }
                        }
                    } else {
                        return fieldDef;
                    }
                }
            }

            return false;
        };

        this.clearData = function(params) {
            this.previousData = this.currentData;
            this.currentData = {};
            this.currentType = false;
            this.currentRawData = {};
        };

        this.setCurrent = function(params) {
            this.currentType = params.type;
        };

        this.setCurrentData = function(params) {
            this.previousData = this.currentData;
            this.currentRawData = params.raw;
            this.currentData = params.data;
        }
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

            var source = options.map(function(x) { return {val: x.id, display: x.name} });
            source.unshift({val: "", display: "Select a Widget Type"});
            frag += this._select({id: typeSelectId, source: source, name: "widget-type", label : "Widget Type", layout: "inline"});
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
            var label = params.label;
            var id = params.id;
            var layout = params.layout || "regular";

            if (!id) {
                id = name;
            }

            if (typeof(source) === 'function') {
                source = source();
            }
            var options = "";
            for (var i = 0; i < source.length; i++) {
                options += '<option value="' + source[i].val + '">' + source[i].display + '</option>';
            }
            var select = '<select id="' + id + '" name="' + name + '" class="form-control">' + options + '</select>';

            var labelFrag = '<label for="' + id + '">' + label + '</label>';
            var frag = '<div class="form-group">' + labelFrag + select + '</div>';

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>'
            }

            return frag;
        };

        this._options = function(params) {
            var source = params.source;

            var options = "";
            for (var i = 0; i < source.length; i++) {
                options += '<option value="' + source[i].val + '">' + source[i].display + '</option>';
            }
            return options;
        };

        this._text = function(params) {
            var defaultValue = params.default;
            var name = params.name;
            var label = params.label;
            var id = params.id;
            var layout = params.layout || "regular";

            if (!id) {
                id = name;
            }

            if (typeof(defaultValue) === 'function') {
                defaultValue = defaultValue();
            }

            var input = '<input name="' + name + '" id= "' + id + '" type="text" value="' + defaultValue + '" class="form-control">';
            var labelFrag = '<label for="' + id + '">' + label + '</label>';
            var frag = '<div class="form-group">' + labelFrag + input + '</div>';

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>'
            }

            return frag;
        };

        this._button = function(params) {
            var name = params.name;
            var label = params.label;
            var id = params.id;

            if (!id) {
                id = name;
            }

            var button = '<button class="btn btn-info form-control" id="' + id + '" disabled>' + label + '</button>';
            return button;
        };

        this._combo = function(params) {
            var label = params.label;
            var subFields = params.subfields;
            var name = params.name;
            var repeatable = params.repeatable || false;

            var prepped = [];
            for (var i = 0; i < subFields.length; i++) {
                var subField = subFields[i];
                subField = $.extend({}, subField);
                subField.name = name + "__" + subField.name;
                if (repeatable) {
                    subField.name += "__1";
                }
                prepped.push(subField);
            }

            var repeatFrag = "";
            if (repeatable) {
                repeatFrag = this._button({name: name + "__add", label: "Add More"});
                prepped.push({
                    type: "button",
                    name: name + "__remove__1",
                    label: "Remove"
                });
            }

            var controls = this._formControls({fieldSet: prepped, layout: "inline"});

            var comboClass = edges.css_classes(this.namespace, "combo", this);
            var frag = '<div class="' + comboClass + '"><strong>' + label + '</strong><br>' + controls + repeatFrag + "</div>";
            return frag;
        };

        this.typeChanged = function() {
            var typeSelectIdSelector = edges.css_id_selector(this.namespace, "type", this);
            var newVal = this.component.context.find(typeSelectIdSelector).val();

            var controlsSelector = edges.css_id_selector(this.namespace, "controls", this);

            // if no valid type is selected, clear the control panel
            var isValid = this.component.isValidType({type: newVal});
            if (!isValid) {
                $(controlsSelector).html("");
                this.component.clearData();
                this.component.cycle();
                return;
            }

            this.component.clearData();
            this.component.setCurrent({type: newVal});
            var fieldSet = this.component.getCurrentFieldSet();
            if (!fieldSet) {
                $(controlsSelector).html("");
                this.component.cycle();
                return;
            }

            var frag = this._formControls({fieldSet : fieldSet});
            $(controlsSelector).html(frag);

            this.readForm();
            var inputs = this.component.context.find(controlsSelector).find(":input");
            edges.on(inputs, "change", this, "inputChanged");

            this.component.cycle();
        };

        this._formControls = function(params) {
            var fieldSet = params.fieldSet;
            var layout = params.layout || "regular";

            var frag = "";
            for (var i = 0; i < fieldSet.length; i++) {
                var fieldDef = fieldSet[i];
                fieldDef = $.extend({}, fieldDef);
                fieldDef.layout = layout === "regular" ? "inline" : "regular";
                var fieldType = fieldDef.type;

                if (fieldType === "combo") {
                    frag += this._combo(fieldDef);
                } else if (fieldType === "select") {
                    frag += this._select(fieldDef);
                } else if (fieldType === "text") {
                    frag += this._text(fieldDef);
                } else if (fieldType === "button") {
                    frag += this._button(fieldDef);
                }
            }

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>';
            }
            return frag;
        };

        this.readForm = function(params) {
            var controlsIdSelector = edges.css_id_selector(this.namespace, "controls", this);
            var controls = this.component.context.find(controlsIdSelector);
            var inputs = controls.find(":input");

            var raw = {};
            for (var i = 0; i < inputs.length; i++) {
                var input = $(inputs[i]);
                var name = input.attr("name");
                if (name) {
                    var val = input.val();
                    raw[name] = val;
                }
            }

            var parsed = {};
            var lists = {};
            var keys = Object.keys(raw);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var bits = key.split("__");
                if (bits.length === 1) {
                    parsed[key] = raw[key];
                } else if (bits.length === 2) {
                    if (!(bits[0] in parsed)) {
                        parsed[bits[0]] = {};
                    }
                    parsed[bits[0]][bits[1]] = raw[key];
                } else if (bits.length === 3) {
                    if (!(bits[0] in lists)) {
                        lists[bits[0]] = {};
                    }
                    if (!(bits[2] in lists[bits[0]])) {
                        lists[bits[0]][bits[2]] = {}
                    }
                    lists[bits[0]][bits[2]][bits[1]] = raw[key];
                }
            }

            keys = Object.keys(lists);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                parsed[key] = [];
                var indices = Object.keys(lists[key]);
                var numbers = indices.map(function(x) { return parseInt(x) });
                var max = Math.max.apply(null, numbers);
                for (var j = 0; j < max; j++) {
                    parsed[key].push({});
                }
                for (var j = 0; j < indices.length; j++) {
                    var idx = indices[j];
                    var props = lists[key][idx];
                    parsed[key][parseInt(idx) - 1] = props;
                }
            }

            this.component.setCurrentData({raw: raw, data: parsed});
        };

        this.inputChanged = function(element) {
            this.readForm();
            this._updateDependents(element);
            this.readForm();
            this.component.cycle();
        };

        this._updateDependents = function(element) {
            var jqel = $(element);
            var name = jqel.attr("name");
            var bits = name.split("__");

            var fieldId = "";
            if (bits.length  === 1) {
                fieldId = bits[0];
            } else if (bits.length > 1) {
                fieldId = bits[0] + "." + bits[1]
            }
            var idx = false;
            if (bits.length === 3) {
                idx = parseInt(bits[2]);
            }

            var fieldDef = this.component.getCurrentFieldDef({id : fieldId});
            if (!fieldDef.hasOwnProperty("dependents")) {
                return;
            }

            var dependents = fieldDef.dependents;
            for (var i = 0; i < dependents.length; i++) {
                var dependentDef = this.component.getCurrentFieldDef({id: dependents[i]});
                if ("source" in dependentDef) {
                    var source = dependentDef.source({currentData: this.component.currentData, previousData: this.component.previousData, idx: idx})

                    var selector = dependentDef.name.replace(".", "__");
                    var fieldBits = fieldDef.name.split(".");
                    var dependentBits = dependentDef.name.split(".");
                    var sameObject = fieldBits[0] === dependentBits[0];
                    if (idx !== false && sameObject) {
                        selector += "__" + idx;
                    }
                    selector = "[name=" + selector + "]";
                    var el = this.component.context.find(selector);

                    var options = this._options({source : source});
                    el.html(options);
                }
                if ("default" in dependentDef) {
                    var defaultVal = dependentDef.default({currentData: this.component.currentData, previousData: this.component.previousData, idx: idx});

                    var selector = dependentDef.name.replace(".", "__");
                    var fieldBits = fieldDef.name.split(".");
                    var dependentBits = dependentDef.name.split(".");
                    var sameObject = fieldBits[0] === dependentBits[0];
                    if (idx !== false && sameObject) {
                        selector += "__" + idx;
                    }
                    selector = "[name=" + selector + "]";
                    var el = this.component.context.find(selector);
                    el.val(defaultVal);
                }
            }
        };
    },

    newWidgetPreview : function(params) {
        return edges.instantiate(rdbwidgets.WidgetPreview, params, edges.newComponent);
    },
    WidgetPreview : function(params) {
        this.base = params.base;
        this.include = params.include;

        this.config = {};

        this.widget_id = "";

        this.synchronise = function() {
            if (this.widget_id === "") {
                this.widget_id = "widget_" + this._random_id();
            }

            if (!this.edge.resources.hasOwnProperty("control")) {
                this.config = {};
                return;
            }

            if (this.edge.resources.control.type === false) {
                this.config = {};
                return;
            }

            this.config = {
                id: this.widget_id,
                type: this.edge.resources.control.type,
                query: this.edge.currentQuery.objectify(),
                base: this.base,
                include: this.include,
                settings: this.edge.resources.control.settings
            }
        };

        this._random_id = function() {
            var id = "";
            while (id.length !== 5) {
                id = Math.random().toString(36).substr(2, 5);
            }
            return id;
        }
    },

    newWidgetPreviewRenderer : function(params) {
        return edges.instantiate(rdbwidgets.WidgetPreviewRenderer, params, edges.newRenderer);
    },
    WidgetPreviewRenderer : function(params) {

        this.namespace = "rdbwidgets-preview";

        this.draw = function() {
            var previewContainerClass = edges.css_classes(this.namespace, "container", this);

            var nopreview = Object.keys(this.component.config).length === 0;

            // if there's no config, don't show the widget
            if (nopreview) {
                var noWidgetClass = edges.css_classes(this.namespace, "no-widget", this);
                var frag = '<div class="' + previewContainerClass + '"><div class="' + noWidgetClass + '">No Preview Available Yet</div></div>';
                this.component.context.html(frag);
                return;
            }

            var frag = '<div class="' + previewContainerClass + '">\
                <div id="' + this.component.widget_id + '">\
                    <div id="' + this.component.widget_id + '-inner">Preview will be displayed here when available</div>\
                </div>\
                </div>';

            var snippetContainerClass = edges.css_classes(this.namespace, "snippet", this);
            frag += '<div class="' + snippetContainerClass + '">Use the following code to embed this in a web page: <pre>' + this._embedSnippet() + '</pre></div>';

            this.component.context.html(frag);
            widget.init(this.component.config);

        };

        this._embedSnippet = function() {
            var div ='<div id="' + this.component.widget_id + '"></div>\n';

            var settings = '<script type="text/javascript">\nvar RDB_WIDGET_CONFIG = ' + JSON.stringify(this.component.config, null, 2) + '\n</script>\n';
            var include = '<script type="text/javascript" src="embed.js"></script>';

            var snippet = div + settings + include;
            snippet = edges.escapeHtml(snippet);
            return snippet;
        };
    }
};
