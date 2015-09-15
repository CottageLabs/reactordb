from bs4 import BeautifulSoup
from collections import defaultdict, Counter
import time
import os
import re

from config.wnaConfig import PRISURL, default_max_pages, sections_scraped, page_details_id, success_rate
from config.wnaConfig import reactor_details_id, reactor_details_data_dir, reactor_details_header
from config.wnaConfig import operating_history_header, operating_history_data_columns, operating_history_data_dir
from config.http import HTTP_RETRY_CODES
from service.lib.unicodeCSV import UnicodeWriter
from service import models
from octopus.lib.http import get


def alternate(i):
    i = iter(i)
    while True:
        yield(i.next(), i.next())
       

def percentage(part, whole):
    return 100 * float(part)/float(whole)


class WNAPageScraper(object):
    """
    Usage:
    from pageScraper import WNAPageScraper
    page_scraper = WNAPageScraper(2)
    page_scraper.get_page()
    page_scraper.get_reactor_details_cols()
    # page_scraper.reactor_details_cols
    page_scraper.get_reactor_details()
    # page_scraper.reactor_details
    """
    def __init__(self, page_number, reactor_details_cols=defaultdict(list)):
        self.reactor_details_cols = reactor_details_cols
        try:
            self.page_number = int(page_number)
        except ValueError:
            self.page_number = None
            # TODO raise exception
            pass
        self.page = None
        self.soup = None
        self.reactor_name = None
        self.reactor_alternate_name = None
        self.reactor_status = None
        self.reactor_country = None
        self.reactor_section = None
        self.life_time_section = None
        self.operating_history_section = None
        self.reactor_details = {}
        self.operating_history = []

    def get_page(self):
        if self.request_page():
            self.parse_page()
            self.get_reactor_name()
            self.get_page_sections()
            return True
        else:
            return False

    def request_page(self):
        # TODO: InsecurePlatformWarning
        #      requests/packages/urllib3/util/ssl_.py:90: InsecurePlatformWarning: A true SSLContext object is not
        #      available. This prevents urllib3 from configuring SSL appropriately and may cause certain SSL
        #      connections to fail. For more information, see
        #      https://urllib3.readthedocs.org/en/latest/security.html#insecureplatformwarning.

        payload = {'current': self.page_number}
        r = get(PRISURL, retry_codes=HTTP_RETRY_CODES, params=payload)
        # r.headers['content-type']
        # r.encoding # could use this decode and encode data into unicode
        if r and r.status_code > 199 and r.status_code < 300:
            self.page = r.text
            return True
        else:
            return False

    def parse_page(self):
        self.soup = BeautifulSoup(self.page, 'html.parser')
        return

    def get_reactor_name(self):
        self.reactor_name = self.soup.find(id=page_details_id['reactor_name']['id']).text.strip('\r\n\t ')
        return

    def get_reactor_alternate_name(self):
        txt = self.soup.find(id=page_details_id[u'reactor_alternate_name']['id']).text
        self.reactor_alternate_name = txt.strip('\r\n\t ')
        return

    def get_reactor_status(self):
        self.reactor_status = self.soup.find(id=page_details_id['reactor_status']['id']).text.strip('\r\n\t ')
        return

    def get_reactor_country(self):
        self.reactor_country = self.soup.find(id=page_details_id['reactor_country']['id']).text.strip('\r\n\t ')
        return

    def get_page_sections(self):
        for section_title in self.soup.find_all('h3'):
            if section_title.text.strip('\r\n\t ').lower() == 'reactor details':
                self.reactor_section = section_title
            if section_title.text.strip('\r\n\t ').lower() == 'lifeTime performance':
                self.life_time_section = section_title
            if section_title.text.strip('\r\n\t ').lower() == 'operating history':
                self.operating_history_section = section_title
        return

    def get_reactor_details_cols(self):
        if not self.reactor_section:
            return False
        content = self.reactor_section.find_parent("div", class_="box")
        for rows in alternate(content.table.find_all('tr')):
            cols0 = rows[0].find_all('td')
            cols1 = rows[1].find_all('td')
            for i in range(len(cols1)):
                span_id = None
                try:
                    try:
                        span_id = cols1[i].span.get('id')
                    except:
                        span_id = cols1[i].h5.a.get('id')
                except:
                    # Loop through contents to find an id
                    for child in cols1[i].contents:
                        try:
                            span_id = child.get('id', None)
                        except:
                            continue
                        if span_id:
                            break
                if span_id and span_id not in self.reactor_details_cols:
                    self.reactor_details_cols[span_id].append(cols0[i].text.strip('\r\n\t '))
                elif not span_id and not cols0[i].text.strip('\r\n\t ') in self.reactor_details_cols:
                    # if no id, use label from column in previous row as key
                    self.reactor_details_cols[cols0[i].text.strip('\r\n\t ')].append(cols0[i].text.strip('\r\n\t '))
        return True
        
    def parse_owner(self, owner):
        owners = owner
        if '%' in owner:
            p1 = re.compile("[0-9][.][ ]")
            p2 = '(.*?)[(](\d+[.,]\d+%)[)](.*?)$'
            p3 = '(.*?)[(](\d+%)[)](.*?)$'
            owners = []
            if '\n' in owner:
                owner = owner.split('\n')
            elif ',' in owner:
                owner = owner.split(',')
            for eachowner in owner:
                eachowner = p1.sub(u'', eachowner)
                ans = re.findall(p2, eachowner)
                if not ans:
                    ans = re.findall(p3, eachowner)
                if ans:
                    ans = ans[0]
                    val = ans[1].replace(',', '.')
                    if ans[0]:
                        name = ans[0].strip('\r\n\t,; ')
                    else:
                        name = ans[2].strip('\r\n\t,; ')
                    owners.append("%s (%s)" % (name, val))
                else:
                    owners.append(eachowner)
            owners = '\n\n'.join(owners)
        elif 'nuclear portion' in owner.lower():
            owners = []
            p = re.compile("nuclear portion:(.*?)[;,]\sconventional portion:(.*?)$", re.IGNORECASE)
            ans = p.findall(owner)
            if ans:
                owners.append(ans[0][0].strip('\r\n\t,; '))
                owners.append(ans[0][1].strip('\r\n\t,; '))
            owners = '\n\n'.join(owners)
        return owners
                
    def get_reactor_details(self):
        if not self.reactor_section:
            return False
        self.get_reactor_alternate_name()
        self.get_reactor_status()
        self.get_reactor_country()
        self.reactor_details[page_details_id['reactor_name']['label']] = self.reactor_name
        self.reactor_details[page_details_id['reactor_alternate_name']['label']] = self.reactor_alternate_name
        self.reactor_details[page_details_id['reactor_status']['label']] = self.reactor_status
        self.reactor_details[page_details_id['reactor_country']['label']] = self.reactor_country
        content = self.reactor_section.find_parent("div", class_="box")
        for rows in alternate(content.table.find_all('tr')):
            cols0 = rows[0].find_all('td')
            cols1 = rows[1].find_all('td')
            for i in range(len(cols1)):
                span_id = None
                label = None
                try:
                    try:
                        span_id = cols1[i].span.get('id')
                        value = cols1[i].span.text.strip('\r\n\t ')
                    except:
                        try:
                            span_id = cols1[i].h5.a.get('id')
                            value = cols1[i].h5.a.text.strip('\r\n\t ')
                            # Note: Not taking the value of href in this case?
                            #       Example: https://www.iaea.org/PRIS/CountryStatistics/ReactorDetails.aspx?current=2
                            #       owner and operator
                        except:
                            # No Id and no hyperlink
                            label = cols0[i].text.strip('\r\n\t ')
                            value = cols1[i].h5.text.strip('\r\n\t ')
                except:
                    # Assuming no ID found rather than looping through content.
                    # Using label from column in row above and all of the contents of the cell for value
                    label = cols0[i].text.strip('\r\n\t ')
                    value = cols1[i].contents.strip('\r\n\t ')
                if span_id and span_id in reactor_details_id:
                    self.reactor_details[reactor_details_id[span_id]] = value
                elif not span_id and label and label in reactor_details_id:
                    # if no id, use label as key
                    self.reactor_details[reactor_details_id[label]] = value
        self.reactor_details['Owner'] = self.parse_owner(self.reactor_details['Owner'])
        return True
        
    def get_operating_history(self):
        if not self.operating_history_section:
            return False
        content = self.operating_history_section.find_parent("div", class_="box")
        prev_comment = None
        for rows in content.table.tbody.find_all('tr'):
            cols = rows.find_all('td')
            data_row = [self.reactor_name]
            if len(cols) == 2:
                data_row.append(cols[0].text.strip('\r\n\t '))
                # Add blank data columns
                data_row.extend([''] * (len(operating_history_data_columns) - 1))
                # Add comment
                if cols[1].text.strip('\r\n\t ') != '"':
                    prev_comment = cols[1].text.strip('\r\n\t ')
                    data_row.append(cols[1].text.strip('\r\n\t '))
                elif prev_comment:
                    data_row.append(prev_comment)
                else:
                    data_row.append(cols[1].text.strip('\r\n\t '))
            elif len(cols) == len(operating_history_data_columns):
                # Add data columns
                for col in cols:
                    data_row.append(col.text.strip('\r\n\t '))
                # Add blank comment
                data_row.append('')
            else:
                # TODO: Add exception. The table layout has been modified
                pass
            if data_row:
                self.operating_history.append(data_row)
        return True
        
        
class WNAScraper(object):
    """
    Usage:
    from pageScraper import WNAScraper
    ws = WNAScraper(max_pages=1200)
    columns = ws.get_all_reactor_details_cols()
    ws.get_page(2)
    ws.get_all_pages()
    """
    def __init__(self, max_pages=default_max_pages):
        try:
            self.max_pages = int(max_pages)
        except ValueError:
            self.max_pages = default_max_pages
        self.rd_filename = None
        self.rd_file_handler = None
        self.rd_csv_writer = None
        self.oh_filename = None
        self.oh_file_handler = None
        self.oh_csv_writer = None
            
    def get_rd_filename(self, job_id='all'):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        fn = "%s-%s-%s.csv" % (timestr, 'reactor_details', str(job_id))
        self.rd_filename = os.path.join(reactor_details_data_dir, fn)
        return
        
    def open_rd_stream(self, filename=None, job_id='all'):
        file_exists = False
        if not filename:
            self.get_rd_filename(job_id=job_id)
            filename = self.rd_filename
        if os.path.isfile(filename):
            file_exists = True
        self.rd_file_handler = file(filename, 'a')
        self.rd_csv_writer = UnicodeWriter(self.rd_file_handler)
        if not file_exists:
            self.rd_csv_writer.writerow(reactor_details_header)
        return
        
    def write_rd_stream(self, reactor_details):
        # reactor_details is a dictionary
        data = []
        for col in reactor_details_header:
            data.append(reactor_details.get(col, ''))
        self.rd_csv_writer.writerow(data)
        return
        
    def close_rd_stream(self):
        self.rd_file_handler.close()
        return
        
    def get_oh_filename(self, job_id='all'):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        fn = "%s-%s-%s.csv" % (timestr, 'operating_history', str(job_id))
        self.oh_filename = os.path.join(operating_history_data_dir, fn)
        return
        
    def open_oh_stream(self, filename=None, job_id='all'):
        file_exists = False
        if not filename:
            self.get_oh_filename(job_id=job_id)
            filename = self.oh_filename
        if os.path.isfile(filename):
            file_exists = True
        self.oh_file_handler = file(filename, 'a')
        self.oh_csv_writer = UnicodeWriter(self.oh_file_handler)
        if not file_exists:
            self.oh_csv_writer.writerow(operating_history_header)
        return
        
    def write_oh_stream(self, operating_history):
        # operating_history is a list of lists
        self.oh_csv_writer.writerows(operating_history)
        return
        
    def close_oh_stream(self):
        self.oh_file_handler.close()
        return

    def get_all_reactor_details_cols(self):
        # Get all available columns in reactor dtails
        reactor_details_cols = defaultdict(list)
        for i in range(1, self.max_pages):
            page_scraper = WNAPageScraper(i, reactor_details_cols=reactor_details_cols)
            if page_scraper.get_reactor_details_cols():
                reactor_details_cols = dict(Counter(reactor_details_cols)+Counter(page_scraper.reactor_details_cols))
                for k, v in reactor_details_cols.iteritems():
                    reactor_details_cols[k] = list(set(v))
        return reactor_details_cols
    
    def get_all_pages(self, sections=sections_scraped):
        if not isinstance(sections, list):
            sections = [sections]
        job = models.ScraperJob()
        job.job_type = "all pages"
        job.status_code = "processing"
        job.max_pages = self.max_pages
        if 'reactor details' in sections:
            self.open_rd_stream(job_id='all')
            job.filename = self.rd_filename
        if 'operating history' in sections:
            self.open_oh_stream(job_id='all')
            job.filename = self.oh_filename
        job.save()
        success_count = 0
        success_rd_count = 0
        success_oh_count = 0
        for page_number in range(1, self.max_pages):
            page_scraper = WNAPageScraper(page_number)
            ans = page_scraper.get_page()
            if ans:
                success_count += 1
                msg = []
                status_rd = True
                if 'reactor details' in sections:
                    if page_scraper.get_reactor_details():
                        self.write_rd_stream(page_scraper.reactor_details)
                        success_rd_count += 1
                    else:
                        status_rd = False
                        msg.append("Reactor details not obtained")
                status_oh = True
                if 'operating history' in sections:
                    if page_scraper.get_operating_history():
                        self.write_oh_stream(page_scraper.operating_history)
                        success_oh_count += 1
                    else:
                        status_oh = False
                        msg.append("Operating history not obtained")
                if status_rd and status_oh:
                    job.status_per_page = {'page': page_number, 'code': 'complete', 'message': 'OK'}
                else:
                    job.status_per_page = {'page': page_number, 'code': 'warning', 'message': '\n'.join(msg)}
            else:
                job.status_per_page = {'page': page_number, 'code': 'error', 'message': 'Error requesting page'}
            job.save()
        if 'reactor details' in sections:
            self.close_rd_stream()
        if 'operating history' in sections:
            self.close_oh_stream()
        job.success_count = {'type': 'all pages',         'success': success_count,    'total': self.max_pages}
        job.success_count = {'type': 'reactor details',   'success': success_rd_count, 'total': success_count}
        job.success_count = {'type': 'operating history', 'success': success_oh_count, 'total': success_count}
        pc = percentage(success_count, self.max_pages)
        if pc >= success_rate:
            job.status_code = "complete"
            job.status_message = "Success rate is %2d%%" % pc
        else:
            job.status_code = "error"
            job.status_message = "Success rate is %2d%%" % pc
        job.save()
        return
        
    def get_page(self, page_number, sections=sections_scraped):
        if not isinstance(page_number, int):
            # TODO: raise exception
            return False
        job = models.ScraperJob()
        job.job_type = "single page"
        job.status_code = "processing"
        job.max_pages = self.max_pages
        job.save()
        page_scraper = WNAPageScraper(page_number)
        ans = page_scraper.get_page()
        if ans:
            msg = []
            status_rd = True
            if 'reactor details' in sections:
                self.open_rd_stream(job_id=str(page_number))
                job.filename = self.rd_filename
                if page_scraper.get_reactor_details():
                    self.write_rd_stream(page_scraper.reactor_details)
                    job.success_count = {'type': 'reactor details', 'success': 1, 'total': 1}
                else:
                    status_rd = False
                    msg.append("Reactor details not obtained")
                    job.success_count = {'type': 'reactor details', 'success': 0, 'total': 1}
                self.close_rd_stream()
            status_oh = True
            if 'operating history' in sections:
                self.open_oh_stream(job_id=str(page_number))
                job.filename = self.oh_filename
                if page_scraper.get_operating_history():
                    self.write_oh_stream(page_scraper.operating_history)
                    job.success_count = {'type': 'operating history', 'success': 1, 'total': 1}
                else:
                    status_oh = False
                    msg.append("Operating history not obtained")
                    job.success_count = {'type': 'operating history', 'success': 0, 'total': 1}
                self.close_oh_stream()
            if status_rd and status_oh:
                job.status_per_page = {'page': page_number, 'code': 'complete', 'message': 'OK'}
            else:
                job.status_per_page = {'page': page_number, 'code': 'warning', 'message': '\n'.join(msg)}
            job.status_code = "complete"
            job.success_count = {'type': 'single page', 'success': 1, 'total': 1}
        else:
            job.status_per_page = {'page': page_number, 'code': 'error', 'message': 'Error requesting page'}
            job.status_code = "error"
            job.success_count = {'type': 'single page', 'success': 0, 'total': 1}
        job.save()
        return
