##################################################
# overrides for the webapp deployment

DEBUG = True
PORT = 5028
SSL = False
THREADED = True

############################################
# important overrides for the ES module

# elasticsearch back-end connection settings
ELASTIC_SEARCH_HOST = "http://localhost:9200"
ELASTIC_SEARCH_INDEX = "reactordb"
ELASTIC_SEARCH_VERSION = "1.4.4"

# Classes from which to retrieve ES mappings to be used in this application
# (note that if ELASTIC_SEARCH_DEFAULT_MAPPINGS is sufficient, you don't need to
# add anything here
ELASTIC_SEARCH_MAPPINGS = [
    # "service.dao.MyDAO"
]

# initialise the index with example documents from each of the types
# this will initialise each type and auto-create the relevant mappings where
# example data is provided
ELASTIC_SEARCH_EXAMPLE_DOCS = [
    # "service.dao.MyDAO"
]

############################################
# important overrides for account module

ACCOUNT_ENABLE = False
SECRET_KEY = "super-secret-key"

#############################################
# important overrides for storage module

# STORE_IMPL = "octopus.modules.store.store.StoreLocal"
# STORE_TMP_IMPL = "octopus.modules.store.store.TempStore"

from octopus.lib import paths
STORE_LOCAL_DIR = paths.rel2abs(__file__, "..", "service", "tests", "local_store", "live")
STORE_TMP_DIR = paths.rel2abs(__file__, "..", "service", "tests", "local_store", "tmp")

#############################################
# Overrides for the HTTP lib code

# which http code responses should result in a retry?
HTTP_RETRY_CODES = [
    # 403,   # forbidden; used for non-available pages - do not retry
    408,    # request timeoue
    409,    # conflict; not clear whether retry will help or not, but worth a go
    420,    # enhance your calm; twitter rate limit code
    429,    # too many requests; general rate limit code
    444,    # no response; nginx specific, not clear if this actuall would go to the client
    502,    # bad gateway; retry to see if the gateway can re-establish connection
    503,    # service unavailable; retry to see if it comes back
    504     # gateway timeout; retry to see if it responds next time
]

##############################################
# Service specific config

DEFAULT_MAX_PAGES = 1200

PRISURL = "https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx"

SECTIONS_AVAILABLE = [
    u'reactor details',
    u'lifeTime performance',
    u'operating history'
]

SECTIONS_SCRAPED = [
    u'reactor details',
    u'operating history'
]

REACTOR_DETAILS_DATA_DIR = 'datadir'

PAGE_DETAILS_ID = {
    u'reactor_name':          {'id': 'MainContent_MainContent_lblReactorName',   'label': u'Reactor Name'},
    u'reactor_alternate_name': {'id': 'MainContent_MainContent_lblAlternateName', 'label': u'Alternate Name'},
    u'reactor_status':        {'id': 'MainContent_MainContent_lblReactorStatus', 'label': u'Status'},
    u'reactor_country':       {'id': 'MainContent_litCaption',                   'label': u'Location'},
    }

REACTOR_DETAILS_ID = {
    u'MainContent_MainContent_hypOperatorUrl':             u'Operator',
    u'MainContent_MainContent_lblType':                    u'Process',
    u'MainContent_MainContent_lblGridConnectionDate':      u'First Grid Connection',
    u'MainContent_MainContent_lblFirstCriticality':        u'First Criticality Date',
    u'MainContent_MainContent_lblNetCapacity':             u'Reference Unit Power (Net Capacity)',
    u'MainContent_MainContent_lblThermalCapacity':         u'Thermal Capacity',
    u'MainContent_MainContent_lblDesignNetCapacity':       u'Design Net Capacity',
    u'MainContent_MainContent_lblModel':                   u'Model',
    u'MainContent_MainContent_lblConstrSuspendedDate':     u'Construction Suspended Date',
    u'MainContent_MainContent_lblCommercialOperationDate': u'Commercial Operation Date',
    u'MainContent_MainContent_lblPermanentShutdownDate':   u'Permanent Shutdown Date',
    u'MainContent_MainContent_lblLongTermShutdownDate':    u'Longterm Shutdown Date',
    u'MainContent_MainContent_lblConstrRestartDate':       u'Construction Restart Date',
    u'MainContent_MainContent_hypOwnerUrl':                u'Owner',
    u'MainContent_MainContent_lblConstructionStartDate':   u'Construction Start Date',
    u'MainContent_MainContent_lblGrossCapacity':           u'Gross Capacity',
    u'MainContent_MainContent_lblRestartDate':             u'Restart Date',
    u'Owner':                                              u'Owner',
    u'Operator':                                           u'Operator',
    }

REACTOR_DETAILS_HEADER = (
    u'Reactor Name',
    u'Alternate Name',
    u'Location',
    u'Status',
    u'Owner',
    u'Operator',
    u'Model',
    u'Process',
    u'Reference Unit Power (Net Capacity)',
    u'Thermal Capacity',
    u'Design Net Capacity',
    u'Gross Capacity',
    u'Construction Start Date',
    u'Construction Suspended Date',
    u'Construction Restart Date',
    u'First Criticality Date',
    u'First Grid Connection',
    u'Commercial Operation Date',
    u'Longterm Shutdown Date',
    u'Restart Date',
    u'Permanent Shutdown Date',
)

OPERATING_HISTORY_DATA_DIR = 'datadir'

OPERATING_HISTORY_HEADER = (
    u'Reactor Name',
    u'Year',
    u'Electricity Supplied [GW.h]',
    u'Reference Unit Power [MW]',
    u'Annual Time On Line [h]',
    u'Operation Factor [%]',
    u'Energy Availability Factor Annual [%]',
    u'Energy Availability Factor Cumulative [%]',
    u'Load Factor Annual [%]',
    u'Load Factor Cumulative [%]',
    u'Comment'
)
# No reactor name and comment in operating history table
OPERATING_HISTORY_DATA_COLUMNS = OPERATING_HISTORY_HEADER[1:-1]

# Minimum success rate for page scraper
SUCCESS_RATE = 25
