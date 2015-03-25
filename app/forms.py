from flask.ext.wtf import Form
from wtforms import StringField, SubmitField, HiddenField
from wtforms.validators import Required

class TraceForm(Form):
    name = StringField('Tracer ID', id='tracer', validators=[Required()])
    subject = StringField('Subject', id='subject')
    project_id = StringField('Project ID', id='project', validators=[Required()])
    data = HiddenField(id='trace-data')
    roi = HiddenField(id='roi-data')
    submit = SubmitField('Get traces', id='dump-traces')
