import React from 'react';
import ImageUploader from 'react-images-upload';
import Dropdown from './Dropdown'
 
class App extends React.Component {
    constructor(props) {
        super(props);
         this.state = { pictures: [], target: -1 };
         this.onDrop = this.onDrop.bind(this);
         this.onSelect = this.onSelect.bind(this);
    }
 
    onDrop(picture) {
        this.setState({
            pictures: this.state.pictures.concat(picture),
        });
    }

    onSelect(option) {
    //   console.error(option)
      this.setState({
        target: option.value,
      });
    }
 
    render() {
        return (
            <div>
              <ImageUploader
                  withIcon={true}
                  buttonText='Choose images'
                  onChange={this.onDrop}
                  imgExtension={['.jpg', '.gif', '.png']}
                  maxFileSize={5242880}
                  withPreview={true}
              />
              <Dropdown onChange={this.onSelect}/>
            </div>
        );
    }
}
export default App;