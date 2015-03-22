from flask import Flask
import os
from config import basedir
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.script import Manager
from flask.ext.bootstrap import Bootstrap



app = Flask(__name__)
app.debug = True

app.config.from_object('config')

manager = Manager(app)
bootstrap = Bootstrap(app)
db = SQLAlchemy(app)


from app import views, models # avoid circular references
