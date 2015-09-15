default_max_pages = 1200

PRISURL="https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx"

sections_available = [
    u'reactor details',
    u'lifeTime performance',
    u'operating history'
]

sections_scraped = [
    u'reactor details',
    u'operating history'
]

reactor_details_data_dir = '/tmp/WNA/'

page_details_id = {
    u'reactor_name':          {'id': 'MainContent_MainContent_lblReactorName',   'label': u'Reactor Name'},
    u'reactor_alternate_name': {'id': 'MainContent_MainContent_lblAlternateName', 'label': u'Alternate Name'},
    u'reactor_status':        {'id': 'MainContent_MainContent_lblReactorStatus', 'label': u'Status'},
    u'reactor_country':       {'id': 'MainContent_litCaption',                   'label': u'Location'},
}

reactor_details_id = {
    u'MainContent_MainContent_hypOperatorUrl':             u'Operator',
	u'MainContent_MainContent_lblType':                    u'Reactor Type',
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

reactor_details_header = (
    u'Reactor Name',
    u'Alternate Name',
    u'Location',
    u'Status',
    u'Operator',
    u'Reactor Type',
    u'First Grid Connection',
    u'First Criticality Date',
    u'Reference Unit Power (Net Capacity)',
    u'Thermal Capacity',
    u'Design Net Capacity',
	u'Model',
    u'Construction Suspended Date',
    u'Commercial Operation Date',
    u'Permanent Shutdown Date',
    u'Longterm Shutdown Date',
    u'Construction Restart Date',
    u'Owner',
    u'Construction Start Date',
    u'Gross Capacity',
    u'Restart Date',
)

operating_history_data_dir = '/tmp/WNA/'

operating_history_header = (
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
operating_history_data_columns = operating_history_header[1:-1]

# Minimum success rate for page scraper
success_rate = 25
