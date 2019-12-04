import React from 'react';
import Dropdown from './Dropdown'
import Slider from 'react-input-slider';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
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

        reader.readAsDataURL(file)
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
                <Container>
                    <Row>
                        <Col sm='true'>
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
                                    <Form.Label>{'Please select perturbation constant:'}<br/><b>{this.state.eps + '/255'}</b></Form.Label>
                                    <br/>
                                    <Slider
                                        axis="x"
                                        xstep={0.5}
                                        xmin={0} // TODO: change to 1
                                        xmax={255}
                                        x={this.state.eps}
                                        onChange={({ x }) => this.setState({ eps: parseFloat(x.toFixed(1)).toFixed(1) })}
                                        />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>{'Please select step size: '}<br/><b>{this.state.stepSize}</b></Form.Label>
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
                                    <Form.Label>{'Please select total number of steps: '}<br/><b>{this.state.numSteps}</b></Form.Label>
                                    <br/>
                                    <Slider
                                        axis="x"
                                        xstep={1}
                                        xmin={1}
                                        xmax={100}
                                        x={this.state.numSteps}
                                        onChange={({ x }) => this.setState({ numSteps: parseInt(x) })}
                                        />
                                </Form.Group>

                                <Button variant="primary" type="submit" onClick={this._handleSubmit} disabled={!this.state.file}>
                                    Submit
                                </Button>
                            </Form>
                        </Col>
                    
                        <div hidden={!this.state.loading}>
                            {/* <Col large='true'> </Col> */}
                            <Col large='true'>
                                <Loader
                                    type="MutatingDots"
                                    color="#007bff"
                                    height={200}
                                    width={200}
                                    visible={this.state.loading}
                                    />
                            </Col>
                        </div>
                            <Col md = 'true' hidden={this.state.loading}>
                                    {$imagePreview}
                                    {$originalClass}
                            </Col>
                            {/* <Col sm = 'true' hidden={this.state.loading}> </Col> */}
                            <Col md = 'true' hidden={this.state.loading}>
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