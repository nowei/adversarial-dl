#!flask/bin/python
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import torch
from PIL import Image
from io import BytesIO
import base64
from torchvision import transforms
import torch.nn.functional as F
import torch
import torch.nn as nn

app = Flask(__name__)
CORS(app)

loss_fn = nn.CrossEntropyLoss()

model = torch.hub.load('pytorch/vision:v0.4.2', 'resnet18', pretrained=True)
model.eval()
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
trans = transforms.ToPILImage()
use_cuda = False
device = torch.device("cuda" if use_cuda else "cpu")

with open('imagenet1000_clsidx_to_labels.txt', 'r') as f:
    classes = eval(f.read())


def proj_grad_desc(x, y, model, step_size=0.05, epsilon=4 * 1/255, steps=50, target=None):
    adversary = x.clone().detach().requires_grad_(True).to(x.device)
    max_diff = x + epsilon
    min_diff = x - epsilon
    for i in range(steps):
        curr = adversary.clone().detach().requires_grad_(True).to(adversary.device)
        output = model(curr)
        loss = loss_fn(output, target if target else y)
        loss.backward()
        with torch.no_grad():
            curr_grad = curr.grad * step_size 
            if target:
                adversary -= curr_grad
            else:
                adversary += curr_grad
        adversary = torch.max(torch.min(adversary, max_diff), min_diff)
    return adversary.detach()

@app.route('/images', methods=['GET'])
def get_tasks():
    name = request.args.get("name")
    task = [task for task in tasks if task['picName'] == name]
    if len(task) != 0:
        return jsonify(task)
    return jsonify({'tasks': tasks})

@app.route('/images', methods=['POST'])
def create_task():
    # print(request.json)
    if not request.json or 'content' not in request.json:
        abort(400)
    # parses request
    content = request.json['content']
    epsilon = float(request.json['epsilon'])
    target = torch.tensor([int(request.json['target'])]) if request.json['target'] != -1 else None
    content = Image.open(BytesIO(base64.b64decode(content.split(',',1)[1]))) # TODO: Something goes here
    # content.save('test.jpg')
    json_obj = {}
    
    # Gets initial prediction on image
    input_tensor = preprocess(content).unsqueeze(0)
    output = model(input_tensor)
    prob_dist = torch.nn.functional.softmax(output[0], dim=0)
    init_prob, init_pred = prob_dist.topk(5)
    json_obj['init_prob'] = init_prob.tolist()
    json_obj['init_pred'] = init_pred.tolist()
    best_label = torch.tensor([init_pred[0]])
    
    # Getting adversarial image
    adv = proj_grad_desc(input_tensor, best_label, model, epsilon=epsilon, target=target)

    # Getting prediction on adversarial image
    output = model(adv)
    prob_dist = torch.nn.functional.softmax(output[0], dim=0)
    adv_prob, adv_pred = prob_dist.topk(5)
    json_obj['adv_prob'] = adv_prob.tolist()
    json_obj['adv_pred'] = adv_pred.tolist()

    adv[:, 0, :, :] = (adv[:, 0, :, :] - 0.485) / 0.229
    adv[:, 1, :, :] = (adv[:, 1, :, :] - 0.456) / 0.224 
    adv[:, 2, :, :] = (adv[:, 2, :, :] - 0.406) / 0.225

    byteArr = io.BytesIO()
    trans(adv.to('cpu')[0]).save(byteArr, format='JPEG')

    json_obj['content'] = byteArr.getvalue()
    # output = robust_model(adv)
    # prob_dist = torch.nn.functional.softmax(output[0], dim=0)
    # robust_prob, robust_pred = prob_dist.topk(5)
    # json_obj['robust_prob'] = robust_prob.tolist()
    # json_obj['robust_pred'] = robust_pred.tolist()

    json_obj

    return jsonify(json_obj), 201

if __name__ == '__main__':
    app.run(debug=True)
