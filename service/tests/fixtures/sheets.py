from octopus.lib import paths
import os

RESOURCES = paths.rel2abs(__file__, "..", "resources")

class SheetFactory(object):
    @classmethod
    def master_sheet_path(cls):
        return os.path.join(RESOURCES, "MasterSheet.csv")

    @classmethod
    def pris_sheet_path(cls):
        return os.path.join(RESOURCES, "PRISScrape.csv")