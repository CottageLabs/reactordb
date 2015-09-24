"""
from service.models import sheets
sheet = sheets.MasterSheet("/home/richard/Code/External/reactordb/service/tests/resources/MasterSheet.csv")
obs = [o for o in sheet.objects()]
"""

"""
from service.models import Reactor
r = Reactor()
r.reactor_name = "richard"
link = {"url" : "a", "text" : "b"}
r.wna_links = [link]
r.wna_links
r.wnn_links = [link]
r.wnn_links
r.reactor_name
print "hello"
"""

from octopus.core import initialise
initialise()

from service.tests import fixtures
from service.lib import importer
master_path = fixtures.SheetFactory.master_sheet_path()
pris_path = fixtures.SheetFactory.pris_sheet_path()
importer.import_reactordb(master_path, pris_path, None)
