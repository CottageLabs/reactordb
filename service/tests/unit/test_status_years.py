from parameterized import parameterized
from combinatrix.testintegration import load_parameter_sets

from octopus.lib import paths

from unittest import TestCase
from datetime import datetime

from service.lib import importer

def load_cases():
    return load_parameter_sets(paths.rel2abs(__file__, "..", "resources", "operational_status"), "operational_status", "test_id",
                               {"test_id" : []})

class TestStatusYears(TestCase):

    def setUp(self):
        pass


    def tearDown(self):
        pass

    @parameterized.expand(load_cases)
    def test_status_years(self, name, kwargs):
        expected = {
            1999 : kwargs.get("1999"),
            2000 : kwargs.get("2000"),
            2001 : kwargs.get("2001"),
            2002 : kwargs.get("2002"),
            2003 : kwargs.get("2003"),
            2004 : kwargs.get("2004"),
            2005 : kwargs.get("2005"),
            2006 : kwargs.get("2006")
        }

        arg_this_year = kwargs.get("this_year")
        expected[datetime.utcnow().year] = arg_this_year

        obj = {}

        def add_date(obj, args, date_type):
            arg_val = args.get(date_type)
            if arg_val == "none":
                return
            arg_val = unicode(arg_val) + u"-07-31"
            obj[date_type] = arg_val

        add_date(obj, kwargs, "construction_start")
        add_date(obj, kwargs, "construction_suspend")
        add_date(obj, kwargs, "construction_restart")
        add_date(obj, kwargs, "first_grid_connection")
        add_date(obj, kwargs, "longterm_shutdown")
        add_date(obj, kwargs, "restart")
        add_date(obj, kwargs, "permanent_shutdown")

        importer._add_status_data(obj)

        assert "operation" in obj
        assert "operational_status" in obj["operation"]

        context = obj["operation"]["operational_status"]

        # check it goes no earlier than expected
        for year, status in expected.iteritems():
            if status == "-":
                assert year not in context
            else:
                assert status == context[year]

        years = context.keys()
        years.sort()

        expected_years = expected.keys()
        expected_years.sort()
        first_year = None
        for expected_year in expected_years:
            if expected[expected_year] != "-":
                first_year = expected_year
                break

        if first_year is not None:
            assert years[0] == first_year
        assert years[-1] == datetime.utcnow().year


