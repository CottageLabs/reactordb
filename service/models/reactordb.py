from service.dao import ScraperJobDAO
from octopus.lib.dataobj import DataObj
from config.wnaConfig import sections_scraped


class ScraperJob(ScraperJobDAO, DataObj):
    """
    {
        "id" : "<opaque identifier for upload>",
        "created_date" : "<date scraping job was requested>",
        "filename" : [
            "<names of files created by page scraper>",
        ],
        "status" : {
            "code" : "<current status of the processing job>",
            "message" : "<message for the user associated with the status>"
        },
        "status_per_page" : [
            {
                "page": "<page number>",
                "code" : "<current status of the processing job>",
                "message" : "<message for the user associated with the status>"
            }
        ],
        "job_type": "<type of job>",
        "max_pages" : "<largest page number to scrape>",
        "success_count" : [
            {
                "type" : "<type of count>",
                "success" : "<number of successful jobs>",
                "total" : "<total number of jobs>"
            }
        ],
    }
    """

    STATUS_CODES = [u"submitted", u"processing", u"complete", u"error"]

    PAGE_STATUS_CODES = [u"complete", u"error", "warning"]

    JOB_TYPES = [u"single page", u"all pages"]

    SUCCESS_COUNT_TYPE = ["pages"]
    SUCCESS_COUNT_TYPE.extend(sections_scraped)

    @property
    def job_id(self):
        return self._get_single("id", self._utf8_unicode())

    @property
    def filename(self):
        return self._get_list("filename", self._utf8_unicode())

    @filename.setter
    def filename(self, val):
        self._add_to_list("filename", val, self._utf8_unicode())

    @property
    def status_code(self):
        return self._get_single("status.code", self._utf8_unicode())

    @status_code.setter
    def status_code(self, val):
        self._set_single("status.code", val, self._utf8_unicode(), allowed_values=self.STATUS_CODES)

    @property
    def status_message(self):
        return self._get_single("status.message", self._utf8_unicode())

    @status_message.setter
    def status_message(self, val):
        self._set_single("status.message", val, self._utf8_unicode())

    @property
    def status_per_page(self):
        objs = self._get_list("status_per_page")
        return [{"page": o.get("page", None),
                 "code": o.get("code", None),
                 "message": o.get("message", None)
                 } for o in objs]

    @status_per_page.setter
    def status_per_page(self, val):
        self._add_to_list("status_per_page", val)

    @property
    def job_type(self):
        return self._get_single("job_type", self._utf8_unicode())

    @job_type.setter
    def job_type(self, val):
        self._set_single("job_type", val, self._utf8_unicode(), allowed_values=self.JOB_TYPES)

    @property
    def max_pages(self):
        return self._get_single("max_pages", self._utf8_unicode())

    @max_pages.setter
    def max_pages(self, val):
        self._set_single("max_pages", val, self._utf8_unicode())

    @property
    def success_count(self):
        objs = self._get_list("success_count")
        return [{"type": o.get("type", None),
                 "success": o.get("success", None),
                 "total": o.get("total", None)
                 } for o in objs]

    @success_count.setter
    def success_count(self, val):
        self._add_to_list("success_count", val)

    @property
    def webhook_callback(self):
        return self._get_single("webhook_callback", self._utf8_unicode())

    @webhook_callback.setter
    def webhook_callback(self, val):
        self._set_single("webhook_callback", val, self._utf8_unicode(), ignore_none=True)
