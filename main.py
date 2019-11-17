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

# @app.route('/generate_new_noise')
def generate_noise(width=32, height=32, scale=50/255):
    image = Image.new("RGB", (width, height), 255)
    random_grid = [*map(lambda x: (int((random() * 2 - 1) * 256 * scale), int((random() * 2 - 1) * 256 * scale), int((random() * 2 - 1) * 256 * scale)) , [0] * width * height)]
    image.putdata(random_grid)
    print(random_grid)
    return image
    # return random_grid

# background process happening without any refreshing
@app.route('/background_process_test')
def background_process_test():
    print("Hello")
    return render_template('blank.html')

if __name__ == "__main__":
    image = Image.open('pictures/husky.jpg')
    width, height = image.size
    noise = generate_noise(width, height).load()
    img = image.load()
    for x in range(image.size[0]):
        for y in range(image.size[1]):
            r, g, b = img[x, y]
            r_a, g_a, b_a = noise[x, y]
            r += r_a 
            g += g_a
            b += b_a
            if r < 0: r = 0
            if g < 0: g = 0
            if b < 0: b = 0
            if r > 255: r = 255
            if g > 255: g = 255
            if b > 255: b = 255
            
            img[x, y] = (r, g, b)
    image.save('henlo.jpg', format='JPEG')
    # app.run(debug=True, host='0.0.0.0')
