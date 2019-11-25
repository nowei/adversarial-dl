#!flask/bin/python
from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

tasks = [
    {
        'id': 1,
        'picName': u'Buy groceries',
        'content': u'Milk, Cheese, Pizza, Fruit, Tylenol',
        'epsilon': 0.003,
        'target': 512,
        'done': False
    },
    {
        'id': 2,
        'picName': u'python',
        'content': u'Need to find a good Python tutorial on the web',
        'epsilon': 0.003,
        'target': 512,
        'done': True
    }
]


@app.route('/images', methods=['GET'])
def get_tasks():
    name = request.args.get("name")
    task = [task for task in tasks if task['picName'] == name]
    if len(task) != 0:
        return jsonify(task)
    return jsonify({'tasks': tasks})


@app.route('/images', methods=['POST'])
def create_task():
    print(request.json)
    if not request.json or 'picName' not in request.json or 'content' not in request.json:
        abort(400)
    task = {
        'id': tasks[-1]['id'] + 1,
        'picName': request.json['picName'],
        'content': request.json['content'],
        'epsilon': request.json.get("epsilon", 0.003),
        'target': request.json.get("target", -1),
        'ogClass': -1,
        'adClass': -1,
        'rbClass': -1,
        'done': False
    }
    tasks.append(task)
    return jsonify({'task': task}), 201


@app.route('/check', methods=['GET'])
def delete_task():
    name = request.args.get("name")
    task = [task for task in tasks if task['picName'] == name]
    if len(task) == 0:
        return jsonify({'result': False})
    return jsonify({'result': task[0]['done']})


if __name__ == '__main__':
    app.run(debug=True)
