import sys
from setuptools import setup, find_packages

setup(
    name = 'reactordb',
    version = '1.0.0',
    packages = find_packages(),
    install_requires = [
        "octopus==1.0.0",
        "esprit",
        "Flask",
        "beautifulsoup4"
    ]  + (["setproctitle", "gunicorn"] if "linux" in sys.platform else []),
    url = 'http://cottagelabs.com/',
    author = 'Cottage Labs',
    author_email = 'us@cottagelabs.com',
    description = 'World Nuclear Association Reactor Database',
    classifiers = [
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Software Development :: Libraries :: Python Modules'
    ]
)
