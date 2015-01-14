# apil-web

## How to run the app
## Install `virtualenv` for python 2.7.x

`pip install virtualenv --python=python2.7`

## Create a virtual environment

From the project directory, `virtualenv apil_env`
## Activate the virtual environment
### 1) Activating the python virtual environment  

From the project directory, `source apil_env/bin/activate`

### 2) Installing the project dependencies

After activating the vm, make sure you have all of the necessary dependencies installed.  type `pip install -r requirements.txt`

### 3) Run the web app locally

``

### 4) Adding dependencies

Install a new package:  

`pip install <some package name here>`

Update `requirements.txt`:  
`pip freeze > requirements.txt`

Be careful not to add unnecessary dependencies to `requirements.txt`
## Exiting the virtual environment

`deactivate`
