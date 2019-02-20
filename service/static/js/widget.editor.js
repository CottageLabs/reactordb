var rdbwidgets = {
    activeEdges : {},

    data : {
        raw: {
            reactor : [
                {id : "additional_info", type: ["single", "text"], sort_type: "exact", display: "Additional Info"},
                {id : "alternate_name", type: ["single", "text"], sort_type: "exact", display: "Alternate Name"},
                {id : "area", type: ["single", "text"], sort_type: "exact", display: "Area"},
                {id : "comment_1", type : ["single", "text"], sort_type: "exact", display: "Comment 1"},
                {id : "comment_2", type : ["single", "text"], sort_type: "exact", display: "Comment 2"},
                {id : "comment_3", type : ["single", "text"], sort_type: "exact", display: "Comment 3"},
                {id : "commercial_operation", type : ["single", "date"], display: "Commercial Operation"},
                {id : "construction_restart", type : ["single", "date"], display : "Construction Restart"},
                {id : "construction_start", type : ["single", "date"], display : "Construction Start"},
                {id : "construction_suspended", type : ["single", "date"], display : "Construction Suspended"},
                {id : "contract_year", type : ["single"], display : "Contract Year"},
                {id : "country", type: ["single", "country-link", "text"], sort_type: "exact", display: "Location"},
                {id : "design_net_capacity", type: ["single", "number"], display: "Design Net Capacity (MWe)"},
                {id : "first_criticality", type: ["single", "date"], display: "First Criticality"},
                {id : "first_grid_connection", type : ["single", "date"], display : "First Grid Connection"},
                {id : "gross_capacity", type: ["single", "number"], display: "Gross Capacity"},
                {id : "licensed_to", type : ["single"], sort_type: "exact", display: "Licensed To"},
                {id : "longterm_shutdown", type: ["single", "date"], display: "Longterm Shutdown"},
                {id : "model", type : ["single", "text"], sort_type: "exact", display: "Model"},
                {id : "name", type: ["single", "reactor-link", "text"], sort_type: "exact", display: "Reactor Name"},
                {id : "operator", type : ["single", "text"], sort_type: "exact", display: "Operator"},
                {id : "permanent_shutdown", type: ["single", "date"], display: "Permanent Shutdown"},
                {id : "planned_closure", type : ["single"], sort_type: "exact", display: "Planned Closure"},
                {id : "planned_start_up", type : ["single"], sort_type: "exact", display: "Planned Start-up"},
                {id : "process", type : ["single", "text"], sort_type: "exact", display : "Reactor Type"},
                {id : "project_start", type: ["single", "date"], display: "Project Start"},
                {id : "reference_unit_power_capacity_net", type : ["single", "number"], display : "Reference Unit Power (MWe)"},
                {id : "restart", type : ["single", "date"], display : "Restart"},
                {id : "site_name", type: ["single", "text"], sort_type: "exact", display : "Site Name"},
                {id : "status", type: ["single", "text"], sort_type: "exact", display : "Current Status"},
                {id : "thermal_capacity", type: ["single", "number"], display: "Thermal Capacity (MWt)"},
                {id : "url", type: ["single"], sort_type: "exact", display: "URL"},
                {id : "vendor", type: ["single", "text"], sort_type: "exact", display: "Vendor"}
            ],
            operations : [
                {id: "annual_time_online", type : ["number"], display: "Annual Time Online"},
                {id: "operation_factor", type: ["number"], display: "Operation Factor"},
                {id: "load_factor_cumulative", type: ["number"], display: "Load Factor Cumulative"},
                {id: "load_factor_annual", type: ["number"], display: "Load Factor Annual"},
                {id: "energy_availability_factor_annual", type: ["number"], display: "Energy Availability Factor (Annual)"},
                {id: "electricity_supplied", type: ["number"], display: "Electricity Supplied (GWh)"},
                {id: "energy_availability_factor_cumulative", type: ["number"], display: "Energy Availability Factor (Cumulative)"},
                {id: "reference_unit_power", type: ["number"], display: "Reference Unit Power (MWe)"}
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
            },
            statuses: [
                {"val" : "", "display" : "Select an Operational Status"},
                {"val" : "under_construction", "display" : "Under Construction"},
                {"val" : "operable", "display" : "Operable"},
                {"val" : "longterm_shutdown", "display" : "Longterm Shutdown"},
                {"val" : "permanent_shutdown", "display" : "Permanent Shutdown"}
            ],
            primaries : [
                {val: "reactor_count", display: "Reactor Count", label : "Reactor Count"},
                {val: "design_net_capacity", display: "Design Net Capacity (Static)", label: "Design Net Capacity"},
                {val: "gross_capacity", display: "Gross Capacity (Static)", label: "Gross Capacity"},
                {val: "thermal_capacity", display: "Thermal Capacity (Static)", label: "Thermal Capacity"},
                {val: "reference_unit_power_capacity_net", display: "Reference Unit Power (Static)", label: "Reference Unit Power"},
                {val: "operational_reference_unit_power", display: "Reference Unit Power (Operational)", label: "Reference Unit Power"}
            ],
            statusHierarchy : {
                "under_construction" : {
                    "primary" : {
                        "reactor_count" : [],
                        "design_net_capacity" : [],
                        "gross_capacity" : [],
                        "thermal_capacity" : []
                    }
                },
                "operable" : {
                    "primary" : {
                        "reactor_count" : [],
                        "operational_reference_unit_power" : [
                            "reference_unit_power_capacity_net", "design_net_capacity", "gross_capacity", "thermal_capacity"
                        ]
                    }
                },
                "longterm_shutdown" : {
                    "primary" : {
                        "reactor_count" : [],
                        "operational_reference_unit_power" : [
                            "reference_unit_power_capacity_net", "design_net_capacity", "gross_capacity", "thermal_capacity"
                        ]
                    }
                },
                "permanent_shutdown" : {
                    "primary" : {
                        "reactor_count" : [],
                        "design_net_capacity" : [],
                        "gross_capacity" : [],
                        "thermal_capacity" : [],
                        "reference_unit_power_capacity_net" : []
                    }
                }
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

        singleTextValueReactorFields : function() {
            var raw = rdbwidgets.data.raw.reactor;
            var list = [{val: "", display: "Select a Reactor Field"}];
            for (var i = 0; i < raw.length; i++) {
                if ($.inArray("single", raw[i].type) !== -1 && $.inArray("text", raw[i].type) !== -1) {
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

                return "";
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

        defaultFieldFormatter : function(params) {
            return [{val: "", display: "Raw data"}];
        },

        fieldFormatters : function(params) {
            var ref = params.ref;
            var defaultOnlyFor = params.defaultOnlyFor;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return [];
                }

                // get the value of the field we are dependent on
                var val = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});

                if ($.inArray(val, defaultOnlyFor) !== -1) {
                    return rdbwidgets.data.defaultFieldFormatter();
                }

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
                var list = rdbwidgets.data.defaultFieldFormatter();
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

                return "";
            }
        },

        sortType : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return "";
                }

                // get the value of the field we are dependent on
                var reactorField = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});

                var raw = rdbwidgets.data.raw.reactor;
                for (var i = 0; i < raw.length; i++) {
                    if ("reactor." + raw[i].id === reactorField) {
                        return raw[i].sort_type || "";
                    }
                }
            }
        },

        statusPrimaryValues : function(params) {
            var ref = params.ref;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return [];
                }

                var options = [];

                // get the value of the field we are dependent on
                var statusField = rdbwidgets.data._getFieldValue({data: currentData, ref: ref, idx: idx});
                if (statusField === "") {
                    return options;
                }

                var primaries = Object.keys(rdbwidgets.data.raw.statusHierarchy[statusField].primary);
                var statuses = rdbwidgets.data.raw.primaries;

                for (var i = 0; i < primaries.length; i++) {
                    var primary = primaries[i];
                    for (var j = 0; j < statuses.length; j++) {
                        var status = statuses[j];
                        if (status.val === primary) {
                            options.push(status);
                            break;
                        }
                    }
                }

                if (options.length > 0) {
                    options.unshift({val: "", display: "Select a Primary Value Field"});
                }
                return options;
            }
        },

        statusFallbackValues : function(params) {
            var statusRef = params.status;
            var primaryRef = params.primary;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return [];
                }

                var options = [];

                // get the value of the field we are dependent on
                var statusField = rdbwidgets.data._getFieldValue({data: currentData, ref: statusRef, idx: idx});
                var primaryField = rdbwidgets.data._getFieldValue({data: currentData, ref: primaryRef, idx: idx});

                if (statusField === "" || primaryField === "") {
                    return options;
                }

                var fallbacks = rdbwidgets.data.raw.statusHierarchy[statusField].primary[primaryField];
                var statuses = rdbwidgets.data.raw.primaries;

                for (var i = 0; i < fallbacks.length; i++) {
                    var fallback = fallbacks[i];
                    for (var j = 0; j < statuses.length; j++) {
                        var status = statuses[j];
                        if (status.val === fallback) {
                            options.push(status);
                            break;
                        }
                    }
                }

                if (options.length > 0) {
                    options.unshift({val: "", display: "Select a Fallback Value Field"});
                }

                return options;
            }
        },

        statusChartLabel : function(params) {
            var statusRef = params.status;
            var primaryRef = params.primary;

            return function(params) {
                if (!params) { params = {} }
                var currentData = params.currentData;
                var idx = params.idx;

                if (!currentData) {
                    return "";
                }

                // get the value of the field we are dependent on
                var statusField = rdbwidgets.data._getFieldValue({data: currentData, ref: statusRef, idx: idx});
                var primaryField = rdbwidgets.data._getFieldValue({data: currentData, ref: primaryRef, idx: idx});

                if (statusField === "" || primaryField === "") {
                    return "";
                }

                var statuses = rdbwidgets.data.raw.statuses;
                var primaries = rdbwidgets.data.raw.primaries;

                for (var i = 0; i < statuses.length; i++) {
                    var status = statuses[i];
                    if (status.val === statusField) {
                        for (var j = 0; j < primaries.length; j++) {
                            var primary = primaries[j];
                            if (primary.val === primaryField) {
                                return status.display + " - " + primary.label;
                            }
                        }
                    }
                }

                return "";
            }
        },

        _getFieldValue : function(params) {
            var ref = params.ref;
            var idx = params.idx;
            var data = params.data;

            var val = false;
            var bits = ref.split(".");
            var node = data[bits[0]];
            if (!node) {
                return "";
            }
            if (bits.length > 1) {
                if (idx !== false) {
                    val = node[idx][bits[1]];
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

    validators : {
        less_than : function(params) {
            var limit = params.limit;
            return function(params) {
                var val = parseInt(params.val);
                return val < limit;
            }
        },

        is_not_integer : function(params) {
            return !Number.isInteger(Number(params.val))
        },

        greater_than : function(params) {
            var limit = params.limit;
            return function(params) {
                var val = parseInt(params.val);
                return val > limit;
            }
        }
    },

    controlPanelOptions : function(params) {
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
                                "label" : "Display Name",
                                "on_val" : [
                                    {"value" : "", "default" : true}
                                ]
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters({ref: "reactor.field"}),
                                "label" : "Value Formatting"
                            }
                        ],
                        "repeatable": true,
                        "limit" : 10
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
                                "label" : "Sort on Field",
                                "dependents" : ["order.sort_type"]
                            },
                            {
                                "name": "dir",
                                "type": "select",
                                "source": [
                                    {val: "asc", display: "ascending"},
                                    {val: "desc", display: "descending"}
                                ],
                                "label" : "Sort Direction"
                            },
                            {
                                "name" : "sort_type",
                                "type" : "hidden",
                                "default" : rdbwidgets.data.sortType({ref: "order.field"})
                            }
                        ]
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10",
                        "label" : "Maximum Number of Records to Show",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 1}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '1'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "countryPageTemplate",
                        "type" : "hidden",
                        "default" : params.countryPageTemplate
                    },
                    {
                        "name" : "reactorPageTemplate",
                        "type" : "hidden",
                        "default" : params.reactorPageTemplate
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
                                "source": rdbwidgets.data.singleTextValueReactorFields,
                                "label" : "Field",
                                "dependents" : ["aggregate_around.display", "aggregate_around.formatting"]
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName({ref : "aggregate_around.field"}),
                                "label" : "Display Name",
                                "on_val" : [
                                    {"value" : "", "default" : true}
                                ]
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters({ref: "aggregate_around.field", defaultOnlyFor: ["reactor.name"]}),
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
                                "dependents" : ["aggregate_on.display", "aggregate_on.formatting", "order"]
                            },
                            {
                                "name": "display",
                                "type": "text",
                                "default": rdbwidgets.data.defaultReactorFieldName({ref : "aggregate_on.field"}),
                                "label" : "Display Name",
                                "on_val" : [
                                    {"value" : "", "default" : true}
                                ]
                            },
                            {
                                "name": "formatting",
                                "type": "select",
                                "source": rdbwidgets.data.fieldFormatters({ref: "aggregate_on.field"}),
                                "label" : "Value Formatting"
                            }
                        ],
                        "repeatable": true,
                        "limit" : 10,
                        "remove_callback" : function(params) {
                            var form = params.form;
                            return function() {
                                var dependentDef = form.component.getCurrentFieldDef({id: "order"});
                                form.readForm();
                                form._updateSource({
                                    fieldDef: dependentDef,
                                    sameObject: false,
                                    idx: false
                                });
                            }
                        }
                    },
                    {
                        "name": "order",
                        "type": "select",
                        "source": rdbwidgets.data.valuesFrom({ref: "aggregate_on.field"}),
                        "label" : "Sort by Field",
                        "controlWidth" : "5"
                    },
                    {
                        "name": "limit",
                        "type": "text",
                        "default": "10",
                        "label" : "Maximum Number of Records to Show",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 1}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '1'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "countryPageTemplate",
                        "type" : "hidden",
                        "default" : params.countryPageTemplate
                    },
                    {
                        "name" : "reactorPageTemplate",
                        "type" : "hidden",
                        "default" : params.reactorPageTemplate
                    }
                ]
            },
            {
                "name": "Chart : Histogram",
                "id" : "chart_histogram",
                "fields": [
                    {
                        "name" : "chart",
                        "type" : "select",
                        "source" : [
                            {"val" : "bar", "display" : "bar"},
                            {"val" : "line", "display" : "line"}
                        ],
                        "label" : "Chart Type",
                        "controlWidth" : "2"
                    },
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970",
                        "label" : "From",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var endDef = form.component.getCurrentFieldDef({id: "end"});
                                    var selector = form._mapToFormName({fieldDef: endDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var endVal = parseInt(form.component.context.find(selector).val());
                                    var startVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your From year must be before your To year")}

                            },
                            {
                                "value" : rdbwidgets.validators.greater_than({limit: (new Date()).getUTCFullYear()}),
                                "default" : true,
                                "run" : function() {alert("Your From year must be before the current year")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear(),
                        "label" : "To",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var startDef = form.component.getCurrentFieldDef({id: "start"});
                                    var selector = form._mapToFormName({fieldDef: startDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var startVal = parseInt(form.component.context.find(selector).val());
                                    var endVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your To year must be after your From year")}

                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields,
                        "label" : "Value Field",
                        "dependents" : ["label"],
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "label",
                        "type" : "text",
                        "default" : rdbwidgets.data.defaultOperationsFieldName({ref : "value"}),
                        "label" : "Name",
                        "on_val" : [
                            {"value" : "", "default" : true}
                        ],
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "height",
                        "type" : "text",
                        "default" : "300",
                        "label" : "Widget Height (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 200}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '200'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "left",
                        "type" : "text",
                        "default" : "80",
                        "label" : "Left Margin (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "distance",
                        "type" : "text",
                        "default" : "0",
                        "label" : "Y Axis Label Distance (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
                    }
                ]
            },
            {
                "name": "Chart : Accumulator",
                "id" : "chart_accumulator",
                "fields": [
                    {
                        "name" : "chart",
                        "type" : "select",
                        "source" : [
                            {"val" : "bar", "display" : "bar"},
                            {"val" : "line", "display" : "line"}
                        ],
                        "label" : "Chart Type",
                        "controlWidth" : "2"
                    },
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970",
                        "label" : "From",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var endDef = form.component.getCurrentFieldDef({id: "end"});
                                    var selector = form._mapToFormName({fieldDef: endDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var endVal = parseInt(form.component.context.find(selector).val());
                                    var startVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your From year must be before your To year")}

                            },
                            {
                                "value" : rdbwidgets.validators.greater_than({limit: (new Date()).getUTCFullYear()}),
                                "default" : true,
                                "run" : function() {alert("Your From year must be before the current year")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear(),
                        "label" : "To",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var startDef = form.component.getCurrentFieldDef({id: "start"});
                                    var selector = form._mapToFormName({fieldDef: startDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var startVal = parseInt(form.component.context.find(selector).val());
                                    var endVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your To year must be after your From year")}

                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "value",
                        "type": "select",
                        "source": rdbwidgets.data.numericOperationsFields,
                        "label" : "Field to Accumulate",
                        "dependents" : ["label"],
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "label",
                        "type" : "text",
                        "default" : rdbwidgets.data.defaultOperationsFieldName({ref : "value"}),
                        "label" : "Name",
                        "on_val" : [
                            {"value" : "", "default" : true}
                        ],
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "height",
                        "type" : "text",
                        "default" : "300",
                        "label" : "Widget Height (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 200}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '200'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "left",
                        "type" : "text",
                        "default" : "80",
                        "label" : "Left Margin (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "distance",
                        "type" : "text",
                        "default" : "0",
                        "label" : "Y Axis Label Distance (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
                    }
                ]
            },
            {
                "name": "Chart : Status",
                "id" : "chart_status",
                "fields": [
                    {
                        "name" : "chart",
                        "type" : "select",
                        "source" : [
                            {"val" : "bar", "display" : "bar"},
                            {"val" : "line", "display" : "line"}
                        ],
                        "label" : "Chart Type",
                        "controlWidth" : "2"
                    },
                    {
                        "name": "start",
                        "type": "text",
                        "default": "1970",
                        "label" : "From",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var endDef = form.component.getCurrentFieldDef({id: "end"});
                                    var selector = form._mapToFormName({fieldDef: endDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var endVal = parseInt(form.component.context.find(selector).val());
                                    var startVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your From year must be before your To year")}

                            },
                            {
                                "value" : rdbwidgets.validators.greater_than({limit: (new Date()).getUTCFullYear()}),
                                "default" : true,
                                "run" : function() {alert("Your From year must be before the current year")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "end",
                        "type": "text",
                        "default": (new Date()).getUTCFullYear(),
                        "label" : "To",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : function(params) {
                                    var form = params.form;
                                    var startDef = form.component.getCurrentFieldDef({id: "start"});
                                    var selector = form._mapToFormName({fieldDef: startDef, idx: false});
                                    selector = "[name=" + selector + "]";
                                    var startVal = parseInt(form.component.context.find(selector).val());
                                    var endVal = parseInt(params.val);
                                    return startVal > endVal;
                                },
                                "default" : true,
                                "run" : function() {alert("Your To year must be after your From year")}

                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name": "status",
                        "type": "select",
                        "source": rdbwidgets.data.raw.statuses,
                        "label" : "Operational Status",
                        "dependents" : ["primary"],
                        "controlWidth" : "5"
                    },
                    {
                        "name": "primary",
                        "type": "select",
                        "source": rdbwidgets.data.statusPrimaryValues({ref: "status"}),
                        "label" : "Primary Value Field",
                        "dependents" : ["fallback", "label"],
                        "controlWidth" : "5"
                    },
                    {
                        "name": "fallback",
                        "type": "select",
                        "source": rdbwidgets.data.statusFallbackValues({status: "status", primary: "primary"}),
                        "label" : "Fallback Value Field",
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "label",
                        "type" : "text",
                        "default" : rdbwidgets.data.statusChartLabel({status: "status", primary: "primary"}),
                        "label" : "Name",
                        "on_val" : [
                            {"value" : "", "default" : true}
                        ],
                        "controlWidth" : "5"
                    },
                    {
                        "name" : "height",
                        "type" : "text",
                        "default" : "300",
                        "label" : "Widget Height (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 200}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '200'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "left",
                        "type" : "text",
                        "default" : "80",
                        "label" : "Left Margin (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
                    },
                    {
                        "name" : "distance",
                        "type" : "text",
                        "default" : "0",
                        "label" : "Y Axis Label Distance (pixels)",
                        "on_val" : [
                            {"value" : "", "default" : true},
                            {
                                "value" : rdbwidgets.validators.is_not_integer,
                                "default" : true,
                                "run" : function() {alert("You may only enter integers")}
                            },
                            {
                                "value" : rdbwidgets.validators.less_than({limit: 0}),
                                "default" : true,
                                "run" : function() {alert("You cannot enter a value less than '0'")}
                            }
                        ],
                        "controlWidth" : "2"
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
        var prefix = edges.getParam(params.prefix, "");
        var searchPage = edges.getParam(params.searchPage, "/search");

        var base = params.base;
        var include = params.include;

        var e = edges.newEdge({
            selector: selector,
            template: rdbwidgets.newWidgetEditorTemplate(),
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
                        allowRemove: false,
                        ifNoFilters: "There are no filters specifed, so this widget will apply to the entire reactor database.  To specify a filter go to <a href='" + searchPage + "'>the search page</a>",
                    })
                }),
                rdbwidgets.newControlPanel({
                    id: "main-control",
                    category: "control-panel",
                    options: rdbwidgets.controlPanelOptions(params),
                    renderer : rdbwidgets.newControlPanelRenderer()
                }),
                rdbwidgets.newWidgetPreview({
                    id: "preview",
                    category: "preview",
                    base: base,
                    include: include,
                    prefix: prefix,
                    renderer : rdbwidgets.newWidgetPreviewRenderer()
                })
            ]
        });

        rdbwidgets.activeEdges[selector] = e;
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
            this.currentData = {};
            this.currentType = false;
            this.currentRawData = {};
        };

        this.setCurrent = function(params) {
            this.currentType = params.type;
        };

        this.setCurrentData = function(params) {
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
            frag += this._select({id: typeSelectId, source: source, name: "widget-type", label : "Widget Type", layout: "horizontal", read: false, controlWidth: "3"});
            frag += '<div id="' + controlsId + '"></div>';
            frag += '</form></div>';

            this.component.context.html(frag);

            var typeSelectIdSelector = edges.css_id_selector(this.namespace, "type", this);
            edges.on(typeSelectIdSelector, "change", this, "typeChanged");

            this.drawn = true;
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
            this.bounceFormWatchers();
            this.setRepeatedElements();

            this.component.cycle();
        };

        this.bounceFormWatchers = function(params) {
            var controlsSelector = edges.css_id_selector(this.namespace, "controls", this);
            var inputs = this.component.context.find(controlsSelector).find(":input");
            inputs.off("change.Input");
            edges.on(inputs, "change.Input", this, "inputChanged");
        };

        this.readForm = function(params) {
            var record = {};
            var lists = {};

            var that = this;
            this.component.context.find("[data-read=true]").each(function () {
                var element = $(this);

                var type = element.attr("data-read-type");
                var tag = element.prop("tagName");
                var val = element.val();
                var separator = element.attr("data-read-separator");
                var valSeparator = element.attr("data-read-value-separator");
                var ifChecked = element.attr("data-read-if-checked");
                var readIfNot = element.attr("data-read-if-not");
                var readIfVal = element.attr("data-read-if-val");

                // don't read the value if it is conditional on another field being checked
                if (ifChecked) {
                    var checkCount = 0;
                    var selectors = ifChecked.split(" ");
                    for (var i = 0; i < selectors.length; i++) {
                        if ($(selectors[i]).is(":checked")) {
                            checkCount++;
                        }
                    }
                    if (checkCount < selectors.length) {
                        return;
                    }
                }

                // don't read the field if the value is in the list of values not to read
                if (readIfNot) {
                    // strip the leading and tailing quotes
                    readIfNot = readIfNot.substring(1, readIfNot.length - 1);

                    // split the values out
                    var vals = readIfNot.split("' '");

                    // don't read this field, if the value is in the list
                    for (var i = 0; i < vals.length; i++) {
                        if (vals[i] === val) {
                            return;
                        }
                    }
                }

                // only read this field if some other field value is set as specified
                if (readIfVal) {
                    var rivbits = readIfVal.split(" ");
                    var selector = rivbits.shift();
                    var valueSection = rivbits.join(" ");
                    var rivval = valueSection.substring(1, valueSection.length - 1);   // strip the quote marks
                    if ($(selector).val() !== rivval) {
                        return;
                    }
                }

                var field = element.attr("data-read-field");
                if (!field) {
                    field = element.attr("name");
                }
                if (!field) {
                    field = element.attr("id");
                }

                if (separator) {
                    var bits = field.split(separator);
                    field = bits.join(".");
                }

                if (tag === "INPUT") {
                    var itype = element.attr("type");
                    if (itype === "checkbox") {
                        if (!$(this).is(':checked')) {
                            return;
                        }
                        if (val === "true") {
                            val = true;
                        } else if (val === "false") {
                            val = false;
                        }
                    } else if (itype === "radio") {
                        if (!$(this).is(':checked')) {
                            return;
                        }
                        if (val === "true") {
                            val = true;
                        } else if (val === "false") {
                            val = false;
                        }
                    }
                }

                // don't store empty vals
                if (val === "" || val === null) {
                    return;
                }

                if (valSeparator) {
                    val = val.split(valSeparator)
                }

                var subField = null;
                if (type === "object-list") {
                    var listField = element.attr("data-read-list-field");
                    var indexRx = element.attr("data-read-index-pattern");
                    var fieldRx = element.attr("data-read-field-pattern");

                    var idx = field.match(indexRx)[1];
                    subField = field.match(fieldRx)[1];
                    field = listField;

                    if (!lists[field]) {
                        lists[field] = {};
                    }
                    if (!lists[field][idx]) {
                        lists[field][idx] = {};
                    }
                }

                if (type === "single") {
                    that._setPath(record, field, val);
                } else if (type === "object-list" && lists.hasOwnProperty(field) && lists[field].hasOwnProperty(idx)) {
                    that._setPath(lists[field][idx], subField, val);
                }
            });


            for (var field in lists) {
                var lookupTable = {};
                var indexes = [];

                for (var idx in lists[field]) {
                    var i = parseInt(idx);
                    lookupTable[i] = idx;
                    indexes.push(i);
                }

                indexes.sort();
                var newList = [];
                for (var i = 0; i < indexes.length; i++) {
                    var idx = indexes[i];
                    var original = lookupTable[idx];
                    newList.push(lists[field][original]);
                }

                this._setPath(record, field, newList);
            }

            this.component.setCurrentData({data: record});
        };

        this.repeat = function(params) {
            var button_selector = params.button_selector;
            var list_selector = params.list_selector;
            var entry_prefix = params.entry_prefix;
            var enable_remove = params.enable_remove || false;
            var remove_behaviour = params.remove_behaviour || "hide";
            var remove_selector = params.remove_selector;
            var remove_callback = params.remove_callback;
            var limit = params.limit || false;

            var source = "";
            var first = true;
            var max = 0;
            var attributes = {};

            var blocks = this.component.context.find(list_selector).children();
            var count = blocks.length;
            if (limit !== false && count >= limit) {
                return 0;
            }

            blocks.each(function () {
                var bits = $(this).attr("id").split("_");
                var n = parseInt(bits[bits.length - 1]);
                if (n > max) {
                    max = n
                }
                if (first) {
                    first = false;
                    source = $(this).html();
                    $(this).each(function () {
                        $.each(this.attributes, function () {
                            attributes[this.name] = this.value;
                        });
                    });
                }
            });

            var nid = entry_prefix + "_" + (max + 1);
            var attrs = "";
            for (var key in attributes) {
                if (key != "id") {
                    attrs += key + "='" + attributes[key] + "'"
                }
            }
            var ns = "<div id='" + nid + "' " + attrs + ">" + source + "</div>";

            // append a new section with a new, higher number (and hide it)
            this.component.context.find(list_selector).append(ns);

            var that = this;
            this.component.context.find("#" + nid).find(".repeatable-control").each(function () {
                var name = $(this).attr("name");
                var bits = name.split("-");
                bits[1] = max + 1;
                var newname = bits.join("-");

                var el = $(this);
                var itype = el.attr("type");
                el.attr("name", newname)
                    .attr("id", newname);
                if (itype !== "checkbox" && itype !== "radio") {
                    el.val("");
                }

                that.component.context.find("#" + nid).find("label[for=" + name + "]").attr("for", newname);
            });

            if (enable_remove) {
                if (remove_behaviour === "hide") {
                    this.component.context.find(remove_selector).show();
                } else if (remove_behaviour === "disable") {
                    this.component.context.find(remove_selector).removeAttr("disabled");
                }
                this.component.context.find(remove_selector).unbind("click")
                    .click(function (event) {
                        event.preventDefault();
                        $(this).parents(".repeatable_container").remove();

                        if (that.component.context.find(list_selector).children().size() == 1) {
                            if (remove_behaviour === "hide") {
                                that.component.context.find(remove_selector).hide();
                            } else if (remove_behaviour === "disable") {
                                that.component.context.find(remove_selector).attr("disabled", "disabled");
                            }
                        }
                        that.component.context.find(button_selector).removeAttr("disabled");

                        that.reNumberRepeatable({entryPrefix : entry_prefix});

                        if (remove_callback) {remove_callback()}
                        that.bounceFormWatchers();

                        that.readForm();
                        that.component.cycle();
                    }
                );
            }

            that.bounceFormWatchers();

            if (limit !== false) {
                return limit - (count + 1);
            } else {
                return -1;
            }
        };

        this.reNumberRepeatable = function(params) {
            var entryPrefix = params.entryPrefix;

            var list = this.component.context.find("#" + entryPrefix + "_list");
            var containers = list.find(".repeatable_container");

            var records = [];
            for (var i = 0; i < containers.length; i++) {
                var container = $(containers[i]);
                var controls = container.find(".repeatable-control");
                var labels = [];
                for (var j = 0; j < controls.length ; j++) {
                    var control = $(controls[j]);
                    var name = control.attr("name");
                    var label = container.find("label[for=" + name + "]");
                    labels.push($(label[0]));
                }
                records.push({container: container, controls: controls, labels: labels, n : i});
            }

            for (var i = 0 ; i < records.length; i++) {
                var record = records[i];

                var containerId = entryPrefix + "_" + record.n;
                record.container.attr("id", containerId);

                var nameMap = {};
                for (var j = 0; j < record.controls.length; j++) {
                    var control = $(record.controls[j]);
                    var currentName = control.attr("name");
                    var fieldRx = control.attr("data-read-field-pattern");
                    var subField = currentName.match(fieldRx)[1];
                    var controlName = entryPrefix + "-" + record.n + "-" + subField;
                    control.attr("name", controlName);
                    control.attr("id", controlName);
                    nameMap[currentName] = controlName;
                }

                for (var j = 0; j < record.labels.length; j++) {
                    var label = record.labels[j];
                    var forControl = label.attr("for");
                    label.attr("for", nameMap[forControl]);
                }
            }
        };

        this.setRepeatedElements = function(params) {
            var fieldSet = this.component.getCurrentFieldSet();
            for (var i = 0; i < fieldSet.length; i++) {
                var fieldDef = fieldSet[i];
                if (fieldDef.repeatable === true) {
                    var bindOpts = {
                        list_selector: "#" + fieldDef.name + "_list",
                        entry_prefix: fieldDef.name,
                        button_selector : "." + fieldDef.name + "__add",
                        limit: fieldDef.limit || false,
                        enable_remove: true,
                        remove_selector: "." + fieldDef.name + "__remove",
                        remove_behaviour: "hide"
                    };
                    if (fieldDef.remove_callback) {
                        bindOpts.remove_callback = fieldDef.remove_callback({form: this});
                    }
                    this.bindRepeatable(bindOpts);
                }
            }
        };

        this.bindRepeatable = function (params) {
            var list_selector = params.list_selector;
            var entry_prefix = params.entry_prefix;
            var button_selector = params.button_selector;
            var limit = params.limit || false;
            var enable_remove = params.enable_remove || false;
            var remove_selector = params.remove_selector;
            var remove_behaviour = params.remove_behaviour || "hide";

            var before_callback = params.before_callback;
            var more_callback = params.more_callback;
            var remove_callback = params.remove_callback;

            var that = this;
            this.component.context.find(button_selector).click(function (event) {
                event.preventDefault();

                if (before_callback) { before_callback() }

                var remaining = that.repeat({
                    button_selector: button_selector,
                    list_selector : list_selector,
                    entry_prefix : entry_prefix,
                    enable_remove : enable_remove,
                    remove_behaviour: remove_behaviour,
                    remove_selector : remove_selector,
                    remove_callback : remove_callback,
                    limit: limit
                });

                // each time it is used, re-bind it, as there may now be more
                // than one "more" button
                that.component.context.find(button_selector).unbind("click");
                if (remaining === 0) {
                    that.component.context.find(button_selector).attr("disabled", "disabled");
                }
                that.bindRepeatable(params);

                if (more_callback) { more_callback() }
            })
        };

        this._isPrimitiveNonBool = function(v) {
            return !($.isPlainObject(v) || $.isArray(v) || v === false || v === true)
        };

        this._findFormElements = function(params) {
            var context = params.context;
            var field = params.key;
            var container = $(depositForms.params.form_selector);

            if (context) {
                field = context + field;
            }

            var selectors = [
                "input[name='" + field + "']",
                "input[id='" + field + "']",
                "textarea[name='" + field + "']",
                "textarea[id='" + field + "']",
                "select[name='" + field + "']",
                "select[id='" + field + "']"
            ];

            var el = false;
            for (var i = 0; i < selectors.length; i++) {
                var jqel = $(selectors[i], container);
                if (jqel.length > 0) {
                    el = jqel;
                    break;
                }
            }

            return el;
        };

        this._setVal = function(params) {
            var jqel = params.element;
            var val = params.val;

            // some properties we might be interested in
            var tag = jqel.prop("tagName");
            var type = jqel.attr("type");

            var cattr = jqel.attr("class");
            var classes = [];
            if (cattr) {
                classes = cattr.split(" ");
            }
            var isSelect2 = false;
            for (var i = 0; i < classes.length; i++) {
                if (classes[i].lastIndexOf("select2", 0) === 0) {
                    isSelect2 = true;
                }
            }

            // if this is a select2 select box, setting the val directly won't have the desired
            // effect, and we want to use the select2 native method
            if (tag && tag.toLowerCase() === "select" && isSelect2) {
                jqel.select2("val", val);
                return;
            } else if (tag && tag.toLowerCase() === "input" && isSelect2) {
                var sdata = [];
                for (var i = 0; i < val.length; i++) {
                    sdata.push({id: val[i], text: val[i]});
                }
                jqel.select2("data", sdata);
                return;
            }

            // if this is a checkbox or radio, check it, and ensure that the value is set appropriately
            if (type && (type.toLowerCase() === "checkbox" || type.toLowerCase() === "radio")) {
                jqel.prop("checked", true);
                jqel.attr("value", val);
                return;
            }

            // finally, jquery's default value setter - will work for most form elements
            jqel.val(val);
        };

        this._setPath = function(obj, path, value) {
            var parts = path.split(".");
            var context = obj;

            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];

                if (!context.hasOwnProperty(p) && i < parts.length - 1) {
                    context[p] = {};
                    context = context[p];
                } else if (context.hasOwnProperty(p) && i < parts.length - 1) {
                    context = context[p];
                } else {
                    context[p] = value;
                }
            }
        };

        this.inputChanged = function(element) {
            this.readForm();
            this._updateDependents(element);
            this.readForm();
            this.component.cycle();
        };

        this._select = function(params) {
            var source = params.source;
            var name = params.name;
            var label = params.label;
            var id = params.id;
            var layout = params.layout || "basic";
            var labelWidth = params.labelWidth || "2";
            var controlWidth = params.controlWidth || "10";

            if (!id) {
                id = name;
            }

            var labelClass = "";
            if (layout === "horizontal") {
                labelClass = ' class="col-xs-' + labelWidth + ' control-label" ';
            }

            var rrf = this._get_read_and_repeat_frags(params);
            var readFrag = rrf.read;
            var repeatFrag = rrf.repeat;

            if (typeof(source) === 'function') {
                source = source();
            }
            var options = "";
            for (var i = 0; i < source.length; i++) {
                options += '<option value="' + source[i].val + '">' + source[i].display + '</option>';
            }

            var disabledFrag = "";
            if (source.length === 0) {
                disabledFrag = " disabled ";
            }

            var select = '<select id="' + id + '" name="' + name + '" class="form-control' + repeatFrag + '"' + readFrag + '' + disabledFrag + '>' + options + '</select>';
            if (layout == "horizontal") {
                select = '<div class="col-xs-' + controlWidth + '">' + select + "</div>";
            }

            var labelFrag = '<label for="' + id + '"' + labelClass + '>' + label + '</label>';
            var frag = '<div class="form-group">' + labelFrag + select + '</div>';

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>'
            } else if (layout === "horizontal") {
                frag = '<div class="form-horizontal">' + frag + '</div>'
            }

            return frag;
        };

        this._get_read_and_repeat_frags = function(params) {
            var read = edges.getParam(params.read, true);
            var readType = edges.getParam(params.readType, "single");
            var fieldSeparator = edges.getParam(params.fieldSeparator, false);
            var repeatable = edges.getParam(params.repeatable, false);
            var indexPattern = edges.getParam(params.indexPattern, false);
            var listField = edges.getParam(params.listField, false);
            var fieldPattern = edges.getParam(params.fieldPattern, false);

            var readFrag = "";
            if (read) {
                readFrag =  ' data-read="true" data-read-type="' + readType + '"';
                if (fieldSeparator) {
                    readFrag += ' data-read-separator="' + fieldSeparator + '" ';
                }
                if (repeatable) {
                    readFrag += ' data-read-index-pattern="' + indexPattern + '" ';
                    readFrag += ' data-read-list-field="' + listField + '" ';
                    readFrag += ' data-read-field-pattern="' + fieldPattern + '" ';
                }
            }

            var repeatFrag = "";
            if (repeatable) {
                repeatFrag = ' repeatable-control ';
            }

            return {read: readFrag, repeat: repeatFrag};
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
            var layout = params.layout || "basic";
            var labelWidth = params.labelWidth || "2";
            var controlWidth = params.controlWidth || "10";

            if (!id) {
                id = name;
            }

            var labelClass = "";
            if (layout === "horizontal") {
                labelClass = ' class="col-xs-' + labelWidth + ' control-label" ';
            }

            var rrf = this._get_read_and_repeat_frags(params);
            var readFrag = rrf.read;
            var repeatFrag = rrf.repeat;

            if (typeof(defaultValue) === 'function') {
                defaultValue = defaultValue();
            }

            var input = '<input name="' + name + '" id= "' + id + '" type="text" value="' + defaultValue + '" class="form-control' + repeatFrag + '" ' + readFrag + '>';
            if (layout == "horizontal") {
                input = '<div class="col-xs-' + controlWidth + '">' + input + "</div>";
            }

            var labelFrag = '<label for="' + id + '"' + labelClass + '>' + label + '</label>';
            var frag = '<div class="form-group">' + labelFrag + input + '</div>';

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>'
            } else if (layout === "horizontal") {
                frag = '<div class="form-horizontal">' + frag + '</div>'
            }

            return frag;
        };

        this._button = function(params) {
            var name = params.name;
            var label = params.label;
            var id = params.id;
            var style = params.style || "btn-info";
            var classes = params.classes || "";
            var hide = edges.getParam(params.hide, false);

            if (!id) {
                id = name;
            }

            var displayFrag = "";
            if (hide) {
                displayFrag = ' style="display:none" ';
            }

            var button = '<button type="button" class="btn ' + style + ' form-control ' + classes + '" id="' + id + '"' + displayFrag + '>' + label + '</button>';
            return button;
        };

        this._hidden = function(params) {
            var name = params.name;
            var id = params.id;
            var def = params.default;

            if (!id) {
                id = name;
            }

            var rrf = this._get_read_and_repeat_frags(params);
            var readFrag = rrf.read;
            var repeatFrag = rrf.repeat;

            var defaultFrag = "";
            if (def && typeof(def) !== 'function') {
                defaultFrag = def;
            }

            var frag = '<input type="hidden" name="' + name + '" id="' + id + '" value="' + defaultFrag + '" class="' + repeatFrag + '" ' + readFrag + '>';
            return frag;
        };

        this._combo = function(params) {
            var label = params.label;
            var subFields = params.subfields;
            var name = params.name;
            var repeatable = params.repeatable || false;

            var fieldSeparator = "__";

            var prepped = [];
            for (var i = 0; i < subFields.length; i++) {
                var subField = subFields[i];
                subField = $.extend({}, subField);

                if (repeatable) {
                    subField.name = name + "-0-" + subField.name;
                    subField.readType = "object-list";
                    subField.indexPattern = name + "-(\\d+)-.*";
                    subField.listField = name;
                    subField.fieldPattern = name + "-\\d+-(.*)";
                    subField.repeatable = true;
                } else {
                    subField.name = name + fieldSeparator + subField.name;
                    subField.fieldSeparator = fieldSeparator;
                    subField.readType = "single";
                }

                prepped.push(subField);
            }

            var repeatFrag = "";
            if (repeatable) {
                repeatFrag = this._button({name: name + "__add", label: "Add More", style: "btn-primary", classes: name + "__add"});
                prepped.push({
                    type: "button",
                    name: name + "__remove",
                    label: "Remove",
                    style: "btn-danger",
                    classes: name + "__remove",
                    hide: true
                });
            }

            var controls = this._formControls({fieldSet: prepped, layout: "inline"});
            if (repeatable) {
                controls = '<div id="' + name + '_list"><div id="' + name + '_0" class="repeatable_container">' + controls + '</div></div>';
            }

            var comboClass = edges.css_classes(this.namespace, "combo", this);
            var frag = '<div class="' + comboClass + '"><strong>' + label + '</strong><br>' + controls + repeatFrag + "</div>";
            return frag;
        };

        this._formControls = function(params) {
            var fieldSet = params.fieldSet;
            var layout = params.layout || "horizontal";

            var frag = "";
            for (var i = 0; i < fieldSet.length; i++) {
                var fieldDef = fieldSet[i];
                fieldDef = $.extend({}, fieldDef);
                fieldDef.layout = layout === "inline" ? "basic" : layout;
                var fieldType = fieldDef.type;

                if (fieldType === "combo") {
                    frag += this._combo(fieldDef);
                } else if (fieldType === "select") {
                    frag += this._select(fieldDef);
                } else if (fieldType === "text") {
                    frag += this._text(fieldDef);
                } else if (fieldType === "button") {
                    frag += this._button(fieldDef);
                } else if (fieldType === "hidden") {
                    frag += this._hidden(fieldDef);
                }
            }

            if (layout === "inline") {
                frag = '<div class="form-inline">' + frag + '</div>';
            }
            return frag;
        };

        this._updateDependents = function(element) {
            var jqel = $(element);
            var name = jqel.attr("name");

            var type = jqel.attr("data-read-type");
            var separator = jqel.attr("data-read-separator");

            var fieldId = "";
            var idx = false;
            if (type === "single") {
                if (separator) {
                    var bits = name.split(separator);
                    fieldId = bits[0] + "." + bits[1];
                } else {
                    fieldId = name;
                }
            } else if (type === "object-list") {
                var listField = jqel.attr("data-read-list-field");
                var indexRx = jqel.attr("data-read-index-pattern");
                var fieldRx = jqel.attr("data-read-field-pattern");

                idx = parseInt(name.match(indexRx)[1]);
                var subField = name.match(fieldRx)[1];
                fieldId = listField + "." + subField;
            }

            var fieldDef = this.component.getCurrentFieldDef({id : fieldId});

            // handle empty fields and their on_empty behaviour
            if (fieldDef.hasOwnProperty("on_val")) {
                var fieldVal = jqel.val();
                for (var i = 0; i < fieldDef.on_val.length; i++) {
                    var valOpts = fieldDef.on_val[i];
                    var matchVal = valOpts.value;
                    var isMatch = false;
                    if (typeof matchVal === "function") {
                        isMatch = matchVal({val: fieldVal, form: this});
                    } else {
                        isMatch = matchVal === fieldVal;
                    }
                    if (isMatch) {
                        if (valOpts.default) {
                            var fieldDefault = fieldDef.default;
                            if (typeof fieldDefault === "function") {
                                fieldDefault = fieldDef.default({currentData: this.component.currentData, idx: idx});
                            }
                            jqel.val(fieldDefault);
                        }
                        if (valOpts.run) {
                            valOpts.run();
                        }
                        break;
                    }
                }
            }

            if (!fieldDef.hasOwnProperty("dependents")) {
                return;
            }

            var dependents = fieldDef.dependents;
            for (var i = 0; i < dependents.length; i++) {
                var dependentDef = this.component.getCurrentFieldDef({id: dependents[i]});
                if ("source" in dependentDef) {
                    var fieldBits = fieldDef.name.split(".");
                    var dependentBits = dependentDef.name.split(".");
                    var sameObject = fieldBits[0] === dependentBits[0];

                    var updatedElement = this._updateSource({
                        fieldDef: dependentDef,
                        sameObject: sameObject,
                        idx: idx
                    });

                    updatedElement.trigger("change")
                }
                if ("default" in dependentDef) {
                    var defaultVal = dependentDef.default({currentData: this.component.currentData, idx: idx});

                    var selector = this._mapToFormName({fieldDef: dependentDef, idx: idx});
                    selector = "[name=" + selector + "]";

                    var el = this.component.context.find(selector);
                    el.val(defaultVal);
                    el.trigger("change");
                }
            }
        };

        this._mapToFormName = function(params) {
            var fieldDef = params.fieldDef;
            var idx = params.idx;

            var bits = fieldDef.name.split(".");

            if (idx === false) {
                return bits.join("__")
            } else {
                return bits[0] + "-" + idx + "-" + bits[1];
            }
        };

        this._updateSource = function(params) {
            var dependentDef = params.fieldDef;
            var sameObject = params.sameObject;
            var idx = params.idx;

            var args = {fieldDef: dependentDef};
            if (sameObject) {
                args.idx = idx;
            } else {
                args.idx = false;
            }
            var selector = this._mapToFormName(args);
            selector = "[name=" + selector + "]";

            var el = this.component.context.find(selector);
            var originalDependentVal = el.val();

            var source = dependentDef.source({currentData: this.component.currentData, idx: idx});
            var options = this._options({source : source});
            el.html(options);

            if (source.length === 0) {
                el.prop("disabled", true);
            } else {
                el.prop("disabled", false);
            }

            // keep the original value if it is still in the list
            for (var j = 0; j < source.length; j++) {
                if (source[j].val === originalDependentVal) {
                    el.val(originalDependentVal);
                    break;
                }
            }

            return el;
        };
    },

    newWidgetPreview : function(params) {
        return edges.instantiate(rdbwidgets.WidgetPreview, params, edges.newComponent);
    },
    WidgetPreview : function(params) {
        this.base = params.base;
        this.include = params.include;
        this.prefix = params.prefix;

        this.config = {};

        this.widget_id = "";
        this.widget = false;

        this.synchronise = function() {
            // always reset the widget id, this makes sure that the same one isn't accidentally used twice
            this.widget_id = "widget_" + this._random_id();

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

        this.documentation = "To embed this widget, copy all the HTML text from the grey box above, and paste it \
                                into your CMS page at the point in the page that you want the widget to appear.";

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

            this.component.context.html(frag);
            var localCfg = $.extend({}, this.component.config);
            localCfg.prefix = this.component.prefix;
            this.component.widget = widget.init(localCfg);

            if (this.component.widget) {
                var snippetContainerClass = edges.css_classes(this.namespace, "snippet", this);
                var previewFrag = '<div class="' + snippetContainerClass + '">Use the following code to embed this in a web page: <pre>' + this._embedSnippet() + '</pre>' + this.documentation + '</div>';
                this.component.context.append(previewFrag);
            }
        };

        this._embedSnippet = function() {
            var div ='<div id="' + this.component.widget_id + '"></div>\n';

            var settings = '<script type="text/javascript">\nvar RDB_WIDGET_CONFIG_';
            settings += this.component.widget_id + ' = ' + JSON.stringify(this.component.config, null, 2) + '\n</script>\n';

            var include = '<script type="text/javascript" src="embed.js?id=' + this.component.widget_id + '"></script>';

            var snippet = div + settings + include;
            snippet = edges.escapeHtml(snippet);
            return snippet;
        };
    }
};
