import React, { Component } from 'react'
import Select from 'react-select'

const allVals = require('./data.json');

const options = Object.keys(allVals).map(function(key, index) {
    return {value: key, label: allVals[key]}
});

class Dropdown extends Component {
    render() {
        return <Select options={options} isSearchable={true} onChange={this.props.onChange} defaultValue={this.props.defaultValue}/>;
    }
}

export default Dropdown;