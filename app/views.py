from app import app

@app.route('/')
@app.route('/index')
def index():
    return "Hello, World!"

@app.errorhandler(404)
def page_not_found(error):
    return 'This page does not exist', 404

#@app.errorhandler(DatabaseError)
#def special_exception_handler(error):
#    return 'Database connection failed', 500

@app.route('/draw')
def poop():
    return app.send_static_file('draw.html')


if __name__ == '__main__':
    app.debug = True
    app.run()
