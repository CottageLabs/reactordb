#import urllib2
#import urllib
from bs4 import BeautifulSoup
import requests
from collections import defaultdict, Counter
import time
import os

from config.wnaConfig import PRISURL, defaultMaxPages, sectionsScraped
from config.wnaConfig import reactorDetailsId, reactorDetailsDataDir, reactorDetailsHeader
from config.wnaConfig import operatingHistoryHeader, operatingHistoryDataColumns, operatingHistoryDataDir
from service.lib.unicodeCSV import UnicodeWriter

#TODO:  Do we need config file with reactor names and corresponding id used in the website
#       If they add new reactors / delete reactors, do we update our config file?

#url="https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current=2"
#page=urllib2.urlopen(url)

#url="https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx"
#values = {'current' : 2}
#data = urllib.urlencode(values)
#req = urllib2.Request(url, data)
#page = urllib2.urlopen(req)

def alternate(i):
    i = iter(i)
    while True:
        yield(i.next(), i.next())
       
class WNAPageScraper(object):
    """
    Usage:
    from pageScraper import WNAPageScraper
    pageScraper = WNAPageScraper(2)
    pageScraper.getColumnsInReactorDetails()
    #pageScraper.columnsInReactorDetails
    pageScraper.getReactorDetails()
    #pageScraper.reactorDetails
    """
    def __init__(self, pageNumber, columnsInReactorDetails=defaultdict(list)):
        self.columnsInReactorDetails = columnsInReactorDetails
        try:
            self.pageNumber = int(pageNumber)
        except:
            self.pageNumber = None
            #TODO raise exception
            pass
        self.page = None
        self.soup = None
        self.reactorName = None
        self.reactorSection = None
        self.lifeTimeSection = None
        self.operatingHistorySection = None
        self.reactorDetails = {}
        self.operatingHistory = []
        self.getPage()

    def getPage(self):
        if self.requestPage():
            self.parsePage()
            self.getReactorName()
            self.getPageSections()
        return

    def requestPage(self):
        payload = {'current': self.pageNumber}
        r = requests.get(PRISURL, params=payload)
        #r.headers['content-type']
        #r.encoding # could use this decode and encode data into unicode
        if r.status_code > 199 and r.status_code < 300:
            self.page = r.text
            return True
        else:
            return False

    def parsePage(self):
        self.soup = BeautifulSoup(self.page, 'html.parser')
        return
        
    def getReactorName(self):
        self.reactorName = self.soup.find(id="MainContent_MainContent_lblReactorName").text
        return
            
    def getPageSections(self):
        for sectionTitle in self.soup.find_all('h3'):
            if sectionTitle.text.strip('\r\n\t ').lower() == 'reactor details':
                self.reactorSection = sectionTitle
            if sectionTitle.text.strip('\r\n\t ').lower() == 'lifeTime performance':
                self.lifeTimeSection = sectionTitle
            if sectionTitle.text.strip('\r\n\t ').lower() == 'operating history':
                self.operatingHistorySection = sectionTitle
        return

    def getColumnsInReactorDetails(self):
        if not self.reactorSection:
            return False
        content = self.reactorSection.find_parent("div", class_="box")
        for rows in alternate(content.table.find_all('tr')):
            cols0 = rows[0].find_all('td')
            cols1 = rows[1].find_all('td')
            for i in range(len(cols1)):
                spanId = None
                try:
                    try:
                        spanId = cols1[i].span.get('id')
                    except:
                        spanId = cols1[i].h5.a.get('id')
                except:
                    #Loop through contents to find an id
                    for child in cols1[i].contents:
                        try:
                            spanId = child.get('id', None)
                        except:
                            continue
                        if spanId:
                            break
                if spanId and not spanId in self.columnsInReactorDetails:
                    self.columnsInReactorDetails[spanId].append(cols0[i].text.strip('\r\n\t '))
                elif not spanId and not cols0[i].text.strip('\r\n\t ') in self.columnsInReactorDetails:
                    # if no id, use label from column in previous row as key
                    self.columnsInReactorDetails[cols0[i].text.strip('\r\n\t ')].append(cols0[i].text.strip('\r\n\t '))
        return True
                
    def getReactorDetails(self):
        if not self.reactorSection:
            return False
        self.reactorDetails[reactorDetailsId['Reactor Name']] = self.reactorName
        content = self.reactorSection.find_parent("div", class_="box")
        for rows in alternate(content.table.find_all('tr')):
            cols0 = rows[0].find_all('td')
            cols1 = rows[1].find_all('td')
            for i in range(len(cols1)):
                spanId = None
                label = None
                try:
                    try:
                        spanId = cols1[i].span.get('id')
                        value = cols1[i].span.text.strip('\r\n\t ')
                    except:
                        try:
                            spanId = cols1[i].h5.a.get('id')
                            value = cols1[i].h5.a.text.strip('\r\n\t ')
                            # TODO: Do we also need the href in this case?
                            #       Example: https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current=2 owner and operator
                        except:
                            # No Id and no hyperlink
                            label = cols0[i].text.strip('\r\n\t ')
                            value = cols1[i].h5.text.strip('\r\n\t ')
                except:
                    #Assuming no ID found rather than looping through content.
                    #Using label from column in row above and all of the contents of the cell for value
                    label = cols0[i].text.strip('\r\n\t ')
                    value = cols1[i].contents.strip('\r\n\t ')
                if spanId and spanId in reactorDetailsId:
                    self.reactorDetails[reactorDetailsId[spanId]] = value
                elif not spanId and label and label in reactorDetailsId:
                     # if no id, use label as key
                    self.reactorDetails[reactorDetailsId[label]] = value
        return True
        
    def getOperatingHistory(self):
        if not self.operatingHistorySection:
            return False
        content = self.operatingHistorySection.find_parent("div", class_="box")
        prevComment = None
        for rows in content.table.tbody.find_all('tr'):
            cols = rows.find_all('td')
            dataRow = [self.reactorName]
            if len(cols) == 2:
                dataRow.append(cols[0].text)
                # Add blank data columns
                dataRow.extend([''] * (len(operatingHistoryDataColumns) - 1))
                # Add comment
                if cols[1].text.strip('\r\n\t ') != '"':
                    prevComment = cols[1].text.strip('\r\n\t ')
                    dataRow.append(cols[1].text.strip('\r\n\t '))
                elif prevComment:
                    dataRow.append(prevComment)
                else:
                    dataRow.append(cols[1].text.strip('\r\n\t '))
            if len(cols) == len(operatingHistoryDataColumns):
                # Add data columns
                for col in cols:
                    dataRow.append(col.text.strip('\r\n\t '))
                # Add blank comment
                dataRow.append('')
            else:
                #TODO: Add exception. The table layout has been modified
                pass
            if dataRow:
                self.operatingHistory.append(dataRow)
        return True
        
        
class WNAScraper(object):
    """
    Usgae:
    from pageScraper import WNAScraper
    ws = WNAScraper(1200)
    ws.getAllColumnsInReactorDetails
    """
    def __init__(self, maxPages=defaultMaxPages):
        try:
            self.maxPages = int(maxPages)
        except:
            self.maxPages = defaultMaxPages
        self.rdFilename = None
        self.rdFileHandler = None
        self.rdCsvWriter = None
        self.ohFilename = None
        self.ohFileHandler = None
        self.ohCsvWriter = None
            
    def getrdFileName(self):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        fn = "%s-%s.csv"%(timestr, 'reactorDetails')
        self.rdFilename = os.path.join(reactorDetailsDataDir, fn)
        return
        
    def openrdStream(self, filename=None):
        fileExists = False
        if not filename:
            self.getrdFileName()
            filename = self.rdFilename
        if os.path.isfile(filename):
            fileExists = True
        self.rdFileHandler = file(filename, 'a')
        self.rdCsvWriter = UnicodeWriter(self.rdFileHandler)
        if not fileExists:
            self.rdCsvWriter.writerow(reactorDetailsHeader)
        return
        
    def writerdStream(self, reactorDetails):
        #reactorDetails is a dictionary
        data = []
        for col in reactorDetailsHeader:
            data.append(reactorDetails.get(col, ''))
        self.rdCsvWriter.writerow(data)
        return
        
    def closerdStream(self):
        self.rdFileHandler.close()
        return
        
    def getohFileName(self):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        fn = "%s-%s.csv"%(timestr, 'operatingHistory')
        self.ohFilename = os.path.join(operatingHistoryDataDir, fn)
        return
        
    def openohStream(self, filename=None):
        fileExists = False
        if not filename:
            self.getohFileName()
            filename = self.ohFilename
        if os.path.isfile(filename):
            fileExists = True
        self.ohFileHandler = file(filename, 'a')
        self.ohCsvWriter = UnicodeWriter(self.ohFileHandler)
        if not fileExists:
            self.ohCsvWriter.writerow(operatingHistoryHeader)
        return
        
    def writeohStream(self, operatingHistory):
        #operatingHistory is a list of lists
        self.ohCsvWriter.writerows(operatingHistory)
        return
        
    def closeohStream(self):
        self.ohFileHandler.close()
        return

    def getAllColumnsInReactorDetails(self):
        # Get all available columns in reactor dtails
        columnsInReactorDetails = defaultdict(list)
        for i in range(1, self.maxPages):
            pageScraper = WNAPageScraper(i, columnsInReactorDetails=columnsInReactorDetails)
            if pageScraper.getColumnsInReactorDetails():
                columnsInReactorDetails = dict(Counter(columnsInReactorDetails)+Counter(pageScraper.columnsInReactorDetails))
                for k,v in columnsInReactorDetails.iteritems():
                    columnsInReactorDetails[k] = list(set(v))
        return columnsInReactorDetails
    
    def getAllPages(self, sections=sectionsScraped):
        if not isinstance(sections, list):
            sections = [sections]
        if 'reactor details' in sections:
            self.getrdFileName()
            self.openrdStream()
        if 'operating history' in sections:
            self.getohFileName()
            self.openohStream()
        for pageNumber in range(1, self.maxPages):
            pageScraper = WNAPageScraper(pageNumber)
            if 'reactor details' in sections:
                if pageScraper.getReactorDetails():
                    self.writerdStream(pageScraper.reactorDetails)
                else:
                    #TODO: raise exception
                    pass
            if 'operating history' in sections:
                if pageScraper.getOperatingHistory():
                    self.writeohStream(pageScraper.operatingHistory)
                else:
                    #TODO: raise exception
                    pass
        if 'reactor details' in sections:
            self.closerdStream()
        if 'operating history' in sections:
            self.closeohStream()
        return
        
    def getPage(self, pageNumber, sections=sectionsScraped):
        if not isinstance(pageNumber, int):
            #TODO: raise exception
            return False
        pageScraper = WNAPageScraper(pageNumber)
        if 'reactor details' in sections:
            self.getrdFileName()
            self.openrdStream()
            if pageScraper.getReactorDetails():
                self.writerdStream(pageScraper.reactorDetails)
            else:
                #TODO: raise exception
                pass
            self.closerdStream()
        if 'operating history' in sections:
            self.getohFileName()
            self.openohStream()
            if pageScraper.getOperatingHistory():
                self.writeohStream(pageScraper.operatingHistory)
            else:
                #TODO: raise exception
                pass
            self.closeohStream()
        return
