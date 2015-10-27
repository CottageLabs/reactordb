# Description

This is a Python app running on an Elasticsearch datastore back-end.

# Hardware

2GB RAM and 2 or more cores (virtual is ok) to keep Elasticsearch happy should be plenty. Disc space should be negligible, only requirement is that the disk isn't completely full, so e.g. 500 MB should be enough.

# Software requirements

- Elasticsearch 1.4.4 
- Python 2.7
- Elasticsearch itself requires Java 7 or 8 (preferably Oracle's) to run.
- Something to keep it running: Supervisor is common (a Python-based daemon for keeping apps running, retrying on failure and directing stdout/stderr to files). It is best to install that via pip ( http://supervisord.org/installing.html#installing-via-pip ) as packaged versions lag by several years.
- Dedicated WSGI web server in production. gunicorn (pip install gunicorn) is a common choice.
- Finally, something to respond to HTTP requests is needed. A recent-ish version of nginx forwarding locally to gunicorn is again very common though Apache can be used as well - just forward to 127.0.0.1:5050 (or whatever the gunicorn port has been set to when running the app)

