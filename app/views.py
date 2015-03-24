from flask import render_template, flash, redirect, session, url_for, request, g, make_response, send_file, send_from_directory, Response, Markup
import os
import logging
import json
#from flask.ext.login import login_user, logout_user, current_user, login_required
from app import app, db
from .forms import TraceForm
from .models import User
from config import basedir

UPLOADS_DIR = os.path.join(basedir, app.config['UPLOAD_FOLDER'])

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html',
                           title='Welcome')

@app.errorhandler(404)
def page_not_found(error):
    return 'This page does not exist', 404

#@app.errorhandler(DatabaseError)
#def special_exception_handler(error):
#    return 'Database connection failed', 500

@app.route('/draw', methods = ['GET', 'POST'])
def trace():
    # trace set meta data
    form = TraceForm()
    if request.method == 'POST' and form.validate():
        form = request.form

        #we'll write json
        try:
            data = json.loads(form['data'])
            app.logger.info("{0} traces found.".format(len(data)))
        except:
            data = dict()
            app.logger.error("No traces found!")

        num_files = len(data)

        data['tracer-id'] = form['name']
        data['subject-id'] = form['subject']
        data['project-id'] = form['project_id']

        flash("Got {0}'s {1} trace data for {2} files!".format(data['subject-id'], data['project-id'], num_files))

        return Response(json.dumps(data),
                           mimetype="text/plain",
                           headers={"Content-Disposition":
                                        "attachment;filename={0}".format('traces.json')})
    #must be a GET...
    return render_template('draw.html',
                           title='Trace', form=form)


@app.route('/downloads/<filename>')
def serve_file(filename):
    return Response(open(os.path.join(UPLOADS_DIR, filename), 'rb').read(),
                       mimetype="text/plain",
                       headers={"Content-Disposition":
                                    "attachment;filename={0}".format(filename)})

if __name__ == '__main__':
    app.debug = True
    app.run()
