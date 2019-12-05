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
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('agg')

app = Flask(__name__)
CORS(app)

loss_fn = nn.CrossEntropyLoss()

model = torch.hub.load('pytorch/vision:v0.4.2', 'resnet34', pretrained=True)
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
    # actual_prob = []
    # target_prob = []
    # iters = []
    for i in range(steps + 1):
        curr = adversary.clone().detach().requires_grad_(True).to(adversary.device)
        output = model(curr)
        loss = loss_fn(output, target if target else y)
        prob_dist = torch.nn.functional.softmax(output[0], dim=0)
        # actual_prob.append(prob_dist[y].item())
        # target_prob.append(prob_dist[target].item())
        # iters.append(i)

        loss.backward()
        with torch.no_grad():
            curr_grad = curr.grad * step_size 
            if target:
                adversary -= curr_grad
            else:
                adversary += curr_grad
        adversary = torch.max(torch.min(adversary, max_diff), min_diff)
    # plt.plot(iters, actual_prob, 'g-.', label='actual class: ' + classes[y.item()])
    # plt.plot(iters, target_prob, 'r-.',label='targeted class: ' + classes[target.item()])
    # plt.xlabel('step number')
    # plt.ylabel('% classification')
    # plt.legend(loc="upper left")
    # plt.savefig('analysis.png')
    return adversary.detach()

@app.route('/images', methods=['POST'])
def create_task():
    # print(request.json)
    if not request.json or 'content' not in request.json:
        abort(400)
    # parses request
    content = request.json['content']
    epsilon = float(request.json['epsilon'])
    step_size = float(request.json['step_size'])
    num_steps = int(request.json['num_steps'])
    target = int(request.json['target'])
    target = torch.tensor([target]) if target != -1 else None
    content = Image.open(BytesIO(base64.b64decode(content.split(',',1)[1])))
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
    adv = proj_grad_desc(input_tensor, best_label, model, step_size=step_size, epsilon=epsilon, steps=num_steps, target=target)

    input_tensor[:, 0, :, :] = input_tensor[:, 0, :, :] * 0.229 + 0.485
    input_tensor[:, 1, :, :] = input_tensor[:, 1, :, :] * 0.224 + 0.456
    input_tensor[:, 2, :, :] = input_tensor[:, 2, :, :] * 0.225 + 0.406
    byteArr = BytesIO()
    trans(input_tensor.to('cpu')[0]).save(byteArr, format='JPEG')
    json_obj['orig_image'] = ('data:image/format;base64,' + base64.b64encode(byteArr.getvalue()).decode('ascii'))

    # Getting prediction on adversarial image
    output = model(adv)
    prob_dist = torch.nn.functional.softmax(output[0], dim=0)
    adv_prob, adv_pred = prob_dist.topk(5)
    json_obj['adv_prob'] = adv_prob.tolist()
    json_obj['adv_pred'] = adv_pred.tolist()

    adv[:, 0, :, :] = adv[:, 0, :, :] * 0.229 + 0.485
    adv[:, 1, :, :] = adv[:, 1, :, :] * 0.224 + 0.456
    adv[:, 2, :, :] = adv[:, 2, :, :] * 0.225 + 0.406

    byteArr = BytesIO()
    trans(adv.to('cpu')[0]).save(byteArr, format='JPEG')

    content = ('data:image/format;base64,' + base64.b64encode(byteArr.getvalue()).decode('ascii'))

    json_obj['adv_image'] = content
    # output = robust_model(adv)
    # prob_dist = torch.nn.functional.softmax(output[0], dim=0)
    # robust_prob, robust_pred = prob_dist.topk(5)
    # json_obj['robust_prob'] = robust_prob.tolist()
    # json_obj['robust_pred'] = robust_pred.tolist()

    return jsonify(json_obj), 200

if __name__ == '__main__':
    app.run(debug=False)
