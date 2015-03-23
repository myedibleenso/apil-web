#!apil_env/bin/python
from app import app
import os, sys, logging
#from logging.handlers import RotatingFileHandler

logging.basicConfig(stream=sys.stderr)

#get path to app folder
#app_home = os.path.dirname(os.path.abspath(__file__))
#activate_this = app_home + '/apil_env/bin/activate_this.py'
#print "activate this: {0}".format(activate_this)
#execfile(activate_this, dict(__file__=activate_this))

if __name__ == '__main__':
    #handler = RotatingFileHandler('apil.log', maxBytes=10000, backupCount=1)
    #handler.setLevel(logging.INFO)
    #app.logger.addHandler(handler)
    app.debug = True
    #app.run(host="0.0.0.0", port=8080)
    app.run()
