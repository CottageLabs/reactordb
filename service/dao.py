from octopus.modules.es import dao


class ScraperJobDAO(dao.ESDAO):
    __type__ = 'scraper'

    @classmethod
    def list_by_status(cls, status):
        q = ScraperStatusQuery(status)
        return cls.object_query(q.query())

    @classmethod
    def list_by_type(cls, job_type):
        q = ScraperTypeQuery(job_type)
        return cls.object_query(q.query())

    @classmethod
    def list_by_status_and_type(cls, status, job_type):
        q = ScraperStatusAndTypeQuery(status, job_type)
        return cls.object_query(q.query())

    @classmethod
    def list_all(cls):
        q = ListAllQuery()
        return cls.object_query(q.query())

    @classmethod
    def query_by_filename(cls, filename):
        return cls.object_query(terms={"filename.exact": filename})

    @classmethod
    def query_by_id(cls, job_id):
        return cls.object_query(terms={"id.exact": job_id})

    @property
    def pc_complete(self):
        # total, epmc, oag = RecordDAO.upload_completeness(self.id)
        # ec = epmc.get("T", 0.0)
        # oc = oag.get("T", 0.0)
        current = 10
        total = 2400
        if total == 0:
            # we will get a divide-by-zero error
            return 0.0    # 100% isn't right, but 0% isn't really right either
        pc = (float(current) / float(total)) * 100.0
        return pc


class ScraperStatusQuery(object):
    def __init__(self, status, size=10):
        self.status = status
        self.size = size

    def query(self):
        return {
            "query": {
                "term": {"status.code.exact": self.status}
            },
            "sort": [{"created_date": {"order": "desc"}}],
            "size": self.size
        }


class ScraperTypeQuery(object):
    def __init__(self, job_type, size=10):
        self.job_type = job_type
        self.size = size

    def query(self):
        return {
            "query": {
                "term": {"job_type.exact": self.job_type}
            },
            "sort": [{"created_date": {"order": "desc"}}],
            "size": self.size
        }


class ScraperStatusAndTypeQuery(object):
    def __init__(self, status, job_type, size=10):
        self.status = status
        self.job_type = job_type
        self.size = size

    def query(self):
        return {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"status.code.exact": self.status}},
                        {"term": {"job_type.exact": self.job_type}}
                    ]
                }
            },
            "sort": [{"created_date": {"order": "desc"}}],
            "size": self.size
        }


class ListAllQuery(object):
    def __init__(self, size=10):
        self.size = size

    def query(self):
        return {
            "query": {
                "match_all": {}
            },
            "sort": [{"created_date": {"order": "desc"}}],
            "size": self.size
        }
