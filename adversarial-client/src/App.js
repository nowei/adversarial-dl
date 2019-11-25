import React from 'react';
import Dropdown from './Dropdown'
import Slider from 'react-input-slider';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
 
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
                    target: -1, eps:  (4).toFixed(1), 
                    defaultTarget:{ label: 'None', value: -1 }};
        this._handleImageChange = this._handleImageChange.bind(this);
        this._handleSubmit = this._handleSubmit.bind(this);
    }

    _handleImageChange(e) {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];

        reader.onloadend = () => {
            this.setState({
                file: file,
                imagePreviewUrl: reader.result
            });
        }

        reader.readAsDataURL(file)
    }

    _handleSubmit(e) {
        e.preventDefault();
        // this.upload().then(data => this.setState({imagePrev: data.content}));

        this.upload().then(data => console.log(data));
    }

    async upload() {
        const formData = {
            content: this.state.imagePreviewUrl,
            epsilon: this.state.eps,
            target: this.state.target
        };

        const options = {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            }
        };

        console.warn(options)

        const response = await fetch('http://127.0.0.1:5000/images', options);
        const responseData = await response.json()
        return responseData;
    }

    async getDataAsync(name) {
        let response = await fetch(`https://api.github.com/users/${name}`);
        let data = await response.json()
        return data;
    }

    render() {
        const {imagePreviewUrl} = this.state;
        let $imagePreview = null;
        if (imagePreviewUrl) {
            $imagePreview = (
                    <div className="imgPreview">
                        <img src={imagePreviewUrl} alt={'Error in rendering uploaded pic'}/>
                    </div>
            )
        }

        const {imagePrev} = this.state;
        let $imagePrevDisp = null;
        if (imagePrev) {
            $imagePrevDisp = (
                    <div className="imgPreview">
                        <img src={imagePrev} alt={'Error in rendering uploaded pic'}/>
                    </div>
            )
        }

        return (
            <div>
                <Container>
                    <Row>
                        <Form>
                            <Form.Group>
                                <Form.Label>Please upload an image:</Form.Label>
                                <Form.Control type="file" placeholder="" accept="image/jpeg,image/jpg" onChange={this._handleImageChange}/>
                            </Form.Group>

                            <Form.Group>
                                {/* <Form.Label>{'Please select a target: ' + this.state.target}</Form.Label> */}
                                <Form.Label>Please select a target:</Form.Label>
                                <Dropdown onChange={(option) => this.setState({ target: option.value })} defaultValue={this.state.defaultTarget}/>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>{'Please select perturbation contant: ' + this.state.eps + '/255'}</Form.Label>
                                <br/>
                                <Slider
                                    axis="x"
                                    xstep={0.5}
                                    xmin={0} // TODO: change to 1
                                    xmax={15}
                                    x={this.state.eps}
                                    onChange={({ x }) => this.setState({ eps: parseFloat(x.toFixed(1)).toFixed(1) })}
                                    />
                            </Form.Group>

                            <Button variant="primary" type="submit" onClick={this._handleSubmit}>
                                Submit
                            </Button>
                        </Form>
                    </Row>
                    <Row>
                        {$imagePreview}
                    </Row>
                    <Row>
                        {$imagePrevDisp}
                    </Row>
                </Container>
            </div>
        );
    }
}
export default App;