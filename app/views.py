from app import app

@app.route('/')
@app.route('/index')
def index():
    return "Hello, World!"

@app.route('/draw')
def poop():
    return app.send_static_file('draw.html')
