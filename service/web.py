from multiprocessing import Process
import os
import json
import time
from octopus.core import app, initialise, add_configuration
from octopus.lib.webapp import jsonp
from flask import Flask, request, abort, render_template, redirect, make_response, jsonify, send_file, \
    send_from_directory, url_for
from wtforms import Form, IntegerField, HiddenField, validators
from service.lib.pageScraper import scrape_all_pages, scrape_page
from service.lib.importer import import_reactordb
from service import models

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--debug", action="store_true", help="pycharm debug support enable")
    parser.add_argument("-c", "--config", help="additional configuration to load (e.g. for testing)")
    args = parser.parse_args()

    if args.config:
        add_configuration(app, args.config)

    pycharm_debug = app.config.get('DEBUG_PYCHARM', False)
    if args.debug:
        pycharm_debug = True

    if pycharm_debug:
        app.config['DEBUG'] = False
        import pydevd
        pydevd.settrace(app.config.get('DEBUG_SERVER_HOST', 'localhost'), port=app.config.get('DEBUG_SERVER_PORT', 51234), stdoutToServer=True, stderrToServer=True)
        print "STARTED IN REMOTE DEBUG MODE"

    initialise()

# most of the imports should be done here, after initialise()
from flask import render_template
from octopus.lib.webapp import custom_static


class ScrapePageForm(Form):
    page_number = IntegerField('page_number', validators=[validators.DataRequired()])
    prefix = HiddenField('prefix', validators=[])


class ScrapeAllForm(Form):
    max_page_number = IntegerField('max_page_number', validators=[validators.DataRequired()])
    prefix = HiddenField('prefix', validators=[])


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config["ALLOWED_EXTENSIONS"]


@app.route("/", methods=['GET', 'POST'])
def index():
    # form_page = ScrapePageForm(request.form, prefix="page")
    # form_all = ScrapePageForm(request.form, prefix="all")
    form_page = ScrapePageForm(request.form)
    form_all = ScrapeAllForm(request.form)
    if request.method == "POST":
        if request.form['prefix'] == 'page' and form_page.validate():
            page_number = form_page.page_number.data
            # Start multiprocess
            Process(target=scrape_page, args=(page_number,)).start()
        elif request.form['prefix'] == 'all' and form_all.validate():
            max_page_number = form_all.max_page_number.data
            # Start multiprocess
            Process(target=scrape_all_pages, args=(max_page_number,)).start()
    job = models.ScraperJob()
    jobs = job.list_all()
    return render_template("index.html", form_page=form_page, form_all=form_all, jobs=jobs)


@app.route("/download/<job_id>/<filename>")
def download_file(job_id, filename):
    job = models.ScraperJob.pull(job_id)
    for fp, fn in job.filename:
        if fn == filename:
            return send_from_directory(os.path.abspath(fp), fn, as_attachment=True, attachment_filename=filename)
    abort(404)


@app.route("/progress/<job_id>")
def progress(job_id):
    job = models.ScraperJob.pull(job_id)
    return render_template("progress.html", job=job)


@app.route("/progress/<job_id>/status")
@jsonp
def status(job_id):
    job = models.ScraperJob.pull(job_id)
    if not job:
        abort(404)
    obj = job.progress2json
    resp = make_response(json.dumps(obj))
    resp.mimetype = "application/json"
    return resp


@app.route("/list_scraper_jobs")
@jsonp
def list_scraper_jobs():
    job = models.ScraperJob()
    jobs = job.list_all()
    ans = render_template("list_scraper_jobs.html", jobs=jobs)
    resp = make_response(json.dumps(ans))
    resp.mimetype = "application/json"
    return resp


@app.route("/upload", methods=['GET', 'POST'])
def upload():
    msg = None
    valid_file_master = False
    valid_file_pris = False
    valid_file_history = False
    if request.method == "POST":
        timestr = time.strftime("%Y%m%d-%H%M%S")
        upload_dir = app.config.get("UPLOAD_DIR")
        file_master = request.files["upload_master"]
        if file_master and allowed_file(file_master.filename):
            # save the file
            master_path = os.path.join(upload_dir, "%s-%s.csv" % (timestr, 'master'))
            file_master.save(master_path)
            valid_file_master = True
        file_pris = request.files["upload_pris"]
        if file_pris and allowed_file(file_pris.filename):
            # save the file
            pris_path = os.path.join(upload_dir, "%s-%s.csv" % (timestr, 'reactor_details'))
            file_pris.save(pris_path)
            valid_file_pris = True
        file_history = request.files["upload_history"]
        if file_history and allowed_file(file_history.filename):
            # save the file
            history_path = os.path.join(upload_dir, "%s-%s.csv" % (timestr, 'operating_history'))
            file_history.save(history_path)
            valid_file_history = True
        if valid_file_master and valid_file_pris and valid_file_history:
            msg = "Data import from spreadsheets started successfully"
            # Start multiprocess
            Process(target=import_reactordb, args=(master_path, pris_path, history_path)).start()

    return render_template("upload_csv.html", msg=msg, valid_file_master=valid_file_master, \
                           valid_file_pris=valid_file_pris, valid_file_history=valid_file_history)


@app.route("/docs")
def docs():
    return render_template("docs.html")

######################################################
## All the preview pages

@app.route("/preview_dashboard")
def preview_dashboard():
    return render_template("preview_dashboard.html")

@app.route("/preview_search")
def preview_search():
    return render_template("preview_search.html")

@app.route("/preview_reactor")
@app.route("/preview_reactor/<reactor_id>")
def preview_reactor(reactor_id=None):
    return render_template("preview_reactor.html", map_key=app.config.get("GOOGLE_MAP_API_KEY"), reactor_id=reactor_id)

@app.route("/preview_country")
@app.route("/preview_country/<country_id>")
def preview_country(country_id=None):
    return render_template("preview_country.html", map_key=app.config.get("GOOGLE_MAP_API_KEY"), country_id=country_id)


#######################################################


#######################################################
## All the "live" pages

@app.route("/live_dashboard")
def live_dashboard():
    return render_template("live_dashboard.html")

@app.route("/live_search")
def live_search():
    return render_template("live_search.html")

@app.route("/live_reactor")
@app.route("/live_reactor/<reactor_id>")
def live_reactor(reactor_id=None):
    return render_template("live_reactor.html", map_key=app.config.get("GOOGLE_MAP_API_KEY"), reactor_id=reactor_id)

@app.route("/live_country")
@app.route("/live_country/<country_id>")
def live_country(country_id=None):
    return render_template("live_country.html", map_key=app.config.get("GOOGLE_MAP_API_KEY"), country_id=country_id)


#######################################################

# this allows us to override the standard static file handling with our own dynamic version
@app.route("/static/<path:filename>")
def static(filename):
    return custom_static(filename)

# this allows us to serve our standard javascript config
from octopus.modules.clientjs.configjs import blueprint as configjs
app.register_blueprint(configjs)

from octopus.modules.es.query import blueprint as query
app.register_blueprint(query, url_prefix="/query")

from octopus.modules.es.rolling import blueprint as rolling
app.register_blueprint(rolling, url_prefix="/rolling")


@app.errorhandler(404)
def page_not_found(e):
    return render_template('errors/404.html'), 404


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=app.config['DEBUG'], port=app.config['PORT'], threaded=False)
