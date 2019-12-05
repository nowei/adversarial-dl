import React from 'react';
import Dropdown from './Dropdown'
import Slider from 'react-input-slider';
import { Form, Button, Row, Col, Container, Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Loader from 'react-loader-spinner'

const allClasses = require('./data.json');

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
                    target: -1, 
                    eps:  (4).toFixed(1), 
                    defaultTarget:{ label: 'None', value: -1 },
                    stepSize: 0.05,
                    numSteps: 10,
                    loading: false
                };
        this._handleImageChange = this._handleImageChange.bind(this);
        this._handleSubmit = this._handleSubmit.bind(this);
        this._handleEpsilonInput = this._handleEpsilonInput.bind(this);
    }

    _handleImageChange(e) {
        e.preventDefault();

        let reader = new FileReader();
        let file = e.target.files[0];

        reader.onloadend = () => {
            this.setState({
                file: file,
                imagePreviewUrl: reader.result,
                adv_image: null
            });
        }

        if (file) {
            reader.readAsDataURL(file)
        }
    }

    _handleEpsilonInput(e) {
        e.preventDefault();
        if (e.target.value) {
            var eps = parseFloat(e.target.value)
            eps = Math.min(Math.max(0, eps), 255)
            this.setState({ eps: eps.toFixed(1) })
        } else {
            this.setState({ eps: (4).toFixed(1) })
        }
    }

    _handleSubmit(e) {
        e.preventDefault();
        this.setState({loading: true})
        this.upload().then(data => this.setState({...data, loading: false})).catch(() => this.setState({loading: false}));
    }

    async upload() {
        const formData = {
            content: this.state.imagePreviewUrl,
            epsilon: (this.state.eps / 255),
            target: this.state.target,
            step_size: this.state.stepSize,
            num_steps: this.state.numSteps
        };

        console.error(formData)

        const options = {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            }
        };

        const response = await fetch('http://127.0.0.1:5000/images', options);
        const responseData = await response.json()
        return responseData;
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

        const {adv_image} = this.state;
        let $imagePrevDisp = null;
        let $originalClass = null;
        let $adversarialClass = null;
        if (adv_image) {
            $imagePrevDisp = (
                    <div className="imgPreview">
                        <img src={adv_image} alt={'Error in rendering uploaded pic'}/>
                    </div>
            )
            const initClass = this.state.init_pred.map((key, index) => <li key={key}>{allClasses[key] + ' '} <b>{(100 * this.state.init_prob[index]).toFixed(2) + '%'}</b></li>);

            $originalClass = (
                <ol>
                {initClass}
                </ol>
            )

            const advClass = this.state.adv_pred.map((key, index) => <li key={key}>{allClasses[key] + ' '} <b>{(100 * this.state.adv_prob[index]).toFixed(2) + '%'}</b></li>);

            $adversarialClass = (
                <ol>
                {advClass}
                </ol>
            )
            $imagePreview = (
                <div className="imgPreview">
                    <img src={this.state.orig_image} alt={'Error in rendering uploaded pic'}/>
                </div>
            )
        }

        return (
            <div>
                <Navbar bg="dark" variant="dark">
                    <Navbar.Brand href="#home">
                    <b>Neural Networks, They Just (Don't) Work</b>
                    </Navbar.Brand>
                </Navbar>
                <Container>
                    <Row className="justify-content-md-center">
                        <Col lg={4}>
                            <Form>
                                <Form.Group>
                                    <Form.Label><b>Please upload an image:</b></Form.Label>
                                    <Form.Control type="file" placeholder="" accept="image/jpeg,image/jpg" onChange={this._handleImageChange}/>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label><b>Please select a target:</b></Form.Label>
                                    <Dropdown onChange={(option) => this.setState({ target: option.value })} defaultValue={this.state.defaultTarget}/>
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label><b>{'Please select perturbation constant:'}</b><br/>{this.state.eps + '/255'}</Form.Label>
                                    <br/>
                                    <Form.Control type="number" min="0" max="255" step="0.5" placeholder={this.state.eps} 
                                            onChange={this._handleEpsilonInput}/>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label><b>{'Please select step size: '}</b><br/>{this.state.stepSize}</Form.Label>
                                    <br/>
                                    <Slider
                                        axis="x"
                                        xstep={0.05}
                                        xmin={0.05}
                                        xmax={5}
                                        x={this.state.stepSize}
                                        onChange={({ x }) => this.setState({ stepSize: parseFloat(x.toFixed(2)).toFixed(2) })}
                                        />
                                </Form.Group>

                                <Form.Group>
                                    <Form.Label><b>{'Please select total number of steps: '}</b><br/>{this.state.numSteps}</Form.Label>
                                    <br/>
                                    <Slider
                                        axis="x"
                                        xstep={1}
                                        xmin={1}
                                        xmax={25}
                                        x={this.state.numSteps}
                                        onChange={({ x }) => this.setState({ numSteps: parseInt(x) })}
                                        />
                                </Form.Group>

                                <Button variant="primary" type="submit" onClick={this._handleSubmit} disabled={!this.state.file}>
                                    Submit
                                </Button>
                            </Form>
                        </Col>
                        <Col lg={8} hidden={!this.state.loading}>
                            <Loader
                                className="loader"
                                type="MutatingDots"
                                color="#007bff"
                                height={100}
                                width={100}
                                visible={this.state.loading}
                                />
                        </Col>
                        <Col lg={4} hidden={this.state.loading}>
                                {$imagePreview}
                                {$originalClass}
                        </Col>
                        <Col lg={4} hidden={this.state.loading}>
                                {$imagePrevDisp}
                                {$adversarialClass}
                        </Col>
                    </Row>
                </Container>
            </div>
        )
    }
}
export default App;