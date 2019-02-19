from octopus.modules.es.testindex import ESTestCase
from octopus.core import app
from service.tests import fixtures
from service.lib import importer
import time, os, shutil
from service import models


class TestImport(ESTestCase):
    def setUp(self):
        self.old_rolling_dir = app.config["ESDAO_ROLLING_DIR"]
        app.config["ESDAO_ROLLING_DIR"] = "test_rolling_dir"
        os.makedirs(os.path.join("test_rolling_dir", "reactor"))
        os.makedirs(os.path.join("test_rolling_dir", "operation"))

        super(TestImport, self).setUp()

    def tearDown(self):
        app.config["ESDAO_ROLLING_DIR"] = self.old_rolling_dir
        shutil.rmtree("test_rolling_dir")

        super(TestImport, self).tearDown()

    def test_01_import(self):
        master_path = fixtures.SheetFactory.master_sheet_path()
        pris_path = fixtures.SheetFactory.pris_sheet_path()
        history_path = fixtures.SheetFactory.history_sheet_path()

        importer.import_reactordb(master_path, pris_path, history_path)
        time.sleep(2)

        res = models.Reactor.object_query()
        assert len(res) == 10
        assert len(res[0].data["operation"]["load_factor_annual"].keys()) > 0
        assert len(res[0].data["operation"]["energy_availability_factor_annual"].keys()) > 0
        assert len(res[0].data["operation"]["electricity_supplied_cumulative"].keys()) > 0
        assert len(res[0].data["operation"]["reference_unit_power"].keys()) > 0
        assert len(res[0].data["operation"]["electricity_supplied"].keys()) > 0
        assert res[0].country is not None
        assert res[0].data["index"]["country"] == res[0].country.lower()

        res = models.Operation.object_query()
        assert len(res) == 10
        assert res[0].country is not None
        assert res[0].data["index"]["country"] == res[0].country.lower()

