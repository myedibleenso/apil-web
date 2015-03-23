from flask import render_template, flash, redirect, session, url_for, request, g, make_response, send_file, send_from_directory, Response
import os
import logging
#from flask.ext.login import login_user, logout_user, current_user, login_required
from app import app, db
from .forms import LoginForm
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

@app.route('/draw')
def trace():
    return render_template('draw.html',
                           title='Trace')

@app.route('/trace-data', methods = ['POST'])
def dump_data():
    print "in function..."
    print request
    #data = request.json['data']
    data = request.data
    app.logger.info("REQUEST: {}".format(request))
    print "DATA: {0}".format(data)
    file_name = 'traces.json'
    # Can't just
    file_path = os.path.join(UPLOADS_DIR, file_name)
    app.logger.info(file_path)
    with open(file_path,"wb") as out:
        out.write(data)
    app.logger.info("returning response...")
    return 'downloads/{0}'.format(file_name)


@app.route('/downloads/<filename>')
def serve_file(filename):
    return Response(open(os.path.join(UPLOADS_DIR, filename), 'rb').read(),
                       mimetype="text/plain",
                       headers={"Content-Disposition":
                                    "attachment;filename={0}".format(filename)})

if __name__ == '__main__':
    app.debug = True
    app.run()
