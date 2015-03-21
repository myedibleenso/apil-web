from flask import render_template, flash, redirect, session, url_for, request, g
#from flask.ext.login import login_user, logout_user, current_user, login_required
from app import app, db
from .forms import LoginForm
from .models import User


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


if __name__ == '__main__':
    app.debug = True
    app.run()
