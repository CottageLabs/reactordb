from octopus.modules.es.testindex import ESTestCase
from octopus.core import app
from service.tests import fixtures
from service.lib import importer
import time
from service import models

class TestModels(ESTestCase):
    def setUp(self):
        super(TestModels, self).setUp()

    def tearDown(self):
        super(TestModels, self).tearDown()

    def test_01_import(self):
        master_path = fixtures.SheetFactory.master_sheet_path()
        pris_path = fixtures.SheetFactory.pris_sheet_path()

        importer.import_reactordb(master_path, pris_path, None)
        time.sleep(2)

        res = models.Reactor.query()
        assert res.get("hits", {}).get("total") > 0
