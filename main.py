from flask import render_template, Flask, request, Response
import io
from PIL import Image
import base64
from random import random
app = Flask(__name__)
@app.route('/', methods=['POST', 'GET'])
def UI_display(name=None):
    # How to load an image without saving it:
    # https://www.reddit.com/r/flask/comments/9hin2q/af_how_to_use_render_template_with_pil_image/
    image_io = io.BytesIO()
    image = Image.open('pictures/pands.jpg')
    image.save(image_io, format='JPEG')
    image_en = base64.b64encode(image_io.getvalue())

    noise_io = io.BytesIO()
    noise = generate_noise()
    noise.save(noise_io, format='JPEG')
    noise_en = base64.b64encode(noise_io.getvalue())

    return render_template('landing.html', image=image_en.decode('ascii'), noise=noise_en.decode('ascii'))

def generate_noise(width=256, height=256):
    image = Image.new("RGB", (width, height), 255)
    random_grid = list(map(lambda x: (int(random() * 256), int(random() * 256), int(random() * 256)), [0] * width * height))
    image.putdata(random_grid)
    return image

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')

