# from octopus.modules.es.testindex import ESTestCase
from unittest import TestCase
from service import models
from service.tests import fixtures

class TestModels(TestCase):
    def setUp(self):
        super(TestModels, self).setUp()

    def tearDown(self):
        super(TestModels, self).tearDown()

    def test_01_scraper_job(self):
        job = models.ScraperJob()
        assert job is not None

    def test_02_reactor(self):
        reactor = models.Reactor()
        assert reactor is not None

    def test_03_operation(self):
        op = models.Operation()
        assert op is not None

    def test_04_master_sheet(self):
        master_path = fixtures.SheetFactory.master_sheet_path()
        master = models.MasterSheet(master_path)
        assert master is not None

    def test_05_pris_sheet(self):
        pris_path = fixtures.SheetFactory.pris_sheet_path()
        pris = models.PRISSheet(pris_path)
        assert pris is not None

    def test_06_history_sheet(self):
        history_path = fixtures.SheetFactory.history_sheet_path()
        history = models.OperatingHistorySheet(history_path)
        assert history is not None

