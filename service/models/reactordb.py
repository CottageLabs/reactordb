from service.dao import ScraperJobDAO, ReactorDAO, OperationDAO
from octopus.lib import dataobj, strings, dates
from config.wnaConfig import sections_scraped
from dateutil.parser import parse
import os

class ScraperJob(dataobj.DataObj, ScraperJobDAO):
    """
    {
        "id" : "<opaque identifier for upload>",
        "created_date" : "<date scraping job was requested>",
        "filename" : [
            "<names of files created by page scraper>",
        ],
        "status" : {
            "code" : "<current status of the processing job>",
            "message" : "<message for the user associated with the status>"
        },
        "status_per_page" : [
            {
                "page": "<page number>",
                "code" : "<current status of the processing job>",
                "message" : "<message for the user associated with the status>"
            }
        ],
        "job_type": "<type of job>",
        "max_pages" : "<largest page number to scrape>",
        "success_count" : [
            {
                "type" : "<type of count>",
                "success" : "<number of successful jobs>",
                "total" : "<total number of jobs>"
            }
        ],
    }
    """

    STATUS_CODES = [u"submitted", u"processing", u"complete", u"error"]

    PAGE_STATUS_CODES = [u"complete", u"error", "warning"]

    JOB_TYPES = [u"single page", u"all pages"]

    SUCCESS_COUNT_TYPE = ["pages"]
    SUCCESS_COUNT_TYPE.extend(sections_scraped)

    @property
    def job_id(self):
        return self._get_single("id", self._utf8_unicode())

    @property
    def started(self):
        dt = self._get_single("created_date", self._utf8_unicode())
        return parse(dt).strftime('%d-%m-%Y %H:%M')

    @property
    def filename(self):
        objs = self._get_list("filename", self._utf8_unicode())
        return [(os.path.split(o)[0], os.path.split(o)[1]) for o in objs]

    @filename.setter
    def filename(self, val):
        self._add_to_list("filename", val, self._utf8_unicode())

    @property
    def status_code(self):
        return self._get_single("status.code", self._utf8_unicode())

    @status_code.setter
    def status_code(self, val):
        self._set_single("status.code", val, self._utf8_unicode(), allowed_values=self.STATUS_CODES)

    @property
    def status_message(self):
        return self._get_single("status.message", self._utf8_unicode())

    @status_message.setter
    def status_message(self, val):
        self._set_single("status.message", val, self._utf8_unicode())

    @property
    def status_per_page(self):
        objs = self._get_list("status_per_page")
        return [{"page": o.get("page", None),
                 "code": o.get("code", None),
                 "message": o.get("message", None)
                 } for o in objs]

    @status_per_page.setter
    def status_per_page(self, val):
        self._add_to_list("status_per_page", val)

    @property
    def job_type(self):
        return self._get_single("job_type", self._utf8_unicode())

    @job_type.setter
    def job_type(self, val):
        self._set_single("job_type", val, self._utf8_unicode(), allowed_values=self.JOB_TYPES)

    @property
    def max_pages(self):
        return self._get_single("max_pages", self._utf8_unicode())

    @max_pages.setter
    def max_pages(self, val):
        self._set_single("max_pages", val, self._utf8_unicode())

    @property
    def success_count(self):
        objs = self._get_list("success_count")
        return [{"type": o.get("type", None),
                 "success": o.get("success", None),
                 "total": o.get("total", None)
                 } for o in objs]

    @success_count.setter
    def success_count(self, val):
        self._add_to_list("success_count", val)

    @property
    def webhook_callback(self):
        return self._get_single("webhook_callback", self._utf8_unicode())

    @webhook_callback.setter
    def webhook_callback(self, val):
        self._set_single("webhook_callback", val, self._utf8_unicode(), ignore_none=True)

class Reactor(dataobj.DataObj, ReactorDAO):
    def __init__(self, raw=None):
        struct = {
            "fields" : {
                "id" : {"coerce" : "unicode"},
                "created_date" : {"coerce" : "utcdatetime"},
                "last_updated" : {"coerce" : "utcdatetime"},
            },
            "objects" : [
                "reactor",
                "index"
            ],

            "structs" : {
                "reactor" : {
                    "fields" : {
                        "additional_info" : {"coerce" : "unicode", "ignore_none" : True},
                        "alternate_name" : {"coerce" : "unicode", "ignore_none" : True},
                        "area" : {"coerce" : "unicode", "ignore_none" : True},
                        "commercial_operation" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "construction_restart" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "construction_start" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "construction_suspend" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "contract_year" : {"coerce" : "integer", "allowed_range" : (1000, 9999), "ignore_none" : True},
                        "country" : {"coerce" : "unicode", "ignore_none" : True},
                        "design_net_capacity" : {"coerce" : "float", "ignore_none" : True},
                        "first_criticality" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "first_grid_connection" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "gross_capacity" : {"coerce" : "float", "ignore_none" : True},
                        "image" : {"coerce" : "unicode", "ignore_none" : True},
                        "image_label" : {"coerce" : "unicode", "ignore_none" : True},
                        "longterm_shutdown" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "model" : {"coerce" : "unicode", "ignore_none" : True},
                        "name" : {"coerce" : "unicode", "ignore_none" : True},
                        "operator" : {"coerce" : "unicode", "ignore_none" : True},
                        "permanent_shutdown" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "process" : {"coerce" : "unicode", "ignore_none" : True},
                        "project_start" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "reference_unit_power_capacity_net" : {"coerce" : "float", "ignore_none" : True},
                        "restart" : {"coerce" : "bigenddate", "ignore_none" : True},
                        "site_name" : {"coerce" : "unicode", "ignore_none" : True},
                        "status" : {"coerce" : "unicode", "ignore_none" : True},
                        "thermal_capacity" : {"coerce" : "float", "ignore_none" : True},
                        "type" : {"coerce" : "unicode", "ignore_none" : True},
                        "url" : {"coerce" : "unicode", "ignore_none" : True},
                        "vendor" : {"coerce" : "unicode", "ignore_none" : True}
                    },
                    "objects" : [
                        "location",
                        "site_location",
                        "load_factor",
                        "energy_availability",
                        "electricity_supplied_cumulative"
                    ],
                    "lists" : {
                        "owner" : {"contains" : "object"},
                        "region" : {"contains" : "field", "coerce" : "unicode", "ignore_none" : True},
                        "links" : {"contains" : "object"}
                    },

                    "structs" : {
                        "location" : {
                            "fields" : {
                                "lat" : {"coerce" : "float", "ignore_none" : True},
                                "lon" : {"coerce" : "float", "ignore_none" : True}
                            }
                        },
                        "site_location" : {
                            "fields" : {
                                "lat" : {"coerce" : "float", "ignore_none" : True},
                                "lon" : {"coerce" : "float", "ignore_none" : True}
                            }
                        },
                        "owner" : {
                            "fields" : {
                                "name" : {"coerce" : "unicode", "ignore_none" : True},
                                "share" : {"coerce" : "unicode", "ignore_none" : True}
                            }
                        },
                        "links" : {
                            "fields" : {
                                "type" : {"coerce" : "unicode", "allowed_values" : [u"wna", u"wnn"], "ignore_none" : True},
                                "url" : {"coerce" : "unicode", "ignore_none" : True},
                                "text" : {"coerce" : "unicode", "ignore_none" : True}
                            }
                        }
                    }
                },
                "index" : {
                    "fields" : {
                        "sort_name" : {"coerce" : "unicode"},
                        "first_grid_connection_year" : {"coerce" : "integer", "allowed_range" : (1000, 9999)},
                        "permanent_shutdown_year" : {"coerce" : "integer", "allowed_range" : (1000, 9999)},
                        "construction_start_year" : {"coerce" : "integer", "allowed_range" : (1000, 9999)},
                        "country" : {"coerce" : "unicode"}
                    }
                }
            }
        }

        properties = {
            "additional_info" : ("reactor.additional_info", None),
            "alternate_name" : ("reactor.alternate_name", None),
            "commercial_operation" : ("reactor.commercial_operation", None),
            "construction_restart" : ("reactor.construction_restart", None),
            "construction_start" : ("reactor.construction_start", None),
            "construction_suspend" : ("reactor.construction_suspend", None),
            "country" : ("reactor.country", None),
            "country_area" : ("reactor.area", None),
            "design_net_capacity" : ("reactor.design_net_capacity", None),
            "first_criticality" : ("reactor.first_criticality", None),
            "first_grid_connection" : ("reactor.first_grid_connection", None),
            "gross_capacity" : ("reactor.gross_capacity", None),
            "image" : ("reactor.image", None),
            "image_label" : ("reactor.image_label", None),
            "latitude" : ("reactor.location.lat", None),
            "longitude" : ("reactor.location.lon", None),
            "longterm_shutdown" : ("reactor.longterm_shutdown", None),
            "model" : ("reactor.model", None),
            "operator" : ("reactor.operator", None),
            "owner" : ("reactor.owner", dataobj.DataObj),
            "permanent_shutdown" : ("reactor.permanent_shutdown", None),
            "process" : ("reactor.process", None),
            "project_start" : ("reactor.project_start", None),
            "reactor_name" : ("reactor.name", None),
            "reactor_type" : ("reactor.type", None),
            "reference_unit_power_capacity_net" : ("reactor.reference_unit_power_capacity_net", None),
            "region" : ("reactor.region", None),
            "restart" : ("reactor.restart", None),
            "site_latitude" : ("reactor.site_location.lat", None),
            "site_longitude" : ("reactor.site_location.lon", None),
            "site_name" : ("reactor.site_name", None),
            "status" : ("reactor.status", None),
            "thermal_capacity" : ("reactor.thermal_capacity", None),
            "url" : ("reactor.url", None),
            "vendor" : ("reactor.vendor", None),
            "website" : ("reactor.url", None),
            "load_factor" : ("reactor.load_factor", None),
            "energy_availability" : ("reactor.energy_availability", None),
            "electricity_supplied_cumulative" : ("reactor.electricity_supplied_cumulative", None)
        }

        self._add_struct(struct)
        super(Reactor, self).__init__(raw=raw, properties=properties, expose_data=True)

    @property
    def wna_links(self):
        type, struct, instructions = dataobj.construct_lookup("reactor.links", self._struct)
        return [dataobj.DataObj(l, struct=struct, expose_data=True) for l in self._get_list("reactor.links") if l.get("type") == "wna"]

    @wna_links.setter
    def wna_links(self, val):
        # first coerce the values
        type, struct, instructions = dataobj.construct_lookup("reactor.links", self._struct)
        cv = []
        if val is not None:
            for v in val:
                v["type"] = u"wna"
                cv.append(dataobj.construct(v, struct, self._coerce_map))

        # now remove the old values and add the new ones
        self._delete_from_list("reactor.links", matchsub={"type" : "wna"})
        for v in cv:
            self._add_to_list("reactor.links", v)

    @property
    def wnn_links(self):
        type, struct, instructions = dataobj.construct_lookup("reactor.links", self._struct)
        return [dataobj.DataObj(l, struct=struct, expose_data=True) for l in self._get_list("reactor.links") if l.get("type") == "wnn"]

    @wnn_links.setter
    def wnn_links(self, val):
        # first coerce the values
        type, struct, instructions = dataobj.construct_lookup("reactor.links", self._struct)
        cv = []
        if val is not None:
            for v in val:
                v["type"] = u"wnn"
                cv.append(dataobj.construct(v, struct, self._coerce_map))

        # now remove the old values and add the new ones
        self._delete_from_list("reactor.links", matchsub={"type" : "wnn"})
        for v in cv:
            self._add_to_list("reactor.links", v)

    def prep(self):
        # we need to set 5 internal index properties

        # 1. index.sort_name - normalised version of the reactor name for sorting on
        sn = strings.normalise(self.reactor_name)
        self._set_single("index.sort_name", sn, coerce=dataobj.to_unicode())

        # 2. index.first_grid_connection_year - just the year, as an int, from first_grid_connection
        if self.first_grid_connection is not None:
            fgcy = dates.reformat(self.first_grid_connection, out_format="%Y")
            self._set_single("index.first_grid_connection_year", fgcy, dataobj.to_int())

        # 3. index.permanent_shutdown_year - just the year, as an int, from permanent_shutdown
        if self.permanent_shutdown is not None:
            psy = dates.reformat(self.permanent_shutdown, out_format="%Y")
            self._set_single("index.permanent_shutdown_year", psy, dataobj.to_int())

        # 4. index.construction_start_year - just the year, as an int, from construction_start
        if self.construction_start is not None:
            csy = dates.reformat(self.construction_start, out_format="%Y")
            self._set_single("index.construction_start_year", csy, dataobj.to_int())

        # 5. A normalised version of the country name
        if self.country is not None:
            norm_country = self.country.lower()
            self._set_with_struct("index.country", norm_country)

class Operation(dataobj.DataObj, OperationDAO):
    def __init__(self, raw=None):
        struct = {
            "fields" : {
                "id" : {"coerce" : "unicode"},
                "created_date" : {"coerce" : "utcdatetime"},
                "last_updated" : {"coerce" : "utcdatetime"},

                "country" : {"coerce" : "unicode"},
                "reactor" : {"coerce" : "unicode", "allow_none" : False},
                "year" : {"coerce" : "integer", "allow_none" : False},

                "electricity_supplied" : {"coerce" : "float", "ignore_none" : True},
                "reference_unit_power" : {"coerce" : "float", "ignore_none" : True},
                "annual_time_online" : {"coerce" : "float", "ignore_none" : True},
                "operation_factor" : {"coerce" : "float", "ignore_none" : True},
                "energy_availability_factor_annual" : {"coerce" : "float", "ignore_none" : True},
                "energy_availability_factor_cumulative" : {"coerce" : "float", "ignore_none" : True},
                "load_factor_annual" : {"coerce" : "float", "ignore_none" : True},
                "load_factor_cumulative" : {"coerce" : "float", "ignore_none" : True},

                "comment" : {"coerce" : "unicode", "ignore_none" : True}
            },
            "objects" : ["index"],
            "structs" : {
                "index" : {
                    "fields" : {
                        "country" : {"coerce" : "unicode"}
                    }
                }
            }
        }

        self._add_struct(struct)
        super(Operation, self).__init__(raw=raw, expose_data=True)

    def prep(self):
        # Store a normalised version of the country name
        if self.country is not None:
            norm_country = self.country.lower()
            self._set_with_struct("index.country", norm_country)
